/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ExtendedProduct } from "@/lib/api";
import { Star, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="bg-gradient-to-br from-pink-50 via-yellow-50 to-purple-50 border-y border-black py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
          <div className="p-2 sm:p-2.5 bg-black rounded-xl border border-black shadow-md">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-black">Featured Products</h2>
            <p className="text-xs sm:text-sm text-black font-bold mt-0.5 sm:mt-1">
              Curated picks from our marketplace
            </p>
          </div>
        </div>

        {/* Featured Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group bg-white border border-black rounded-2xl overflow-hidden hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 border-b border-black overflow-hidden">
                {product.thumbnail_url ? (
                  <Image
                    src={product.thumbnail_url}
                    alt={product.name}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-gray-400" />
                  </div>
                )}

                {/* Featured Badge */}
                <div className="absolute top-3 right-3 bg-yellow-300 border border-black px-3 py-1 rounded-full">
                  <span className="text-xs font-extrabold text-black">FEATURED</span>
                </div>
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h3 className="text-base font-extrabold text-black mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                  {product.name}
                </h3>

                {/* Creator */}
                {product.creator_name && (
                  <p className="text-sm text-gray-600 font-bold mb-3">
                    by {product.creator_name}
                  </p>
                )}

                {/* Price and Rating */}
                <div className="flex items-center justify-between">
                  <div className="bg-pink-200 border border-black px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-extrabold text-black">
                      ${product.base_price}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-black">4.8</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
