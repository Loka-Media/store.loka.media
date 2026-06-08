"use client";

import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterState {
  category: string;
  search: string;
  creator: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
  sortOrder: string;
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

        {/* Categories */}
        <div className="mb-6">
          <label
            htmlFor="category-filter"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Category
          </label>
          <Select
            value={filters.category || "all"}
            onValueChange={(val) => onFilterChange("category", val === "all" ? "" : val)}
          >
            <SelectTrigger id="category-filter" className="w-full h-12 bg-gray-800 border-gray-700">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.category} value={cat.category}>
                  {cat.category} ({cat.product_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Creators */}
        <div className="mb-6">
          <label
            htmlFor="creator-filter"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Creator
          </label>
          <Select
            value={filters.creator || "all"}
            onValueChange={(val) => onFilterChange("creator", val === "all" ? "" : val)}
          >
            <SelectTrigger id="creator-filter" className="w-full h-12 bg-gray-800 border-gray-700">
              <SelectValue placeholder="All Creators" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Creators</SelectItem>
              {creators.map((creator) => (
                <SelectItem key={creator.id} value={creator.name}>
                  {creator.name} ({creator.product_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select
            value={filters.sortBy || "created_at"}
            onValueChange={(val) => onFiltersUpdate({ sortBy: val })}
          >
            <SelectTrigger id="sort-by" className="w-full h-12 bg-gray-800 border-gray-700">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="min_price">Price (Low to High)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort Order */}
        <div className="mb-6">
          <label
            htmlFor="sort-order"
            className="block text-sm font-medium text-gray-300 mb-2"
          >
            Sort Order
          </label>
          <Select
            value={filters.sortOrder || "DESC"}
            onValueChange={(val) => onFiltersUpdate({ sortOrder: val })}
          >
            <SelectTrigger id="sort-order" className="w-full h-12 bg-gray-800 border-gray-700">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DESC">Descending</SelectItem>
              <SelectItem value="ASC">Ascending</SelectItem>
            </SelectContent>
          </Select>
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
