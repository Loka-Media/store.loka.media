
'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/api';

interface ProductInfoProps {
  productName: string;
  description: string;
  basePrice: number;
  selectedVariantPrice?: number;
}

const TRUNCATE_LENGTH = 150;

export function ProductInfo({
  productName,
  description,
  basePrice,
  selectedVariantPrice,
}: ProductInfoProps) {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const canTruncate = description.length > TRUNCATE_LENGTH;

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{productName}</h1>
      <div className="mb-6">
        <p className="text-3xl font-bold text-orange-500">
          {formatPrice(selectedVariantPrice ?? basePrice)}
        </p>
        {(selectedVariantPrice ?? basePrice) < basePrice * 1.2 && (
          <span className="text-lg text-gray-500 line-through ml-2">
            {formatPrice(basePrice * 1.2)}
          </span>
        )}
      </div>
      <div className="text-gray-300 space-y-4">
        <p className="whitespace-pre-wrap">
          {canTruncate && !isDescriptionExpanded
            ? `${description.substring(0, TRUNCATE_LENGTH)}...`
            : description}
        </p>
        {canTruncate && (
          <button
            onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
            className="text-orange-500 font-semibold hover:text-orange-400 transition-colors"
          >
            {isDescriptionExpanded ? 'Show Less' : 'Read More'}
          </button>
        )}
      </div>
    </div>
  );
}
