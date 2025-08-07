/* eslint-disable @typescript-eslint/no-explicit-any */
import { Grid, List, Filter } from "lucide-react";

interface ProductsControlsProps {
  loading: boolean;
  pagination: {
    total: number;
  };
  filters: {
    sortBy: string;
    sortOrder: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  viewMode: "grid" | "list";
  setViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>;
  
}

export function ProductsControls({
  loading,
  pagination,
  filters,
  setFilters,
  viewMode,
  setViewMode,
  
}: ProductsControlsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
      <div className="text-gray-400">
        {loading ? (
          <div className="flex items-center">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading products...
          </div>
        ) : (
          <span className="text-lg">
            <span className="text-orange-400 font-bold">
              {pagination.total}
            </span>{" "}
            products found
          </span>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {/* Enhanced Sort */}
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split("-");
            setFilters((prev: any) => ({ ...prev, sortBy, sortOrder }));
          }}
          className="p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
        >
          <option value="created_at-DESC">Newest First</option>
          <option value="created_at-ASC">Oldest First</option>
          <option value="base_price-ASC">Price: Low to High</option>
          <option value="base_price-DESC">Price: High to Low</option>
          <option value="name-ASC">Name: A to Z</option>
          <option value="name-DESC">Name: Z to A</option>
        </select>

        {/* Enhanced View Mode */}
        <div className="flex bg-gray-800/80 border border-gray-600/50 rounded-xl p-1 backdrop-blur-sm">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-3 rounded-lg transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-orange-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-3 rounded-lg transition-all duration-200 ${
              viewMode === "list"
                ? "bg-orange-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        
      </div>
    </div>
  );
}
