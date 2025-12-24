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
    <div className="bg-gradient-to-r from-gray-950 via-black to-gray-950 border-y border-white/10 py-4">
      <div className="max-w-7xl mx-auto px-4">
        {/* Scrollable category tabs with navigation */}
        <div className="relative">
          {/* Left scroll button with gradient fade */}
          {showLeftButton && (
            <div className="absolute left-0 top-0 bottom-2 z-10 flex items-center bg-gradient-to-r from-black via-black to-transparent pointer-events-none pr-4">
              <button
                onClick={() => scroll("left")}
                className="pointer-events-auto bg-orange-500 text-white p-2 rounded-lg border border-orange-400 hover:bg-orange-600 transition-all hover:shadow-[0_8px_20px_rgba(255,99,71,0.3)]"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Right scroll button with gradient fade */}
          {showRightButton && (
            <div className="absolute right-0 top-0 bottom-2 z-10 flex items-center bg-gradient-to-l from-black via-black to-transparent pointer-events-none pl-4">
              <button
                onClick={() => scroll("right")}
                className="pointer-events-auto bg-orange-500 text-white p-2 rounded-lg border border-orange-400 hover:bg-orange-600 transition-all hover:shadow-[0_8px_20px_rgba(255,99,71,0.3)]"
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
          {/* All Categories */}
          <button
            onClick={() => onCategoryChange("")}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-extrabold border transition-all ${
              activeCategory === ""
                ? "bg-orange-500 text-white border-orange-400 hover:shadow-[0_8px_20px_rgba(255,99,71,0.3)]"
                : "bg-gray-800 text-white border-white/10 hover:border-orange-400/50 hover:bg-gray-700"
            }`}
          >
            All
          </button>

          {/* Category buttons */}
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => onCategoryChange(cat.category)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-extrabold border transition-all ${
                activeCategory === cat.category
                  ? "bg-orange-500 text-white border-orange-400 hover:shadow-[0_8px_20px_rgba(255,99,71,0.3)]"
                  : "bg-gray-800 text-white border-white/10 hover:border-orange-400/50 hover:bg-gray-700"
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
