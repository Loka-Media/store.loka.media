"use client";

import { Filter, ChevronDown } from "lucide-react";

interface FilterState {
  category: string;
  search: string;
  creator: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
  source: "printful" | "shopify" | "all";
}

interface ProductFiltersProps {
  filters: FilterState;
  categories: { category: string; product_count: number }[];
  creators: {
    id: number;
    name: string;
    username: string;
    product_count: number;
  }[];
  onFilterChange: (key: string, value: string) => void;
  onFiltersUpdate: (newFilters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  onSearch: () => void;
}

export function ProductFilters({
  filters,
  categories,
  creators,
  onFilterChange,
  onFiltersUpdate,
  onClearFilters,
  onSearch,
}: ProductFiltersProps) {
  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-gray-900 rounded-lg shadow-xl p-6 border border-gray-800 sticky top-24">
        <h3 className="font-bold text-white text-xl mb-6 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-orange-400" />
          Filters
        </h3>

        {/* Product Source */}
        <div className="mb-6">
          <label
            htmlFor="source-filter"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Product Source
          </label>
          <div className="relative">
            <select
              id="source-filter"
              value={filters.source}
              onChange={(e) => onFilterChange("source", e.target.value)}
              className="w-full p-3 pr-10 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white appearance-none"
            >
              <option value="all">All Sources</option>
              <option value="printful">🎨 Printful Products</option>
              <option value="shopify">🛍️ Shopify Products</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Category
          </label>
          <div className="relative">
            <select
              id="category-filter"
              value={filters.category}
              onChange={(e) => onFilterChange("category", e.target.value)}
              className="w-full p-3 pr-10 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category} value={cat.category}>
                  {cat.category} ({cat.product_count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Creators */}
        <div className="mb-6">
          <label
            htmlFor="creator-filter"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Creator
          </label>
          <div className="relative">
            <select
              id="creator-filter"
              value={filters.creator}
              onChange={(e) => onFilterChange("creator", e.target.value)}
              className="w-full p-3 pr-10 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white appearance-none"
            >
              <option value="">All Creators</option>
              {creators.map((creator) => (
                <option key={creator.id} value={creator.name}>
                  {creator.name} ({creator.product_count})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Price Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Price Range
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => onFiltersUpdate({ minPrice: e.target.value })}
              onBlur={onSearch}
              className="w-1/2 p-2 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => onFiltersUpdate({ maxPrice: e.target.value })}
              onBlur={onSearch}
              className="w-1/2 p-2 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white text-sm"
            />
          </div>
        </div>

        {/* Sort By */}
        <div className="mb-6">
          <label
            htmlFor="sort-by"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Sort By
          </label>
          <div className="relative">
            <select
              id="sort-by"
              value={filters.sortBy}
              onChange={(e) => onFiltersUpdate({ sortBy: e.target.value })}
              className="w-full p-3 pr-10 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white appearance-none"
            >
              <option value="created_at">Newest</option>
              <option value="name">Name (A-Z)</option>
              <option value="min_price">Price (Low to High)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Sort Order */}
        <div className="mb-6">
          <label
            htmlFor="sort-order"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Sort Order
          </label>
          <div className="relative">
            <select
              id="sort-order"
              value={filters.sortOrder}
              onChange={(e) => onFiltersUpdate({ sortOrder: e.target.value })}
              className="w-full p-3 pr-10 border border-gray-700 rounded-md focus:ring-orange-500 focus:border-orange-500 bg-gray-800 text-white appearance-none"
            >
              <option value="DESC">Descending</option>
              <option value="ASC">Ascending</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <button
          onClick={onClearFilters}
          className="w-full py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
