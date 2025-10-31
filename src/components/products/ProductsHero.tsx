/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, TrendingUp, Users, ShoppingBag } from "lucide-react";
import DarkVeil from "./DarkVeil";

interface ProductsHeroProps {
  filters: {
    category: string;
    search: string;
    creator: string;
    minPrice: number | undefined;
    maxPrice: number | undefined;
    sortBy: string;
    sortOrder: string;
    source: "all" | "printful" | "shopify";
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  fetchProducts: (customFilters?: any, customPagination?: any, appendMode?: boolean) => void;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasNext: boolean;
  };
  creators: {
    id: number;
    name: string;
    username: string;
    product_count: number;
  }[];
  categories: {
    category: string;
    product_count: number;
  }[];
}

export function ProductsHero({
  filters,
  setFilters,
  fetchProducts,
  pagination,
  creators,
  categories,
}: ProductsHeroProps) {
  return (
    <div className="min-h-[70vh] sm:min-h-[90vh] md:min-h-[110vh]">
      <DarkVeil speed={1.5}>
        <div className="flex items-center justify-center py-8 sm:py-10 md:py-12 h-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12 sm:pb-16 md:pb-24">
            <div className="text-center space-y-4 sm:space-y-6 md:space-y-8">
              {/* Professional heading */}
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                    Premium Marketplace
                  </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed px-2">
                  Discover curated designs from top creators worldwide
                </p>
              </div>

              {/* Stats bar - Responsive Grid */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-8 text-xs sm:text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">{pagination.total.toLocaleString()} Products</span>
                </div>
                <div className="hidden sm:block text-gray-600">•</div>
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">{creators.length} Creators</span>
                </div>
                <div className="hidden sm:block text-gray-600">•</div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="whitespace-nowrap">{categories.length} Categories</span>
                </div>
              </div>

              {/* Professional Search Bar - Responsive */}
              <div className="max-w-2xl mx-auto w-full px-2 sm:px-0">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-lg sm:rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-lg sm:rounded-2xl border border-white/10 p-1">
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
                      <div className="flex items-center flex-1 w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3">
                        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Search products, creators..."
                          className="flex-1 bg-transparent border-0 text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-sm sm:text-base"
                          value={filters.search}
                          onChange={(e) =>
                            setFilters((prev: any) => ({
                              ...prev,
                              search: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
                        />
                      </div>
                      <button
                        onClick={() => fetchProducts()}
                        className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 flex-shrink-0"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="text-center px-2">
                <p className="text-gray-400 text-xs sm:text-sm">
                  Explore designs • Support creators • Find your style
                </p>
              </div>
            </div>
          </div>
        </div>
      </DarkVeil>
    </div>
  );
}