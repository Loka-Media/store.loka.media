/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Filter, ChevronDown, X } from "lucide-react";

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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const CustomDropdown = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    placeholder = "Select..."
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onSelect: (value: string) => void;
    placeholder?: string;
  }) => {
    const isOpen = openDropdown === label;
    const selectedOption = options.find(opt => opt.value === value);

    return (
      <div className="relative">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : label)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white text-sm hover:bg-gray-700/50 hover:border-gray-600/50 transition-all duration-200 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50"
        >
          <span className={selectedOption?.label ? "text-white" : "text-gray-400"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`} />
        </button>
        
        {isOpen && (
          <>
            <div 
              className="fixed inset-0"
              style={{ zIndex: 999998 }}
              onClick={() => setOpenDropdown(null)}
            />
            <div 
              className="absolute top-full left-0 right-0 mt-1 bg-gray-800/95 border border-gray-700/50 rounded-xl shadow-2xl backdrop-blur-sm max-h-64 overflow-y-auto"
              style={{ zIndex: 999999 }}
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-gray-700/50 first:rounded-t-xl last:rounded-b-xl ${
                    value === option.value
                      ? "bg-orange-500/20 text-orange-300"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const hasActiveFilters = filters.category !== "" || 
    filters.creator !== "" || 
    (filters.minPrice !== "" && filters.minPrice !== "0") || 
    (filters.maxPrice !== "" && filters.maxPrice !== "0");

  return (
    <div className="w-full bg-gray-900/50 border border-gray-800/50 rounded-2xl backdrop-blur-sm mb-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-orange-400" />
          <span className="text-white font-medium text-sm">Filters</span>
          {hasActiveFilters && (
            <span className="bg-orange-500/20 text-orange-300 text-xs font-medium px-2 py-0.5 rounded-full">
              {Object.values(filters).filter(v => v !== "" && v !== "all" && v !== "0").length}
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-gray-400 hover:text-orange-400 text-xs font-medium transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-gray-800/50"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          {/* Category */}
          <div className="min-w-0 flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Category
            </label>
            <CustomDropdown
              label="category"
              value={filters.category}
              options={[
                { value: "", label: "All Categories" },
                ...categories.map(cat => ({
                  value: cat.category,
                  label: `${cat.category} (${cat.product_count})`
                }))
              ]}
              onSelect={(value) => handleFilterChange("category", value)}
              placeholder="All Categories"
            />
          </div>

          {/* Creator */}
          <div className="min-w-0 flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Creator
            </label>
            <CustomDropdown
              label="creator"
              value={filters.creator}
              options={[
                { value: "", label: "All Creators" },
                ...creators.map(creator => ({
                  value: creator.name,
                  label: `${creator.name} (${creator.product_count})`
                }))
              ]}
              onSelect={(value) => handleFilterChange("creator", value)}
              placeholder="All Creators"
            />
          </div>

          {/* Price Range */}
          <div className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Price
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((prev: any) => ({ ...prev, minPrice: e.target.value }))}
                  className="w-16 px-2 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 text-xs focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all duration-200"
                  placeholder="Min"
                />
                <span className="text-gray-500 text-xs">-</span>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((prev: any) => ({ ...prev, maxPrice: e.target.value }))}
                  className="w-16 px-2 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 text-xs focus:ring-1 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all duration-200"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1.5 pt-2 mt-2 border-t border-gray-800/50">
            {filters.category !== "" && (
              <span className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium px-2 py-0.5 rounded-md">
                {filters.category}
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className="text-orange-300 hover:text-orange-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.creator !== "" && (
              <span className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium px-2 py-0.5 rounded-md">
                {creators.find(c => c.name === filters.creator)?.name || filters.creator}
                <button
                  onClick={() => handleFilterChange("creator", "")}
                  className="text-orange-300 hover:text-orange-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {((filters.minPrice !== "" && filters.minPrice !== "0") ||
              (filters.maxPrice !== "" && filters.maxPrice !== "0")) && (
              <span className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium px-2 py-0.5 rounded-md">
                ${filters.minPrice || "0"} - ${filters.maxPrice || "∞"}
                <button
                  onClick={() => {
                    setFilters((prev: any) => ({
                      ...prev,
                      minPrice: "",
                      maxPrice: "",
                    }));
                  }}
                  className="text-orange-300 hover:text-orange-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
