/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { ExtendedProduct } from "@/lib/api";
import { createProductSlug, getValidImageUrl } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalMarkup } from "@/contexts/GlobalMarkupContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Heart, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface ProductCardProps {
  product: ExtendedProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addToWishlist, removeFromWishlist, items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const { getProductPriceRange } = useGlobalMarkup();
  const { formatPrice } = useCurrency();

  const { minPrice, maxPrice } = getProductPriceRange(product);

  useEffect(() => {
    if (isAuthenticated) {
      const inWishlist = wishlistItems.some(item => item.product_id === product.id);
      setIsWishlisted(inWishlist);
    } else {
      setIsWishlisted(false);
    }
  }, [isAuthenticated, product.id, wishlistItems]);

  const imageUrl = getValidImageUrl(product);

  // Helper to extract and format tags
  const productTags = (() => {
    let raw: any =
      product.tags ||
      (product as any).tag ||
      (product as any).tags_list ||
      (product as any).product_data?.tags ||
      (product as any).productData?.tags ||
      (product as any).details?.tags ||
      (product as any).base_product?.tags;

    let list: string[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed;
        else list = raw.split(',').map((t: string) => t.trim());
      } catch (e) {
        list = raw.split(',').map((t: string) => t.trim());
      }
    }
    return list.filter(Boolean);
  })();

  const getTagBadgeConfig = (tag: string) => {
    const normalized = tag.toLowerCase().trim();
    if (normalized.includes('trending')) {
      return { label: 'Trending', icon: '📈', className: 'bg-purple-600/90 text-white border-purple-400/50 shadow-purple-500/30' };
    }
    if (normalized.includes('new')) {
      return { label: 'New', icon: '✨', className: 'bg-blue-600/90 text-white border-blue-400/50 shadow-blue-500/30' };
    }
    if (normalized.includes('popular')) {
      return { label: 'Popular', icon: '🔥', className: 'bg-red-600/90 text-white border-red-400/50 shadow-red-500/30' };
    }
    return { label: tag, icon: '🏷️', className: 'bg-gray-800/90 text-white border-gray-600/50' };
  };

  return (
    <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
      <style>{`
        @keyframes shimmer-card {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .card-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          background-size: 1000px 100%;
          animation: shimmer-card 2s infinite;
        }
      `}</style>
      <div
        className="group relative bg-black rounded-3xl overflow-hidden hover:shadow-[0_20px_60px_rgba(255,99,71,0.3)] transition-all duration-300 cursor-pointer transform hover:-translate-y-2"
        style={{
          border: '1px solid transparent',
          backgroundImage: isHovered
            ? 'linear-gradient(#000, #000), linear-gradient(135deg, rgba(255,109,31,0.2), rgba(255,255,255,0.3))'
            : 'linear-gradient(#000, #000), linear-gradient(180deg, transparent, rgba(255,255,255,0.3) 70%, #ffffff)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          transition: 'all 300ms ease'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-black" style={{ aspectRatio: '1/1' }}>
          {/* Top Right Tag Badge */}
          {productTags.length > 0 && (
            <div className="absolute top-2.5 right-2.5 z-10 flex flex-wrap gap-1 justify-end max-w-[85%]">
              {productTags.slice(0, 2).map((tag, idx) => {
                const config = getTagBadgeConfig(tag);
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold border backdrop-blur-md shadow-md ${config.className}`}
                  >
                    <span className="mr-1 text-[11px]">{config.icon}</span>
                    <span>{config.label}</span>
                  </span>
                );
              })}
            </div>
          )}
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-all duration-700 group-hover:scale-110"
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
            className="fallback-img absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
            style={{ display: "none" }}
            onError={(e) => {
              e.currentTarget.src = "/placeholder-product.svg";
            }}
          />

          {/* Premium overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

          {/* Wishlist Button - Bottom Left with enhanced styling */}
          <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" onClick={(e) => e.stopPropagation()}>
            <button
              className={`p-2 sm:p-3 rounded-full transition-all duration-300 focus:outline-none backdrop-blur-md shadow-lg hover:shadow-[0_8px_20px_rgba(255,99,71,0.8)] transform hover:scale-125 ${
                isWishlisted
                  ? "bg-red-500/90 text-white"
                  : "bg-black/70 text-white hover:bg-red-500/80"
              }`}
              title="Add to wishlist"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAuthenticated) {
                  toast.success("Please sign in to manage your wishlist");
                  router.push('/auth/login?redirect=/wishlist');
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
                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                  isWishlisted ? "fill-current scale-110" : ""
                }`}
              />
            </button>
          </div>

        </div>

        {/* Content Section - Below Image with enhanced styling */}
        <div className="bg-gradient-to-b from-black/80 to-black px-2 sm:px-4 py-2 sm:py-3 flex flex-col h-full backdrop-blur-sm">
          {/* Creator Name with badge style */}
          <p className="text-xs text-gray-400 font-semibold mb-1 text-center">
            by {product.creator?.name || product.creator_name || 'Unknown'}
          </p>

          {/* Product Title */}
          <div className="font-normal text-xs text-center sm:text-sm text-white mb-auto line-clamp-1 group-hover:text-orange-300 transition-colors duration-300 tracking-tight leading-snug">
            {product.name}
          </div>

          {/* Price Section with gradient background */}
          <div className="flex items-center justify-center pt-1.5 sm:pt-2 border-t border-gray-700/30 mt-1.5 sm:mt-2">
            <span className="text-sm text-center font-extrabold text-cyan-400 tracking-tight">
              {formatPrice(minPrice)}
              {maxPrice > minPrice && (
                <span className="text-xs text-gray-500 font-normal ml-1">- {formatPrice(maxPrice)}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

