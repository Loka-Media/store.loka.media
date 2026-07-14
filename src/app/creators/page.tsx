"use client";

import { useState, useEffect, useCallback } from "react";
import { productAPI } from "@/lib/api";
import Link from "next/link";
import { User, Package, ChevronRight } from "lucide-react";
import GradientTitle from "@/components/ui/GradientTitle";
import CreativeLoader from "@/components/CreativeLoader";

interface Creator {
  id: number;
  name: string;
  username: string;
  product_count: number;
}

export default function CreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const fetchCreators = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productAPI.getCreators();
      setCreators(response.creators || []);
    } catch (error) {
      console.error("Failed to fetch creators:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  const filteredCreators = creators.filter((creator) => {
    const query = searchQuery.toLowerCase();
    return (
      creator.name.toLowerCase().includes(query) ||
      creator.username.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <GradientTitle
            text="Discover Creators"
            size="lg"
            className="mb-4 text-4xl sm:text-5xl md:text-6xl"
          />
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Explore our talented community of creators and find unique products crafted just for you.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-16 relative animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search creators by name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 h-12 rounded-xl border border-white/20 bg-gradient-to-br from-gray-800 to-gray-900 text-white text-sm placeholder-white/40 hover:border-orange-400/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all shadow-lg"
          />
        </div>

        {loading ? (
          <div className="flex justify-center mt-20">
            <CreativeLoader variant="product" message="Loading creators..." />
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center mt-20 p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl max-w-2xl mx-auto">
            <User className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              {searchQuery ? "No creators match your search" : "No creators found"}
            </h3>
            <p className="text-gray-400">
              {searchQuery ? "Try searching with a different name or username." : "Be the first to join and start selling!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCreators.map((creator, index) => (
              <Link
                key={creator.id}
                href={`/shop/${creator.username || creator.name.replace(/\s+/g, '')}`}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="h-full p-6 rounded-3xl bg-[#1a1a1a]/80 backdrop-blur-xl border border-white/10 hover:border-orange-500/50 hover:bg-[#222] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(255,109,31,0.15)] flex flex-col items-center text-center relative overflow-hidden">
                  
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-pink-500/20 blur-3xl -mr-10 -mt-10 rounded-full transition-all group-hover:scale-150 group-hover:opacity-70"></div>

                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-white/20 mb-4 flex items-center justify-center shadow-xl group-hover:border-orange-500/50 transition-colors z-10">
                    <User className="w-8 h-8 text-gray-400 group-hover:text-orange-400 transition-colors" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-1 z-10 relative group-hover:text-orange-50 transition-colors">
                    {creator.name}
                  </h3>
                  
                  <p className="text-sm text-gray-400 mb-6 z-10 relative">
                    @{creator.username}
                  </p>
                  
                  <div className="mt-auto w-full flex items-center justify-between pt-4 border-t border-white/10 z-10 relative">
                    <div className="flex items-center text-sm text-gray-300">
                      <Package className="w-4 h-4 mr-2 text-orange-500" />
                      {creator.product_count} Products
                    </div>
                    
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
