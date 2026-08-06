/**
 * Centralized Pricing Engine Helper / Service
 * 
 * Drives all product pricing calculation on the platform using:
 * 1. Live Printify Premium pricing as base cost.
 * 2. Dynamic Global Markup setting or Category-specific settings override.
 */

/**
 * Converts a standard Printify catalog price into its Printify Premium counterpart.
 * Printify Premium represents a ~23% discount on the wholesale catalog cost.
 */
export function calculatePremiumPrice(regularPrice: number): number {
  const parsedPrice = typeof regularPrice === 'string' ? parseFloat(regularPrice) : regularPrice;
  if (isNaN(parsedPrice) || parsedPrice <= 0) return 0;
  
  const premiumPrice = parsedPrice * 0.77;
  return Math.round(premiumPrice * 100) / 100;
}

/**
 * Calculates the customer selling price from base cost, dynamic category, and markup configuration.
 * Supports backward compatibility where the second argument is the direct markup percentage.
 * 
 * Formula: Customer Price = Printify Premium Price * (1 + Category/Global Markup / 100)
 */
export function calculateSellingPrice(
  baseCost: number, 
  categoryOrMarkup: string | number | undefined, 
  categoryMarkups?: Record<string, number>, 
  globalMarkup?: number
): number {
  const parsedCost = typeof baseCost === 'string' ? parseFloat(baseCost) : baseCost;
  if (isNaN(parsedCost) || parsedCost <= 0) return 0;
  
  let markupRate = 35; // Default fallback

  if (typeof categoryOrMarkup === 'number') {
    // Direct markup percentage passed (backward compatibility)
    markupRate = categoryOrMarkup;
  } else if (typeof categoryOrMarkup === 'string') {
    // Category name string passed
    const globalRate = globalMarkup !== undefined ? globalMarkup : 35;
    markupRate = globalRate;

    if (categoryMarkups) {
      // Normalize category name for matching
      const clean = (s: string) => s.toLowerCase().trim().replace(/[-_&]/g, ' ');
      const targetClean = clean(categoryOrMarkup);

      // 1. Direct match or key check
      let matchedVal = undefined;
      for (const [key, val] of Object.entries(categoryMarkups)) {
        if (clean(key) === targetClean) {
          matchedVal = val;
          break;
        }
      }

      // 2. Substring matches if not directly found (e.g., "Men Hoodie" matches "Men")
      if (matchedVal === undefined) {
        for (const [key, val] of Object.entries(categoryMarkups)) {
          const keyClean = clean(key);
          if (keyClean === 'men' && (targetClean === 'women' || targetClean.includes('women'))) {
            continue;
          }
          if (targetClean.includes(keyClean) || keyClean.includes(targetClean)) {
            matchedVal = val;
            break;
          }
        }
      }

      if (matchedVal !== undefined && matchedVal !== 0) {
        markupRate = matchedVal;
      }
    }
  } else if (globalMarkup !== undefined) {
    // If first markup param is undefined but globalMarkup is provided
    markupRate = globalMarkup;
  }
  
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
    product.retail_price ?? 
    0
  );
  const directMax = parseFloat(
    product.max_price ?? 
    product.maxPrice ?? 
    product.price_range?.max ?? 
    product.price ?? 
    product.retail_price ?? 
    directMin
  );

  if (!isNaN(directMin) && directMin > 0) {
    return {
      minPrice: directMin,
      maxPrice: !isNaN(directMax) && directMax > 0 ? directMax : directMin
    };
  }

  // 2. Gather variant retail prices if available
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const prices = product.variants
      .map((v: any) => parseFloat(v.price || v.retail_price || v.cost || 0))
      .filter((p: number) => !isNaN(p) && p > 0);
    
    if (prices.length > 0) {
      return {
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
      };
    }
  }

  // 3. Fallback to calculating selling price from base cost & markup
  const baseCost = parseFloat(product.base_price || product.basePrice || product.min_base_cost || product.cost || '0');
  const creatorMarkup = parseFloat(product.markup_percentage || product.markupPercentage || '0');

  if (!isNaN(baseCost) && baseCost > 0) {
    if (!isNaN(creatorMarkup) && creatorMarkup > 0) {
      const creatorPrice = Math.ceil(baseCost * (1 + creatorMarkup / 100)) - 0.01;
      return { minPrice: creatorPrice, maxPrice: creatorPrice };
    }

    if (typeof categoryOrMarkup === 'number') {
      const calculated = calculateSellingPrice(baseCost, categoryOrMarkup);
      return { minPrice: calculated, maxPrice: calculated };
    }
    const categoryName = typeof categoryOrMarkup === 'string' ? categoryOrMarkup : resolveProductCategoryName(product);
    const markupRateInput = categoryOrMarkup !== undefined ? categoryOrMarkup : categoryName;
    const calculated = calculateSellingPrice(baseCost, markupRateInput, categoryMarkups, globalMarkup);
    return { minPrice: calculated, maxPrice: calculated };
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
    // Reverse engineer base cost (assuming 35% markup was added)
    baseCost = parseFloat(variant.price) / 1.35;
  } else {
    baseCost = parseFloat(product?.base_price || '0');
  }

  if (typeof categoryOrMarkup === 'number') {
    return calculateSellingPrice(baseCost, categoryOrMarkup);
  }

  const markupRateInput = categoryOrMarkup !== undefined ? categoryOrMarkup : categoryName;
  return calculateSellingPrice(baseCost, markupRateInput, categoryMarkups, globalMarkup);
}

