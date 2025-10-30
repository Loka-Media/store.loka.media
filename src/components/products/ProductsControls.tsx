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
    <div className="flex flex-col gap-4 mb-8">
      <div className="text-gray-400 text-sm sm:text-base">
        {loading ? (
          <div className="flex items-center">
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading products...
          </div>
        ) : (
          <span>
            <span className="text-orange-400 font-bold">
              {pagination.total}
            </span>{" "}
            products found
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        {/* Enhanced Sort */}
        <div className="w-full sm:w-auto relative z-50">
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-");
              setFilters((prev: any) => ({ ...prev, sortBy, sortOrder }));
            }}
            className="w-full sm:w-auto p-2 sm:p-3 bg-gray-800/80 border border-gray-600/50 rounded-lg sm:rounded-xl text-white text-xs sm:text-sm backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none pr-8 sm:pr-10"
            style={{ zIndex: 9999 }}
          >
            <option value="created_at-DESC" className="bg-gray-800 text-white">Newest First</option>
            <option value="created_at-ASC" className="bg-gray-800 text-white">Oldest First</option>
            <option value="base_price-ASC" className="bg-gray-800 text-white">Price: Low to High</option>
            <option value="base_price-DESC" className="bg-gray-800 text-white">Price: High to Low</option>
            <option value="name-ASC" className="bg-gray-800 text-white">Name: A to Z</option>
            <option value="name-DESC" className="bg-gray-800 text-white">Name: Z to A</option>
          </select>
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Enhanced View Mode */}
        <div className="flex bg-gray-800/80 border border-gray-600/50 rounded-lg sm:rounded-xl p-0.5 sm:p-1 backdrop-blur-sm">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-orange-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-200 ${
              viewMode === "list"
                ? "bg-orange-500 text-white shadow-lg"
                : "text-gray-400 hover:text-white hover:bg-gray-700/50"
            }`}
          >
            <List className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
