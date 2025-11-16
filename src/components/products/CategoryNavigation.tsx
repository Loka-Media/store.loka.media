/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Tag, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);

  const checkScrollPosition = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setShowLeftButton(container.scrollLeft > 0);
    setShowRightButton(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    );
  };

  useEffect(() => {
    checkScrollPosition();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      window.addEventListener("resize", checkScrollPosition);
      return () => {
        container.removeEventListener("scroll", checkScrollPosition);
        window.removeEventListener("resize", checkScrollPosition);
      };
    }
  }, [categories]);

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 300;
    const targetScroll =
      direction === "left"
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <div className="bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 border-y border-black py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Scrollable category tabs with navigation */}
        <div className="relative">
          {/* Left scroll button with gradient fade */}
          {showLeftButton && (
            <div className="absolute left-0 top-0 bottom-2 z-10 flex items-center bg-gradient-to-r from-yellow-100 via-pink-100 to-transparent pointer-events-none pr-4">
              <button
                onClick={() => scroll("left")}
                className="pointer-events-auto bg-black text-white p-2 rounded-xl border border-black hover:bg-gray-900 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Right scroll button with gradient fade */}
          {showRightButton && (
            <div className="absolute right-0 top-0 bottom-2 z-10 flex items-center bg-gradient-to-l from-purple-100 via-pink-100 to-transparent pointer-events-none pl-4">
              <button
                onClick={() => scroll("right")}
                className="pointer-events-auto bg-black text-white p-2 rounded-xl border border-black hover:bg-gray-900 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide px-12"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
          <div className="flex items-center gap-2 flex-shrink-0 pl-0">
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
