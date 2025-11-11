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
    <div className="border-b border-black mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-extrabold border border-black transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] whitespace-nowrap ${
                  activeView === tab.id
                    ? "bg-black text-white"
                    : "bg-white text-black hover:bg-yellow-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Results Count */}
        <div className="bg-pink-200 px-4 py-2 rounded-full border border-black whitespace-nowrap">
          <span className="text-sm font-extrabold text-black">
            {resultCount} products
          </span>
        </div>
      </div>
    </div>
  );
}
