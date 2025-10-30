/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { formatPrice, ExtendedProduct } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
// Cart functionality removed - useGuestCart no longer needed
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Star,
  User,
} from "lucide-react";
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

  // Sync with wishlist context state for real-time updates - NO API calls needed!
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
      <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group cursor-pointer hover:border-orange-500/50">
        <div className="w-full relative overflow-hidden rounded-t-xl" style={{ aspectRatio: '1/1' }}>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
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
            className="fallback-img absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ display: "none" }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder-product.svg";
            }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div className="flex items-center space-x-2 w-full" onClick={(e) => e.stopPropagation()}>
              <button
                className={`p-2 rounded-lg transition-all duration-200 focus:outline-none ${
                  isWishlisted
                    ? "bg-red-500 text-white"
                    : "bg-black/70 text-gray-400 hover:text-red-400 hover:bg-black/90"
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
                  className={`w-4 h-4 ${
                    isWishlisted ? "fill-current" : ""
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="font-bold text-lg text-white truncate mb-2 group-hover:text-orange-300 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between mb-3">
            <span className="text-orange-400 font-semibold">
              {formatPrice(product.min_price)}
              {product.max_price > product.min_price && (
                <span className="text-xs text-gray-400 ml-1">- {formatPrice(product.max_price)}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center bg-gray-700/50 rounded-full px-2 py-1">
              <User className="w-3 h-3 text-orange-400 mr-1" />
              <span className="text-xs text-gray-300 truncate">{product.creator_name}</span>
            </div>
            <div className="flex items-center bg-yellow-500/20 rounded-full px-2 py-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
              <span className="text-xs text-yellow-200">4.8</span>
            </div>
          </div>

          {/* Category badge */}
          {product.category && (
            <div className="flex flex-wrap gap-1">
              <span className="inline-flex items-center bg-orange-800/60 text-orange-200 text-xs px-2 py-1 rounded-md font-medium">
                {product.category}
              </span>
              {product.product_source && (
                <span
                  className={`inline-flex items-center text-xs px-2 py-1 rounded-md font-medium ${
                    product.product_source === "printful"
                      ? "bg-purple-900/60 text-purple-300"
                      : product.product_source === "shopify"
                      ? "bg-green-900/60 text-green-300"
                      : "bg-gray-800/60 text-gray-400"
                  }`}
                >
                  {product.product_source === "printful"
                    ? "PF"
                    : product.product_source === "shopify"
                    ? "SP"
                    : "CS"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}