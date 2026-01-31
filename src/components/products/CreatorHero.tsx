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
    const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/profile/${creatorUsername}/shop`;

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
    <div className="relative bg-black px-4 sm:px-6 lg:px-8">
      <div className="gradient-border-white-bottom max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative z-10">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 lg:gap-12">
          {/* Left Section - Avatar */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={creatorName}
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-2 sm:border-3 border-white/20"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center border-2 sm:border-3 border-white/20">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  {creatorName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {isVerified && (
              <div className="absolute bottom-0 right-0 w-6 h-6 sm:w-7 sm:h-7 bg-blue-500 rounded-full border-2 border-black flex items-center justify-center">
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </div>
            )}
          </div>

          {/* Middle Section - Creator Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <div className="text-3xl sm:text-3xl lg:text-3xl font-semibold text-white">
                {creatorName}
              </div>
              {isVerified && (
                <div className="flex items-center justify-center sm:justify-start gap-1 text-blue-400">
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={3} />
                  <span className="text-xs sm:text-sm font-semibold">Verified</span>
                </div>
              )}
            </div>
            <p className="text-sm sm:text-base text-orange-400 font-medium mt-1 mb-2">
              @{creatorUsername}
            </p>
            {tagline && (
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                {tagline}
              </p>
            )}
          </div>

          {/* Right Section - Share Button & Stats */}
          <div className="flex flex-col gap-4 items-center sm:items-end flex-shrink-0">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 transition-colors cursor-pointer animate-share-flicker"
              title="Share this creator's profile"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm font-medium">{copied ? "Copied!" : "Share"}</span>
            </button>

            {/* Stats Cards */}
            <div className="flex items-center gap-4 sm:gap-6">
            {/* Products Stat */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 gradient-border-white-top bg-white/5 hover:bg-white/10 transition-colors w-32 sm:w-40">
              <img
                src="/icons/products-box.png"
                alt="Products"
                className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
              />
              <div className="flex flex-col items-center sm:items-end">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                  {productCount}
                </span>
                <span className="text-xs sm:text-sm text-white/60 font-medium whitespace-nowrap">
                  {productCount === 1 ? "Product" : "Products"}
                </span>
              </div>
            </div>

            {/* Categories Stat */}
            {categoryCount > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-3 py-2 sm:px-4 sm:py-3 gradient-border-white-top bg-white/5 hover:bg-white/10 transition-colors w-32 sm:w-40">
                <img
                  src="/icons/category-box.png"
                  alt="Categories"
                  className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
                />
                <div className="flex flex-col items-center sm:items-end">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    {categoryCount}
                  </span>
                  <span className="text-xs sm:text-sm text-white/60 font-medium whitespace-nowrap">
                    {categoryCount === 1 ? "Category" : "Categories"}
                  </span>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
