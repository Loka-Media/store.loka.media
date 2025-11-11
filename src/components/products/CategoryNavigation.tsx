/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Tag } from "lucide-react";

interface CategoryNavigationProps {
  categories: {
    category: string;
    product_count: number;
  }[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryNavigation({
  categories,
  activeCategory,
  onCategoryChange,
}: CategoryNavigationProps) {
  return (
    <div className="bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 border-y border-black py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Scrollable category tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Tag className="w-4 h-4 text-black" />
            <span className="text-sm font-extrabold text-black hidden sm:inline">Categories:</span>
          </div>

          {/* All Categories */}
          <button
            onClick={() => onCategoryChange("")}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold border border-black transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
              activeCategory === ""
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-yellow-50"
            }`}
          >
            All
          </button>

          {/* Category buttons */}
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => onCategoryChange(cat.category)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-extrabold border border-black transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] ${
                activeCategory === cat.category
                  ? "bg-black text-white"
                  : "bg-white text-black hover:bg-yellow-50"
              }`}
            >
              {cat.category}
              <span className="ml-2 text-xs opacity-70">({cat.product_count})</span>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
