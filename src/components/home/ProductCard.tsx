"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, User, Star, Tag, Globe } from "lucide-react";
import { ExtendedProduct, formatPrice } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: ExtendedProduct;
  isAuthenticated: boolean;
  onAddToWishlist: (productId: string) => void;
}

export function ProductCard({
  product,
  isAuthenticated,
  onAddToWishlist,
}: ProductCardProps) {
  const imageUrl =
    product.thumbnail_url || product.images?.[0] || "/placeholder-product.svg";

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }
    onAddToWishlist(product.id?.toString());
    toast.success("Added to wishlist!");
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-800">
      <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
        <div className="aspect-square relative group">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized={true}
            onError={(e) => {
              console.log(
                "Next.js Image failed to load:",
                imageUrl,
                "for product:",
                product.name
              );
              e.currentTarget.style.display = "none";
              const fallbackImg = e.currentTarget.parentElement?.querySelector(
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
            className="fallback-img absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            style={{ display: "none" }}
            onError={(e) => {
              console.log("Fallback image also failed:", imageUrl);
              e.currentTarget.src = "/placeholder-product.svg";
            }}
          />
          <div className="absolute top-3 right-3">
            <button
              className="p-2 bg-black bg-opacity-70 rounded-full text-gray-300 hover:text-orange-500 hover:bg-black transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              title="Add to wishlist"
              onClick={handleWishlistClick}
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>

      <div className="p-5">
        <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
          <h3 className="font-semibold text-white hover:text-orange-400 transition-colors text-lg leading-tight line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center mt-2 space-x-2 text-sm">
          <div className="flex items-center bg-gray-800 rounded-full px-2 py-1">
            <User className="w-3 h-3 text-gray-500 mr-1" />
            <span className="text-xs text-gray-400 font-medium">
              {product.creator_name}
            </span>
          </div>
          <div className="flex items-center">
            <Star className="w-3 h-3 text-orange-400 fill-current" />
            <span className="text-xs text-gray-400 ml-1">4.8</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">
              {formatPrice(product.min_price)}
            </span>
            {product.max_price > product.min_price && (
              <span className="text-sm text-gray-500">
                - {formatPrice(product.max_price)}
              </span>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-block bg-orange-800 text-orange-200 text-xs px-2 py-1 rounded-full font-medium">
            <Tag className="inline-block w-3 h-3 mr-1" />
            {product.category || "Uncategorized"}
          </span>
          {product.product_source && (
            <span
              className={`inline-flex items-center text-xs px-2 py-1 rounded-full font-medium ${
                product.product_source === "printful"
                  ? "bg-purple-900 text-purple-300"
                  : product.product_source === "shopify"
                  ? "bg-green-900 text-green-300"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {product.product_source === "printful" ? (
                <Image
                  src="/printful-logo.svg"
                  alt="Printful"
                  width={12}
                  height={12}
                  className="mr-1"
                />
              ) : product.product_source === "shopify" ? (
                <Image
                  src="/shopify-logo.svg"
                  alt="Shopify"
                  width={12}
                  height={12}
                  className="mr-1"
                />
              ) : (
                <Globe className="w-3 h-3 mr-1" />
              )}
              {product.product_source === "printful"
                ? "Printful"
                : product.product_source === "shopify"
                ? "Shopify"
                : "Custom"}
            </span>
          )}
          <span className="text-xs text-gray-500 ml-auto">
            {product.variant_count} options
          </span>
        </div>
      </div>
    </div>
  );
}
