
'use client';

import { useState } from 'react';
import { Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import { ProductVariant } from '@/lib/api';

interface ProductActionsProps {
  selectedVariant: ProductVariant | null;
  isVariantAvailable: boolean;
  isWishlisted: boolean;
  onAddToCart: (quantity: number) => void;
  onWishlistToggle: () => void;
}

export function ProductActions({
  selectedVariant,
  isVariantAvailable,
  isWishlisted,
  onAddToCart,
  onWishlistToggle,
}: ProductActionsProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-white mb-2">Quantity</label>
        <div className="flex items-center">
          <div className="flex items-center bg-gray-800 rounded-md border border-gray-700">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-3 text-white hover:bg-gray-700 transition-colors rounded-l-md"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-6 py-2 text-white font-semibold">{quantity}</span>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="p-3 text-white hover:bg-gray-700 transition-colors rounded-r-md"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-stretch gap-4">
        <button
          onClick={() => onAddToCart(quantity)}
          disabled={!selectedVariant || !isVariantAvailable}
          className="flex-1 bg-orange-500 text-white font-bold py-3 px-6 rounded-md hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ShoppingCart className="w-5 h-5 mr-2" />
          {isVariantAvailable ? 'Add to Cart' : 'Out of Stock'}
        </button>
        <button
          onClick={onWishlistToggle}
          className={`p-4 rounded-md border transition-colors ${
            isWishlisted
              ? 'bg-orange-500/20 border-orange-500 text-orange-500'
              : 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700'
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>
    </div>
  );
}
