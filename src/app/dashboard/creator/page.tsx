"use client";

import { useCreatorDashboard } from "./hooks/useCreatorDashboard";
import { EnhancedDashboardHeader } from "./components/EnhancedDashboardHeader";
import { EnhancedStatsCards } from "./components/EnhancedStatsCards";
import { EnhancedQuickActions } from "./components/EnhancedQuickActions";
import { EnhancedProductsSection } from "./components/EnhancedProductsSection";
import PrintfulConnectionPrompt from "./components/PrintfulConnectionPrompt";
import Navigation from "@/components/Navigation";
import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";

export default function CreatorDashboard() {
  const { user, connection, products, loading, stats, handleConnectPrintful, deleteProduct } =
    useCreatorDashboard();

  return (
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <Navigation />

        <div className="max-w-7xl mx-auto pb-12 px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
          <EnhancedDashboardHeader
            connection={connection}
            onConnectPrintful={handleConnectPrintful}
            creatorUsername={user?.username || user?.name || ""}
          />
          <div className="mt-12">
            {connection && !connection.connected ? (
              <PrintfulConnectionPrompt onConnect={handleConnectPrintful} />
            ) : (
              <>
                <EnhancedStatsCards stats={stats} />
                <EnhancedQuickActions />
                <EnhancedProductsSection products={products} loading={loading} onDelete={deleteProduct} />
              </>
            )}
          </div>
        </div>
      </div>
    </CreatorProtectedRoute>
  );
}
