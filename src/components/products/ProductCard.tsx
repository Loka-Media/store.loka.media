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
      <div className="group relative bg-black rounded-3xl overflow-hidden hover:shadow-[0_20px_60px_rgba(255,99,71,0.3)] transition-all duration-300 cursor-pointer" style={{
        border: '1px solid transparent',
        backgroundImage: 'linear-gradient(#000, #000), linear-gradient(180deg, transparent, rgba(255,255,255,0.3) 70%, #ffffff)',
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
      }}>
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-black" style={{ aspectRatio: '1/1' }}>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-105"
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
            className="fallback-img absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
            style={{ display: "none" }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder-product.svg";
            }}
          />

          {/* Wishlist Button - Bottom Left */}
          <div className="absolute bottom-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
            <button
              className={`p-2.5 rounded-lg transition-all duration-300 focus:outline-none hover:shadow-[0_8px_20px_rgba(255,99,71,0.5)] ${
                isWishlisted
                  ? "bg-pink-500 text-white"
                  : "bg-black text-white"
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
                className={`w-5 h-5 ${
                  isWishlisted ? "fill-current" : ""
                }`}
              />
            </button>
          </div>

          {/* Rating Badge - Bottom Right */}
          <div className="absolute bottom-3 right-3 z-10">
            <div className="bg-black px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">4.8</span>
              <span className="text-sm">⭐</span>
            </div>
          </div>
        </div>

        {/* Content Section - Below Image */}
        <div className="bg-black px-3 py-2.5 flex flex-col h-full">
          {/* Creator Name */}
          <p className="text-xs text-gray-400 font-semibold mb-1">
            by {product.creator_name}
          </p>

          {/* Product Title */}
          <div className="font-extrabold text-sm text-white mb-auto line-clamp-2 group-hover:text-orange-400 transition-colors tracking-tight">
            {product.name}
          </div>

          {/* Price */}
          <div className="flex items-center justify-between pt-1.5">
            <span className="text-sm font-extrabold text-cyan-400 tracking-tight">
              {formatPrice(product.min_price)}
              {product.max_price > product.min_price && (
                <span className="text-xs text-gray-400 font-normal ml-1">- {formatPrice(product.max_price)}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
