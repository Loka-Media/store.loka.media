
'use client';

import { ProductVariant } from '@/lib/api';

interface ProductVariantSelectorProps {
  variants: ProductVariant[];
  selectedVariant: ProductVariant | null;
  onVariantChange: (variant: ProductVariant) => void;
  getVariantColorAndSize: (variant: ProductVariant) => { color: string; size: string };
  getUniqueColors: () => [string, string][];
  getAvailableSizes: (color?: string) => string[];
  getCurrentVariant: (color: string, size: string) => ProductVariant | undefined;
  isVariantAvailable: (variant: ProductVariant) => boolean;
}

export function ProductVariantSelector({
  variants,
  selectedVariant,
  onVariantChange,
  getVariantColorAndSize,
  getUniqueColors,
  getAvailableSizes,
  getCurrentVariant,
  isVariantAvailable,
}: ProductVariantSelectorProps) {
  const uniqueColors = getUniqueColors();
  const selectedColor = selectedVariant ? getVariantColorAndSize(selectedVariant).color : undefined;
  const availableSizes = getAvailableSizes(selectedColor);

  return (
    <div className="space-y-6">
      {uniqueColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-2">
            Color: <span className="font-bold">{selectedColor}</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {uniqueColors.map(([colorName, colorCode]) => (
              <button
                key={colorName}
                onClick={() => {
                  const currentSize = selectedVariant ? getVariantColorAndSize(selectedVariant).size : availableSizes[0];
                  const newVariant = getCurrentVariant(colorName, currentSize);
                  if (newVariant) onVariantChange(newVariant);
                }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === colorName
                    ? 'border-orange-500 ring-2 ring-orange-500 ring-offset-2 ring-offset-black'
                    : 'border-gray-700'
                }`}
                style={{ backgroundColor: colorCode }}
                title={colorName}
              />
            ))}
          </div>
        </div>
      )}

      {availableSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-white mb-2">
            Size: <span className="font-bold">{selectedVariant ? getVariantColorAndSize(selectedVariant).size : ''}</span>
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {availableSizes.map((size) => {
              const variant = getCurrentVariant(selectedColor || uniqueColors[0]?.[0], size);
              const isAvailable = variant ? isVariantAvailable(variant) : false;
              const isSelected = selectedVariant ? getVariantColorAndSize(selectedVariant).size === size : false;

              return (
                <button
                  key={size}
                  onClick={() => {
                    if (variant && isAvailable) {
                      onVariantChange(variant);
                    }
                  }}
                  disabled={!isAvailable}
                  className={`py-2 px-3 text-sm font-semibold rounded-md border transition-all duration-200 ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-500'
                      : isAvailable
                      ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                      : 'bg-black text-gray-600 border-gray-800 cursor-not-allowed'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
