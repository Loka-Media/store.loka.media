/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Filter, ChevronDown, X } from "lucide-react";

interface ProductsFilterTopBarProps {
  filters: {
    source: string;
    category: string;
    creator: string;
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
      <div className="relative w-full sm:flex-1">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : label)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-black text-sm font-semibold hover:border-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <span className={selectedOption?.label ? "text-black" : "text-foreground-muted"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-foreground-muted transition-transform duration-200 flex-shrink-0 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`} />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpenDropdown(null)}
            />
            <div
              className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto z-50"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-medium transition-colors duration-150 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg ${
                    value === option.value
                      ? "bg-gray-100 text-black"
                      : "text-foreground-muted hover:text-black"
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
    filters.creator !== "";

  return (
    <div className="w-full bg-white border-2 border-gray-200 rounded-lg mb-8">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-black" />
          <span className="text-black font-bold text-sm">Filters</span>
          {hasActiveFilters && (
            <span className="bg-accent/10 text-accent text-xs font-bold px-2 py-0.5 rounded-full">
              {Object.values(filters).filter(v => v !== "" && v !== "all" && v !== "0").length}
            </span>
          )}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1.5 text-foreground-muted hover:text-black text-xs font-semibold transition-colors duration-200 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Category */}
          <div className="flex-1">
            <label className="block text-xs font-bold text-black mb-2">
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
          <div className="flex-1">
            <label className="block text-xs font-bold text-black mb-2">
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
        </div>

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-200">
            {filters.category !== "" && (
              <span className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-black text-xs font-semibold px-3 py-1.5 rounded-md">
                {filters.category}
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className="text-foreground-muted hover:text-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {filters.creator !== "" && (
              <span className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-black text-xs font-semibold px-3 py-1.5 rounded-md">
                {creators.find(c => c.name === filters.creator)?.name || filters.creator}
                <button
                  onClick={() => handleFilterChange("creator", "")}
                  className="text-foreground-muted hover:text-black transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
