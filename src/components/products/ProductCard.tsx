/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
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

  const { addToWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const imageUrl =
    product.thumbnail_url ||
    product.images?.[0] ||
    "/placeholder-product.svg";

  return (
    <div className="group bg-gradient-to-br from-gray-900/90 via-gray-900/95 to-gray-800/90 rounded-2xl shadow-lg overflow-hidden hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-1 border border-gray-700/40 hover:border-orange-500/40 backdrop-blur-sm relative">
      {/* Simplified background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
        <div className="aspect-[4/3] relative overflow-hidden bg-gray-800">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            unoptimized={true}
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {/* Wishlist button */}
          <div className="absolute top-2 right-2">
            <button
              className={`p-1 rounded-full transition-all duration-200 focus:outline-none ${
                isWishlisted
                  ? "bg-red-500 text-white"
                  : "bg-black/70 text-gray-300 hover:text-red-400 hover:bg-black/90"
              }`}
              title="Add to wishlist"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  toast.error("Please login to add items to wishlist");
                  return;
                }
                setIsWishlisted(!isWishlisted);
                addToWishlist(product.id);
                toast.success(
                  isWishlisted
                    ? "Removed from wishlist!"
                    : "Added to wishlist!"
                );
              }}
            >
              <Heart
                className={`w-2.5 h-2.5 transition-all duration-200 ${
                  isWishlisted ? "fill-current" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-2 relative z-10">
        <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
          <h3 className="font-semibold text-white hover:text-orange-400 transition-colors duration-200 text-sm leading-tight line-clamp-2 mb-1 group-hover:text-orange-300">
            {product.name}
          </h3>
        </Link>

        {/* Creator and rating */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center bg-gray-800/60 rounded-full px-1.5 py-0.5">
            <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-1">
              <User className="w-1.5 h-1.5 text-white" />
            </div>
            <span className="text-xs text-gray-300 font-medium truncate">
              {product.creator_name}
            </span>
          </div>

          <div className="flex items-center bg-yellow-500/15 rounded-full px-1.5 py-0.5">
            <Star className="w-2.5 h-2.5 text-yellow-400 fill-current mr-0.5" />
            <span className="text-xs text-yellow-200 font-medium">4.8</span>
          </div>
        </div>

        {/* Price section */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {/* No fake discount pricing */}
            <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              {formatPrice(product.min_price)}
            </span>
            {product.max_price > product.min_price && (
              <span className="text-xs text-gray-400">
                - {formatPrice(product.max_price)}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-0.5">
          {product.category && (
            <span className="inline-flex items-center bg-orange-800/60 text-orange-200 text-xs px-1.5 py-0.5 rounded-md font-medium">
              {product.category.slice(0, 8)}
            </span>
          )}

          {product.product_source && (
            <span
              className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded-md font-medium ${
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
      </div>

      {/* Simplified shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 transition-transform duration-500 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>
    </div>
  );
}