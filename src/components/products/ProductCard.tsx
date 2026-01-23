/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { formatPrice, ExtendedProduct } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { Heart, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: ExtendedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addToWishlist, removeFromWishlist, items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      const inWishlist = wishlistItems.some(item => item.product_id === product.id);
      setIsWishlisted(inWishlist);
    } else {
      setIsWishlisted(false);
    }
  }, [isAuthenticated, product.id, wishlistItems]);

  const imageUrl =
    product.thumbnail_url ||
    product.images?.[0] ||
    "/placeholder-product.svg";

  return (
    <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
      <style>{`
        @keyframes shimmer-card {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .card-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer-card 2s infinite;
        }
      `}</style>
      <div
        className="group relative bg-black rounded-3xl overflow-hidden hover:shadow-[0_20px_60px_rgba(255,99,71,0.3)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
        style={{
          border: '1px solid transparent',
          backgroundImage: isHovered
            ? 'linear-gradient(#000, #000), linear-gradient(135deg, rgba(255,109,31,0.2), rgba(255,255,255,0.3))'
            : 'linear-gradient(#000, #000), linear-gradient(180deg, transparent, rgba(255,255,255,0.3) 70%, #ffffff)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          transition: 'all 300ms ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-black" style={{ aspectRatio: '1/1' }}>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110"
            unoptimized={true}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fallbackImg =
                e.currentTarget.parentElement?.querySelector(
                  ".fallback-img"
                ) as HTMLImageElement;
              if (fallbackImg) {
                fallbackImg.style.display = "block";
              }
            }}
          />

          <img
            src={imageUrl}
            alt={product.name}
            className="fallback-img absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            style={{ display: "none" }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder-product.svg";
            }}
          />

          {/* Premium overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Wishlist Button - Bottom Left with enhanced styling */}
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
            <button
              className={`p-2 sm:p-3 rounded-full transition-all duration-300 focus:outline-none backdrop-blur-md shadow-lg hover:shadow-[0_8px_20px_rgba(255,99,71,0.8)] transform hover:scale-125 ${
                isWishlisted
                  ? "bg-red-500/90 text-white"
                  : "bg-black/70 text-white hover:bg-red-500/80"
              }`}
              title="Add to wishlist"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  toast.error("Please login to add items to wishlist");
                  return;
                }

                try {
                  if (isWishlisted) {
                    await removeFromWishlist(product.id);
                  } else {
                    await addToWishlist(product.id);
                  }
                } catch (error) {
                  console.error('Wishlist operation failed:', error);
                }
              }}
            >
              <Heart
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                  isWishlisted ? "fill-current scale-110" : ""
                }`}
              />
            </button>
          </div>

        </div>

        {/* Content Section - Below Image with enhanced styling */}
        <div className="bg-gradient-to-b from-black/80 to-black px-2 sm:px-4 py-2 sm:py-3 flex flex-col h-full backdrop-blur-sm">
          {/* Creator Name with badge style */}
          <p className="text-xs text-orange-400 font-semibold mb-1 sm:mb-1.5 inline-block bg-orange-500/20 px-2 py-1 rounded-full w-fit">
            by {product.creator?.name || product.creator_name || 'Unknown'}
          </p>

          {/* Product Title */}
          <div className="font-normal text-xs sm:text-sm text-white mb-auto line-clamp-2 group-hover:text-orange-300 transition-colors duration-300 tracking-tight leading-snug">
            {product.name}
          </div>

          {/* Price Section with gradient background */}
          <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-gray-700/30 mt-1.5 sm:mt-2">
            <span className="text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              {formatPrice(
                product.price_range?.min ? parseFloat(String(product.price_range.min)) : parseFloat(String(product.base_price) || '0')
              )}
              {product.price_range?.min && product.price_range?.max &&
                parseFloat(String(product.price_range.max)) > parseFloat(String(product.price_range.min)) && (
                <span className="text-xs text-gray-500 font-normal ml-1">- {formatPrice(parseFloat(String(product.price_range.max)))}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
