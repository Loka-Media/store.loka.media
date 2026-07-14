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
  const { 
    user, 
    connection, 
    products, 
    loading, 
    stats, 
    creators,
    selectedCreatorId,
    setSelectedCreatorId,
    handleConnectPrintful, 
    deleteProduct 
  } = useCreatorDashboard();

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

          {user?.role === "admin" && (
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-neutral-900/60 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
              <span className="text-sm font-semibold text-gray-400">View Platform Dashboard For:</span>
              <select
                value={selectedCreatorId}
                onChange={(e) => setSelectedCreatorId(e.target.value)}
                className="bg-black border border-white/20 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-orange-500 cursor-pointer min-w-[220px]"
              >
                <option value="all">All Creators (Platform Total)</option>
                {creators.map((creator) => (
                  <option key={creator.id} value={creator.id}>
                    {creator.name} (@{creator.username})
                  </option>
                ))}
              </select>
            </div>
          )}

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
