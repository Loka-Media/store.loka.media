/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { printfulAPI, productAPI } from "@/lib/api";
import toast from "react-hot-toast";

interface ConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
}

interface CreatorProduct {
  id: number;
  is_active: boolean;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
}

export function useCreatorDashboard() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    revenue: 0,
  });

  useEffect(() => {
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
    fetchCreatorProducts();
  }, []);

  const checkPrintfulConnection = async () => {
    try {
      const status = await printfulAPI.getConnectionStatus();
      setConnection({
        connected: status.connected || false,
        adminAccount: status.adminAccount || true,
      });
    } catch (error: any) {
      // Handle authentication errors gracefully
      if (error?.response?.status === 401) {
        console.log("Authentication required for Printful connection check");
      } else {
        console.error("Failed to check Printful connection:", error);
      }
      // If connection check fails, assume Printful is available (admin account setup)
      // Only show connection prompt if there's a real configuration issue
      setConnection({ connected: true, adminAccount: true });
    }
  };

  const fetchCreatorProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getCreatorProducts();
      setProducts(response.products);

      // Calculate stats
      const totalProducts = response.products.length;
      const activeProducts = response.products.filter(
        (p: CreatorProduct) => p.is_active
      ).length;

      setStats({
        totalProducts,
        activeProducts,
        totalSales: 0, // TODO: Implement sales tracking
        revenue: 0, // TODO: Implement revenue tracking
      });
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load your products");
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPrintful = async () => {
    try {
      const response = await printfulAPI.initializeAuth();

      if (response.connected) {
        setConnection({ connected: true, adminAccount: true });
        toast.success("Connected to Printful admin account");
      } else if (response.needsAuth && response.authUrl) {
        // Need OAuth authorization - redirect to Printful
        toast("🔑 Admin authorization required. Redirecting to Printful...");
        setTimeout(() => {
          window.location.href = response.authUrl;
        }, 1500);
      } else {
        setConnection({ connected: false, adminAccount: true });
        toast.error("Failed to connect to Printful");
      }
    } catch (error) {
      console.error("Failed to test connection:", error);
      toast.error("Failed to connect to Printful");
    }
  };

  const deleteProduct = async (productId: number) => {
    try {
      await productAPI.deleteProduct(productId);
      toast.success("Product deleted successfully");
      fetchCreatorProducts(); // Refresh products list
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
    handleConnectPrintful,
    deleteProduct,
  };
}
