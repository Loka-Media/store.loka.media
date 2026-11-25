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
 * Clean and normalize a category string for reliable comparison.
 */
function cleanCategory(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[-_]/g, ' ')
    .replace(/['"]/g, '')
    .replace(/\s+/g, ' ');
}

function isWomenTarget(text: string): boolean {
  return /\b(women|womens|female|ladies|lady)\b/i.test(text);
}

function isMenTarget(text: string): boolean {
  if (isWomenTarget(text)) return false;
  return /\b(men|mens|male|guys)\b/i.test(text);
}

function isUnisexTarget(text: string): boolean {
  return /\bunisex\b/i.test(text);
}

function isKidsTarget(text: string): boolean {
  return /\b(kid|kids|youth|toddler|baby|infant|child|children)\b/i.test(text);
}

/**
 * Checks if a candidate label matches a configured category key.
 * Strictly prevents cross-gender leakage (e.g. "Men" matching "Women" or vice-versa).
 */
export function isCategoryMatch(candidate: string, categoryKey: string): boolean {
  if (!candidate || !categoryKey) return false;

  const targetClean = cleanCategory(candidate);
  const keyClean = cleanCategory(categoryKey);

  // Exact normalized match (e.g. "women" === "women", "men" === "men", "accessories" === "accessories")
  if (targetClean === keyClean) {
    return true;
  }

  // Cross-mapping between Loka distinct category names and legacy/Printify category names
  const ALIAS_MAP: Record<string, string[]> = {
    'menswear': ['men', 'mens', 'menswear', 'male'],
    'men': ['men', 'mens', 'menswear', 'male'],
    'womenswear': ['women', 'womens', 'womenswear', 'female', 'ladies'],
    'women': ['women', 'womens', 'womenswear', 'female', 'ladies'],
    'everyday fits': ['unisex', 'everyday fits'],
    'unisex': ['unisex', 'everyday fits'],
    'kids and youth': ['kids', 'kid', 'kids and youth', 'youth'],
    'kids': ['kids', 'kid', 'kids and youth', 'youth'],
    'everyday essentials': ['accessories', 'everyday essentials'],
    'accessories': ['accessories', 'everyday essentials'],
    'home and studio': ['home and living', 'home living', 'home and studio', 'home'],
    'home and living': ['home and living', 'home living', 'home and studio', 'home'],
    'drinkware studio': ['mugs and drinkware', 'mugs drinkware', 'drinkware studio', 'mugs', 'drinkware'],
    'mugs and drinkware': ['mugs and drinkware', 'mugs drinkware', 'drinkware studio', 'mugs', 'drinkware'],
    'footwear and kicks': ['shoes and socks', 'shoes socks', 'footwear and kicks', 'shoes', 'socks', 'footwear'],
    'shoes and socks': ['shoes and socks', 'shoes socks', 'footwear and kicks', 'shoes', 'socks', 'footwear'],
  };

  if (ALIAS_MAP[keyClean]?.includes(targetClean) || ALIAS_MAP[targetClean]?.includes(keyClean)) {
    return true;
  }

  // Strict Gender / Department Boundaries
  if (keyClean === 'women' || keyClean === 'womens' || keyClean === 'womenswear') {
    return isWomenTarget(targetClean);
  }

  if (keyClean === 'men' || keyClean === 'mens' || keyClean === 'menswear') {
    return isMenTarget(targetClean);
  }

  if (keyClean === 'unisex' || keyClean === 'everyday fits') {
    return isUnisexTarget(targetClean) || targetClean === 'everyday fits';
  }

  if (keyClean === 'kids' || keyClean === 'kid' || keyClean === 'kids and youth') {
    return isKidsTarget(targetClean) || targetClean === 'kids and youth';
  }

  // Accessories & Home & Drinkware exact boundaries
  if (keyClean === 'accessories' || keyClean === 'everyday essentials') {
    return targetClean === 'accessories' || targetClean === 'everyday essentials' || /\baccessories\b/i.test(targetClean) || /\bessentials\b/i.test(targetClean);
  }

  if (keyClean === 'home and living' || keyClean === 'home living' || keyClean === 'home and studio') {
    return (targetClean.includes('home') && (targetClean.includes('living') || targetClean.includes('studio'))) || targetClean === 'home and studio';
  }

  if (keyClean === 'mugs and drinkware' || keyClean === 'mugs drinkware' || keyClean === 'drinkware studio') {
    return targetClean.includes('mug') || targetClean.includes('drinkware') || targetClean === 'drinkware studio';
  }

  if (keyClean === 'shoes and socks' || keyClean === 'shoes socks' || keyClean === 'footwear and kicks') {
    return (targetClean.includes('shoe') && targetClean.includes('sock')) || targetClean === 'shoes and socks' || targetClean.includes('footwear') || targetClean.includes('kicks');
  }

  // Specific subcategories (T-Shirts, Hoodies, Phone Cases, etc.)
  const escaped = keyClean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordRegex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, 'i');
  return wordRegex.test(targetClean);
}

