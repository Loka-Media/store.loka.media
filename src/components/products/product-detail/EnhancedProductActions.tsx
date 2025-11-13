'use client';

import { useState } from 'react';
import { Heart, Minus, Plus, ShoppingCart, Sparkles } from 'lucide-react';
import { ProductVariant } from '@/lib/api';

interface EnhancedProductActionsProps {
  selectedVariant: ProductVariant | null;
  isVariantAvailable: boolean;
  isWishlisted: boolean;
  onAddToCart: (quantity: number) => void;
  onWishlistToggle: () => void;
}

export function EnhancedProductActions({
  selectedVariant,
  isVariantAvailable,
  isWishlisted,
  onAddToCart,
  onWishlistToggle,
}: EnhancedProductActionsProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    setIsAdding(true);
    await onAddToCart(quantity);
    setTimeout(() => setIsAdding(false), 1000);
  };

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-pink-50 border-4 border-black rounded-2xl p-6 space-y-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
      {/* Quantity Selector */}
      <div>
        <label className="block text-lg font-extrabold text-black mb-3">
          Quantity
        </label>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border-4 border-black rounded-xl overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-4 text-black hover:bg-yellow-200 transition-colors font-extrabold"
            >
              <Minus className="w-5 h-5" />
            </button>
            <div className="px-8 py-3 bg-white">
              <span className="text-2xl font-extrabold text-black">{quantity}</span>
            </div>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="p-4 text-black hover:bg-yellow-200 transition-colors font-extrabold"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <span className="text-sm font-bold text-gray-700">
            (Max: 10)
          </span>
        </div>
      </div>

      {/* Stock Indicator */}
      {selectedVariant && (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${
          isVariantAvailable
            ? 'bg-green-100 border-green-600'
            : 'bg-red-100 border-red-600'
        }`}>
          <div className={`w-3 h-3 rounded-full ${
            isVariantAvailable ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="font-extrabold text-black text-sm">
            {isVariantAvailable ? '✅ In Stock - Ships Today!' : '❌ Out of Stock'}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant || !isVariantAvailable || isAdding}
          className="flex-1 bg-gradient-to-r from-orange-400 to-pink-400 text-white font-extrabold py-4 px-6 rounded-xl border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="w-6 h-6" />
              {isVariantAvailable ? 'Add to Cart' : 'Out of Stock'}
            </>
          )}
        </button>
        <button
          onClick={onWishlistToggle}
          className={`p-4 rounded-xl border-4 transition-all hover:scale-105 ${
            isWishlisted
              ? 'bg-red-400 border-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
              : 'bg-white border-black text-black hover:bg-pink-200'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Buy Now Button (Optional) */}
      {isVariantAvailable && selectedVariant && (
        <button
          disabled={!selectedVariant}
          className="w-full bg-black text-white font-extrabold py-4 px-6 rounded-xl border-4 border-black hover:bg-purple-600 transition-all flex items-center justify-center gap-2 text-lg"
        >
          <Sparkles className="w-5 h-5" />
          Buy Now - Fast Checkout
        </button>
      )}

      {/* Trust Badges */}
      <div className="pt-4 border-t-2 border-black/20 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <span>✓</span>
          <span>Secure checkout with SSL encryption</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <span>✓</span>
          <span>Free shipping on orders over $50</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
          <span>✓</span>
          <span>30-day money-back guarantee</span>
        </div>
      </div>
    </div>
  );
}
