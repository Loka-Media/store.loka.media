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
      <div className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-all duration-200 cursor-pointer">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
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

          {/* Wishlist Button */}
          <div className="absolute top-3 right-3" onClick={(e) => e.stopPropagation()}>
            <button
              className={`p-2 rounded-full transition-all duration-200 focus:outline-none ${
                isWishlisted
                  ? "bg-accent text-white"
                  : "bg-white/90 backdrop-blur-sm text-black/70 hover:text-accent hover:bg-white"
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

        {/* Content */}
        <div className="p-4">
          <h3 className="font-bold text-base text-black truncate mb-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>

          <div className="flex items-center justify-between mb-3">
            <span className="text-black font-bold text-lg">
              {formatPrice(product.min_price)}
              {product.max_price > product.min_price && (
                <span className="text-sm text-foreground-muted font-normal ml-1">- {formatPrice(product.max_price)}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center bg-gray-100 rounded-full px-2.5 py-1">
              <User className="w-3 h-3 text-foreground-muted mr-1.5" />
              <span className="text-xs text-foreground-muted truncate font-medium">{product.creator_name}</span>
            </div>
          </div>

          {/* Category badge */}
          {product.category && (
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center bg-gray-100 text-black text-xs px-2.5 py-1 rounded-md font-semibold">
                {product.category}
              </span>
              {product.product_source && (
                <span
                  className={`inline-flex items-center text-xs px-2.5 py-1 rounded-md font-semibold ${
                    product.product_source === "printful"
                      ? "bg-purple-100 text-purple-700"
                      : product.product_source === "shopify"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {product.product_source === "printful"
                    ? "Printful"
                    : product.product_source === "shopify"
                    ? "Shopify"
                    : "Custom"}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
