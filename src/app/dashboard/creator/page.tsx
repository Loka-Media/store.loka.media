"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useCreatorDashboard } from "./hooks/useCreatorDashboard";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsCards } from "./components/StatsCards";
import { QuickActions } from "./components/QuickActions";
import { ProductsSection } from "./components/ProductsSection";
import PrintfulConnectionPrompt from "./components/PrintfulConnectionPrompt";

export default function CreatorDashboard() {
  const router = useRouter();
  const { user, connection, products, loading, stats, handleConnectPrintful } =
    useCreatorDashboard();

  useEffect(() => {
    if (user?.role !== "creator" && user?.role !== "admin") {
      router.push("/dashboard");
      return;
    }
  }, [user, router]);

  if (!user || (user.role !== "creator" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader
        connection={connection}
        onConnectPrintful={handleConnectPrintful}
      />

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {connection && !connection.connected ? (
            <PrintfulConnectionPrompt onConnect={handleConnectPrintful} />
          ) : (
            <>
              <StatsCards stats={stats} />
              <QuickActions />
              <ProductsSection products={products} loading={loading} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
