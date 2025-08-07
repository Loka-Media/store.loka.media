"use client";

import { Grid, List } from "lucide-react";
import { ExtendedProduct } from "@/lib/api";

interface ProductGridProps {
  products: ExtendedProduct[];
  loading: boolean;
  viewMode: "grid" | "list";
  totalProducts: number;
  onViewModeChange: (mode: "grid" | "list") => void;
  ProductCard: React.ComponentType<{ product: ExtendedProduct }>;
  ProductListItem: React.ComponentType<{ product: ExtendedProduct }>;
}

export function ProductGrid({
  products,
  loading,
  viewMode,
  totalProducts,
  onViewModeChange,
  ProductCard,
  ProductListItem,
}: ProductGridProps) {
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-900 rounded-xl shadow-lg overflow-hidden animate-pulse border border-gray-800"
        >
          <div className="aspect-square bg-gray-800"></div>
          <div className="p-5">
            <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-700 rounded w-1/3"></div>
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-10 bg-gray-900 rounded-lg border border-gray-800">
      <p className="text-xl text-gray-400">
        No products found matching your criteria.
      </p>
      <p className="text-gray-500 mt-2">
        Try adjusting your filters or search terms.
      </p>
    </div>
  );

  return (
    <div className="flex-1">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-white">
          All Products ({totalProducts})
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "grid"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            title="Grid View"
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`p-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-orange-600 text-white shadow-md"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
            title="List View"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading && products.length === 0 ? (
        <LoadingSkeleton />
      ) : products.length > 0 ? (
        <div
          className={`${
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-6"
          }`}
        >
          {products.map((product) =>
            viewMode === "grid" ? (
              <ProductCard
                key={product.id}
                product={product}
              />
            ) : (
              <ProductListItem
                key={product.id}
                product={product}
              />
            )
          )}
        </div>
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
