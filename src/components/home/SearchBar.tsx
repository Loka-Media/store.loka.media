"use client";

import { Search, ArrowRight } from "lucide-react";

interface SearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export function SearchBar({
  searchValue,
  onSearchChange,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="mt-8 flex justify-center">
      <div className="bg-white/10 rounded-full p-2 flex items-center space-x-2 shadow-lg w-full max-w-2xl border border-white/20">
        <Search className="w-5 h-5 text-gray-500 ml-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search for products, creators, or categories..."
          className="flex-1 px-4 py-2 border-0 rounded-full focus:ring-0 focus:outline-none bg-transparent text-white placeholder-gray-500 text-base"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && onSearch()}
        />
        <button
          onClick={onSearch}
          className="bg-orange-600 text-white px-6 py-2 rounded-full hover:bg-orange-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50 flex items-center"
        >
          Search
          <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
