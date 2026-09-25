/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { printifyAPI, productAPI } from "@/lib/api";
import { api } from "@/lib/auth";
import toast from "react-hot-toast";

interface ConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
}

interface CreatorProduct {
  id: number;
  is_active?: boolean;
  status?: string;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
  creator_name?: string;
  creator_username?: string;
}

export function useCreatorDashboard() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | number>("all");
  const [creators, setCreators] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    revenue: 0,
  });

  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (hasInitializedRef.current) {
      return;
    }
    hasInitializedRef.current = true;

    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get("connected");
    const error = urlParams.get("error");

    if (connected === "true") {
      setConnection({ connected: true, adminAccount: true });

      const setup = urlParams.get("setup");
      if (setup === "complete") {
        toast.success(
          "🎉 Admin setup complete! All creators can now use Printful."
        );
      } else {
        toast.success("Successfully connected to Printful!");
      }

      // Clean URL
      window.history.replaceState({}, "", "/dashboard/creator");
    } else if (error) {
      toast.error(`Printful connection failed: ${error}`);
      // Clean URL
      window.history.replaceState({}, "", "/dashboard/creator");
    }

    checkPrintfulConnection();
  }, []);

  // Fetch creators list for admin dropdown
  useEffect(() => {
    if (user?.role === "admin") {
      const fetchCreators = async () => {
        try {
          const response = await productAPI.getCreators();
          setCreators(response.creators || []);
        } catch (error) {
          console.error("Failed to fetch creators list:", error);
        }
      };
      fetchCreators();
    }
  }, [user]);

  // Fetch products and stats whenever selectedCreatorId changes
  useEffect(() => {
    fetchDashboardData();
  }, [selectedCreatorId, user]);

  const checkPrintfulConnection = async () => {
    try {
      const status = await printifyAPI.getConnectionStatus();
      setConnection({
        connected: status.connected || false,
        adminAccount: status.adminAccount || true,
      });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log("Authentication required for Printful connection check");
      } else {
        console.error("Failed to check Printful connection:", error);
      }
      setConnection({ connected: true, adminAccount: true });
    }
  };

  const fetchDashboardData = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token && !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Build parameters for products request
      const params: any = {
        limit: 1000,
        offset: 0,
      };
      if (user?.role === "admin" && selectedCreatorId !== "all") {
        params.creatorId = selectedCreatorId;
      }

      // Build parameters for commissions summary request
      const summaryParams: any = {};
      if (user?.role === "admin" && selectedCreatorId !== "all") {
        summaryParams.creatorId = selectedCreatorId;
      }

      // Fetch products, commission summary, and real local analytics
      const [productsResult, summaryResult, analyticsResult] = await Promise.allSettled([
        productAPI.getCreatorProducts(params),
        api.get("/api/creator/commissions/summary", { params: summaryParams }),
        fetch(`/api/creator/analytics?creatorId=${selectedCreatorId !== "all" ? selectedCreatorId : ""}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }).then((r) => (r.ok ? r.json() : null)),
      ]);

      let fetchedProducts: CreatorProduct[] = [];
      if (productsResult.status === "fulfilled") {
        fetchedProducts = productsResult.value?.products || [];
      } else {
        console.error("Failed to fetch creator products:", productsResult.reason);
      }
      setProducts(fetchedProducts);

      // Calculate products stats
      const totalProducts = fetchedProducts.length;
      const isProductActive = (product: CreatorProduct) => {
        if (typeof product.is_active === "boolean") {
          return product.is_active;
        }
        if (typeof product.status === "string") {
          return product.status.toLowerCase() === "active";
        }
        return false;
      };
      const activeProducts = fetchedProducts.filter((p: CreatorProduct) => isProductActive(p)).length;

      // Extract stats from commission summary or real local analytics
      let totalSales = 0;
      let revenue = 0;

      if (summaryResult.status === "fulfilled" && summaryResult.value?.data?.data) {
        const commissions = summaryResult.value.data.data.commissions || {};
        Object.keys(commissions).forEach((status) => {
          totalSales += parseInt(commissions[status].count || 0);
          revenue += parseFloat(commissions[status].totalAmount || 0);
        });
      } else if (summaryResult.status === "rejected") {
        console.warn("Failed to fetch commission summary:", summaryResult.reason);
      }

      // If external commission summary had 0 sales or failed, use real PostgreSQL database analytics
      if (totalSales === 0 && analyticsResult.status === "fulfilled" && analyticsResult.value?.data) {
        totalSales = analyticsResult.value.data.totalSales || 0;
        revenue = analyticsResult.value.data.revenue || 0;
      }

      setStats({
        totalProducts,
        activeProducts,
        totalSales,
        revenue: parseFloat(revenue.toFixed(2)),
      });

      // Only toast error if both endpoints fail
      if (productsResult.status === "rejected" && summaryResult.status === "rejected") {
        toast.error("Failed to load dashboard statistics");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPrintful = async () => {
    try {
      const response = await printifyAPI.getConnectionStatus();

      if (response.connected) {
        setConnection({ connected: true, adminAccount: true });
        toast.success("Connected to fulfillment provider successfully!");
      } else {
        setConnection({ connected: false, adminAccount: false });
        toast.error("Failed to connect to fulfillment provider. Check API configuration.");
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      toast.error("Failed to connect to fulfillment provider");
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      await productAPI.deleteProduct(productId);
      toast.success("Product deleted successfully");
      fetchDashboardData(); // Refresh list and stats
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
    }
  };

  return {
    user,
    connection,
    products,
    loading,
    stats,
    creators,
    selectedCreatorId,
    setSelectedCreatorId,
    handleConnectPrintful,
    deleteProduct,
    refreshData: fetchDashboardData
  };
}
