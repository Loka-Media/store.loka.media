'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/api';
import { Package } from 'lucide-react';

interface EnhancedProductInfoProps {
  productName: string;
  description: string;
  basePrice: number;
  selectedVariantPrice?: number;
  category?: string;
  creatorName?: string;
  markupPercentage?: number;
}

const TRUNCATE_LENGTH = 200;

export function EnhancedProductInfo({
  productName,
  description,
  basePrice,
  selectedVariantPrice,
  category,
  creatorName,
  markupPercentage = 20, // Default to 20% if not provided
}: EnhancedProductInfoProps) {
  const displayPrice = selectedVariantPrice ?? (basePrice * (1 + markupPercentage / 100));

  return (
    <div className="space-y-2 sm:space-y-3 md:space-y-4">
      {/* Badges Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category Badge */}
        {category && (
          <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-2 py-1 rounded-lg">
            <Package className="w-3 h-3 text-gray-300" />
            <span className="font-medium text-gray-300 text-xs">{category}</span>
          </div>
        )}
      </div>

      {/* Product Name */}
      <div className="space-y-0.5">
        <div className="text-lg sm:text-2xl font-bold text-white leading-tight">
          {productName}
        </div>
        {creatorName && (
          <p className="text-xs text-gray-400">
            by <span className="text-gray-300">{creatorName}</span>
          </p>
        )}
      </div>

      {/* Pricing Section */}
      <div className="space-y-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-2xl sm:text-3xl font-bold text-cyan-400">
            {formatPrice(displayPrice)}
          </span>
        </div>
      </div>
    </div>
  );
}

export function EnhancedProductDescription({ description }: { description: string }) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const canTruncate = description.length > TRUNCATE_LENGTH;

  return (
    <div className="text-gray-400 text-xs sm:text-sm leading-relaxed space-y-3">
      <p className="whitespace-pre-wrap">
        {canTruncate && !isDescriptionExpanded
          ? `${description.substring(0, TRUNCATE_LENGTH)}...`
          : description}
      </p>
      {canTruncate && (
        <button
          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
        >
          {isDescriptionExpanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}
