/**
 * Centralized Pricing Engine Helper / Service
 * 
 * Drives all product pricing calculation on the platform using:
 * 1. Live Printify Premium pricing as base cost.
 * 2. Dynamic Global Markup setting or Category-specific settings override.
 */
import defaultSettings from '@/config/global_settings.json';
import { CATEGORIES_MAP } from '@/config/categories';
import { ensure99Pricing, calculateRetailPriceFromMarkup } from './pricing-utils';

/**
 * Converts a standard Printify catalog price into its Printify Premium counterpart.
 * Printify Premium represents a ~23% discount on the wholesale catalog cost.
 */
export function calculatePremiumPrice(regularPrice: number): number {
  const parsedPrice = typeof regularPrice === 'string' ? parseFloat(regularPrice) : regularPrice;
  if (isNaN(parsedPrice) || parsedPrice <= 0) return 0;
  
  return Math.round(parsedPrice * 100) / 100;
}

/**
 * Determines the effective markup percentage to apply.
 * 
 * STRICT PRIORITY RULES:
 * 1. Category Markups have FIRST PRIORITY. If a category markup is configured (> 0%), it always wins.
 * 2. If no category markup is found or it is 0%, falls back to the Global Platform Markup.
 */
export function getEffectiveMarkupRate(
  categoryOrProductOrMarkup: any,
  categoryMarkups?: Record<string, number>,
  globalMarkup?: number
): number {
  // 1. Direct markup percentage passed (backward compatibility)
  if (typeof categoryOrProductOrMarkup === 'number') {
    return categoryOrProductOrMarkup;
  }

  // Determine fallback global markup
  const fallbackGlobal =
    globalMarkup !== undefined
      ? globalMarkup
      : defaultSettings?.globalMarkup !== undefined
      ? (defaultSettings.globalMarkup as number)
      : 35;

  // Merge category markups with defaults
  const mergedCategoryMarkups: Record<string, number> = {
    ...((defaultSettings?.categoryMarkup as Record<string, number>) || {}),
    ...(categoryMarkups || {})
  };

  // Collect candidate category/product strings to test
  const candidates: string[] = [];

  if (typeof categoryOrProductOrMarkup === 'string') {
    const trimmed = categoryOrProductOrMarkup.trim();
    if (trimmed) candidates.push(trimmed);
  } else if (categoryOrProductOrMarkup && typeof categoryOrProductOrMarkup === 'object') {
    const obj = categoryOrProductOrMarkup;
    if (typeof obj.category === 'string' && obj.category.trim()) candidates.push(obj.category.trim());
    if (typeof obj.sourceCategory === 'string' && obj.sourceCategory.trim()) candidates.push(obj.sourceCategory.trim());
    if (typeof obj.type_name === 'string' && obj.type_name.trim()) candidates.push(obj.type_name.trim());
    if (typeof obj.type === 'string' && obj.type.trim()) candidates.push(obj.type.trim());
    if (Array.isArray(obj.categoryIds)) {
      for (const id of obj.categoryIds) {
        const found = CATEGORIES_MAP.find((c) => c.id === id);
        if (found) candidates.push(found.title);
      }
    }
    const resolved = resolveProductCategoryName(obj);
    if (resolved && resolved !== 'Other') candidates.push(resolved);
    if (typeof obj.title === 'string' && obj.title.trim()) candidates.push(obj.title.trim());
    if (typeof obj.name === 'string' && obj.name.trim()) candidates.push(obj.name.trim());
  }

  const clean = (s: string) => s.toLowerCase().trim().replace(/[-_&]/g, ' ');

  // PRIORITY 1: Exact / Normalized Match on Category Markups (val > 0)
  for (const candidate of candidates) {
    const targetClean = clean(candidate);
    for (const [key, val] of Object.entries(mergedCategoryMarkups)) {
      if (typeof val === 'number' && val > 0 && clean(key) === targetClean) {
        return val;
      }
    }
  }

  // PRIORITY 1 (Step 2): Word boundary / Substring Match on Category Markups (val > 0)
  for (const candidate of candidates) {
    const targetClean = clean(candidate);
    for (const [key, val] of Object.entries(mergedCategoryMarkups)) {
      if (typeof val !== 'number' || val <= 0) continue;
      const keyClean = clean(key);
      // Guard against false positive: "men" inside "women"
      if (keyClean === 'men' && (targetClean === 'women' || targetClean.includes('women'))) {
        continue;
      }
      const wordRegex = new RegExp(`(^|\\s)${keyClean}(\\s|$)`, 'i');
      if (wordRegex.test(targetClean) || targetClean.includes(keyClean) || keyClean.includes(targetClean)) {
        return val;
      }
    }
  }

  // PRIORITY 2: Fallback to Global Platform Markup
  return fallbackGlobal;
}

/**
 * Calculates the customer selling price from base cost, dynamic category, and markup configuration.
 * Supports backward compatibility where the second argument is the direct markup percentage.
 * 
 * Formula: Customer Price = Printify Premium Price * (1 + Category/Global Markup / 100)
 */
