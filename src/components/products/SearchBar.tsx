'use client';

import { Search } from "lucide-react";

interface SearchBarProps {
  search: string;
  setSearch: (search: string) => void;
  onSearch: () => void;
}

export function SearchBar({
  search,
  setSearch,
  onSearch,
}: SearchBarProps) {
  return (
    <div className="mt-10 flex justify-center">
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
        <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl p-2 flex items-center space-x-3 shadow-2xl border border-gray-700/50">
          <Search className="w-6 h-6 text-orange-400 ml-4" />
          <input
            type="text"
            placeholder="Search for products, creators, or categories..."
            className="flex-1 px-4 py-4 bg-transparent border-0 rounded-lg focus:ring-0 focus:outline-none text-white placeholder-gray-400 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && onSearch()}
          />
          <button
            onClick={onSearch}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
}
