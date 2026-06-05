/**
 * Printify Product Service
 * Transforms raw Printify API data into storefront-friendly formats.
 * Handles: color grouping, size grouping, mockup sorting, price formatting.
 */

import type {
  PrintifyProduct,
  PrintifyVariant,
  PrintifyProductImage,
  PrintifyProductOption,
  PrintifyColorOption,
  PrintifySizeOption,
  StorefrontVariant,
  StorefrontMockup,
  StorefrontProduct,
} from '@/types/printify';

const POSITION_LABELS: Record<string, string> = {
  front: 'Front View',
  back: 'Back View',
  left_sleeve: 'Left Sleeve',
  right_sleeve: 'Right Sleeve',
  label_outside_back: 'Neck Label',
  label_inside_back: 'Inside Label',
  other: 'Lifestyle',
};

const POSITION_ORDER = [
  'front', 'back', 'left_sleeve', 'right_sleeve',
  'label_outside_back', 'label_inside_back', 'other',
];

// ============================================================
// COLOR EXTRACTION
// ============================================================

function extractColorOptions(
  options: PrintifyProductOption[],
  variants: PrintifyVariant[],
  images: PrintifyProductImage[]
): PrintifyColorOption[] {
  const colorOption = options.find(o => o.type === 'color' || o.name.toLowerCase() === 'colors');
  if (!colorOption) return [];

  return colorOption.values.map(colorVal => {
    const matchingVariants = variants.filter(v => v.options.includes(colorVal.id));
    const variantIds = matchingVariants.map(v => v.id);

    // Find the default or first front image for this color
    const colorImage = images.find(img =>
      img.variant_ids.some(vid => variantIds.includes(vid)) &&
      (img.is_default || img.position === 'front' || img.position === 'other')
    );

    return {
      id: colorVal.id,
      title: colorVal.title,
      colors: colorVal.colors || [],
      variantIds,
      image: colorImage?.src,
    };
  });
}

// ============================================================
// SIZE EXTRACTION
// ============================================================

function extractSizeOptions(
  options: PrintifyProductOption[],
  variants: PrintifyVariant[]
): PrintifySizeOption[] {
  const sizeOption = options.find(o => o.type === 'size' || o.name.toLowerCase() === 'sizes');
  if (!sizeOption) return [];

  return sizeOption.values.map(sizeVal => {
    const matchingVariants = variants.filter(v => v.options.includes(sizeVal.id));
    return {
      id: sizeVal.id,
      title: sizeVal.title,
      variantIds: matchingVariants.map(v => v.id),
    };
  });
}

// ============================================================
// VARIANT TRANSFORMATION
// ============================================================

function transformVariants(
  variants: PrintifyVariant[],
  options: PrintifyProductOption[],
  images: PrintifyProductImage[]
): StorefrontVariant[] {
  const colorOption = options.find(o => o.type === 'color' || o.name.toLowerCase() === 'colors');
  const sizeOption = options.find(o => o.type === 'size' || o.name.toLowerCase() === 'sizes');

  return variants
    .filter(v => v.is_enabled)
    .map(variant => {
      // Parse color from options
      const colorValueId = colorOption
        ? variant.options.find(oid => colorOption.values.some(cv => cv.id === oid))
        : undefined;
      const colorValue = colorOption?.values.find(cv => cv.id === colorValueId);

      // Parse size from options
      const sizeValueId = sizeOption
        ? variant.options.find(oid => sizeOption.values.some(sv => sv.id === oid))
        : undefined;
      const sizeValue = sizeOption?.values.find(sv => sv.id === sizeValueId);

      // Find variant image
      const variantImage = images.find(img =>
        img.variant_ids.includes(variant.id)
      );

      const colorCodes = colorValue?.colors || [];

      return {
        id: variant.id,
        sku: variant.sku,
        price: variant.price / 100,           // Convert cents → dollars
        cost: variant.cost / 100,
        title: variant.title,
        color: colorValue?.title || '',
        colorCode: colorCodes[0] || '#000000',
        colorCodes,
        size: sizeValue?.title || '',
        isAvailable: variant.is_available && variant.is_enabled,
        isDefault: variant.is_default,
        imageUrl: variantImage?.src,
        grams: variant.grams,
      };
    });
}

// ============================================================
// MOCKUP TRANSFORMATION
// ============================================================