export function calculateSellingPrice(
  baseCost: number, 
  categoryOrMarkup?: string | number | any, 
  categoryMarkups?: Record<string, number>, 
  globalMarkup?: number
): number {
  const parsedCost = typeof baseCost === 'string' ? parseFloat(baseCost) : baseCost;
  if (isNaN(parsedCost) || parsedCost <= 0) return 0;
  
  const markupRate = getEffectiveMarkupRate(categoryOrMarkup, categoryMarkups, globalMarkup);
  
  // Calculate selling price
  const sellingPrice = parsedCost * (1 + markupRate / 100);
  
  // Round to nearest .99 (X.99 pricing)
  return Math.ceil(sellingPrice) - 0.01;
}

/**
 * Get dynamic retail price range for a product.
 * Returns min and max selling prices calculated from variant base costs and markup rules.
 */
export function getProductPriceRange(
  product: any, 
  categoryOrMarkup?: string | number | undefined, 
  categoryMarkups?: Record<string, number>, 
  globalMarkup?: number
): { minPrice: number; maxPrice: number } {
  if (!product) return { minPrice: 0, maxPrice: 0 };

  // 1. Check direct retail prices calculated by backend API / Database
  const directMin = parseFloat(
    product.min_price ?? 
    product.minPrice ?? 
    product.price_range?.min ?? 
    product.price ?? 
    product.selling_price ?? 
    product.retail_price ?? 
    0
  );
  const directMax = parseFloat(
    product.max_price ?? 
    product.maxPrice ?? 
    product.price_range?.max ?? 
    product.price ?? 
    product.selling_price ?? 
    product.retail_price ?? 
    directMin
  );

  if (!isNaN(directMin) && directMin > 0) {
    const normMin = ensure99Pricing(directMin);
    const normMax = !isNaN(directMax) && directMax > 0 ? ensure99Pricing(directMax) : normMin;
    return {
      minPrice: normMin,
      maxPrice: normMax
    };
  }

  // 2. Gather variant retail prices if available
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map((v: any) => parseFloat(v.price || v.selling_price || v.retail_price || v.cost || 0))
      .filter((p: number) => !isNaN(p) && p > 0);
    
    if (prices.length > 0) {
      return {
        minPrice: ensure99Pricing(Math.min(...prices)),
        maxPrice: ensure99Pricing(Math.max(...prices))
      };
    }
  }

  // 3. Fallback to calculating selling price from base cost & markup
  const rawCost = parseFloat(product.cost || product.min_base_cost || '0');
  const baseCost = !isNaN(rawCost) && rawCost > 0 
    ? rawCost 
    : parseFloat(product.base_price || product.basePrice || '0');
  const creatorMarkup = parseFloat(product.markup_percentage || product.markupPercentage || '0');

  if (!isNaN(baseCost) && baseCost > 0) {
    if (!isNaN(creatorMarkup) && creatorMarkup > 0) {
      if (!isNaN(rawCost) && rawCost > 0) {
        const platformPrice = calculateSellingPrice(rawCost, categoryOrMarkup, categoryMarkups, globalMarkup);
        const creatorPrice = calculateRetailPriceFromMarkup(platformPrice, creatorMarkup);
        return { minPrice: ensure99Pricing(creatorPrice), maxPrice: ensure99Pricing(creatorPrice) };
      }
      // If baseCost already ends in .99 and is not a sub-$5 item, it is already a finalized retail price
      const cents = Math.round(baseCost * 100);
      if (cents % 100 === 99 && baseCost >= 5) {
        return { minPrice: baseCost, maxPrice: baseCost };
      }
      const creatorPrice = calculateRetailPriceFromMarkup(baseCost, creatorMarkup);
      return { minPrice: ensure99Pricing(creatorPrice), maxPrice: ensure99Pricing(creatorPrice) };
    }

    if (typeof categoryOrMarkup === 'number') {
      const calculated = calculateSellingPrice(baseCost, categoryOrMarkup);
      return { minPrice: ensure99Pricing(calculated), maxPrice: ensure99Pricing(calculated) };
    }
    const categoryName = typeof categoryOrMarkup === 'string' ? categoryOrMarkup : resolveProductCategoryName(product);
    const markupRateInput = categoryOrMarkup !== undefined ? categoryOrMarkup : categoryName;
    const calculated = calculateSellingPrice(baseCost, markupRateInput, categoryMarkups, globalMarkup);
    return { minPrice: ensure99Pricing(calculated), maxPrice: ensure99Pricing(calculated) };
  }

  return { minPrice: 0, maxPrice: 0 };
}

/**
 * Calculates a specific variant's retail selling price.
 */
