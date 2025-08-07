import { Filter } from "lucide-react";

interface ProductsFilterTopBarProps {
  filters: {
    source: string;
    category: string;
    creator: string;
    minPrice: string;
    maxPrice: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  handleFilterChange: (key: string, value: string) => void;
  clearFilters: () => void;
  fetchProducts: () => void;
  categories: {
    category: string;
    product_count: number;
  }[];
  creators: {
    id: number;
    name: string;
    username: string;
    product_count: number;
  }[];
}

export function ProductsFilterTopBar({
  filters,
  setFilters,
  handleFilterChange,
  clearFilters,
  fetchProducts,
  categories,
  creators,
}: ProductsFilterTopBarProps) {
  return (
    <div className="w-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
        <h3 className="font-bold text-white text-xl flex items-center mb-3 md:mb-0">
          <Filter className="w-5 h-5 mr-2 text-orange-400" />
          Filters
        </h3>
        <button
          onClick={clearFilters}
          className="text-gray-400 hover:text-orange-400 text-sm font-medium transition-colors duration-200 px-3 py-1 rounded-md border border-transparent hover:border-gray-600"
        >
          Clear All Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-6 mb-6">
        {/* Product Source */}
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">
            Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange("source", e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200 text-sm"
          >
            <option value="all">All Sources</option>
            <option value="printful">🎨 Printful</option>
            <option value="shopify">🛍️ Shopify</option>
          </select>
        </div>

        {/* Categories */}
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.product_count})
              </option>
            ))}
          </select>
        </div>

        {/* Creators */}
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">
            Creator
          </label>
          <select
            value={filters.creator}
            onChange={(e) => handleFilterChange("creator", e.target.value)}
            className="w-full py-2.5 px-3 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200 text-sm"
          >
            <option value="">All Creators</option>
            {creators.map((creator) => (
              <option key={creator.id} value={creator.name}>
                {creator.name} ({creator.product_count})
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-300 mb-1.5">
            Price Range
          </label>
          <div className="flex space-x-3">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) =>
                setFilters((prev: any) => ({
                  ...prev,
                  minPrice: e.target.value,
                }))
              }
              className="w-full py-2.5 px-3 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 text-sm"
              placeholder="Min"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) =>
                setFilters((prev: any) => ({
                  ...prev,
                  maxPrice: e.target.value,
                }))
              }
              className="w-full py-2.5 px-3 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200 text-sm"
              placeholder="Max"
            />
          </div>
        </div>

        <div className="flex flex-col justify-end">
          <button
            onClick={fetchProducts}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-2.5 px-4 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Active Filters Tags */}
      {Object.values(filters).some(
        (value) => value !== "" && value !== "all" && value !== "0"
      ) && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-700/50">
          <span className="text-gray-300 text-sm font-semibold mr-2">
            Active Filters:
          </span>
          {filters.source !== "all" && filters.source !== "" && (
            <span className="flex items-center bg-orange-500/20 text-orange-300 text-xs font-medium px-2.5 py-1 rounded-full">
              Source: {filters.source}
              <button
                onClick={() => handleFilterChange("source", "all")}
                className="ml-1 text-orange-300 hover:text-orange-100"
              >
                &times;
              </button>
            </span>
          )}
          {filters.category !== "" && (
            <span className="flex items-center bg-orange-500/20 text-orange-300 text-xs font-medium px-2.5 py-1 rounded-full">
              Category: {filters.category}
              <button
                onClick={() => handleFilterChange("category", "")}
                className="ml-1 text-orange-300 hover:text-orange-100"
              >
                &times;
              </button>
            </span>
          )}
          {filters.creator !== "" && (
            <span className="flex items-center bg-orange-500/20 text-orange-300 text-xs font-medium px-2.5 py-1 rounded-full">
              Creator: {creators.find(c => c.name === filters.creator)?.name || filters.creator}
              <button
                onClick={() => handleFilterChange("creator", "")}
                className="ml-1 text-orange-300 hover:text-orange-100"
              >
                &times;
              </button>
            </span>
          )}
          {(filters.minPrice !== "" && filters.minPrice !== "0") ||
          (filters.maxPrice !== "" && filters.maxPrice !== "0") ? (
            <span className="flex items-center bg-orange-500/20 text-orange-300 text-xs font-medium px-2.5 py-1 rounded-full">
              Price: ${filters.minPrice || "0"} - ${filters.maxPrice || "Max"}
              <button
                onClick={() => {
                  setFilters((prev: any) => ({
                    ...prev,
                    minPrice: "",
                    maxPrice: "",
                  }));
                }}
                className="ml-1 text-orange-300 hover:text-orange-100"
              >
                &times;
              </button>
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