/**
 * Resolves specific product subcategory from a string.
 */
function resolveSubcategoryFromString(str: string): string | undefined {
  const t = str.toLowerCase();
  if (t.includes('sock')) return 'Socks';
  if (t.includes('shoe') || t.includes('sneaker') || t.includes('boot') || t.includes('slipper') || t.includes('slide') || t.includes('clog')) return 'Shoes';
  if (t.includes('hoodie')) return 'Hoodies';
  if (t.includes('sweatshirt')) return 'Sweatshirts';
  if (t.includes('tank') || t.includes('racerback')) return 'Tank Tops';
  if (t.includes('long sleeve') || t.includes('long-sleeve')) return 'Long Sleeves';
  if (t.includes('tee') || t.includes('t-shirt') || t.includes('t shirt')) return 'T-Shirts';
  if (t.includes('sport') || t.includes('active') || t.includes('athletic')) return 'Sportswear';
  if (t.includes('hat') || t.includes('cap') || t.includes('beanie')) return 'Hats & Caps';
  if (t.includes('jogger') || t.includes('pant') || t.includes('legging')) return 'Bottoms & Leggings';
  if (t.includes('swim') || t.includes('bikini') || t.includes('trunks')) return 'Swimwear';
  if (t.includes('boxer') || t.includes('brief') || t.includes('underwear')) return 'Underwear';
  if (t.includes('jacket') || t.includes('coat') || t.includes('windbreaker')) return 'Jackets & Outerwear';
  if (t.includes('phone') || (t.includes('case') && !t.includes('pillow') && !t.includes('cushion'))) return 'Phone Cases';
  if (t.includes('bag') || t.includes('tote') || t.includes('backpack')) return 'Bags';
  if (t.includes('sticker') || t.includes('decal')) return 'Stickers';
  if (t.includes('poster')) return 'Posters';
  if (t.includes('canvas')) return 'Canvas';
  if (t.includes('blanket')) return 'Blankets';
  if (t.includes('pillow') || t.includes('cushion')) return 'Pillows';
  if (t.includes('mug')) return 'Mugs';
  if (t.includes('bottle') || t.includes('tumbler') || t.includes('drinkware')) return 'Drinkware';
  return undefined;
}

/**
 * Extracts all matching category labels for an input, ordered from specific to general.
 */
