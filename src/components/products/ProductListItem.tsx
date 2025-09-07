/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { productAPI, formatPrice, ExtendedProduct } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Heart,
  Star,
  User,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Package,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

interface ProductListItemProps {
  product: ExtendedProduct;
}

export function ProductListItem({ product }: ProductListItemProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState<{
    isAvailable: boolean;
    availableCount: number;
    totalCount: number;
    loading: boolean;
  }>({ isAvailable: true, availableCount: 0, totalCount: 0, loading: false });

  const { addToCart } = useGuestCart();
  const { addToWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const imageUrl =
    product.thumbnail_url ||
    product.images?.[0] ||
    "/placeholder-product.svg";

  // Check inventory status
  const checkInventoryStatus = async () => {
    if (inventoryStatus.loading || inventoryStatus.totalCount > 0) return;

    try {
      setInventoryStatus((prev) => ({ ...prev, loading: true }));
      const productData = await productAPI.getProduct(product.id);
      if (productData.variants && productData.variants.length > 0) {
        const availableVariants = productData.variants.filter(
          (v: { inventory_available: boolean; in_stock: boolean }) =>
            v.inventory_available !== false && v.in_stock !== false
        );
        setInventoryStatus({
          isAvailable: availableVariants.length > 0,
          availableCount: availableVariants.length,
          totalCount: productData.variants.length,
          loading: false,
        });
      } else {
        setInventoryStatus({
          isAvailable: false,
          availableCount: 0,
          totalCount: 0,
          loading: false,
        });
      }
    } catch (error) {
      setInventoryStatus({
        isAvailable: true, // Default to available if check fails
        availableCount: 0,
        totalCount: 0,
        loading: false,
      });
    }
  };

  const handleAddToCart = async () => {
    try {
      const productData = await productAPI.getProduct(product.id);
      if (productData.variants && productData.variants.length > 0) {
        // Check if any variants are available
        const availableVariants = productData.variants.filter(
          (v: { inventory_available: boolean; in_stock: boolean }) =>
            v.inventory_available !== false && v.in_stock !== false
        );

        if (availableVariants.length === 0) {
          toast.error("Product is currently out of stock");
          return;
        }

        // Cache variant data for guest cart before adding to cart
        const selectedVariant = availableVariants[0];
        const variantCacheData = {
          product_id: product.id,
          product_name: product.name,
          price: selectedVariant.price?.toString() || product.min_price?.toString() || '25.00',
          size: selectedVariant.size || selectedVariant.title?.split(' / ')[1] || 'One Size',
          color: selectedVariant.color || selectedVariant.title?.split(' / ')[0] || 'Default',
          color_code: selectedVariant.color_code || '#808080',
          image_url: selectedVariant.image_url || product.thumbnail_url || product.images?.[0],
          thumbnail_url: product.thumbnail_url || product.images?.[0],
          creator_name: product.creator_name,
          source: product.product_source || 'unknown',
          shopify_variant_id: selectedVariant.shopify_variant_id,
          printful_variant_id: selectedVariant.printful_variant_id
        };
        
        // Store in localStorage for guest cart
        try {
          localStorage.setItem(`product_variant_${selectedVariant.id}`, JSON.stringify(variantCacheData));
        } catch (error) {
          console.warn('Failed to cache variant data:', error);
          toast.error('Failed to prepare product data. Please try again.');
          return;
        }

        // Small delay to ensure localStorage write completes
        await new Promise(resolve => setTimeout(resolve, 10));

        await addToCart(selectedVariant.id, 1);
      } else {
        toast.error("No variants available");
      }
    } catch (error) {
      const errorMessage =
        (error as any)?.response?.data?.error || "Failed to add to cart";
      if (
        errorMessage.includes("out of stock") ||
        errorMessage.includes("unavailable")
      ) {
        toast.error("Product is currently out of stock");
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Remove fake discount logic

  return (
    <div
      className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-700/50 hover:border-orange-500/30 backdrop-blur-sm"
      onMouseEnter={checkInventoryStatus}
    >
      <div className="flex flex-col md:flex-row">
        <Link
          href={`/products/${createProductSlug(product.name, product.id)}`}
          className="relative md:w-40 h-32 md:h-auto flex-shrink-0"
        >
          {/* Sale badge removed - no fake discounts */}
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
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
              className="fallback-img absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ display: "none" }}
              onError={(e) => {
                e.currentTarget.src = "/placeholder-product.svg";
              }}
            />
          </div>
        </Link>

        <div className="flex-1 p-4">
          <div className="flex justify-between items-start h-full">
            <div className="flex-1">
              <Link
                href={`/products/${createProductSlug(
                  product.name,
                  product.id
                )}`}
              >
                <h3 className="text-lg font-bold text-white hover:text-orange-400 transition-colors duration-200 mb-1">
                  {product.name}
                </h3>
              </Link>

              <div className="flex items-center mb-2">
                <div className="w-4 h-4 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-2">
                  <User className="w-2 h-2 text-white" />
                </div>
                <span className="text-gray-300 font-medium text-sm">
                  by {product.creator_name}
                </span>
                <div className="flex items-center ml-3">
                  <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                  <span className="text-yellow-200 font-medium text-sm">4.8</span>
                </div>

                {/* Inventory status */}
                {inventoryStatus.totalCount > 0 && (
                  <div className="ml-3">
                    <div
                      className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center ${
                        inventoryStatus.isAvailable
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {inventoryStatus.isAvailable ? (
                        <CheckCircle className="w-2 h-2 mr-0.5" />
                      ) : (
                        <AlertTriangle className="w-2 h-2 mr-0.5" />
                      )}
                      {inventoryStatus.isAvailable
                        ? `${inventoryStatus.availableCount}/${inventoryStatus.totalCount}`
                        : "Out"}
                    </div>
                  </div>
                )}

                {inventoryStatus.loading && (
                  <div className="ml-3">
                    <div className="bg-gray-600/30 text-gray-400 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                      <Package className="w-2 h-2 mr-0.5 animate-spin" />
                      ...
                    </div>
                  </div>
                )}
              </div>

              <p className="text-gray-400 mb-3 line-clamp-2 text-sm leading-relaxed">
                {product.description ||
                  "Discover this amazing product with unique design and premium quality craftsmanship."}
              </p>

              <div className="flex flex-wrap items-center gap-1 mb-3">
                {product.category && (
                  <span className="inline-flex items-center bg-orange-800/60 text-orange-200 text-xs px-2 py-1 rounded-md font-medium">
                    {product.category.slice(0, 8)}
                  </span>
                )}
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
            </div>

            <div className="text-right ml-4 flex flex-col items-end">
              <div className="mb-2">
                <div className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {formatPrice(product.min_price)}
                  {product.max_price > product.min_price && (
                    <div className="text-sm text-gray-400 mt-0.5">
                      - {formatPrice(product.max_price)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  className={`p-2 rounded-lg transition-all duration-200 focus:outline-none ${
                    isWishlisted
                      ? "bg-red-500 text-white"
                      : "bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-gray-700/80"
                  }`}
                  title="Add to wishlist"
                  onClick={() => {
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
                    className={`w-4 h-4 ${
                      isWishlisted ? "fill-current" : ""
                    }`}
                  />
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={
                    inventoryStatus.totalCount > 0 &&
                    !inventoryStatus.isAvailable
                  }
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center text-sm ${
                    inventoryStatus.totalCount > 0 &&
                    !inventoryStatus.isAvailable
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                  }`}
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  {inventoryStatus.totalCount > 0 &&
                  !inventoryStatus.isAvailable
                    ? "Out"
                    : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
