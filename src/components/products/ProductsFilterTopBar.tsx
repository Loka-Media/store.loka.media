/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Filter, ChevronDown, X, Tag, User, Sparkles } from "lucide-react";

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
      <div className="relative w-full">
        <button
          onClick={() => setOpenDropdown(isOpen ? null : label)}
          className="w-full flex items-center justify-between px-4 py-3 bg-white border border-black rounded-xl text-black text-sm font-bold hover:bg-gray-50 transition-all duration-200 focus:outline-none hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"
        >
          <span className={selectedOption?.label ? "text-black" : "text-gray-500"}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className={`w-4 h-4 text-black transition-transform duration-200 flex-shrink-0 ml-2 ${
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
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-black rounded-xl shadow-[6px_6px_0_0_rgba(0,0,0,1)] max-h-72 overflow-y-auto z-50"
            >
              {options.map((option, index) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value);
                    setOpenDropdown(null);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-colors duration-150 border-b border-black/5 last:border-0 ${
                    index === 0 ? "rounded-t-xl" : ""
                  } ${
                    index === options.length - 1 ? "rounded-b-xl" : ""
                  } ${
                    value === option.value
                      ? "bg-gradient-to-r from-yellow-100 to-pink-100 text-black font-extrabold"
                      : "text-black hover:bg-gray-100"
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
    <div className="w-full bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 border border-black rounded-2xl mb-8 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-black bg-gradient-to-r from-yellow-200 to-pink-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black rounded-xl border border-black shadow-md">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black font-extrabold text-lg">Filter Products</span>
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          {hasActiveFilters && (
            <span className="bg-black text-white text-xs font-extrabold px-3 py-1.5 rounded-full border border-black shadow-md">
              {Object.values(filters).filter(v => v !== "" && v !== "all" && v !== "0").length} Active
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 text-white bg-black hover:bg-gray-900 text-sm font-extrabold transition-all duration-200 px-4 py-2 rounded-xl border border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
          >
            <X className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category Filter - Yellow */}
          <div className="bg-yellow-200 border border-black rounded-xl p-4 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-black rounded-lg">
                <Tag className="w-4 h-4 text-yellow-300" />
              </div>
              <label className="text-sm font-extrabold text-black">
                Category
              </label>
            </div>
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

          {/* Creator Filter - Pink */}
          <div className="bg-pink-200 border border-black rounded-xl p-4 hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-black rounded-lg">
                <User className="w-4 h-4 text-pink-300" />
              </div>
              <label className="text-sm font-extrabold text-black">
                Creator
              </label>
            </div>
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
          <div className="pt-6 mt-6 border-t border-black">
            <div className="mb-3">
              <span className="text-sm font-extrabold text-black uppercase tracking-wide">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {filters.category !== "" && (
                <span className="flex items-center gap-2 bg-yellow-300 border border-black text-black text-sm font-extrabold px-4 py-2 rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                  <Tag className="w-3.5 h-3.5" />
                  {filters.category}
                  <button
                    onClick={() => handleFilterChange("category", "")}
                    className="text-black hover:bg-black/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
              {filters.creator !== "" && (
                <span className="flex items-center gap-2 bg-pink-300 border border-black text-black text-sm font-extrabold px-4 py-2 rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                  <User className="w-3.5 h-3.5" />
                  {creators.find(c => c.name === filters.creator)?.name || filters.creator}
                  <button
                    onClick={() => handleFilterChange("creator", "")}
                    className="text-black hover:bg-black/10 rounded-full p-1 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
