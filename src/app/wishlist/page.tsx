"use client";

import { useEffect } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { productAPI } from "@/lib/api";
import { Heart, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import GradientTitle from "@/components/ui/GradientTitle";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const { items, loading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useGuestCart();
  const { isAuthenticated } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();

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
        creator_name: productData.creator?.name || productData.creator_name || 'Unknown',
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
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl inline-flex items-center justify-center mb-6">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign In to Continue</h2>
          <p className="text-gray-400 font-medium mb-8">
            Please log in to access your wishlist and view your saved items.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/auth/login?redirect=/wishlist')}
              variant="primary"
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/products')}
              variant="secondary"
              className="w-full"
            >
              Continue Shopping
            </Button>
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
    <div className="min-h-screen bg-black text-white">
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer-card {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .wishlist-card-animate {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
        .card-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer-card 2s infinite;
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pt-2 sm:pt-3">
          <div>
            <GradientTitle text="My Wishlist" size="sm" />
            <p className="text-gray-400 mt-1 sm:mt-2 text-sm sm:text-lg">
              {items.length} {items.length === 1 ? "item" : "items"} saved for later
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2.5 sm:px-6 sm:py-3 border border-white/20 text-xs sm:text-sm font-semibold rounded-xl text-white bg-black hover:bg-gray-900 hover:border-gray-600 transition-all shadow-md shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Heart className="mx-auto h-14 w-14 sm:h-16 sm:w-16 text-white/30" />
            <h3 className="mt-4 text-lg sm:text-xl font-semibold text-white">
              Your wishlist is empty
            </h3>
            <p className="mt-2 text-sm sm:text-base text-gray-400">
              Save products you love to your wishlist!
            </p>
            <div className="mt-6 sm:mt-8">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-xl text-white bg-orange-500 hover:bg-orange-600 transition-colors shadow-lg"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Clear Wishlist Button */}
            <div className="mb-4 sm:mb-6 flex justify-end">
              <button
                type="button"
                className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1.5"
                onClick={() => {
                  if (
                    confirm("Are you sure you want to clear your wishlist?")
                  ) {
                    clearWishlist();
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Wishlist
              </button>
            </div>

            {/* Wishlist Items Grid - 2 columns on mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="wishlist-card-animate"
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Link href={`/products/${item.product_id}`}>
                    <div
                      className="group relative bg-black rounded-2xl sm:rounded-3xl overflow-hidden hover:shadow-[0_20px_60px_rgba(255,99,71,0.3)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 flex flex-col h-full"
                      style={{
                        border: '1px solid transparent',
                        backgroundImage: 'linear-gradient(#000, #000), linear-gradient(180deg, transparent, rgba(255,255,255,0.3) 70%, #ffffff)',
                        backgroundOrigin: 'border-box',
                        backgroundClip: 'padding-box, border-box',
                        transition: 'all 300ms ease'
                      }}
                    >
                      {/* Image Container */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-black flex-shrink-0" style={{ aspectRatio: '1/1', width: '100%' }}>
                        <Image
                          src={item.thumbnail_url || "/placeholder-product.svg"}
                          alt={item.product_name}
                          fill
                          className="object-cover transition-all duration-700 group-hover:scale-110"
                          unoptimized={true}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder-product.svg";
                          }}
                        />

                        {/* Premium overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Remove Button - Top Right (Visible on mobile touch, enhanced hover on desktop) */}
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1.5 sm:p-2.5 rounded-full transition-all duration-300 focus:outline-none backdrop-blur-md shadow-lg hover:shadow-[0_8px_20px_rgba(239,68,68,0.8)] transform hover:scale-110 bg-red-500/90 text-white"
                            title="Remove from wishlist"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                await removeFromWishlist(item.product_id);
                              } catch (error) {
                                console.error('Remove from wishlist failed:', error);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300" />
                          </button>
                        </div>
                      </div>

                      {/* Content Section - Below Image */}
                      <div className="bg-gradient-to-b from-black/80 to-black p-2.5 sm:p-4 flex flex-col flex-grow backdrop-blur-sm gap-1 sm:gap-1.5">
                        {/* Creator Name with badge style */}
                        <p className="text-[10px] sm:text-xs text-orange-400 font-semibold inline-block bg-orange-500/20 px-2 py-0.5 rounded-full w-fit truncate max-w-full">
                          by {item.creator?.name || item.creator_name || 'Unknown'}
                        </p>

                        {/* Product Title */}
                        <div className="font-medium text-xs sm:text-sm text-white line-clamp-2 group-hover:text-orange-300 transition-colors duration-300 tracking-tight leading-snug flex-grow">
                          {item.product_name}
                        </div>

                        {/* Category and Variants Info */}
                        <div className="flex items-center justify-between gap-1 text-[10px] sm:text-xs text-gray-400">
                          {item.category && (
                            <span className="inline-block bg-orange-800/60 text-orange-200 px-1.5 py-0.5 rounded-md font-medium text-[10px] sm:text-xs truncate max-w-[90px]">
                              {item.category}
                            </span>
                          )}
                          {item.variant_count && (
                            <span className="text-[10px] sm:text-xs text-gray-400 shrink-0">
                              {item.variant_count} option{item.variant_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Price Section */}
                        <div className="flex items-center justify-between pt-1 sm:pt-1.5 border-t border-gray-700/30">
                          <span className="text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent truncate">
                            {formatPrice(parseFloat(String(item.price_range?.min) || '0'))}
                            {item.price_range?.max && parseFloat(String(item.price_range.max)) > parseFloat(String(item.price_range.min)) && (
                              <span className="text-[10px] sm:text-xs text-gray-500 font-normal ml-1">- {formatPrice(parseFloat(String(item.price_range.max)))}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
