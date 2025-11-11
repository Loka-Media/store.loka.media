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
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Heading - Gumroad style: clean and minimal */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-black">
              Premium Marketplace
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-foreground-muted font-normal max-w-3xl mx-auto">
              Discover curated designs from top creators worldwide
            </p>
          </div>

          {/* Stats bar - Clean and minimal */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-foreground-muted">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{pagination.total.toLocaleString()} Products</span>
            </div>
            <div className="text-gray-300">•</div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{creators.length} Creators</span>
            </div>
            <div className="text-gray-300">•</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>{categories.length} Categories</span>
            </div>
          </div>

          {/* Search Bar - Clean Gumroad style */}
          <div className="max-w-2xl mx-auto">
            <div className="relative bg-white border-2 border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
              <div className="flex items-center">
                <div className="flex items-center flex-1 px-4 py-3">
                  <Search className="w-5 h-5 text-foreground-muted mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search products, creators..."
                    className="flex-1 bg-transparent border-0 text-black placeholder-foreground-muted focus:outline-none focus:ring-0 text-base"
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
                  className="bg-accent hover:bg-accent-hover text-white px-6 py-3 font-bold text-base transition-colors flex-shrink-0"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center">
            <p className="text-foreground-muted text-sm">
              Explore designs • Support creators • Find your style
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