export function getVariantSellingPrice(
  variant: any, 
  product: any, 
  categoryOrMarkup: string | number | undefined, 
  categoryMarkups?: Record<string, number>, 
  globalMarkup?: number
): number {
  if (!variant) return 0;

  // Determine category name
  const categoryName = typeof categoryOrMarkup === 'string' ? categoryOrMarkup : resolveProductCategoryName(product);
  
  // Get base cost
  let baseCost = 0;
  if (variant.cost !== undefined && variant.cost !== null && !isNaN(parseFloat(variant.cost))) {
    baseCost = parseFloat(variant.cost);
  } else if (variant.price !== undefined && variant.price !== null && !isNaN(parseFloat(variant.price))) {
    baseCost = parseFloat(variant.price);
  } else {
    baseCost = parseFloat(product?.base_price || product?.cost || '0');
  }

  if (typeof categoryOrMarkup === 'number') {
    return ensure99Pricing(calculateSellingPrice(baseCost, categoryOrMarkup));
  }

  const markupRateInput = categoryOrMarkup !== undefined ? categoryOrMarkup : categoryName;
  return ensure99Pricing(calculateSellingPrice(baseCost, markupRateInput, categoryMarkups, globalMarkup));
}

/**
 * Automatically resolves the category name/title of a product or blueprint for pricing lookups.
 */
export function resolveProductCategoryName(product: any): string {
  if (!product) return '';
  const title = (product.name || product.title || '').toLowerCase();
  
  // 1. Check for specific footwear subcategories (high priority)
  if (title.includes('sock')) return 'Socks';
  if (
    title.includes('shoe') || 
    title.includes('sneaker') || 
    title.includes('boot') || 
    title.includes('footwear') || 
    title.includes('slide') || 
    title.includes('sandal') || 
    title.includes('flip flop') || 
    title.includes('clog')
  ) {
    return 'Shoes';
  }

  // 2. Check for apparel subcategories matching titles
  if (title.includes('hoodie')) return 'Hoodies';
  if (title.includes('sweatshirt')) return 'Sweatshirts';
  if (title.includes('tank') || title.includes('racerback')) return 'Tank Tops';
  if (title.includes('long sleeve') || title.includes('long-sleeve')) return 'Long Sleeves';
  if (title.includes('tee') || title.includes('t-shirt') || title.includes('t shirt')) return 'T-Shirts';
  if (title.includes('sport') || title.includes('active') || title.includes('jersey') || title.includes('athletic')) return 'Sportswear';
  if (title.includes('hat') || title.includes('cap') || title.includes('beanie')) return 'Hats & Caps';
  if (title.includes('jogger') || title.includes('pant') || title.includes('legging') || title.includes('sweatpant')) return 'Bottoms & Leggings';
  if (title.includes('swim') || title.includes('bikini') || title.includes('trunks')) return 'Swimwear';
  if (title.includes('boxer') || title.includes('brief') || title.includes('underwear')) return 'Underwear';
  if (title.includes('jacket') || title.includes('windbreaker') || title.includes('vest') || title.includes('coat')) return 'Jackets & Outerwear';

  // 3. Check for accessories & home subcategories
  if (title.includes('phone') || title.includes('case')) return 'Phone Cases';
  if (title.includes('bag') || title.includes('backpack') || title.includes('tote')) return 'Bags';
  if (title.includes('sticker') || title.includes('decal')) return 'Stickers';
  if (title.includes('poster') || (title.includes('print') && !title.includes('all-over') && !title.includes('all over') && !title.includes('sublimat'))) return 'Posters';
  if (title.includes('canvas')) return 'Canvas';
  if (title.includes('blanket')) return 'Blankets';
  if (title.includes('pillow')) return 'Pillows';
  if (title.includes('mug')) return 'Mugs';
  if (title.includes('bottle') || title.includes('tumbler')) return 'Drinkware';

  // 4. Check categoryIds (from blueprint_categories.json or Printify)
  if (Array.isArray(product.categoryIds)) {
    if (product.categoryIds.includes(7)) return 'Shoes & Socks';
    if (product.categoryIds.includes(6)) return 'Mugs & Drinkware';
    if (product.categoryIds.includes(5)) return 'Home & Living';
    if (product.categoryIds.includes(4)) return 'Accessories';
    if (product.categoryIds.includes(3)) return 'Kids';
    if (product.categoryIds.includes(2)) return 'Women';
    if (product.categoryIds.includes(1)) return 'Men';
    if (product.categoryIds.includes(8)) return 'Unisex';
  }

  // 5. Check for main category matches in title/tags
  if (title.includes('kid') || title.includes('youth') || title.includes('toddler') || title.includes('baby') || title.includes('infant')) return 'Kids';
  if (title.includes('women') || title.includes('lady') || title.includes('girl')) return 'Women';
  if (title.includes('men') || title.includes('guy') || title.includes('boy')) return 'Men';
  if (title.includes('unisex')) return 'Unisex';

  // 6. Fall back to standard product category
  const productCat = (product.category || product.category_name || '').toLowerCase().trim();
  if (productCat === 'apparel') return 'Apparel';
  if (productCat === 'accessories') return 'Accessories';
  if (productCat === 'home-living' || productCat === 'home & living') return 'Home & Living';
  if (productCat === 'mugs & drinkware' || productCat === 'mugs-drinkware') return 'Mugs & Drinkware';
  if (productCat === 'shoes & socks' || productCat === 'shoes-socks' || productCat === 'shoes' || productCat === 'socks') return 'Shoes & Socks';
  if (productCat === 'stationery') return 'Stationery';
  if (productCat === 'bags') return 'Bags';

  return product.category || 'Other';
}

