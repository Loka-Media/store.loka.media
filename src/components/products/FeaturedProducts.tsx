/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ExtendedProduct } from "@/lib/api";
import { Star, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import GradientTitle from "@/components/ui/GradientTitle";

interface FeaturedProductsProps {
  products: ExtendedProduct[];
}

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  // Take first 4 products as featured
  const featuredProducts = products.slice(0, 4);

  if (featuredProducts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-950 via-black to-gray-950 border-y border-white/10 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <GradientTitle text="Featured Products" size="sm" className="sm:!text-2xl md:!text-3xl lg:!text-4xl" />
        </div>

        {/* Featured Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group relative bg-black rounded-3xl overflow-hidden hover:shadow-[0_20px_60px_rgba(255,99,71,0.3)] transition-all duration-300 cursor-pointer"
              style={{
                border: '1px solid transparent',
                backgroundImage: 'linear-gradient(#000, #000), linear-gradient(180deg, transparent, rgba(255,255,255,0.3) 70%, #ffffff)',
                backgroundOrigin: 'border-box',
                backgroundClip: 'padding-box, border-box',
              }}
            >
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-800 to-black" style={{ aspectRatio: '1/1' }}>
                {product.thumbnail_url ? (
                  <Image
                    src={product.thumbnail_url}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-gray-700" />
                  </div>
                )}

                {/* Featured Badge - Top Right */}
                <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-10">
                  <div className="bg-yellow-400 border border-yellow-500 px-1.5 sm:px-2 py-0.5 rounded text-[8px] sm:text-[10px] md:text-[11px] lg:text-xs font-extrabold text-black leading-none">
                    FEATURED
                  </div>
                </div>

              </div>

              {/* Content Section - Below Image */}
              <div className="bg-black px-3 py-2.5 flex flex-col h-full">
                {/* Creator Name */}
                <p className="text-xs text-gray-400 font-semibold mb-1">
                  by {product.creator?.name || product.creator_name || 'Unknown'}
                </p>

                {/* Product Title */}
                <div className="font-normal text-sm text-white mb-auto line-clamp-2 group-hover:text-orange-400 transition-colors tracking-tight">
                  {product.name}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-1.5">
                  <span className="text-sm font-extrabold text-cyan-400 tracking-tight">
                    ${product.base_price}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
