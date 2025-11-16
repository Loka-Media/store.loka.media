/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Filter, X, ChevronDown, User, DollarSign } from "lucide-react";

interface MobileFiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
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

export function MobileFiltersDrawer({
  isOpen,
  onClose,
  filters,
  creators,
  handleFilterChange,
  clearFilters,
}: MobileFiltersDrawerProps) {
  const [openSection, setOpenSection] = useState<string | null>("creator");

  const hasActiveFilters = filters.creator !== "" || filters.minPrice || filters.maxPrice;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-x-0 bottom-0 bg-white border-t-2 border-black rounded-t-3xl z-50 lg:hidden max-h-[85vh] overflow-y-auto">
        {/* Handle Bar */}
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-200 to-pink-200 p-5 border-b border-black sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-black rounded-xl">
                <Filter className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-extrabold text-black">Filters</h3>
              {hasActiveFilters && (
                <span className="bg-black text-white text-xs font-extrabold px-3 py-1.5 rounded-full">
                  {(filters.creator ? 1 : 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-black" />
            </button>
          </div>
        </div>

        {/* Filters Content */}
        <div className="p-5 space-y-6">
          {/* Creator Filter */}
          <div className="bg-gradient-to-br from-pink-50 to-yellow-50 border border-black rounded-2xl p-4">
            <button
              onClick={() => setOpenSection(openSection === "creator" ? null : "creator")}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-black rounded-lg">
                  <User className="w-4 h-4 text-pink-300" />
                </div>
                <span className="text-sm font-extrabold text-black">Creator</span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-black transition-transform ${
                  openSection === "creator" ? "rotate-180" : ""
                }`}
              />
            </button>

            {openSection === "creator" && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    handleFilterChange("creator", "");
                    onClose();
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm rounded-lg border border-black transition-all ${
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
                    onClick={() => {
                      handleFilterChange("creator", creator.name);
                      onClose();
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg border border-black transition-all ${
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
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-black rounded-2xl p-4">
            <button
              onClick={() => setOpenSection(openSection === "price" ? null : "price")}
              className="w-full flex items-center justify-between mb-3"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-black rounded-lg">
                  <DollarSign className="w-4 h-4 text-green-300" />
                </div>
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
                  <label className="text-xs font-bold text-black mb-1.5 block">Min Price</label>
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
                    className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-black mb-1.5 block">Max Price</label>
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
                    className="w-full px-4 py-3 border-2 border-black rounded-xl text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="pt-4 border-t-2 border-black">
              <p className="text-xs font-extrabold text-black uppercase mb-3">Active Filters:</p>
              <div className="space-y-2">
                {filters.creator && (
                  <div className="flex items-center justify-between bg-pink-200 border border-black px-4 py-2.5 rounded-xl">
                    <span className="text-sm font-extrabold text-black">{filters.creator}</span>
                    <button
                      onClick={() => handleFilterChange("creator", "")}
                      className="hover:bg-black/10 rounded-full p-1.5"
                    >
                      <X className="w-4 h-4 text-black" />
                    </button>
                  </div>
                )}
                {filters.minPrice && (
                  <div className="flex items-center justify-between bg-green-200 border border-black px-4 py-2.5 rounded-xl">
                    <span className="text-sm font-extrabold text-black">Min: ${filters.minPrice}</span>
                    <button
                      onClick={() => handleFilterChange("minPrice", undefined)}
                      className="hover:bg-black/10 rounded-full p-1.5"
                    >
                      <X className="w-4 h-4 text-black" />
                    </button>
                  </div>
                )}
                {filters.maxPrice && (
                  <div className="flex items-center justify-between bg-green-200 border border-black px-4 py-2.5 rounded-xl">
                    <span className="text-sm font-extrabold text-black">Max: ${filters.maxPrice}</span>
                    <button
                      onClick={() => handleFilterChange("maxPrice", undefined)}
                      className="hover:bg-black/10 rounded-full p-1.5"
                    >
                      <X className="w-4 h-4 text-black" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t-2 border-black p-4 flex gap-3">
          {hasActiveFilters && (
            <button
              onClick={() => {
                clearFilters();
                onClose();
              }}
              className="flex-1 bg-white border-2 border-black text-black px-6 py-3.5 rounded-xl font-extrabold hover:bg-gray-50 transition-all"
            >
              Clear All
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-black text-white px-6 py-3.5 rounded-xl font-extrabold hover:bg-gray-900 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}
