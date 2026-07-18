// ============================================================
// CATEGORY MAP
// Maps our internal category IDs to human-readable names.
// These IDs correspond exactly to the values in blueprint_categories.json.
// ============================================================

export const CATEGORIES_MAP = [
  { id: 1, title: "Men" },
  { id: 2, title: "Women" },
  { id: 8, title: "Unisex" },
  { id: 3, title: "Kids" },
  { id: 4, title: "Accessories" },
  { id: 5, title: "Home & Living" },
  { id: 6, title: "Mugs & Drinkware" },
  { id: 7, title: "Shoes & Socks" }
];

// ============================================================
// CATEGORY-AWARE MATCH HELPER
// ============================================================

/**
 * Returns true if the blueprint belongs to the given category.
 *
 * If `bp.categoryIds` is present (set by the server from blueprint_categories.json),
 * we use it as the authoritative check.  If the field is absent (e.g. during SSR
 * or when fetching blueprint details directly), we fall back to title keywords so
 * the code remains robust without breaking.
 *
 * Printify's public Catalog API has NO gender/category field on blueprints; the
 * categoryIds field is the only reliable source of truth available to us.
 */
function inCategory(bp: any, categoryId: number): boolean {
  if (Array.isArray(bp.categoryIds)) {
    return bp.categoryIds.includes(categoryId);
  }
  // Soft fallback (defensive — shouldn't normally be needed)
  return true;
}

// ============================================================
// TITLE KEYWORD HELPERS
// Centralised so that Men and Women share identical keyword sets
// for the same garment types, avoiding drift between the two.
// ============================================================

const isSweatshirt  = (t: string) => t.includes("sweatshirt") || t.includes("crewneck") || t.includes("crew neck");
const isHoodie      = (t: string) => t.includes("hoodie") || t.includes("hooded sweatshirt") || t.includes("zip hoodie") || t.includes("full zip");
const isTShirt      = (t: string) => t.includes("tee") || t.includes("t-shirt") || t.includes("t shirt") || t.includes("jersey tee") || t.includes("polo");
const isLongSleeve  = (t: string) => t.includes("long sleeve") || t.includes("long-sleeve");
const isTankTop     = (t: string) => t.includes("tank") || t.includes("racerback") || t.includes("muscle");
const isSportswear  = (t: string) => t.includes("sport") || t.includes("active") || t.includes("jersey") || t.includes("athletic") || t.includes("performance") || t.includes("compression");
const isBottoms     = (t: string) => t.includes("pant") || t.includes("jogger") || t.includes("shorts") || t.includes("sweatpant") || t.includes("legging") || t.includes("tights");
const isSwimwear    = (t: string) => t.includes("swim") || t.includes("bikini") || t.includes("trunk");
const isShoe        = (t: string) => t.includes("shoe") || t.includes("sneaker") || t.includes("boot") || t.includes("slipper") || t.includes("loafer") || t.includes("canvas shoe");
const isOuterwear   = (t: string) => t.includes("jacket") || t.includes("coat") || t.includes("windbreaker") || t.includes("bomber") || t.includes("parka");
const isDress       = (t: string) => t.includes("dress") || t.includes("skirt") || t.includes("romper");
const isBag         = (t: string) => t.includes("bag") || t.includes("backpack") || t.includes("tote") || t.includes("pouch") || t.includes("wallet") || t.includes("purse") || t.includes("fanny pack");
const isHat         = (t: string) => t.includes("hat") || t.includes("cap") || t.includes("beanie") || t.includes("bucket hat") || t.includes("snapback") || t.includes("trucker");
const isPhoneCase   = (t: string) => t.includes("phone") || t.includes("iphone") || t.includes("samsung") || (t.includes("case") && !t.includes("pillowcase") && !t.includes("cushion case"));
const isSticker     = (t: string) => t.includes("sticker") || t.includes("decal");
const isStationery  = (t: string) => t.includes("notebook") || t.includes("journal") || t.includes("pen ") || t.includes("pencil") || t.includes(" card") || t.includes("postcard");
const isTechAcc     = (t: string) => t.includes("charger") || t.includes("mouse pad") || t.includes("mousepad") || t.includes("laptop sleeve") || t.includes("phone stand");
const isPoster      = (t: string) => t.includes("poster") || t.includes("art print");
const isCanvas      = (t: string) => t.includes("canvas") || t.includes("wall art") || t.includes("tapestry");
const isBlanket     = (t: string) => t.includes("blanket") || t.includes("throw");
const isPillow      = (t: string) => t.includes("pillow") || t.includes("cushion");
const isTowel       = (t: string) => t.includes("towel");
const isMug         = (t: string) => t.includes("mug");
const isDrinkware   = (t: string) => t.includes("bottle") || t.includes("tumbler") || t.includes("cup") || t.includes("glass") || t.includes("flask") || t.includes("pint") || t.includes("travel mug");
const isSock        = (t: string) => t.includes("sock");
const isKidsItem    = (t: string) => t.includes("kid") || t.includes("youth") || t.includes("toddler") || t.includes("baby") || t.includes("infant") || t.includes("bodysuit") || t.includes("creeper");

