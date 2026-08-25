import { useState, useCallback } from 'react';
import { ProductVariant } from '@/lib/api';
import { ProductDetails } from './useProductData';

export const useVariantSelection = (product: ProductDetails | null, isVariantAvailable: (variant: ProductVariant, source?: string) => boolean) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const getVariantColorAndSize = useCallback((variant: ProductVariant) => {
    let color = (variant.color || '').trim();
    let size = (variant.size || '').trim();

    if (color && size) {
      return { color, size };
    }

    const title = (variant.title || '').trim();
    if (title) {
      const separator = title.includes(' / ') ? ' / ' : title.includes(' - ') ? ' - ' : null;
      if (separator) {
        const parts = title.split(separator).map(p => p.trim());
        if (parts.length >= 2) {
          const knownSizes = new Set(['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', 'small', 'medium', 'large', 'x-large', '2x-large', '3x-large', 'one size', 'os', 'default']);
          const part0Lower = parts[0].toLowerCase();
          const part1Lower = parts[1].toLowerCase();

          const isPart0Size = knownSizes.has(part0Lower) || /^\d+(\.\d+)?\s*(oz|in|cm|mm|g|ml)?$/i.test(part0Lower);
          const isPart1Size = knownSizes.has(part1Lower) || /^\d+(\.\d+)?\s*(oz|in|cm|mm|g|ml)?$/i.test(part1Lower);

          if (isPart0Size && !isPart1Size) {
            if (!size) size = parts[0];
            if (!color) color = parts[1];
          } else if (isPart1Size && !isPart0Size) {
            if (!color) color = parts[0];
            if (!size) size = parts[1];
          } else {
            if (!color) color = parts[0];
            if (!size) size = parts[1];
          }
        }
      } else {
        if (!color && !size) {
          const knownSizes = new Set(['xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl', '5xl', 'one size', 'default']);
          if (knownSizes.has(title.toLowerCase())) {
            size = title;
            color = 'Default';
          } else {
            color = title;
            size = 'Default';
          }
        }
      }
    }

    return {
      color: color || 'Default',
      size: size || 'Default'
    };
  }, []);

  const getColorCode = useCallback((colorName: string, colorCode?: string) => {
    const colorMap: { [key: string]: string } = {
      'charcoal': '#36454F',
      'black': '#000000',
      'white': '#FFFFFF',
      'navy': '#000080',
      'gray': '#808080',
      'grey': '#808080',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'maroon': '#800000',
      'olive': '#808000',
      'lime': '#00FF00',
      'aqua': '#00FFFF',
      'teal': '#008080',
      'silver': '#C0C0C0',
      'fuchsia': '#FF00FF'
    };
    
    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || colorCode || '#808080';
  }, []);

  const getUniqueColors = useCallback(() => {
    if (!product?.variants) return [];
    const colors = new Map();
    product.variants.forEach(variant => {
      const color = getVariantColorAndSize(variant).color;
      const actualColorCode = getColorCode(color, variant.color_code);
      if (!colors.has(color)) {
        colors.set(color, actualColorCode);
      }
    });
    return Array.from(colors.entries());
  }, [product?.variants, getVariantColorAndSize, getColorCode]);

  const getAvailableSizes = useCallback((selectedColor?: string) => {
    if (!product?.variants) return [];
    
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
    
    const sizes = product.variants
      .filter(variant => {
        if (!selectedColor) return true;
        return getVariantColorAndSize(variant).color === selectedColor;
      })
      .map(variant => getVariantColorAndSize(variant).size)
      .filter((size, index, self) => self.indexOf(size) === index);
    
    return sizes.sort((a, b) => {
      const indexA = sizeOrder.indexOf(a);
      const indexB = sizeOrder.indexOf(b);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return a.localeCompare(b);
    });
  }, [product?.variants, getVariantColorAndSize]);

  const getCurrentVariant = useCallback((color: string, size: string) => {
    return product?.variants.find(variant => {
      const { color: variantColor, size: variantSize } = getVariantColorAndSize(variant);
      return variantColor === color && variantSize === size;
    });
  }, [product?.variants, getVariantColorAndSize]);

  const initializeSelectedVariant = useCallback(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariant) {
      const firstInStock = product.variants.find((v: ProductVariant) => isVariantAvailable(v, product.source));
      setSelectedVariant(firstInStock || product.variants[0]);
    }
  }, [product, selectedVariant, isVariantAvailable]);

  return {
    selectedVariant,
    setSelectedVariant,
    getVariantColorAndSize,
    getColorCode,
    getUniqueColors,
    getAvailableSizes,
    getCurrentVariant,
    initializeSelectedVariant
  };
};