// components/home/ProductListItem.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, User, Tag, Globe } from "lucide-react";
import { ExtendedProduct, formatPrice } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
import toast from "react-hot-toast";

interface ProductListItemProps {
  product: ExtendedProduct;
  isAuthenticated: boolean;
  onAddToWishlist: (productId: string) => void;
}

export function ProductListItem({
  product,
  isAuthenticated,
  onAddToWishlist,
}: ProductListItemProps) {
  const imageUrl =
    product.thumbnail_url || product.images?.[0] || "/placeholder-product.svg";

  const handleWishlistClick = () => {
    if (!isAuthenticated) {
      toast.error("Please login to add items to wishlist");
      return;
    }
    onAddToWishlist(product.id?.toString());
    toast.success("Added to wishlist!");
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-800">
      <div className="flex flex-col sm:flex-row">
        <Link
          href={`/products/${createProductSlug(product.name, product.id)}`}
          className="flex-shrink-0"
        >
          <div className="w-full sm:w-48 h-48 relative">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized={true}
              onError={(e) => {
                console.log(
                  "List Next.js Image failed to load:",
                  imageUrl,
                  "for product:",
                  product.name
                );
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
              className="fallback-img absolute inset-0 w-full h-full object-cover"
              style={{ display: "none" }}
              onError={(e) => {
                console.log("List fallback image also failed:", imageUrl);
                e.currentTarget.src = "/placeholder-product.svg";
              }}
            />
          </div>
        </Link>

        <div className="flex-1 p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div className="flex-1">
              <Link
                href={`/products/${createProductSlug(
                  product.name,
                  product.id
                )}`}
              >
                <h3 className="text-xl font-semibold text-white hover:text-orange-400 transition-colors line-clamp-2">
                  {product.name}
                </h3>
              </Link>

              <p className="text-gray-400 mt-1 flex items-center">
                <User className="w-4 h-4 text-gray-500 mr-1" />
                by {product.creator_name}
              </p>

              <p className="text-gray-300 mt-3 line-clamp-3 text-sm">
                {product.description || "No description available."}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="inline-block bg-orange-800 text-orange-200 text-sm px-3 py-1 rounded">
                  <Tag className="inline-block w-4 h-4 mr-1" />
                  {product.category || "Uncategorized"}
                </span>
                {product.product_source && (
                  <span
                    className={`inline-flex items-center text-sm px-3 py-1 rounded font-medium ${
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
                        width={14}
                        height={14}
                        className="mr-1"
                      />
                    ) : product.product_source === "shopify" ? (
                      <Image
                        src="/shopify-logo.svg"
                        alt="Shopify"
                        width={14}
                        height={14}
                        className="mr-1"
                      />
                    ) : (
                      <Globe className="w-4 h-4 mr-1" />
                    )}
                    {product.product_source === "printful"
                      ? "Printful"
                      : product.product_source === "shopify"
                      ? "Shopify"
                      : "Custom"}
                  </span>
                )}
                <span className="text-sm text-gray-500 ml-auto">
                  {product.variant_count} variants
                </span>
              </div>
            </div>

            <div className="md:text-right mt-4 md:mt-0 md:ml-6 flex flex-col items-start md:items-end">
              <div className="text-2xl font-bold text-white">
                {formatPrice(product.min_price)}
                {product.max_price > product.min_price && (
                  <span className="text-lg text-gray-500 block">
                    - {formatPrice(product.max_price)}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-3 mt-3">
                <button
                  className="p-2 text-gray-400 hover:text-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                  title="Add to wishlist"
                  onClick={handleWishlistClick}
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
