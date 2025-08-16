import { useState, useCallback } from 'react';
import { ProductVariant } from '@/lib/api';
import { ProductDetails } from './useProductData';

export const useVariantSelection = (product: ProductDetails | null, isVariantAvailable: (variant: ProductVariant, source?: string) => boolean) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const getVariantColorAndSize = useCallback((variant: ProductVariant) => {
    if (variant.color && variant.size) {
      return { color: variant.color, size: variant.size };
    } else if (variant.title?.includes(' - ')) {
      const parts = variant.title.split(' - ');
      return { size: parts[0] || 'Default', color: parts[1] || 'Default' };
    } else if (variant.title?.includes(' / ')) {
      const parts = variant.title.split(' / ');
      return { color: parts[0] || 'Default', size: parts[1] || 'Default' };
    } else {
      return { color: 'Default', size: 'Default' };
    }
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