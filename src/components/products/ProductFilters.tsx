'use client';

import { Filter, ChevronDown, Grid, List } from "lucide-react";
import Link from "next/link";

interface ProductFiltersProps {
  filters: {
    category: string;
    search: string;
    creator: string;
    minPrice: string;
    maxPrice: string;
    sortBy: string;
    sortOrder: string;
    source: "printful" | "shopify" | "all";
  };
  categories: { category: string; product_count: number }[];
  creators: { id: number; name: string; username: string; product_count: number }[];
  handleFilterChange: (key: string, value: string) => void;
  clearFilters: () => void;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
  loading: boolean;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
  setShowFilters: (show: boolean) => void;
  showFilters: boolean;
}

export function ProductFilters({
  filters,
  categories,
  creators,
  handleFilterChange,
  clearFilters,
  pagination,
  loading,
  viewMode,
  setViewMode,
  setShowFilters,
  showFilters
}: ProductFiltersProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 mb-8 border border-gray-700/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-white text-xl flex items-center">
          <Filter className="w-5 h-5 mr-2 text-orange-400" />
          Filters & Sorting
        </h3>
        <button
          onClick={clearFilters}
          className="text-gray-400 hover:text-orange-400 text-sm font-medium transition-colors duration-200"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Product Source */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Product Source
          </label>
          <select
            value={filters.source}
            onChange={(e) => handleFilterChange("source", e.target.value)}
            className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200"
          >
            <option value="all">All Sources</option>
            <option value="printful">🎨 Printful Products</option>
            <option value="shopify">🛍️ Shopify Products</option>
          </select>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Category
          </label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200"
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
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Creator
          </label>
          <select
            value={filters.creator}
            onChange={(e) => handleFilterChange("creator", e.target.value)}
            className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200"
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
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Price Range
          </label>
          <div className="flex space-x-3">
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) =>
                handleFilterChange("minPrice", e.target.value)
              }
              className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
              placeholder="Min"
            />
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) =>
                handleFilterChange("maxPrice", e.target.value)
              }
              className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* Sort and View Mode */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
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
              handleFilterChange("sortBy", sortBy);
              handleFilterChange("sortOrder", sortOrder);
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

          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-gray-400 hover:text-white backdrop-blur-sm transition-all duration-200"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
