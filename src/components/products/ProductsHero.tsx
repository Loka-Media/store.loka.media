/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, TrendingUp, Users, ShoppingBag } from "lucide-react";

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
    <div className="relative bg-gradient-to-br from-pink-200 via-yellow-100 to-pink-100 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-yellow-300 rounded-full opacity-40 hidden lg:block"></div>
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-pink-300 rounded-3xl opacity-30 rotate-12 hidden lg:block"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 relative z-10">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Heading - Neubrutalism style: bold and colorful */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-normal mb-6 md:mb-8 text-black leading-[0.95] tracking-tight">
              Premium Marketplace
            </h1>
            <div className="inline-block bg-white/90 backdrop-blur-sm px-6 py-3 rounded-2xl border border-black">
              <p className="text-lg sm:text-xl md:text-2xl text-black font-bold max-w-3xl">
                Discover curated designs from top creators worldwide
              </p>
            </div>
          </div>

          {/* Stats bar - Colorful cards */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 bg-yellow-300 px-4 py-2 rounded-full border border-black font-bold text-black">
              <ShoppingBag className="w-4 h-4" />
              <span>{pagination.total.toLocaleString()} Products</span>
            </div>
            <div className="flex items-center gap-2 bg-pink-300 px-4 py-2 rounded-full border border-black font-bold text-black">
              <Users className="w-4 h-4" />
              <span>{creators.length} Creators</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-black font-bold text-black">
              <TrendingUp className="w-4 h-4" />
              <span>{categories.length} Categories</span>
            </div>
          </div>

          {/* Search Bar - Neubrutalist style */}
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-white border border-black rounded-2xl overflow-hidden hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="flex items-center">
                <div className="flex items-center flex-1 px-4 py-3">
                  <Search className="w-5 h-5 text-black mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products, creators..."
                    className="flex-1 bg-transparent border-0 text-black placeholder-gray-500 focus:outline-none focus:ring-0 text-base font-semibold"
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
                  className="bg-black hover:bg-gray-900 text-white px-8 py-4 font-extrabold text-base transition-all flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center">
            <p className="text-black font-bold text-sm">
              Explore designs • Support creators • Find your style
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
