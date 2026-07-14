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
    try {
      setLoading(true);
      
      // Build parameters
      const params: any = {};
      if (user?.role === "admin") {
        params.creatorId = selectedCreatorId;
      }

      // Fetch products and commission summary in parallel
      const [productsResponse, summaryResponse] = await Promise.all([
        productAPI.getCreatorProducts(params),
        api.get("/api/creator/commissions/summary", { params: { creatorId: selectedCreatorId } })
      ]);

      const fetchedProducts = productsResponse.products || [];
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

      // Extract stats from commission summary
      let totalSales = 0;
      let revenue = 0;

      if (summaryResponse.data && summaryResponse.data.data) {
        const commissions = summaryResponse.data.data.commissions || {};
        Object.keys(commissions).forEach(status => {
          totalSales += parseInt(commissions[status].count || 0);
          revenue += parseFloat(commissions[status].totalAmount || 0);
        });
      }

      setStats({
        totalProducts,
        activeProducts,
        totalSales,
        revenue: parseFloat(revenue.toFixed(2)),
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPrintful = async () => {
    try {
      const response = await printifyAPI.getConnectionStatus();

      if (response.connected) {
        setConnection({ connected: true, adminAccount: true });
        toast.success("Connected to Printify account successfully!");
      } else {
        setConnection({ connected: false, adminAccount: false });
        toast.error("Failed to connect to Printify. Check API key configuration.");
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      toast.error("Failed to connect to Printify");
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
