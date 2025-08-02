"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

interface Creator {
  id: number;
  name: string;
  username: string;
  product_count: number;
}

interface FeaturedCreatorsProps {
  creators: Creator[];
  onCreatorSelect: (creatorName: string) => void;
}

export function FeaturedCreators({
  creators,
  onCreatorSelect,
}: FeaturedCreatorsProps) {
  const CreatorPlaceholder = ({ index }: { index: number }) => (
    <div
      key={index}
      className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700/50 animate-pulse"
    >
      <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-700"></div>
      <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2 mx-auto"></div>
      <div className="flex items-center justify-center mt-1">
        <Star className="w-3 h-3 text-gray-600" />
        <span className="text-xs text-gray-600 ml-1">-.-</span>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg p-6 mb-12 border border-gray-800">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Featured Creators</h2>
          <p className="text-gray-400 mt-1">
            Discover amazing creators and their unique designs
          </p>
        </div>
        <Link
          href="/creators"
          className="text-orange-500 hover:text-orange-400 font-medium text-sm mt-4 sm:mt-0 flex items-center"
        >
          View All Creators <ArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
        {creators.length > 0
          ? creators.slice(0, 5).map((creator) => (
              <div
                key={creator.id}
                className="text-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer border border-gray-700/50"
                onClick={() => onCreatorSelect(creator.name)}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center border-2 border-orange-400">
                  <span className="text-white font-bold text-lg">
                    {creator.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-medium text-white text-base truncate">
                  {creator.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {creator.product_count} products
                </p>
                <div className="flex items-center justify-center mt-1">
                  <Star className="w-3 h-3 text-orange-400 fill-current" />
                  <span className="text-xs text-gray-500 ml-1">4.8</span>
                </div>
              </div>
            ))
          : Array.from({ length: 5 }).map((_, i) => (
              <CreatorPlaceholder key={i} index={i} />
            ))}
      </div>
    </div>
  );
}
