'use client';

import { ProductVariant } from '@/lib/api';
import { Check, Info } from 'lucide-react';

interface EnhancedProductVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
  getVariantColorAndSize: (variant: ProductVariant) => { color: string; size: string };
  getUniqueColors: () => [string, string][];
  getAvailableSizes: (color?: string) => string[];
  getCurrentVariant: (color: string, size: string) => ProductVariant | undefined;
  isVariantAvailable: (variant: ProductVariant) => boolean;
}

export function EnhancedProductVariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  getVariantColorAndSize,
  getUniqueColors,
  getAvailableSizes,
  getCurrentVariant,
  isVariantAvailable,
}: EnhancedProductVariantSelectorProps) {
  const uniqueColors = getUniqueColors();
  const selectedColor = selectedVariant ? getVariantColorAndSize(selectedVariant).color : undefined;
  const selectedSize = selectedVariant ? getVariantColorAndSize(selectedVariant).size : undefined;
  const availableSizes = getAvailableSizes(selectedColor);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Color Selection */}
      {uniqueColors.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-white">Select Colors</div>
          <div className="flex flex-wrap gap-3">
            {uniqueColors.map(([colorName, colorCode]) => {
              const isSelected = selectedColor === colorName;
              return (
                <button
                  key={colorName}
                  onClick={() => {
                    const currentSize = selectedVariant ? getVariantColorAndSize(selectedVariant).size : availableSizes[0];
                    const newVariant = getCurrentVariant(colorName, currentSize);
                    if (newVariant) onVariantChange(newVariant);
                  }}
                  title={colorName}
                  className={`py-2 px-6 rounded-full font-medium text-sm transition-all ${
                    isSelected
                      ? 'bg-white text-black border border-white'
                      : 'bg-transparent text-white border border-white/30 hover:border-white/50'
                  }`}
                >
                  {colorName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-white">Select Sizes</div>
          <div className="flex flex-wrap gap-3">
            {availableSizes.map((size) => {
              const variant = getCurrentVariant(selectedColor || uniqueColors[0]?.[0], size);
              const isAvailable = variant ? isVariantAvailable(variant) : false;
              const isSelected = selectedSize === size;

              return (
                <button
                  key={size}
                  onClick={() => {
                    if (variant && isAvailable) {
                      onVariantChange(variant);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`py-2 px-6 rounded-full font-medium text-sm transition-all ${
                    isSelected
                      ? 'bg-white text-black border border-white'
                      : isAvailable
                      ? 'bg-transparent text-white border border-white/30 hover:border-white/50'
                      : 'text-gray-500 border border-white/10 cursor-not-allowed opacity-40'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <button className="text-blue-400 hover:text-blue-300 font-medium text-sm">
            Sizes Guide
          </button>
        </div>
      )}
    </div>
  );
}
