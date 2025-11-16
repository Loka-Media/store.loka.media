/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { TrendingUp, Clock, Flame } from "lucide-react";

export type ViewType = "trending" | "new" | "popular";

interface ProductViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  resultCount: number;
}

export function ProductViewTabs({
  activeView,
  onViewChange,
  resultCount,
}: ProductViewTabsProps) {
  const tabs = [
    { id: "trending" as ViewType, label: "Trending", icon: TrendingUp },
    { id: "new" as ViewType, label: "New Arrivals", icon: Clock },
    { id: "popular" as ViewType, label: "Popular", icon: Flame },
  ];

  return (
    <div className="border-b border-black mb-4 sm:mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4">
        {/* Tabs */}
        <div className="w-full sm:w-auto flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-extrabold border border-black transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] whitespace-nowrap flex-shrink-0 ${
                  activeView === tab.id
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-yellow-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">{tab.label}</span>
                <span className="xs:hidden">{tab.id === "new" ? "New" : tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results Count */}
        <div className="bg-pink-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-black whitespace-nowrap flex-shrink-0">
          <span className="text-xs sm:text-sm font-extrabold text-black">
            {resultCount} products
          </span>
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
