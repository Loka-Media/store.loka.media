"use client";

import { useCreatorDashboard } from "./hooks/useCreatorDashboard";
import { DashboardHeader } from "./components/DashboardHeader";
import { StatsCards } from "./components/StatsCards";
import { QuickActions } from "./components/QuickActions";
import { ProductsSection } from "./components/ProductsSection";
import PrintfulConnectionPrompt from "./components/PrintfulConnectionPrompt";
import Navigation from "@/components/Navigation";
import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";

export default function CreatorDashboard() {
  const { user, connection, products, loading, stats, handleConnectPrintful, deleteProduct } =
    useCreatorDashboard();

  return (
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-gray-950 text-white">
        <Navigation />

        <div className="max-w-7xl mt-16 mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <DashboardHeader
            connection={connection}
            onConnectPrintful={handleConnectPrintful}
          />
          <div className="mt-8">
            {connection && !connection.connected ? (
              <PrintfulConnectionPrompt onConnect={handleConnectPrintful} />
            ) : (
              <>
                <StatsCards stats={stats} />
                <QuickActions />
                <ProductsSection products={products} loading={loading} onDelete={deleteProduct} />
              </>
            )}
          </div>
        </div>
      </div>
    </CreatorProtectedRoute>
  );
}
