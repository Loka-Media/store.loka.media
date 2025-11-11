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
      <div className="group relative bg-white border-2 border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300 cursor-pointer">
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100" style={{ aspectRatio: '1/1' }}>
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-all duration-500 group-hover:scale-110"
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
            className="fallback-img absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
            style={{ display: "none" }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder-product.svg";
            }}
          />

          {/* Gradient Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Wishlist Button */}
          <div className="absolute top-4 right-4 z-10" onClick={(e) => e.stopPropagation()}>
            <button
              className={`p-2.5 rounded-full transition-all duration-300 focus:outline-none shadow-md hover:scale-110 ${
                isWishlisted
                  ? "bg-accent text-white hover:bg-accent-hover"
                  : "bg-white/95 backdrop-blur-sm text-black/60 hover:text-accent hover:bg-white"
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
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-extrabold text-lg text-black truncate mb-3 group-hover:text-accent transition-colors tracking-tight">
            {product.name}
          </h3>

          <div className="flex items-center justify-between mb-4">
            <span className="text-black font-extrabold text-2xl tracking-tight">
              {formatPrice(product.min_price)}
              {product.max_price > product.min_price && (
                <span className="text-sm text-foreground-muted font-normal ml-1.5">- {formatPrice(product.max_price)}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center bg-gray-100 rounded-full px-3 py-1.5 hover:bg-gray-200 transition-colors">
              <User className="w-3.5 h-3.5 text-foreground-muted mr-1.5" />
              <span className="text-xs text-foreground-muted truncate font-semibold">{product.creator_name}</span>
            </div>
          </div>

          {/* Category badge */}
          {product.category && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center bg-black text-white text-xs px-3 py-1.5 rounded-full font-bold tracking-tight">
                {product.category}
              </span>
              {product.product_source && (
                <span
                  className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full font-bold ${
                    product.product_source === "printful"
                      ? "bg-purple-500 text-white"
                      : product.product_source === "shopify"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
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