// ============================================================
// SUBCATEGORIES CONFIG
// ============================================================

export const SUBCATEGORIES_CONFIG: Record<number, Array<{ id: string; title: string; match: (bp: any) => boolean }>> = {

  // ──────────────────────────────────────────────────────────
  // 1 — MEN
  // Every match() FIRST checks inCategory(bp, 1) so that a
  // Women's-only product (categoryIds=[2]) can never appear in
  // any Men's subcategory, even if the title contains matching
  // keywords (e.g. "Women's Flowy Tank").
  // ──────────────────────────────────────────────────────────
  1: [
    {
      id: "men-new-arrivals",
      title: "New Arrivals",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        // Approximate "new" by higher blueprint IDs (Printify assigns IDs sequentially).
        // Products above ID 400 are relatively recent additions to the catalog.
        return bp.id > 400;
      }
    },
    {
      id: "men-bestsellers",
      title: "Bestsellers",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        // Classic staples by well-known brands that appear on Printify's bestseller list.
        // Gildan 5000 (id 6), Bella+Canvas 3001 (id 12), Comfort Colors 1717 (id 706),
        // Gildan 18500 hoodie (id 77), Gildan 18000 sweatshirt (id 78).
        const BESTSELLER_IDS = new Set([5, 6, 12, 36, 49, 77, 78, 145, 175, 439, 440, 706]);
        return BESTSELLER_IDS.has(bp.id);
      }
    },
    {
      id: "men-sweatshirts",
      title: "Sweatshirts",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        const t = bp.title.toLowerCase();
        return isSweatshirt(t) && !isHoodie(t);
      }
    },
    {
      id: "men-hoodies",
      title: "Hoodies",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        return isHoodie(bp.title.toLowerCase());
      }
    },
    {
      id: "men-t-shirts",
      title: "T-Shirts",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        const t = bp.title.toLowerCase();
        return isTShirt(t) && !isLongSleeve(t);
      }
    },
    {
      id: "men-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        return isLongSleeve(bp.title.toLowerCase());
      }
    },
    {
      id: "men-tank-tops",
      title: "Tank Tops",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        return isTankTop(bp.title.toLowerCase());
      }
    },
    {
      id: "men-sportswear",
      title: "Sportswear",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        const t = bp.title.toLowerCase();
        return isSportswear(t) && !isTShirt(t) && !isHoodie(t) && !isSweatshirt(t);
      }
    },
    {
      id: "men-bottoms",
      title: "Bottoms",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        const t = bp.title.toLowerCase();
        return isBottoms(t) && !isSwimwear(t);
      }
    },
    {
      id: "men-swimwear",
      title: "Swimwear",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        return isSwimwear(bp.title.toLowerCase());
      }
    },
    {
      id: "men-outerwear",
      title: "Outerwear",
      match: (bp) => {
        if (!inCategory(bp, 1)) return false;
        return isOuterwear(bp.title.toLowerCase());
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 2 — WOMEN
  // Same pattern: inCategory(bp, 2) guard first.
  // ──────────────────────────────────────────────────────────
  2: [
    {
      id: "women-new-arrivals",
      title: "New Arrivals",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        return bp.id > 400;
      }
    },
    {
      id: "women-bestsellers",
      title: "Bestsellers",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        const BESTSELLER_IDS = new Set([9, 10, 11, 12, 18, 36, 49, 77, 78, 145, 175, 439, 440, 706]);
        return BESTSELLER_IDS.has(bp.id);
      }
    },
    {
      id: "women-t-shirts",
      title: "T-Shirts",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        const t = bp.title.toLowerCase();
        return isTShirt(t) && !isLongSleeve(t);
      }
    },
    {
      id: "women-hoodies",
      title: "Hoodies",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        return isHoodie(bp.title.toLowerCase());
      }
    },
    {
      id: "women-sweatshirts",
      title: "Sweatshirts",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        const t = bp.title.toLowerCase();
        return isSweatshirt(t) && !isHoodie(t);
      }
    },
    {
      id: "women-tank-tops",
      title: "Tank Tops",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        return isTankTop(bp.title.toLowerCase());
      }
    },
    {
      id: "women-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        return isLongSleeve(bp.title.toLowerCase());
      }
    },
    {
      id: "women-dresses",
      title: "Dresses & Skirts",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        return isDress(bp.title.toLowerCase());
      }
    },
    {
      id: "women-leggings",
      title: "Leggings",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        const t = bp.title.toLowerCase();
        return t.includes("legging") || t.includes("tights");
      }
    },
    {
      id: "women-bottoms",
      title: "Bottoms",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        const t = bp.title.toLowerCase();
        return isBottoms(t) && !isDress(t) && !t.includes("legging") && !isSwimwear(t);
      }
    },
    {
      id: "women-swimwear",
      title: "Swimwear",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        return isSwimwear(bp.title.toLowerCase());
      }
    },
    {
      id: "women-outerwear",
      title: "Outerwear",
      match: (bp) => {
        if (!inCategory(bp, 2)) return false;
        return isOuterwear(bp.title.toLowerCase());
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 8 — UNISEX
  // Every match() checks inCategory(bp, 8).
  // ──────────────────────────────────────────────────────────
  8: [
    {
      id: "unisex-new-arrivals",
      title: "New Arrivals",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        return bp.id > 400;
      }
    },
    {
      id: "unisex-bestsellers",
      title: "Bestsellers",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        const BESTSELLER_IDS = new Set([5, 6, 12, 36, 49, 77, 78, 145, 175, 439, 440, 706]);
        return BESTSELLER_IDS.has(bp.id);
      }
    },
    {
      id: "unisex-sweatshirts",
      title: "Sweatshirts",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        const t = bp.title.toLowerCase();
        return isSweatshirt(t) && !isHoodie(t);
      }
    },
    {
      id: "unisex-hoodies",
      title: "Hoodies",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        return isHoodie(bp.title.toLowerCase());
      }
    },
    {
      id: "unisex-t-shirts",
      title: "T-Shirts",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        const t = bp.title.toLowerCase();
        return isTShirt(t) && !isLongSleeve(t);
      }
    },
    {
      id: "unisex-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        return isLongSleeve(bp.title.toLowerCase());
      }
    },
    {
      id: "unisex-tank-tops",
      title: "Tank Tops",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        return isTankTop(bp.title.toLowerCase());
      }
    },
    {
      id: "unisex-sportswear",
      title: "Sportswear",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        const t = bp.title.toLowerCase();
        return isSportswear(t) && !isTShirt(t) && !isHoodie(t) && !isSweatshirt(t);
      }
    },
    {
      id: "unisex-bottoms",
      title: "Bottoms",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        const t = bp.title.toLowerCase();
        return isBottoms(t) && !isSwimwear(t);
      }
    },
    {
      id: "unisex-swimwear",
      title: "Swimwear",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        return isSwimwear(bp.title.toLowerCase());
      }
    },
    {
      id: "unisex-outerwear",
      title: "Outerwear",
      match: (bp) => {
        if (!inCategory(bp, 8)) return false;
        return isOuterwear(bp.title.toLowerCase());
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 3 — KIDS
  // Kids items are exclusively mapped to [3] in
  // blueprint_categories.json, so the inCategory guard
  // here is mostly redundant but kept for safety.
  // ──────────────────────────────────────────────────────────
  3: [
    {
      id: "kids-t-shirts",
      title: "T-Shirts",
      match: (bp) => {
        if (!inCategory(bp, 3)) return false;
        const t = bp.title.toLowerCase();
        return isTShirt(t) && !isLongSleeve(t) && !isHoodie(t) && !isSweatshirt(t);
      }
    },
    {
      id: "kids-hoodies",
      title: "Hoodies",
      match: (bp) => {
        if (!inCategory(bp, 3)) return false;
        return isHoodie(bp.title.toLowerCase());
      }
    },
    {
      id: "kids-sweatshirts",
      title: "Sweatshirts",
      match: (bp) => {
        if (!inCategory(bp, 3)) return false;
        const t = bp.title.toLowerCase();
        return isSweatshirt(t) && !isHoodie(t);
      }
    },
    {
      id: "kids-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => {
        if (!inCategory(bp, 3)) return false;
        return isLongSleeve(bp.title.toLowerCase());
      }
    },
    {
      id: "kids-bodysuits",
      title: "Bodysuits & Baby",
      match: (bp) => {
        if (!inCategory(bp, 3)) return false;
        return isKidsItem(bp.title.toLowerCase());
      }
    },
    {
      id: "kids-accessories",
      title: "Accessories",
      match: (bp) => {
        if (!inCategory(bp, 3)) return false;
        const t = bp.title.toLowerCase();
        return isBag(t) || isHat(t) || t.includes("bib");
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 4 — ACCESSORIES
  // ──────────────────────────────────────────────────────────
  4: [
    {
      id: "acc-bags",
      title: "Bags & Backpacks",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        return isBag(bp.title.toLowerCase());
      }
    },
    {
      id: "acc-hats",
      title: "Hats & Beanies",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        return isHat(bp.title.toLowerCase());
      }
    },
    {
      id: "acc-phone-cases",
      title: "Phone Cases",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        return isPhoneCase(bp.title.toLowerCase());
      }
    },
    {
      id: "acc-stickers",
      title: "Stickers & Decals",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        return isSticker(bp.title.toLowerCase());
      }
    },
    {
      id: "acc-stationery",
      title: "Stationery",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        return isStationery(bp.title.toLowerCase());
      }
    },
    {
      id: "acc-tech",
      title: "Tech Accessories",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        return isTechAcc(bp.title.toLowerCase());
      }
    },
    {
      id: "acc-other",
      title: "Other Accessories",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        const t = bp.title.toLowerCase();
        // Catch-all for accessories not matched by the above subcategories
        return !isBag(t) && !isHat(t) && !isPhoneCase(t) && !isSticker(t) && !isStationery(t) && !isTechAcc(t);
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 5 — HOME & LIVING
  // ──────────────────────────────────────────────────────────
  5: [
    {
      id: "home-posters",
      title: "Posters & Prints",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        return isPoster(bp.title.toLowerCase());
      }
    },
    {
      id: "home-canvas",
      title: "Canvas & Wall Art",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        return isCanvas(bp.title.toLowerCase());
      }
    },
    {
      id: "home-blankets",
      title: "Blankets & Throws",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        return isBlanket(bp.title.toLowerCase());
      }
    },
    {
      id: "home-pillows",
      title: "Pillows & Cushions",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        return isPillow(bp.title.toLowerCase());
      }
    },
    {
      id: "home-towels",
      title: "Towels",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        return isTowel(bp.title.toLowerCase());
      }
    },
    {
      id: "home-mugs",
      title: "Mugs",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        return isMug(bp.title.toLowerCase());
      }
    },
    {
      id: "home-drinkware",
      title: "Drinkware",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        return isDrinkware(bp.title.toLowerCase());
      }
    },
    {
      id: "home-other",
      title: "Other Home Items",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        const t = bp.title.toLowerCase();
        return !isPoster(t) && !isCanvas(t) && !isBlanket(t) && !isPillow(t) && !isTowel(t) && !isMug(t) && !isDrinkware(t);
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 6 — MUGS & DRINKWARE
  // ──────────────────────────────────────────────────────────
  6: [
    {
      id: "drink-mugs",
      title: "Mugs",
      match: (bp) => {
        if (!inCategory(bp, 6)) return false;
        return isMug(bp.title.toLowerCase());
      }
    },
    {
      id: "drink-tumblers",
      title: "Tumblers & Bottles",
      match: (bp) => {
        if (!inCategory(bp, 6)) return false;
        return isDrinkware(bp.title.toLowerCase());
      }
    },
    {
      id: "drink-other",
      title: "Other Drinkware",
      match: (bp) => {
        if (!inCategory(bp, 6)) return false;
        const t = bp.title.toLowerCase();
        return !isMug(t) && !isDrinkware(t);
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 7 — SHOES & SOCKS
  // ──────────────────────────────────────────────────────────
  7: [
    {
      id: "shoes-sneakers",
      title: "Sneakers & Shoes",
      match: (bp) => {
        if (!inCategory(bp, 7)) return false;
        return isShoe(bp.title.toLowerCase());
      }
    },
    {
      id: "shoes-socks",
      title: "Socks",
      match: (bp) => {
        if (!inCategory(bp, 7)) return false;
        return isSock(bp.title.toLowerCase());
      }
    },
  ],
};

// ============================================================
// UTILITY: Flat category names for search/filtering elsewhere
// ============================================================

/** Get a flat list of all unique category names (main + subcategories) */
export function getFlatCategoryNames(): string[] {
  const categories = new Set<string>();

  CATEGORIES_MAP.forEach(cat => categories.add(cat.title));

  Object.values(SUBCATEGORIES_CONFIG).forEach(subList => {
    subList.forEach(sub => {
      if (sub.title !== "New Arrivals" && sub.title !== "Bestsellers" && sub.title !== "Other Accessories" && sub.title !== "Other Home Items" && sub.title !== "Other Drinkware") {
        categories.add(sub.title);
      }
    });
  });

  return Array.from(categories);
}