function transformMockups(images: PrintifyProductImage[]): StorefrontMockup[] {
  // Filter out duplicate image sources
  const seenSrcs = new Set<string>();
  const uniqueImages = images.filter(img => {
    if (!img.src) return false;
    if (seenSrcs.has(img.src)) return false;
    seenSrcs.add(img.src);
    return true;
  });

  // Sort by position order, then default status
  const sorted = [...uniqueImages].sort((a, b) => {
    const aOrder = POSITION_ORDER.indexOf(a.position);
    const bOrder = POSITION_ORDER.indexOf(b.position);
    if (aOrder !== bOrder) return (aOrder === -1 ? 999 : aOrder) - (bOrder === -1 ? 999 : bOrder);
    // Default images first within same position
    if (a.is_default !== b.is_default) return a.is_default ? -1 : 1;
    return 0;
  });

  return sorted.map(img => ({
    src: img.src,
    position: img.position,
    label: POSITION_LABELS[img.position] || img.position,
    variantIds: img.variant_ids,
    isDefault: img.is_default,
  }));
}

// ============================================================
// PRINT AREAS EXTRACTION
// ============================================================

function extractPrintAreas(product: PrintifyProduct): string[] {
  const positions = new Set<string>();
  product.print_areas?.forEach(area => {
    area.placeholders?.forEach(p => positions.add(p.position));
  });
  return Array.from(positions);
}

// ============================================================
// PRICE CALCULATION
// ============================================================

function getPriceRange(variants: StorefrontVariant[]): { min: number; max: number } {
  const prices = variants.filter(v => v.isAvailable).map(v => v.price);
  if (prices.length === 0) return { min: 0, max: 0 };
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  };
}

// ============================================================
// MAIN TRANSFORMATION
// ============================================================

/**
 * Transform a raw Printify product into a storefront-ready format
 */
export function transformProductForStorefront(product: PrintifyProduct): StorefrontProduct {
  const variants = transformVariants(product.variants, product.options, product.images);
  const mockups = transformMockups(product.images);
  const colorOptions = extractColorOptions(product.options, product.variants, product.images);
  const sizeOptions = extractSizeOptions(product.options, product.variants);
  const printAreas = extractPrintAreas(product);
  const { min: minPrice, max: maxPrice } = getPriceRange(variants);

  const defaultVariant = variants.find(v => v.isDefault) || variants[0];
  const defaultMockup = mockups.find(m => m.isDefault) || mockups[0];

  return {
    id: product.id,
    title: product.title,
    description: product.description,
    tags: product.tags || [],
    blueprintId: product.blueprint_id,
    printProviderId: product.print_provider_id,
    variants,
    mockups,
    colorOptions,
    sizeOptions,
    defaultVariantId: defaultVariant?.id || 0,
    defaultMockupUrl: defaultMockup?.src || '',
    minPrice,
    maxPrice,
    printAreas,
    isVisible: product.visible,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
}

/**
 * Get mockups for a specific color variant
 */
export function getMockupsForColor(
  mockups: StorefrontMockup[],
  variantIds: number[]
): StorefrontMockup[] {
  if (!variantIds.length) return mockups;

  // Prefer mockups that include these variant IDs
  const variantMockups = mockups.filter(m =>
    m.variantIds.length === 0 || m.variantIds.some(vid => variantIds.includes(vid))
  );

  return variantMockups.length > 0 ? variantMockups : mockups;
}

/**
 * Get variant by color + size selection
 */
export function findVariantByColorAndSize(
  variants: StorefrontVariant[],
  colorId: number,
  sizeId: number,
  colorOptions: PrintifyColorOption[],
  sizeOptions: PrintifySizeOption[]
): StorefrontVariant | undefined {
  const colorVariantIds = colorOptions.find(c => c.id === colorId)?.variantIds || [];
  const sizeVariantIds = sizeOptions.find(s => s.id === sizeId)?.variantIds || [];

  return variants.find(v =>
    colorVariantIds.includes(v.id) && sizeVariantIds.includes(v.id)
  );
}

/**
 * Format price in USD
 */
export function formatPrintifyPrice(priceInDollars: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(priceInDollars);
}

/**
 * Get the mockup image URL for a specific variant and position
 */
export function getMockupForVariantAndPosition(
  mockups: StorefrontMockup[],
  variantId: number,
  position: string = 'front'
): string | undefined {
  // First try: exact match (variant + position)
  const exact = mockups.find(m =>
    m.position === position &&
    (m.variantIds.length === 0 || m.variantIds.includes(variantId))
  );
  if (exact) return exact.src;

  // Second try: just by position
  const byPosition = mockups.find(m => m.position === position);
  if (byPosition) return byPosition.src;

  // Fallback: default mockup
  return mockups.find(m => m.isDefault)?.src || mockups[0]?.src;
}
