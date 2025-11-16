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
  const { connection, products, loading, stats, handleConnectPrintful, deleteProduct } =
    useCreatorDashboard();

  return (
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
        <Navigation />

        <div className="max-w-7xl mx-auto pb-12">
          <EnhancedDashboardHeader
            connection={connection}
            onConnectPrintful={handleConnectPrintful}
          />
          <div className="mt-8 px-4 sm:px-6 lg:px-8">
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
