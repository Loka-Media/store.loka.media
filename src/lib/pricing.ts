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

      if (matchedVal !== undefined) {
        markupRate = matchedVal;
      }
    }
  } else if (globalMarkup !== undefined) {
    // If first markup param is undefined but globalMarkup is provided
    markupRate = globalMarkup;
  }
  
  // Calculate selling price
  const sellingPrice = parsedCost * (1 + markupRate / 100);
  
  // Round to nearest cents/decimals
  return Math.round(sellingPrice * 100) / 100;
}

/**
 * Get dynamic retail price range for a product.
 * Returns min and max selling prices calculated from variant base costs and markup rules.
 */
export function getProductPriceRange(
  product: any, 
  categoryOrMarkup: string | number | undefined, 
  categoryMarkups?: Record<string, number>, 
  globalMarkup?: number
): { minPrice: number; maxPrice: number } {
  if (!product) return { minPrice: 0, maxPrice: 0 };

  // Determine category name
  const categoryName = typeof categoryOrMarkup === 'string' ? categoryOrMarkup : resolveProductCategoryName(product);

  // 1. Gather all variant base costs
  let costs: number[] = [];

  if (product.variants && product.variants.length > 0) {
    costs = product.variants
      .map((v: any) => {
        // Use variant.cost directly if available (it is in dollars)
        if (v.cost !== undefined && v.cost !== null && !isNaN(parseFloat(v.cost))) {
          return parseFloat(v.cost);
        }
        // Fallback to variant.price
        if (v.price !== undefined && v.price !== null && !isNaN(parseFloat(v.price))) {
          return parseFloat(v.price) / 1.35;
        }
        return 0;
      })
      .filter((c: number) => c > 0);
  }

  // 2. Fallback to product-level base price if no variants have valid costs
  if (costs.length === 0) {
    const fallbackBase = parseFloat(product.base_price || product.price || '0');
    // If the base price has the premium indicator, or if we need to convert
    const baseCost = product.premiumPrice 
      ? parseFloat(product.premiumPrice) 
      : (product.source === 'printify' || product.product_source === 'printify' ? calculatePremiumPrice(fallbackBase) : fallbackBase);
    
    costs = [baseCost];
  }

  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  if (typeof categoryOrMarkup === 'number') {
    return {
      minPrice: calculateSellingPrice(minCost, categoryOrMarkup),
      maxPrice: calculateSellingPrice(maxCost, categoryOrMarkup),
    };
  }

  const markupRateInput = categoryOrMarkup !== undefined ? categoryOrMarkup : categoryName;
  return {
    minPrice: calculateSellingPrice(minCost, markupRateInput, categoryMarkups, globalMarkup),
    maxPrice: calculateSellingPrice(maxCost, markupRateInput, categoryMarkups, globalMarkup),
  };
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

