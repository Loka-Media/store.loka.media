/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Filter, X, ChevronDown, User, DollarSign } from "lucide-react";

interface ProductsSidebarProps {
  filters: {
    creator: string;
    minPrice: number | undefined;
    maxPrice: number | undefined;
  };
  creators: {
    id: number;
    name: string;
    username: string;
    product_count: number;
  }[];
  handleFilterChange: (key: string, value: string | number | undefined) => void;
  clearFilters: () => void;
}

export function ProductsSidebar({
  filters,
  creators,
  handleFilterChange,
  clearFilters,
}: ProductsSidebarProps) {
  const [openSection, setOpenSection] = useState<string | null>("creator");

  const hasActiveFilters = filters.creator !== "" || filters.minPrice || filters.maxPrice;

  return (
    <div className="sticky top-4 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 border border-black rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-200 to-pink-200 p-4 border-b border-black">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black rounded-lg">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-extrabold text-black">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-extrabold text-white bg-black hover:bg-gray-900 px-3 py-1.5 rounded-lg border border-black transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4">
        {/* Creator Filter */}
        <div className="border-b border-black pb-4">
          <button
            onClick={() => setOpenSection(openSection === "creator" ? null : "creator")}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-black" />
              <span className="text-sm font-extrabold text-black">Creator</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-black transition-transform ${
                openSection === "creator" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSection === "creator" && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleFilterChange("creator", "")}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg border border-black transition-all ${
                  filters.creator === ""
                    ? "bg-black text-white font-extrabold"
                    : "bg-white text-black hover:bg-yellow-50 font-bold"
                }`}
              >
                All Creators
              </button>
              {creators.map((creator) => (
                <button
                  key={creator.id}
                  onClick={() => handleFilterChange("creator", creator.name)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border border-black transition-all ${
                    filters.creator === creator.name
                      ? "bg-black text-white font-extrabold"
                      : "bg-white text-black hover:bg-yellow-50 font-bold"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{creator.name}</span>
                    <span className="text-xs opacity-70">({creator.product_count})</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Price Range Filter */}
        <div>
          <button
            onClick={() => setOpenSection(openSection === "price" ? null : "price")}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-black" />
              <span className="text-sm font-extrabold text-black">Price Range</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-black transition-transform ${
                openSection === "price" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSection === "price" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-black mb-1 block">Min Price</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "minPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-black rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-black mb-1 block">Max Price</label>
                <input
                  type="number"
                  placeholder="$999"
                  value={filters.maxPrice || ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "maxPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-3 py-2 border border-black rounded-lg text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-black">
            <p className="text-xs font-extrabold text-black uppercase mb-2">Active:</p>
            <div className="space-y-2">
              {filters.creator && (
                <div className="flex items-center justify-between bg-pink-200 border border-black px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-extrabold text-black">{filters.creator}</span>
                  <button
                    onClick={() => handleFilterChange("creator", "")}
                    className="hover:bg-black/10 rounded-full p-1"
                  >
                    <X className="w-3 h-3 text-black" />
                  </button>
                </div>
              )}
              {filters.minPrice && (
                <div className="flex items-center justify-between bg-green-200 border border-black px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-extrabold text-black">Min: ${filters.minPrice}</span>
                  <button
                    onClick={() => handleFilterChange("minPrice", undefined)}
                    className="hover:bg-black/10 rounded-full p-1"
                  >
                    <X className="w-3 h-3 text-black" />
                  </button>
                </div>
              )}
              {filters.maxPrice && (
                <div className="flex items-center justify-between bg-green-200 border border-black px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-extrabold text-black">Max: ${filters.maxPrice}</span>
                  <button
                    onClick={() => handleFilterChange("maxPrice", undefined)}
                    className="hover:bg-black/10 rounded-full p-1"
                  >
                    <X className="w-3 h-3 text-black" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
