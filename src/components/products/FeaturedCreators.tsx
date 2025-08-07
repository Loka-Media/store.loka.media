'use client';

import Link from "next/link";
import { Sparkles, ChevronDown, Star, User } from "lucide-react";

interface FeaturedCreatorsProps {
  creators: { id: number; name: string; username: string; product_count: number }[];
  handleFilterChange: (key: string, value: string) => void;
}

export function FeaturedCreators({
  creators,
  handleFilterChange,
}: FeaturedCreatorsProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-8 mb-12 border border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center">
              <Sparkles className="w-8 h-8 text-orange-400 mr-3" />
              Featured Creators
            </h2>
            <p className="text-gray-400 mt-2 text-lg">
              Meet the artists behind extraordinary designs
            </p>
          </div>
          <Link
            href="/creators"
            className="text-orange-400 hover:text-orange-300 font-semibold text-lg transition-colors duration-200 flex items-center group"
          >
            View All Creators
            <ChevronDown className="w-5 h-5 ml-1 transform -rotate-90 group-hover:translate-x-1 transition-transform duration-200" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {creators.length > 0
            ? creators.slice(0, 4).map((creator) => (
                <div
                  key={creator.id}
                  className="group text-center p-6 hover:bg-gray-800/50 rounded-2xl transition-all duration-300 cursor-pointer border border-transparent hover:border-orange-500/30 backdrop-blur-sm"
                  onClick={() => handleFilterChange("creator", creator.name)}
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {creator.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors duration-200">
                    {creator.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {creator.product_count} products
                  </p>
                  <div className="flex items-center justify-center mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400 ml-1">4.8</span>
                  </div>
                </div>
              ))
            : // Fallback creators with enhanced styling
              [
                { name: "Featured Creator", products: 25, rating: "4.8" },
                { name: "Design Studio", products: 18, rating: "4.9" },
                { name: "Creative Mind", products: 32, rating: "4.7" },
                { name: "Art Collective", products: 14, rating: "4.8" },
              ].map((creator, index) => (
                <div
                  key={creator.name}
                  className="group text-center p-6 hover:bg-gray-800/50 rounded-2xl transition-all duration-300 border border-transparent hover:border-orange-500/30"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {creator.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors duration-200">
                    {creator.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {creator.products} products
                  </p>
                  <div className="flex items-center justify-center mt-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-400 ml-1">
                      {creator.rating}
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
}