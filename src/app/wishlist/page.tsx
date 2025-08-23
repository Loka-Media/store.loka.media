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
      
      // Cache variant data for guest cart before adding to cart
      const variantCacheData = {
        product_id: productData.id,
        product_name: productData.name,
        price: firstVariant.price?.toString() || productData.min_price?.toString() || '25.00',
        size: firstVariant.size || firstVariant.title?.split(' / ')[1] || 'One Size',
        color: firstVariant.color || firstVariant.title?.split(' / ')[0] || 'Default',
        color_code: firstVariant.color_code || '#808080',
        image_url: firstVariant.image_url || productData.thumbnail_url || productData.images?.[0],
        thumbnail_url: productData.thumbnail_url || productData.images?.[0],
        creator_name: productData.creator_name,
        source: productData.product_source || 'unknown',
        shopify_variant_id: firstVariant.shopify_variant_id,
        printful_variant_id: firstVariant.printful_variant_id
      };
      
      // Store in localStorage for guest cart
      try {
        localStorage.setItem(`product_variant_${firstVariant.id}`, JSON.stringify(variantCacheData));
      } catch (error) {
        console.warn('Failed to cache variant data:', error);
      }
      
      await addToCart(firstVariant.id, 1);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Failed to add to cart");
    }
  }];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-white">
            Please login to view your wishlist
          </h3>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-orange-500 hover:bg-orange-400"
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Heart className="w-7 h-7 mr-3 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-gray-400 mt-2 text-lg">
              {items.length} {items.length === 1 ? "item" : "items"} saved for
              later
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-gray-600 shadow-sm text-sm font-semibold rounded-lg text-white bg-gray-800 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-gray-600" />
            <h3 className="mt-4 text-xl font-semibold text-white">
              Your wishlist is empty
            </h3>
            <p className="mt-2 text-gray-400">
              Save products you love to your wishlist!
            </p>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent shadow-sm text-sm font-semibold rounded-lg text-black bg-orange-500 hover:bg-orange-400"
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
                className="text-sm text-red-400 hover:text-red-300 font-semibold"
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
                  className="bg-gray-900 rounded-xl shadow-xl border border-gray-700 overflow-hidden hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 transform hover:-translate-y-1"
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
                      <h3 className="font-semibold text-white hover:text-orange-400 transition-colors text-lg leading-tight">
                        {item.product_name}
                      </h3>
                    </Link>

                    <div className="flex items-center mt-2">
                      <span className="text-sm text-gray-400">
                        by {item.creator_name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl font-bold text-white">
                          {formatPrice(item.min_price)}
                        </span>
                        {item.max_price > item.min_price && (
                          <span className="text-sm text-gray-400">
                            - {formatPrice(item.max_price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="inline-block bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full font-medium border border-orange-500/30">
                        {item.category || "Uncategorized"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {item.variant_count} options
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex items-center space-x-2">
                      <button
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
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
