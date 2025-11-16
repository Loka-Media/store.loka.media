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
    <div className="bg-white border-4 border-black rounded-2xl p-6 space-y-6 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
      {/* Color Selection */}
      {uniqueColors.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-black">
              Select Color
            </h3>
            {selectedColor && (
              <span className="inline-flex items-center gap-2 bg-yellow-200 border-2 border-black px-3 py-1 rounded-full">
                <Check className="w-4 h-4 text-black" />
                <span className="font-extrabold text-black text-sm">{selectedColor}</span>
              </span>
            )}
          </div>
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
                  className={`relative group transition-all ${
                    isSelected
                      ? 'scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={colorName}
                >
                  <div
                    className={`w-12 h-12 rounded-xl border-4 transition-all ${
                      isSelected
                        ? 'border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
                        : 'border-gray-300 hover:border-black'
                    }`}
                    style={{ backgroundColor: colorCode }}
                  />
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-white border-2 border-black rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                    </div>
                  )}
                  {/* Tooltip */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {colorName}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-extrabold text-black">
              Select Size
            </h3>
            {selectedSize && (
              <span className="inline-flex items-center gap-2 bg-pink-200 border-2 border-black px-3 py-1 rounded-full">
                <Check className="w-4 h-4 text-black" />
                <span className="font-extrabold text-black text-sm">{selectedSize}</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
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
                  className={`relative py-3 px-4 text-base font-extrabold rounded-xl border-4 transition-all ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] scale-105'
                      : isAvailable
                      ? 'bg-white text-black border-gray-300 hover:border-black hover:scale-105'
                      : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                >
                  {size}
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 border-2 border-black rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-black" />
                    </div>
                  )}
                  {!isAvailable && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-red-500 rotate-45"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Size Guide Link */}
      <div className="bg-blue-100 border-2 border-black rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-black flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-black">
            <strong>Not sure about sizing?</strong> Check our{' '}
            <button className="text-purple-600 underline hover:text-purple-700 font-extrabold">
              size guide
            </button>{' '}
            for detailed measurements.
          </p>
        </div>
      </div>
    </div>
  );
}