export function getProductCategoryHierarchy(input: any): { subcategory?: string; department?: string; candidates: string[] } {
  if (!input) return { candidates: [] };

  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return { candidates: [] };

    let department: string | undefined;
    if (isWomenTarget(trimmed)) department = 'Women';
    else if (isMenTarget(trimmed)) department = 'Men';
    else if (isUnisexTarget(trimmed)) department = 'Unisex';
    else if (isKidsTarget(trimmed)) department = 'Kids';
    else if (cleanCategory(trimmed) === 'accessories') department = 'Accessories';
    else if (cleanCategory(trimmed).includes('home') && cleanCategory(trimmed).includes('living')) department = 'Home & Living';
    else if (cleanCategory(trimmed).includes('mug') || cleanCategory(trimmed).includes('drinkware')) department = 'Mugs & Drinkware';
    else if (cleanCategory(trimmed).includes('shoe') || cleanCategory(trimmed).includes('sock')) department = 'Shoes & Socks';

    const subcategory = resolveSubcategoryFromString(trimmed);
    const candidates: string[] = [trimmed];
    if (subcategory && subcategory.toLowerCase() !== trimmed.toLowerCase()) candidates.unshift(subcategory);
    if (department && !candidates.includes(department)) candidates.push(department);

    return { subcategory, department, candidates };
  }

  if (typeof input === 'object') {
    const candidates: string[] = [];
    let department: string | undefined;
    let subcategory: string | undefined;

    // 1. Check categoryIds (highest authority on gender/department)
    if (Array.isArray(input.categoryIds) && input.categoryIds.length > 0) {
      if (input.categoryIds.includes(1) && input.categoryIds.includes(2)) department = 'Unisex';
      else if (input.categoryIds.includes(8)) department = 'Unisex';
      else if (input.categoryIds.includes(2)) department = 'Women';
      else if (input.categoryIds.includes(1)) department = 'Men';
      else if (input.categoryIds.includes(3)) department = 'Kids';
      else if (input.categoryIds.includes(4)) department = 'Accessories';
      else if (input.categoryIds.includes(5)) department = 'Home & Living';
      else if (input.categoryIds.includes(6)) department = 'Mugs & Drinkware';
      else if (input.categoryIds.includes(7)) department = 'Shoes & Socks';
    }

    const title = (input.title || input.name || '').trim();
    const catStr = (input.category || input.sourceCategory || '').trim();

    if (!department) {
      if (isWomenTarget(catStr) || isWomenTarget(title)) department = 'Women';
      else if (isMenTarget(catStr) || isMenTarget(title)) department = 'Men';
      else if (isUnisexTarget(catStr) || isUnisexTarget(title)) department = 'Unisex';
      else if (isKidsTarget(catStr) || isKidsTarget(title)) department = 'Kids';
      else if (cleanCategory(catStr) === 'accessories') department = 'Accessories';
      else if (cleanCategory(catStr).includes('home') && cleanCategory(catStr).includes('living')) department = 'Home & Living';
      else if (cleanCategory(catStr).includes('mug') || cleanCategory(catStr).includes('drinkware')) department = 'Mugs & Drinkware';
      else if (cleanCategory(catStr).includes('shoe') || cleanCategory(catStr).includes('sock')) department = 'Shoes & Socks';
    }

    const typeName = (input.type_name || input.type || '').trim();
    if (typeName) {
      subcategory = resolveSubcategoryFromString(typeName);
    }
    if (!subcategory) {
      subcategory = resolveSubcategoryFromString(title) || resolveSubcategoryFromString(catStr);
    }

    if (subcategory) candidates.push(subcategory);
    if (department && !candidates.includes(department)) candidates.push(department);
    if (catStr && !candidates.includes(catStr)) candidates.push(catStr);
    if (title && !candidates.includes(title)) candidates.push(title);

    return { subcategory, department, candidates };
  }

  return { candidates: [] };
}

