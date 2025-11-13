'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/api';
import { Package, TrendingUp, Shield, Truck } from 'lucide-react';

interface EnhancedProductInfoProps {
  productName: string;
  description: string;
  basePrice: number;
  selectedVariantPrice?: number;
  category?: string;
}

const TRUNCATE_LENGTH = 200;

export function EnhancedProductInfo({
  productName,
  description,
  basePrice,
  selectedVariantPrice,
  category,
}: EnhancedProductInfoProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const canTruncate = description.length > TRUNCATE_LENGTH;
  const currentPrice = selectedVariantPrice ?? basePrice;
  const originalPrice = basePrice * 1.3; // Show 30% discount
  const savings = originalPrice - currentPrice;
  const savingsPercent = ((savings / originalPrice) * 100).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Category Badge */}
      {category && (
        <div className="inline-flex items-center gap-2 bg-purple-200 border-2 border-black px-4 py-2 rounded-full">
          <Package className="w-4 h-4 text-black" />
          <span className="font-extrabold text-black text-sm">{category}</span>
        </div>
      )}

      {/* Product Name */}
      <h1 className="text-4xl md:text-5xl font-extrabold text-black leading-tight">
        {productName}
      </h1>

      {/* Pricing Section */}
      <div className="bg-gradient-to-r from-green-100 to-green-200 border-4 border-black rounded-2xl p-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-black">
            {formatPrice(currentPrice)}
          </span>
          {savings > 0 && (
            <>
              <span className="text-2xl text-gray-600 line-through font-bold">
                {formatPrice(originalPrice)}
              </span>
              <span className="inline-flex items-center gap-1 bg-red-500 border-2 border-black text-white px-3 py-1 rounded-full font-extrabold text-sm">
                <TrendingUp className="w-4 h-4" />
                Save {savingsPercent}%
              </span>
            </>
          )}
        </div>
        <p className="text-sm font-bold text-gray-700 mt-2">
          💰 Best price guaranteed!
        </p>
      </div>

      {/* Description */}
      <div className="bg-white border-4 border-black rounded-2xl p-6">
        <h3 className="text-lg font-extrabold text-black mb-3">Product Description</h3>
        <div className="text-gray-800 font-bold leading-relaxed">
          <p className="whitespace-pre-wrap">
            {canTruncate && !isDescriptionExpanded
              ? `${description.substring(0, TRUNCATE_LENGTH)}...`
              : description}
          </p>
          {canTruncate && (
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="mt-3 text-purple-600 font-extrabold hover:text-purple-700 underline transition-colors"
            >
              {isDescriptionExpanded ? '↑ Show Less' : '↓ Read More'}
            </button>
          )}
        </div>
      </div>

      {/* Features/Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-yellow-100 border-2 border-black rounded-xl p-4 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
          <Shield className="w-6 h-6 text-black mb-2" />
          <h4 className="font-extrabold text-black text-sm mb-1">Quality Guaranteed</h4>
          <p className="text-xs font-bold text-gray-700">Premium materials</p>
        </div>
        <div className="bg-pink-100 border-2 border-black rounded-xl p-4 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
          <Truck className="w-6 h-6 text-black mb-2" />
          <h4 className="font-extrabold text-black text-sm mb-1">Fast Shipping</h4>
          <p className="text-xs font-bold text-gray-700">5-7 business days</p>
        </div>
        <div className="bg-purple-100 border-2 border-black rounded-xl p-4 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
          <Package className="w-6 h-6 text-black mb-2" />
          <h4 className="font-extrabold text-black text-sm mb-1">Easy Returns</h4>
          <p className="text-xs font-bold text-gray-700">30-day guarantee</p>
        </div>
      </div>
    </div>
  );
}
