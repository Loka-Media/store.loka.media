'use client';

import { useState } from 'react';
import { Heart, Minus, Plus, ShoppingCart } from 'lucide-react';
import { ProductVariant } from '@/lib/api';
import { Button } from '@/components/ui/button';

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
    <div className="space-y-2 sm:space-y-3 md:space-y-4">
      {/* Quantity Selector */}
      <div className="space-y-1.5">
        <label className="block text-xs sm:text-sm font-medium text-white">
          Quantity
        </label>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white/10 border border-white/20 rounded-full overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-1.5 text-white hover:bg-white/20 transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="px-3 sm:px-4 py-1.5">
              <span className="text-sm sm:text-base font-bold text-white">{quantity}</span>
            </div>
            <button
              onClick={() => setQuantity(Math.min(10, quantity + 1))}
              className="p-1.5 text-white hover:bg-white/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 sm:gap-3">
        {/* Add to Bag Button */}
        <Button
          onClick={handleAddToCart}
          disabled={!selectedVariant || !isVariantAvailable || isAdding}
          variant="primary"
          className="flex-1 flex items-center justify-center gap-1.5 !px-2 !py-1.5 sm:!px-3 sm:!py-2 !text-xs sm:!text-sm"
        >
          {isAdding ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-black border-t-transparent" />
              Adding...
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Add to Bag
            </>
          )}
        </Button>

        {/* Wishlist Button */}
        <Button
          onClick={onWishlistToggle}
          variant="secondary"
          className="flex-1 flex items-center justify-center gap-1.5 !px-2 !py-1.5 sm:!px-3 sm:!py-2 !text-xs sm:!text-sm"
        >
          <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
        </Button>
      </div>
    </div>
  );
}
