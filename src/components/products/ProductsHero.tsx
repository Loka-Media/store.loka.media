import { Search, Sparkles, TrendingUp } from "lucide-react";
import { ExtendedProduct } from "@/lib/api";

interface ProductsHeroProps {
  filters: {
    search: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  fetchProducts: () => void;
  pagination: {
    total: number;
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
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-purple-600/20"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M30%2030h30v30H30V30z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-orange-400 mr-3 animate-pulse" />
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Marketplace
            </h1>
            <TrendingUp className="w-8 h-8 text-orange-400 ml-3 animate-bounce" />
          </div>
          <p className="mt-6 text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            Discover extraordinary designs from the world&apos;s most talented
            creators.
            <span className="text-orange-400 font-semibold">
              {" "}
              Premium quality
            </span>
            ,
            <span className="text-orange-400 font-semibold">
              {" "}
              unique artistry
            </span>
            , and{" "}
            <span className="text-orange-400 font-semibold">
              limitless creativity
            </span>{" "}
            await.
          </p>

          {/* Enhanced Search Bar */}
          <div className="mt-10 flex justify-center">
            <div className="relative w-full max-w-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl p-2 flex items-center space-x-3 shadow-2xl border border-gray-700/50">
                <Search className="w-6 h-6 text-orange-400 ml-4" />
                <input
                  type="text"
                  placeholder="Search for products, creators, or categories..."
                  className="flex-1 px-4 py-4 bg-transparent border-0 rounded-lg focus:ring-0 focus:outline-none text-white placeholder-gray-400 text-lg"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev: any) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  onKeyPress={(e) => e.key === "Enter" && fetchProducts()}
                />
                <button
                  onClick={fetchProducts}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {pagination.total}+
              </div>
              <div className="text-gray-400 mt-1">Unique Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {creators.length}+
              </div>
              <div className="text-gray-400 mt-1">Talented Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {categories.length}+
              </div>
              <div className="text-gray-400 mt-1">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
