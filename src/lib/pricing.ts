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
  return /\b(women|womens|womenswear|female|ladies|lady)\b/i.test(text);
}

function isMenTarget(text: string): boolean {
  if (isWomenTarget(text)) return false;
  return /\b(men|mens|menswear|male|guys)\b/i.test(text);
}

function isUnisexTarget(text: string): boolean {
  return /\b(unisex|everyday fits|everyday fit|all gender|all-gender)\b/i.test(text);
}

function isKidsTarget(text: string): boolean {
  return /\b(kid|kids|youth|kids & youth|toddler|baby|infant|child|children)\b/i.test(text);
}

/**
 * Checks if a candidate label matches a configured category key.
 * Strictly prevents cross-gender leakage (e.g. "Menswear" matching "Womenswear" or vice-versa).
 */
export function isCategoryMatch(candidate: string, categoryKey: string): boolean {
  if (!candidate || !categoryKey) return false;

  const targetClean = cleanCategory(candidate);
  const keyClean = cleanCategory(categoryKey);

  // Exact normalized match (e.g. "womenswear" === "womenswear", "menswear" === "menswear")
  if (targetClean === keyClean) {
    return true;
  }

  // Strict Gender / Department Boundaries
  if (keyClean === 'womenswear' || keyClean === 'women' || keyClean === 'womens') {
    return isWomenTarget(targetClean);
  }

  if (keyClean === 'menswear' || keyClean === 'men' || keyClean === 'mens') {
    return isMenTarget(targetClean);
  }

  if (keyClean === 'everyday fits' || keyClean === 'everyday fit' || keyClean === 'unisex') {
    return isUnisexTarget(targetClean);
  }

  if (keyClean === 'kids and youth' || keyClean === 'kids youth' || keyClean === 'kids' || keyClean === 'kid') {
    return isKidsTarget(targetClean);
  }

  // Everyday Essentials (Accessories)
  if (keyClean === 'everyday essentials' || keyClean === 'accessories') {
    return targetClean.includes('everyday essentials') || targetClean === 'accessories' || /\baccessories\b/i.test(targetClean);
  }

  // Home & Studio (Home & Living)
  if (keyClean === 'home and studio' || keyClean === 'home studio' || keyClean === 'home and living' || keyClean === 'home living') {
    return targetClean.includes('home') && (targetClean.includes('studio') || targetClean.includes('living'));
  }

  // Drinkware Studio (Mugs & Drinkware)
  if (keyClean === 'drinkware studio' || keyClean === 'mugs and drinkware' || keyClean === 'mugs drinkware' || keyClean === 'drinkware') {
    return targetClean.includes('drinkware') || targetClean.includes('mug');
  }

  // Footwear & Kicks (Shoes & Socks)
  if (keyClean === 'footwear and kicks' || keyClean === 'footwear kicks' || keyClean === 'shoes and socks' || keyClean === 'shoes socks' || keyClean === 'footwear') {
    return targetClean.includes('footwear') || targetClean.includes('kick') || (targetClean.includes('shoe') && targetClean.includes('sock'));
  }

  // Specific subcategories (Graphic Tees, Hoodies, Phone Cases, etc.)
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
    if (isWomenTarget(trimmed)) department = 'Womenswear';
    else if (isMenTarget(trimmed)) department = 'Menswear';
    else if (isUnisexTarget(trimmed)) department = 'Everyday Fits';
    else if (isKidsTarget(trimmed)) department = 'Kids & Youth';
    else if (cleanCategory(trimmed) === 'everyday essentials' || cleanCategory(trimmed) === 'accessories') department = 'Everyday Essentials';
    else if (cleanCategory(trimmed).includes('home') && (cleanCategory(trimmed).includes('studio') || cleanCategory(trimmed).includes('living'))) department = 'Home & Studio';
    else if (cleanCategory(trimmed).includes('drinkware') || cleanCategory(trimmed).includes('mug')) department = 'Drinkware Studio';
    else if (cleanCategory(trimmed).includes('footwear') || cleanCategory(trimmed).includes('shoe') || cleanCategory(trimmed).includes('sock')) department = 'Footwear & Kicks';

    const subcategory = resolveSubcategoryFromString(trimmed);
    const candidates: string[] = [trimmed];
    if (subcategory && subcategory.toLowerCase() !== trimmed.toLowerCase()) candidates.unshift(subcategory);
    if (department && !candidates.includes(department)) candidates.push(department);
    // Add legacy aliases for backward compatibility with saved settings
    if (department === 'Menswear') candidates.push('Men');
    if (department === 'Womenswear') candidates.push('Women');
    if (department === 'Everyday Fits') candidates.push('Unisex');
    if (department === 'Kids & Youth') candidates.push('Kids');
    if (department === 'Everyday Essentials') candidates.push('Accessories');
    if (department === 'Home & Studio') candidates.push('Home & Living');
    if (department === 'Drinkware Studio') candidates.push('Mugs & Drinkware');
    if (department === 'Footwear & Kicks') candidates.push('Shoes & Socks');

    return { subcategory, department, candidates };
  }

  if (typeof input === 'object') {
    const candidates: string[] = [];
    let department: string | undefined;
    let subcategory: string | undefined;

    // 1. Check categoryIds (highest authority on gender/department)
    if (Array.isArray(input.categoryIds) && input.categoryIds.length > 0) {
      if (input.categoryIds.includes(1) && input.categoryIds.includes(2)) department = 'Everyday Fits';
      else if (input.categoryIds.includes(8)) department = 'Everyday Fits';
      else if (input.categoryIds.includes(2)) department = 'Womenswear';
      else if (input.categoryIds.includes(1)) department = 'Menswear';
      else if (input.categoryIds.includes(3)) department = 'Kids & Youth';
      else if (input.categoryIds.includes(4)) department = 'Everyday Essentials';
      else if (input.categoryIds.includes(5)) department = 'Home & Studio';
      else if (input.categoryIds.includes(6)) department = 'Drinkware Studio';
      else if (input.categoryIds.includes(7)) department = 'Footwear & Kicks';
    }

    const title = (input.title || input.name || '').trim();
    const catStr = (input.category || input.sourceCategory || '').trim();

    if (!department) {
      if (isWomenTarget(catStr) || isWomenTarget(title)) department = 'Womenswear';
      else if (isMenTarget(catStr) || isMenTarget(title)) department = 'Menswear';
      else if (isUnisexTarget(catStr) || isUnisexTarget(title)) department = 'Everyday Fits';
      else if (isKidsTarget(catStr) || isKidsTarget(title)) department = 'Kids & Youth';
      else if (cleanCategory(catStr) === 'everyday essentials' || cleanCategory(catStr) === 'accessories') department = 'Everyday Essentials';
      else if (cleanCategory(catStr).includes('home') && (cleanCategory(catStr).includes('studio') || cleanCategory(catStr).includes('living'))) department = 'Home & Studio';
      else if (cleanCategory(catStr).includes('drinkware') || cleanCategory(catStr).includes('mug')) department = 'Drinkware Studio';
      else if (cleanCategory(catStr).includes('footwear') || cleanCategory(catStr).includes('shoe') || cleanCategory(catStr).includes('sock')) department = 'Footwear & Kicks';
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

    // Add legacy aliases for backward compatibility with saved settings
    if (department === 'Menswear' && !candidates.includes('Men')) candidates.push('Men');
    if (department === 'Womenswear' && !candidates.includes('Women')) candidates.push('Women');
    if (department === 'Everyday Fits' && !candidates.includes('Unisex')) candidates.push('Unisex');
    if (department === 'Kids & Youth' && !candidates.includes('Kids')) candidates.push('Kids');
    if (department === 'Everyday Essentials' && !candidates.includes('Accessories')) candidates.push('Accessories');
    if (department === 'Home & Studio' && !candidates.includes('Home & Living')) candidates.push('Home & Living');
    if (department === 'Drinkware Studio' && !candidates.includes('Mugs & Drinkware')) candidates.push('Mugs & Drinkware');
    if (department === 'Footwear & Kicks' && !candidates.includes('Shoes & Socks')) candidates.push('Shoes & Socks');

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
  if (title.includes('sock')) return 'Streetwear Socks';
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
    return 'Footwear & Kicks';
  }

  // 2. Check for apparel subcategories matching titles
  if (title.includes('hoodie')) return 'Pullovers & Hoodies';
  if (title.includes('sweatshirt')) return 'Crewnecks & Sweaters';
  if (title.includes('tank') || title.includes('racerback')) return 'Sleeveless & Tanks';
  if (title.includes('long sleeve') || title.includes('long-sleeve')) return 'Long Sleeves';
  if (title.includes('tee') || title.includes('t-shirt') || title.includes('t shirt')) return 'Graphic Tees & Tops';
  if (title.includes('sport') || title.includes('active') || title.includes('jersey') || title.includes('athletic')) return 'Sportswear';
  if (title.includes('hat') || title.includes('cap') || title.includes('beanie')) return 'Headwear & Caps';
  if (title.includes('jogger') || title.includes('pant') || title.includes('legging') || title.includes('sweatpant')) return 'Joggers & Bottoms';
  if (title.includes('swim') || title.includes('bikini') || title.includes('trunks')) return 'Beach & Swimwear';
  if (title.includes('boxer') || title.includes('brief') || title.includes('underwear')) return 'Underwear';
  if (title.includes('jacket') || title.includes('windbreaker') || title.includes('vest') || title.includes('coat')) return 'Jackets & Outerwear';

  // 3. Check for accessories & home subcategories
  if (title.includes('phone') || title.includes('case')) return 'Tech & Phone Cases';
  if (title.includes('bag') || title.includes('backpack') || title.includes('tote')) return 'Backpacks & Totes';
  if (title.includes('sticker') || title.includes('decal')) return 'Stickers';
  if (title.includes('poster') || (title.includes('print') && !title.includes('all-over') && !title.includes('all over') && !title.includes('sublimat'))) return 'Wall Art & Prints';
  if (title.includes('canvas')) return 'Canvas';
  if (title.includes('blanket')) return 'Blankets';
  if (title.includes('pillow')) return 'Pillows';
  if (title.includes('mug')) return 'Artistic Mugs';
  if (title.includes('bottle') || title.includes('tumbler')) return 'Drinkware';

  // 4. Check categoryIds (from blueprint_categories.json or Printify)
  if (Array.isArray(product.categoryIds)) {
    if (product.categoryIds.includes(7)) return 'Footwear & Kicks';
    if (product.categoryIds.includes(6)) return 'Drinkware Studio';
    if (product.categoryIds.includes(5)) return 'Home & Studio';
    if (product.categoryIds.includes(4)) return 'Everyday Essentials';
    if (product.categoryIds.includes(3)) return 'Kids & Youth';
    if (product.categoryIds.includes(2)) return 'Womenswear';
    if (product.categoryIds.includes(1)) return 'Menswear';
    if (product.categoryIds.includes(8)) return 'Everyday Fits';
  }

  // 5. Check for main category matches in title/tags
  if (title.includes('kid') || title.includes('youth') || title.includes('toddler') || title.includes('baby') || title.includes('infant')) return 'Kids & Youth';
  if (title.includes('women') || title.includes('lady') || title.includes('girl')) return 'Womenswear';
  if (title.includes('men') || title.includes('guy') || title.includes('boy')) return 'Menswear';
  if (title.includes('unisex')) return 'Everyday Fits';

  // 6. Fall back to standard product category
  const productCat = (product.category || product.category_name || '').toLowerCase().trim();
  if (productCat === 'menswear' || productCat === 'men') return 'Menswear';
  if (productCat === 'womenswear' || productCat === 'women') return 'Womenswear';
  if (productCat === 'everyday fits' || productCat === 'unisex' || productCat === 'apparel') return 'Everyday Fits';
  if (productCat === 'kids & youth' || productCat === 'kids') return 'Kids & Youth';
  if (productCat === 'everyday essentials' || productCat === 'accessories' || productCat === 'bags' || productCat === 'stationery') return 'Everyday Essentials';
  if (productCat === 'home & studio' || productCat === 'home-living' || productCat === 'home & living') return 'Home & Studio';
  if (productCat === 'drinkware studio' || productCat === 'mugs & drinkware' || productCat === 'mugs-drinkware') return 'Drinkware Studio';
  if (productCat === 'footwear & kicks' || productCat === 'shoes & socks' || productCat === 'shoes-socks' || productCat === 'shoes' || productCat === 'socks') return 'Footwear & Kicks';

  return product.category || 'Other';
}

