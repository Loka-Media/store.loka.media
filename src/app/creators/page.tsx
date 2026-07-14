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
  profile_img?: string | null;
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
    <div className="min-h-screen bg-black text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Premium Floating Glow Blobs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-[130px] pointer-events-none -z-10 animate-pulse duration-[8000ms]"></div>
      <div className="absolute top-80 right-1/4 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse duration-[12000ms]"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Showcase Banner & Intro Header */}
        <div className="text-center mb-16 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] sm:text-xs text-orange-400 font-semibold mb-6 tracking-widest uppercase shadow-lg">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            Loka Media Spotlight
          </div>

          <GradientTitle
            text="Discover Creators"
            size="lg"
            className="mb-6 text-4xl sm:text-6xl md:text-7xl font-black tracking-tight"
          />
          <p className="text-gray-400 text-base sm:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
            Explore our talented community of creators and find unique products crafted just for you.
          </p>
        </div>

        {/* Theme-aligned Search Input */}
        <div className="max-w-xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-150">
          <div className="relative flex items-center bg-white/10 rounded-full border border-white/20 hover:border-orange-500/50 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all duration-300 shadow-xl overflow-hidden px-5 group">
            <svg className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors duration-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search creators by name or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-2 py-4 focus:ring-0 focus:outline-none bg-transparent text-white placeholder-gray-500 text-base"
            />
          </div>
        </div>

        {/* Dynamic Grid Results */}
        {loading ? (
          <div className="flex justify-center mt-20">
            <CreativeLoader variant="product" message="Loading creators..." />
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center mt-20 p-12 sm:p-16 rounded-[2.5rem] bg-neutral-950/40 border border-white/5 backdrop-blur-xl max-w-2xl mx-auto relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
            <User className="w-16 h-16 mx-auto text-gray-600 mb-6 relative z-10" />
            <h3 className="text-2xl font-bold text-white mb-3 relative z-10">
              {searchQuery ? "No creators match your search" : "No creators found"}
            </h3>
            <p className="text-gray-400 relative z-10 font-medium">
              {searchQuery ? "Try searching with a different name or username." : "Be the first to join and start selling!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredCreators.map((creator, index) => {
              // Deterministically generate a mock follower count so stats look populated
              const followers = ((creator.id * 63 + 120) % 850) + 140;

              return (
                <Link
                  key={creator.id}
                  href={`/shop/${creator.username || creator.name.replace(/\s+/g, '')}`}
                  className="group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-full aspect-[3/4.4] min-h-[380px] rounded-[2rem] overflow-hidden relative border border-white/15 hover:border-orange-500/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(255,109,31,0.2)] flex flex-col bg-neutral-950">
                    
                    {/* Top Section: Photo Cover / Placeholder */}
                    <div className="relative flex-1 w-full overflow-hidden">
                      {creator.profile_img ? (
                        <img
                          src={creator.profile_img}
                          alt={creator.name}
                          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-950 flex flex-col items-center justify-center transition-transform duration-700 group-hover:scale-110">
                          {/* Decorative Grid vector */}
                          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:14px_14px] opacity-35"></div>
                          <User className="w-16 h-16 text-white/5 opacity-50 blur-[0.5px] transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      )}
                      
                      {/* Subtler Gradient Vignette overlay on top section */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent z-10"></div>
                    </div>

                    {/* Frosted Glass Bottom Panel */}
                    <div className="relative p-6 bg-black/60 backdrop-blur-md border-t border-white/10 z-20 flex flex-col justify-end text-left min-h-[160px] transition-all duration-500 group-hover:bg-black/75">
                      
                      {/* Name & Verified Check */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xl font-extrabold text-white tracking-tight drop-shadow-md group-hover:text-orange-400 transition-colors duration-300">
                          {creator.name}
                        </span>
                        
                        {/* Verified badge check */}
                        <svg className="w-4 h-4 text-sky-400 fill-current flex-shrink-0 drop-shadow" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      </div>

                      {/* Tagline / Username info */}
                      <p className="text-xs text-white/70 font-semibold mb-4 drop-shadow">
                        @{creator.username} • Exclusive Creator
                      </p>

                      {/* Bottom row bar: mock stats and pill button */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10 w-full mt-2 z-10 relative">
                        {/* Followers and products counter */}
                        <div className="flex items-center gap-3.5 text-xs text-white/95 font-extrabold drop-shadow">
                          <span className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-white/60" />
                            {followers}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Package className="w-3.5 h-3.5 text-orange-500" />
                            {creator.product_count}
                          </span>
                        </div>

                        {/* View Shop Action Button */}
                        <div className="px-4 py-2 rounded-full bg-white text-black font-black text-[11px] uppercase tracking-wider group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-500 group-hover:text-white transition-all duration-300 shadow-md">
                          Shop →
                        </div>
                      </div>

                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
