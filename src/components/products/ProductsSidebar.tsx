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
    <div className="sticky top-4 bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 border-b border-orange-400">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black/50 backdrop-blur-sm rounded-lg">
              <Filter className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-extrabold text-white">Filters</h3>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs font-extrabold text-orange-600 bg-white hover:bg-white/90 px-3 py-1.5 rounded-lg border border-white transition-all"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 space-y-4">
        {/* Creator Filter */}
        <div className="border-b border-white/10 pb-4">
          <button
            onClick={() => setOpenSection(openSection === "creator" ? null : "creator")}
            className="w-full flex items-center justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-extrabold text-white">Creator</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-orange-400 transition-transform ${
                openSection === "creator" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSection === "creator" && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleFilterChange("creator", "")}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${
                  filters.creator === ""
                    ? "bg-orange-500 text-white font-extrabold border-orange-400"
                    : "bg-gray-800 text-white border-white/10 hover:bg-gray-700 hover:border-orange-400/30 font-bold"
                }`}
              >
                All Creators
              </button>
              {creators.map((creator) => (
                <button
                  key={creator.id}
                  onClick={() => handleFilterChange("creator", creator.name)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg border transition-all ${
                    filters.creator === creator.name
                      ? "bg-orange-500 text-white font-extrabold border-orange-400"
                      : "bg-gray-800 text-white border-white/10 hover:bg-gray-700 hover:border-orange-400/30 font-bold"
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
              <DollarSign className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-extrabold text-white">Price Range</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-orange-400 transition-transform ${
                openSection === "price" ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSection === "price" && (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-white/70 mb-1 block">Min Price</label>
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
                  className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm font-bold bg-gray-800 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/70 mb-1 block">Max Price</label>
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
                  className="w-full px-3 py-2 border border-white/10 rounded-lg text-sm font-bold bg-gray-800 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-white/10">
            <p className="text-xs font-extrabold text-white/70 uppercase mb-2">Active:</p>
            <div className="space-y-2">
              {filters.creator && (
                <div className="flex items-center justify-between bg-orange-500/20 border border-orange-400/30 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-extrabold text-orange-300">{filters.creator}</span>
                  <button
                    onClick={() => handleFilterChange("creator", "")}
                    className="hover:bg-white/10 rounded-full p-1"
                  >
                    <X className="w-3 h-3 text-orange-300" />
                  </button>
                </div>
              )}
              {filters.minPrice && (
                <div className="flex items-center justify-between bg-purple-500/20 border border-purple-400/30 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-extrabold text-purple-300">Min: ${filters.minPrice}</span>
                  <button
                    onClick={() => handleFilterChange("minPrice", undefined)}
                    className="hover:bg-white/10 rounded-full p-1"
                  >
                    <X className="w-3 h-3 text-purple-300" />
                  </button>
                </div>
              )}
              {filters.maxPrice && (
                <div className="flex items-center justify-between bg-purple-500/20 border border-purple-400/30 px-3 py-1.5 rounded-lg">
                  <span className="text-xs font-extrabold text-purple-300">Max: ${filters.maxPrice}</span>
                  <button
                    onClick={() => handleFilterChange("maxPrice", undefined)}
                    className="hover:bg-white/10 rounded-full p-1"
                  >
                    <X className="w-3 h-3 text-purple-300" />
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
