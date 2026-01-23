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
import GradientTitle from "@/components/ui/GradientTitle";

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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-white/40" />
          <h3 className="mt-2 text-sm font-medium text-white">
            Please login to view your wishlist
          </h3>
          <div className="mt-6">
            <Link
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600 transition-colors"
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <GradientTitle text="My Wishlist" size="sm" />
            <p className="text-gray-400 mt-2 text-lg">
              {items.length} {items.length === 1 ? "item" : "items"} saved for
              later
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 border border-gray-700 text-sm font-semibold rounded-lg text-white bg-black hover:bg-gray-900 hover:border-gray-600 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="mx-auto h-16 w-16 text-white/30" />
            <h3 className="mt-4 text-xl font-semibold text-white">
              Your wishlist is empty
            </h3>
            <p className="mt-2 text-gray-400">
              Save products you love to your wishlist!
            </p>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg text-white bg-orange-500 hover:bg-orange-600 transition-colors"
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
                className="text-sm text-red-400 hover:text-red-300 font-semibold transition-colors"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
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
                      className="group relative bg-black rounded-3xl overflow-hidden hover:shadow-[0_20px_60px_rgba(255,99,71,0.3)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2 flex flex-col h-full"
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

                        {/* Remove Button - Bottom Left with enhanced styling */}
                        <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-2 sm:p-3 rounded-full transition-all duration-300 focus:outline-none backdrop-blur-md shadow-lg hover:shadow-[0_8px_20px_rgba(239,68,68,0.8)] transform hover:scale-125 bg-red-500/90 text-white"
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
                            <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300" />
                          </button>
                        </div>
                      </div>

                      {/* Content Section - Below Image with enhanced styling */}
                      <div className="bg-gradient-to-b from-black/80 to-black px-3 sm:px-4 py-2 sm:py-3 flex flex-col flex-grow backdrop-blur-sm gap-1.5">
                        {/* Creator Name with badge style */}
                        <p className="text-xs text-orange-400 font-semibold inline-block bg-orange-500/20 px-2 py-0.5 rounded-full w-fit">
                          by {item.creator?.name || item.creator_name || 'Unknown'}
                        </p>

                        {/* Product Title */}
                        <div className="font-normal text-xs sm:text-sm text-white line-clamp-2 group-hover:text-orange-300 transition-colors duration-300 tracking-tight leading-snug flex-grow">
                          {item.product_name}
                        </div>

                        {/* Category and Variants Info */}
                        <div className="flex items-center justify-between gap-1 text-xs text-gray-400">
                          {item.category && (
                            <span className="inline-block bg-orange-800/60 text-orange-200 px-1.5 py-0.5 rounded-md font-medium text-xs">
                              {item.category}
                            </span>
                          )}
                          {item.variant_count && (
                            <span className="text-xs text-gray-400">
                              {item.variant_count} option{item.variant_count !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Price Section with gradient background */}
                        <div className="flex items-center justify-between pt-1.5 border-t border-gray-700/30">
                          <span className="text-xs sm:text-sm font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            {formatPrice(parseFloat(item.price_range?.min || '0'))}
                            {item.price_range?.max && parseFloat(item.price_range.max) > parseFloat(item.price_range.min) && (
                              <span className="text-xs text-gray-500 font-normal ml-1">- {formatPrice(parseFloat(item.price_range.max))}</span>
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
