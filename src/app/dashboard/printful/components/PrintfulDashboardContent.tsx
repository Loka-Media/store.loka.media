"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { printfulAPI, PrintfulConnection } from "@/lib/printful";
import {
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import toast from "react-hot-toast";
import ConnectPrintfulCard from "./ConnectPrintfulCard";
import PrintfulDashboardMain from "./PrintfulDashboardMain";

export default function PrintfulDashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<PrintfulConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();

    // Handle OAuth callback
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("Printful account connected successfully!");
      checkConnection();
    } else if (error) {
      toast.error("Failed to connect Printful account. Please try again.");
    }
  }, [searchParams]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const status = await printfulAPI.getConnectionStatus();
      setConnection(status);
    } catch (error) {
      console.error("Failed to check connection:", error);
      toast.error("Failed to check Printful connection status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { authUrl } = await printfulAPI.initializeAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error("Failed to initialize auth:", error);
      toast.error("Failed to initialize Printful connection");
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm("Are you sure you want to disconnect your Printful account?")
    ) {
      return;
    }

    try {
      await printfulAPI.disconnect();
      setConnection({ connected: false, isExpired: false, scope: "" });
      toast.success("Printful account disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect Printful account");
    }
  };

  const ConnectionStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Checking connection...</span>
        </div>
      );
    }

    if (!connection?.connected) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span>Not connected</span>
        </div>
      );
    }

    if (connection.isExpired) {
      return (
        <div className="flex items-center space-x-2 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span>Connection expired</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span>Connected</span>
      </div>
    );
  };

  if (user?.role !== "creator" && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Creator Access Required
          </h2>
          <p className="text-gray-600">
            Printful integration is only available for creators and admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="w-8 h-8 mr-3 text-indigo-600" />
                Printful Integration
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Connect your Printful account to access print-on-demand services
              </p>
            </div>
            <ConnectionStatus />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!connection?.connected || connection.isExpired ? (
            <ConnectPrintfulCard
              onConnect={handleConnect}
              isExpired={connection?.isExpired}
            />
          ) : (
            <PrintfulDashboardMain
              connection={connection}
              onDisconnect={handleDisconnect}
            />
          )}
        </div>
      </div>
    </div>
  );
}
