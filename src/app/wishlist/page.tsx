"use client";

import { useEffect } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatPrice, productAPI } from "@/lib/api";
import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const { items, loading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useGuestCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const [/* handleAddToCart */] = [async (productId: number) => {
    try {
      // Fetch product variants to get the first available variant
      const productData = await productAPI.getProduct(productId);

      if (!productData.variants || productData.variants.length === 0) {
        toast.error("No variants available for this product");
        return;
      }

      // Use the first available variant
      const firstVariant = productData.variants[0];
      await addToCart(firstVariant.id, 1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    }
  }];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Please login to view your wishlist
          </h3>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Heart className="w-6 h-6 mr-2 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-gray-600 mt-1">
              {items.length} {items.length === 1 ? "item" : "items"} saved for
              later
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Your wishlist is empty
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Save products you love to your wishlist!
            </p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Clear Wishlist Button */}
            <div className="mb-6 flex justify-end">
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-500 font-medium"
                onClick={() => {
                  if (
                    confirm("Are you sure you want to clear your wishlist?")
                  ) {
                    clearWishlist();
                  }
                }}
              >
                Clear Wishlist
              </button>
            </div>

            {/* Wishlist Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <Link href={`/products/${item.product_id}`}>
                    <div className="aspect-square relative group">
                      <Image
                        src={item.thumbnail_url || "/placeholder-product.svg"}
                        alt={item.product_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        unoptimized={true}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder-product.svg";
                        }}
                      />
                    </div>
                  </Link>

                  <div className="p-5">
                    <Link href={`/products/${item.product_id}`}>
                      <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-lg leading-tight">
                        {item.product_name}
                      </h3>
                    </Link>

                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-600">
                        by {item.creator_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(item.min_price)}
                        </span>
                        {item.max_price > item.min_price && (
                          <span className="text-sm text-gray-500">
                            - {formatPrice(item.max_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
                        {item.category || "Uncategorized"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.variant_count} options
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center space-x-2">
                      <button
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => removeFromWishlist(item.product_id)}
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
