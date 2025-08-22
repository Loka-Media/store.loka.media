/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, TrendingUp, Users, ShoppingBag } from "lucide-react";
import DarkVeil from "./DarkVeil";

interface ProductsHeroProps {
  filters: {
    category: string;
    search: string;
    creator: string;
    minPrice: string;
    maxPrice: string;
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
    <div className="min-h-[120vh]">
      <DarkVeil
      speed={1.5}
      >
        <div className="flex items-center justify-center pt-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
            <div className="text-center space-y-8">
              {/* Professional heading */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-white via-gray-100 to-gray-200 bg-clip-text text-transparent">
                    Premium Marketplace
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-gray-300 font-light max-w-3xl mx-auto leading-relaxed">
                  Discover curated designs from top creators worldwide
                </p>
              </div>

              {/* Stats bar */}
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-400">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4" />
                  <span>{pagination.total.toLocaleString()} Products</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>{creators.length} Creators</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{categories.length} Categories</span>
                </div>
              </div>

              {/* Professional Search Bar */}
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur-xl"></div>
                  <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-1">
                    <div className="flex items-center">
                      <div className="flex items-center flex-1 px-4 py-3">
                        <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
                        <input
                          type="text"
                          placeholder="Search products, creators, or categories..."
                          className="flex-1 bg-transparent border-0 text-white placeholder-gray-400 focus:outline-none focus:ring-0 text-base"
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
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/25 flex-shrink-0"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Call to action */}
              <div className="text-center">
                <p className="text-gray-400 text-sm">
                  Explore premium designs • Support independent creators • Find your style
                </p>
              </div>
            </div>
          </div>
        </div>
      </DarkVeil>
    </div>
  );
}