/**
 * Automatically resolves the category name/title of a product or blueprint for pricing lookups.
 */
export function resolveProductCategoryName(product: any): string {
  if (!product) return '';
  const title = (product.name || product.title || '').toLowerCase();
  
  // 1. Check for specific subcategories matching titles (highest priority)
  if (title.includes('hoodie')) return 'Hoodies';
  if (title.includes('sweatshirt')) return 'Sweatshirts';
  if (title.includes('tank') || title.includes('racerback')) return 'Tank Tops';
  if (title.includes('long sleeve') || title.includes('long-sleeve')) return 'Long Sleeves';
  if (title.includes('tee') || title.includes('t-shirt') || title.includes('t shirt')) return 'T-Shirts';
  if (title.includes('sport') || title.includes('active') || title.includes('jersey') || title.includes('athletic')) return 'Sportswear';
  if (title.includes('phone') || title.includes('case')) return 'Phone Cases';
  if (title.includes('bag') || title.includes('backpack') || title.includes('tote')) return 'Bags';
  if (title.includes('sticker') || title.includes('decal')) return 'Stickers';
  if (title.includes('poster') || title.includes('print')) return 'Posters';
  if (title.includes('canvas')) return 'Canvas';
  if (title.includes('blanket')) return 'Blankets';
  if (title.includes('pillow')) return 'Pillows';
  if (title.includes('mug')) return 'Mugs';
  if (title.includes('bottle') || title.includes('tumbler')) return 'Drinkware';

  // 2. Check for main category matches in title/tags
  if (title.includes('kid') || title.includes('youth') || title.includes('toddler') || title.includes('baby') || title.includes('infant')) return 'Kids';
  if (title.includes('women') || title.includes('lady') || title.includes('girl')) return 'Women';
  if (title.includes('men') || title.includes('guy') || title.includes('boy')) return 'Men';

  // 3. Fall back to standard product category
  const productCat = (product.category || '').toLowerCase().trim();
  if (productCat === 'apparel') return 'Apparel';
  if (productCat === 'accessories') return 'Accessories';
  if (productCat === 'home-living' || productCat === 'home & living') return 'Home & Living';
  if (productCat === 'stationery') return 'Stationery';
  if (productCat === 'bags') return 'Bags';

  return product.category || 'Other';
}

