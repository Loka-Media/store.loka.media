/* eslint-disable @typescript-eslint/no-explicit-any */
import { Search, Sparkles, TrendingUp, Zap, Heart, Star, ShoppingBag, Users, Flame } from "lucide-react";
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
    <div className="relative overflow-hidden min-h-[32vh] flex items-center">
      {/* Background gradients with website theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 via-gray-900 to-orange-800/10"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-gray-800/5"></div>
      
      {/* Floating emoji animations - no blinking */}
      <div className="absolute top-8 left-10 text-2xl animate-bounce" style={{animationDelay: '0s'}}>🔥</div>
      <div className="absolute top-12 right-20 text-xl animate-bounce" style={{animationDelay: '1s'}}>✨</div>
      <div className="absolute bottom-16 left-20 text-xl animate-bounce" style={{animationDelay: '2s'}}>💎</div>
      <div className="absolute top-16 right-10 text-lg animate-bounce" style={{animationDelay: '1.5s'}}>🚀</div>
      <div className="absolute bottom-20 right-32 text-xl animate-bounce" style={{animationDelay: '0.5s'}}>⚡</div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%221%22%3E%3Cpath%20d%3D%22M20%200v40M0%2020h40%22%20stroke%3D%22%23ffffff%22%20stroke-width%3D%221%22%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center">
          {/* Main heading with website theme */}
          <div className="mb-4">
            <div className="flex items-center justify-center mb-2">
              <Flame className="w-6 h-6 text-orange-400 mr-2" />
              <div className="text-3xl sm:text-4xl md:text-5xl font-black">
                <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  SHOP
                </span>
              </div>
              <Zap className="w-6 h-6 text-orange-400 ml-2 animate-bounce" />
            </div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-200 via-gray-300 to-orange-300 bg-clip-text text-transparent">
              THE VIBE ✨
            </div>
          </div>
          
          {/* Gen Z description - more compact */}
          <div className="mt-4 text-sm sm:text-base text-gray-300 max-w-3xl mx-auto leading-relaxed">
            <p className="mb-2">
              <span className="text-orange-400 font-bold">No cap</span> - we&apos;ve got the 
              <span className="text-orange-500 font-bold"> most fire </span> 
              designs from creators who absolutely 
              <span className="text-orange-300 font-bold">understand the assignment</span> 💅
            </p>
            <p className="text-sm text-gray-400">
              Custom prints, trending designs, and that 
              <span className="text-orange-400 font-semibold">main character energy</span> you&apos;ve been looking for
            </p>
          </div>

          {/* Compact Search Bar */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-full max-w-2xl">
              {/* Glowing background - no blinking */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-gray-800/20 to-orange-600/20 rounded-2xl blur-xl"></div>
              
              {/* Search container */}
              <div className="relative bg-gray-900/90 backdrop-blur-xl rounded-2xl p-2 border border-orange-500/20 shadow-xl">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-orange-400 ml-3" />
                  <input
                    type="text"
                    placeholder="Search the vibe... ✨ (products, creators, whatever you're feeling)"
                    className="flex-1 px-3 py-3 bg-transparent border-0 rounded-xl focus:ring-0 focus:outline-none text-white placeholder-gray-400 text-base font-medium"
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
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 relative overflow-hidden group"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
                    <span className="relative flex items-center">
                      Let&apos;s Go! 🚀
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Stats with website theme */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="group bg-gradient-to-br from-orange-500/10 to-gray-800/10 backdrop-blur-sm rounded-2xl p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-2">
                <ShoppingBag className="w-6 h-6 text-orange-400 animate-bounce" />
              </div>
              <div className="text-2xl font-black bg-gradient-to-r from-orange-400 to-orange-500 bg-clip-text text-transparent">
                {pagination.total}+
              </div>
              <div className="text-gray-300 mt-1 font-medium text-sm">Fire Products 🔥</div>
              <div className="text-xs text-gray-500">All the hits, no misses</div>
            </div>
            
            <div className="group bg-gradient-to-br from-gray-800/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-4 border border-gray-600/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 text-gray-400" />
              </div>
              <div className="text-2xl font-black bg-gradient-to-r from-gray-300 to-orange-400 bg-clip-text text-transparent">
                {creators.length}+
              </div>
              <div className="text-gray-300 mt-1 font-medium text-sm">Creator Besties ✨</div>
              <div className="text-xs text-gray-500">Artists who get it</div>
            </div>
            
            <div className="group bg-gradient-to-br from-orange-500/10 to-gray-800/10 backdrop-blur-sm rounded-2xl p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-6 h-6 text-orange-400 animate-spin" style={{animationDuration: '3s'}} />
              </div>
              <div className="text-2xl font-black bg-gradient-to-r from-orange-400 to-gray-300 bg-clip-text text-transparent">
                {categories.length}+
              </div>
              <div className="text-gray-300 mt-1 font-medium text-sm">Vibes & Categories 💫</div>
              <div className="text-xs text-gray-500">Every aesthetic covered</div>
            </div>
          </div>
          
          {/* Compact Call to action */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="bg-gradient-to-r from-orange-500/20 to-gray-800/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-orange-500/30">
              <span className="text-orange-300 font-semibold text-sm">💅 Serving looks since day one</span>
            </div>
            <div className="bg-gradient-to-r from-gray-800/20 to-orange-500/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-orange-500/30">
              <span className="text-gray-300 font-semibold text-sm">🎨 Art that hits different</span>
            </div>
            <div className="bg-gradient-to-r from-orange-500/20 to-gray-700/20 backdrop-blur-sm rounded-xl px-4 py-2 border border-orange-500/30">
              <span className="text-orange-300 font-semibold text-sm">✨ Main character energy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}