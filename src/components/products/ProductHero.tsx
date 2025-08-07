'use client';

import { Sparkles, TrendingUp, Search } from "lucide-react";
import { SearchBar } from './SearchBar';

interface ProductHeroProps {
  paginationTotal: number;
  creatorsLength: number;
  categoriesLength: number;
  filtersSearch: string;
  setFiltersSearch: (search: string) => void;
  fetchProducts: () => void;
}

export function ProductHero({
  paginationTotal,
  creatorsLength,
  categoriesLength,
  filtersSearch,
  setFiltersSearch,
  fetchProducts,
}: ProductHeroProps) {
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
          <SearchBar
            search={filtersSearch}
            setSearch={setFiltersSearch}
            onSearch={fetchProducts}
          />

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {paginationTotal}+
              </div>
              <div className="text-gray-400 mt-1">Unique Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {creatorsLength}+
              </div>
              <div className="text-gray-400 mt-1">Talented Creators</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">
                {categoriesLength}+
              </div>
              <div className="text-gray-400 mt-1">Categories</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