/**
 * Determines the effective markup percentage to apply.
 * 
 * STRICT PRIORITY RULES:
 * 1. Specific Category / Subcategory Markup (> 0%):
 *    - If configured for the specific subcategory (e.g. "T-Shirts": 30%), it applies.
 *    - If subcategory is 0% or not configured, it checks the primary department (e.g. "Women": 60% or "Men": 40%).
 * 2. Exact match rules ALWAYS prevent cross-gender leakage:
 *    - "Women" rule NEVER applies to Men's products or "Men" category.
 *    - "Men" rule NEVER applies to Women's products or "Women" category.
 *    - "Accessories", "Home & Living", etc. ONLY apply to their respective items.
 * 3. Fallback:
 *    - If no category rule is configured (> 0%), falls back to Global Platform Markup.
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
      : 50;

  // Merge category markups with defaults
  const mergedCategoryMarkups: Record<string, number> = {
    ...((defaultSettings?.categoryMarkup as Record<string, number>) || {}),
    ...(categoryMarkups || {})
  };

  const { candidates } = getProductCategoryHierarchy(categoryOrProductOrMarkup);

  // 1. Try candidates in order (Subcategory first, then Department)
  for (const candidate of candidates) {
    for (const [key, val] of Object.entries(mergedCategoryMarkups)) {
      if (typeof val === 'number' && val > 0 && isCategoryMatch(candidate, key)) {
        return val;
      }
    }
  }

  // Fallback to Global Platform Markup
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

  // 1. Gather variant retail prices if available (takes priority for accurate variant price ranges)
  if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const activeVariants = product.variants.filter((v: any) => v.is_enabled !== false && v.available_for_sale !== false);
    const variantsToCheck = activeVariants.length > 0 ? activeVariants : product.variants;
    const prices = variantsToCheck
      .map((v: any) => parseFloat(v.price || v.selling_price || v.retail_price || 0))
      .filter((p: number) => !isNaN(p) && p > 0);
    
    if (prices.length > 0) {
      return {
        minPrice: ensure99Pricing(Math.min(...prices)),
        maxPrice: ensure99Pricing(Math.max(...prices))
      };
    }
  }

  // 2. Check direct retail prices calculated by backend API / Database
  const directMin = parseFloat(
    product.min_price ?? 
    product.minPrice ?? 
    product.price_range?.min ?? 
    product.price ?? 
    product.selling_price ?? 
    product.retail_price ?? 
    product.base_price ??
    product.basePrice ??
    0
  );
  const directMax = parseFloat(
    product.max_price ?? 
    product.maxPrice ?? 
    product.price_range?.max ?? 
    product.price ?? 
    product.selling_price ?? 
    product.retail_price ?? 
    product.base_price ??
    product.basePrice ??
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

  // 3. Fallback to calculating selling price from base cost & markup
  const categoryName = typeof categoryOrMarkup === 'string' ? categoryOrMarkup : (product.category || resolveProductCategoryName(product));
  const markupRateInput = categoryOrMarkup !== undefined ? categoryOrMarkup : categoryName;
  const rawCost = parseFloat(product.cost || product.min_base_cost || '0');
  const baseCost = !isNaN(rawCost) && rawCost > 0 
    ? rawCost 
    : parseFloat(product.base_price || product.basePrice || '0');
  const creatorMarkup = parseFloat(product.markup_percentage || product.markupPercentage || '0');

  if (!isNaN(baseCost) && baseCost > 0) {
    if (!isNaN(creatorMarkup) && creatorMarkup > 0) {
      if (!isNaN(rawCost) && rawCost > 0) {
        const platformPrice = calculateSellingPrice(rawCost, markupRateInput, categoryMarkups, globalMarkup);
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

  // 1. Direct finalized retail price on variant
  const directVariantPrice = parseFloat(variant.price || variant.selling_price || variant.retail_price || 0);
  if (!isNaN(directVariantPrice) && directVariantPrice > 0) {
    const cents = Math.round(directVariantPrice * 100);
    if (cents % 100 === 99 && directVariantPrice >= 5) {
      return directVariantPrice;
    }
  }

  // Determine category name
  const categoryName = typeof categoryOrMarkup === 'string' ? categoryOrMarkup : (product?.category || resolveProductCategoryName(product));
  
  // Get base cost
  let baseCost = 0;
  if (variant.cost !== undefined && variant.cost !== null && !isNaN(parseFloat(variant.cost))) {
    baseCost = parseFloat(variant.cost);
  } else if (variant.base_cost !== undefined && variant.base_cost !== null && !isNaN(parseFloat(variant.base_cost))) {
    baseCost = parseFloat(variant.base_cost);
  } else if (variant.price !== undefined && variant.price !== null && !isNaN(parseFloat(variant.price))) {
    baseCost = parseFloat(variant.price);
  } else {
    baseCost = parseFloat(product?.base_price || product?.cost || '0');
  }

  const creatorMarkup = parseFloat(product?.markup_percentage || product?.markupPercentage || '0');

  if (typeof categoryOrMarkup === 'number') {
    const pPrice = calculateSellingPrice(baseCost, categoryOrMarkup);
    return !isNaN(creatorMarkup) && creatorMarkup > 0
      ? calculateRetailPriceFromMarkup(pPrice, creatorMarkup)
      : ensure99Pricing(pPrice);
  }

  const markupRateInput = categoryOrMarkup !== undefined ? categoryOrMarkup : categoryName;
  const platformPrice = calculateSellingPrice(baseCost, markupRateInput, categoryMarkups, globalMarkup);
  return !isNaN(creatorMarkup) && creatorMarkup > 0
    ? calculateRetailPriceFromMarkup(platformPrice, creatorMarkup)
    : ensure99Pricing(platformPrice);
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

