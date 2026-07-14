"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

interface CreatorHeroProps {
  creatorName: string;
  creatorUsername: string;
  isVerified?: boolean;
  tagline?: string;
  productCount?: number;
  categoryCount?: number;
  avatarUrl?: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
  };
}

export function CreatorHero({
  creatorName,
  creatorUsername,
  isVerified = false,
  tagline,
  productCount = 0,
  categoryCount = 0,
  avatarUrl,
  socialLinks = {},
}: CreatorHeroProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/shop/${creatorUsername}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${creatorName}'s Shop`,
          text: tagline || `Check out ${creatorName}'s exclusive products`,
          url: shareUrl,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: Copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <div className="relative bg-black px-4 sm:px-6 lg:px-8 py-8">
      {/* Dynamic cover-blur background derived from creator avatar */}
      {avatarUrl && (
        <div className="absolute inset-x-4 sm:inset-x-6 lg:inset-x-8 top-8 bottom-8 rounded-[2.5rem] overflow-hidden opacity-20 blur-3xl pointer-events-none -z-10">
          <img src={avatarUrl} alt="" className="w-full h-full object-cover scale-150" />
        </div>
      )}

      {/* Main Glassmorphic Container */}
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 py-8 sm:py-10 rounded-[2.5rem] bg-neutral-900/30 backdrop-blur-xl border border-white/10 relative overflow-hidden shadow-2xl">
        
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:16px_16px] opacity-30 -z-10"></div>
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-orange-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* Left section: Avatar & Name details */}
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 text-center sm:text-left flex-1">
            
            {/* Avatar container */}
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-neutral-950 border-2 sm:border-3 border-orange-500 flex items-center justify-center shadow-2xl overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={creatorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-white">
                      {creatorName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name, Tagline & Verified status */}
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                  {creatorName}
                </h2>
                
                <div className="inline-flex items-center gap-1 text-sky-400 bg-sky-500/10 border border-sky-500/25 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider self-center sm:self-auto shadow-sm">
                  <Check className="w-3.5 h-3.5" strokeWidth={3.5} />
                  <span>Verified</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-orange-400 font-extrabold tracking-wide mt-1.5 mb-3">
                @{creatorUsername}
              </p>
              
              <p className="text-sm text-gray-400 max-w-xl font-medium leading-relaxed drop-shadow">
                {tagline || "Exclusive design drops, limited apparel lines, and custom merchandise curated for you."}
              </p>
            </div>

          </div>

          {/* Right section: Share button & stats */}
          <div className="flex flex-col md:items-end gap-6 w-full md:w-auto flex-shrink-0">
            
            {/* Share action pill */}
            <div className="flex justify-center md:justify-end">
              <button
                onClick={handleShare}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-black font-extrabold text-xs uppercase tracking-widest hover:bg-orange-500 hover:text-white hover:scale-105 transition-all duration-300 shadow-xl cursor-pointer"
                title="Share this creator's profile"
              >
                <Share2 className="w-4 h-4" />
                <span>{copied ? "Copied!" : "Share Profile"}</span>
              </button>
            </div>

            {/* Stats list */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 w-full md:w-auto">
              
              {/* Product Stat */}
              <div className="bg-neutral-950/40 border border-white/5 rounded-[1.5rem] p-4 flex items-center gap-3.5 w-36 sm:w-44 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/icons/products-box.png"
                    alt="Products"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-white leading-none">
                    {productCount}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/50 font-bold uppercase tracking-wider mt-1">
                    Products
                  </span>
                </div>
              </div>

              {/* Categories Stat */}
              <div className="bg-neutral-950/40 border border-white/5 rounded-[1.5rem] p-4 flex items-center gap-3.5 w-36 sm:w-44 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                  <img
                    src="/icons/category-box.png"
                    alt="Categories"
                    className="w-6 h-6 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl sm:text-3xl font-black text-white leading-none">
                    {categoryCount || 1}
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/50 font-bold uppercase tracking-wider mt-1">
                    Categories
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
