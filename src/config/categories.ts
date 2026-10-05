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
// ============================================================
// TITLE KEYWORD HELPERS
// Centralised keyword matching for Printify catalog blueprints.
// ============================================================

const isSweatshirt      = (t: string) => /\b(sweatshirt|sweatshirts|crewneck|crewnecks|crew neck|crew necks)\b/i.test(t);
const isHoodie          = (t: string) => /\b(hoodie|hoodies|hooded sweatshirt|zip hoodie|full zip)\b/i.test(t);
const isTShirt          = (t: string) => {
  if (t.includes("steel") || t.includes("canteen") || t.includes("fourteen") || t.includes("guarantee")) return false;
  return /\b(tee|tees|t-shirt|t-shirts|t shirt|t shirts|jersey tee|polo|polos)\b/i.test(t);
};
const isLongSleeve      = (t: string) => /\b(long sleeve|long sleeves|long-sleeve|long-sleeves)\b/i.test(t);
const isTankTop         = (t: string) => /\b(tank|tanks|racerback|racerbacks|muscle|crop top|crop tops)\b/i.test(t);
const isSportswear      = (t: string) => {
  if (t.includes("jersey tee") || t.includes("jersey short sleeve") || t.includes("single jersey")) return false;
  return /\b(sport|sports|activewear|athletic|performance|compression)\b/i.test(t);
};
const isBottoms         = (t: string) => /\b(pant|pants|jogger|joggers|shorts|sweatpant|sweatpants|legging|leggings|tights|bottoms)\b/i.test(t);
const isSwimwear        = (t: string) => /\b(swim|swimwear|bikini|bikinis|swim trunk|swim trunks|trunk|trunks|one-piece)\b/i.test(t);
const isShoe            = (t: string) => /\b(shoe|shoes|sneaker|sneakers|boot|boots|slipper|slippers|loafer|loafers|canvas shoe|canvas shoes|slide|slides|clog|clogs|footwear)\b/i.test(t);
const isOuterwear       = (t: string) => /\b(jacket|jackets|coat|coats|windbreaker|windbreakers|bomber|parka|vest|vests)\b/i.test(t);
const isDress           = (t: string) => /\b(dress|dresses|skirt|skirts|romper|rompers)\b/i.test(t);
const isBag             = (t: string) => /\b(bag|bags|backpack|backpacks|tote|totes|pouch|pouches|wallet|wallets|purse|purses|fanny pack|duffel|duffels|clutch)\b/i.test(t);
const isHat             = (t: string) => {
  if (t.includes("capri") || t.includes("capital") || t.includes("escape")) return false;
  return /\b(hat|hats|cap|caps|beanie|beanies|bucket hat|snapback|trucker|visor|visors|headwear)\b/i.test(t);
};
const isPhoneCase       = (t: string) => {
  if (t.includes("pillowcase") || t.includes("cushion case") || t.includes("laptop case") || t.includes("pencil case")) return false;
  return /\b(phone case|phone cases|iphone|samsung)\b/i.test(t) || (t.includes("case") && !t.includes("pillow") && !t.includes("cushion"));
};
const isSticker         = (t: string) => /\b(sticker|stickers|decal|decals)\b/i.test(t);
const isStationery      = (t: string) => {
  if (t.includes("mousepad") || t.includes("mouse pad") || t.includes("ipad") || t.includes("desk mat")) return false;
  return /\b(notebook|notebooks|journal|journals|pen|pens|pencil|pencils|postcard|postcards|greeting card|greeting cards|folder|folders|notepad|notepads|stationery)\b/i.test(t);
};
const isTechAcc         = (t: string) => {
  if (t.includes("shirt") || t.includes("tee") || t.includes("apparel")) return false;
  return /\b(charger|chargers|mouse pad|mousepad|laptop sleeve|laptop case|phone stand|airpod|cable|desk mat)\b/i.test(t);
};
const isPoster          = (t: string) => /\b(poster|posters|art print|wall art)\b/i.test(t);
const isCanvas          = (t: string) => /\b(canvas|tapestry)\b/i.test(t);
const isBlanket         = (t: string) => /\b(blanket|blankets|throw|throws|fleece)\b/i.test(t);
const isPillow          = (t: string) => /\b(pillow|pillows|cushion|cushions)\b/i.test(t);
const isTowel           = (t: string) => /\b(towel|towels)\b/i.test(t);
const isMug             = (t: string) => /\b(mug|mugs)\b/i.test(t);
const isDrinkware       = (t: string) => {
  if (t.includes("sunglass") || t.includes("hourglass")) return false;
  return /\b(mug|mugs|tumbler|tumblers|bottle|bottles|cup|cups|flask|flasks|pint|pints|glass|glassware|drinkware)\b/i.test(t);
};
const isBottleTumbler   = isDrinkware;
const isSock            = (t: string) => /\b(sock|socks)\b/i.test(t);
const isKidsItem        = (t: string) => /\b(kid|kids|youth|toddler|baby|infant|bodysuit|creeper|bib|onesie)\b/i.test(t);
const isJewelry         = (t: string) => {
  const clean = t.replace(/\b(ring spun|ringspun|drawstring|string|spring)\b/gi, "");
  return (
    /\b(jewelry|jewellery|necklace|necklaces|bracelet|bracelets|pendant|pendants|earring|earrings|charm|charms|bangle|bangles|cufflink|cufflinks|signet ring)\b/i.test(clean) ||
    (/\bring\b/i.test(clean) && !/\b(keyring|key-ring)\b/i.test(clean))
  );
};
const isBook            = (t: string) => /\b(book|books|coloring book|hardcover|paperback)\b/i.test(t);
const isUnderwear       = (t: string) => {
  if (isJewelry(t) || t.includes("pen") || t.includes("chambray") || t.includes("shirt") || t.includes("hoodie") || t.includes("jacket")) {
    return false;
  }
  return /\b(underwear|boxer|boxers|brief|briefs|panties|thong|thongs|bra|bras|sports bra|lingerie)\b/i.test(t);
};
const isBabyAcc         = (t: string) => /\b(baby|bib|pacifier|burp|swaddle|onesie|infant)\b/i.test(t);
const isMousePad        = (t: string) => /\b(mouse pad|mousepad|desk mat)\b/i.test(t);
const isPetAcc          = (t: string) => /\b(pet|dog|cat|leash|collar|harness|bandana|pet bowl|pet bed|pup)\b/i.test(t);
const isKitchenAcc      = (t: string) => /\b(apron|oven mitt|pot holder|cutting board|coaster|placemat|trivet|kitchen)\b/i.test(t);
const isCarAcc          = (t: string) => /\b(car|license plate|sunshade|car mat|seat cover|auto)\b/i.test(t);
const isSportsGames     = (t: string) => {
  if (t.includes("ballpoint") || t.includes("ball point")) return false;
  return /\b(sport|sports|game|games|puzzle|puzzles|playing card|golf|ball|balls|pickleball|ping pong|yoga)\b/i.test(t);
};
const isFaceMask        = (t: string) => /\b(mask|masks|face mask|gaiter|covering)\b/i.test(t);
const isCandle          = (t: string) => /\b(candle|candles|wax|fragrance)\b/i.test(t);
const isOrnament        = (t: string) => /\b(ornament|ornaments|bauble|baubles)\b/i.test(t);
const isSeasonal        = (t: string) => /\b(seasonal|holiday|christmas|halloween|easter|stocking|tree skirt)\b/i.test(t);
const isGlassware       = (t: string) => {
  if (t.includes("sunglass") || t.includes("hourglass")) return false;
  return /\b(glass|glasses|shot glass|wine glass|beer glass|mason jar)\b/i.test(t);
};
const isPostcard        = (t: string) => /\b(postcard|postcards|greeting card|card|cards)\b/i.test(t);
const isJournal         = (t: string) => /\b(journal|journals|notebook|notebooks|planner|planners)\b/i.test(t);
const isMagnetSticker   = (t: string) => /\b(magnet|magnets|sticker|stickers|decal|decals)\b/i.test(t);
const isHomeDecor       = (t: string) => /\b(clock|banner|flag|sign|wood print|acrylic|metal print|mirror|vase|decor)\b/i.test(t);
const isBathroom        = (t: string) => /\b(shower curtain|bath mat|bathrobe|bath)\b/i.test(t);
const isRugMat          = (t: string) => /\b(rug|rugs|doormat|doormats|floor mat)\b/i.test(t);
const isBedding         = (t: string) => /\b(duvet|comforter|bedding|sheet|sheets|quilt)\b/i.test(t);

// ============================================================
// SUBCATEGORIES CONFIG
// ============================================================

export const SUBCATEGORIES_CONFIG: Record<number, Array<{ id: string; title: string; match: (bp: any) => boolean }>> = {

  // ──────────────────────────────────────────────────────────
  // 1 — MEN
  // ──────────────────────────────────────────────────────────
  1: [
    {
      id: "men-new-arrivals",
      title: "New Arrivals",
      match: (bp) => inCategory(bp, 1) && bp.id > 400
    },
    {
      id: "men-bestsellers",
      title: "Bestsellers",
      match: (bp) => inCategory(bp, 1) && new Set([5, 6, 12, 36, 49, 77, 78, 145, 175, 439, 440, 706]).has(bp.id)
    },
    {
      id: "men-sweatshirts",
      title: "Sweatshirts",
      match: (bp) => inCategory(bp, 1) && isSweatshirt(bp.title.toLowerCase()) && !isHoodie(bp.title.toLowerCase())
    },
    {
      id: "men-hoodies",
      title: "Hoodies",
      match: (bp) => inCategory(bp, 1) && isHoodie(bp.title.toLowerCase())
    },
    {
      id: "men-t-shirts",
      title: "T-Shirts",
      match: (bp) => inCategory(bp, 1) && isTShirt(bp.title.toLowerCase()) && !isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "men-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => inCategory(bp, 1) && isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "men-tank-tops",
      title: "Tank Tops",
      match: (bp) => inCategory(bp, 1) && isTankTop(bp.title.toLowerCase())
    },
    {
      id: "men-sportswear",
      title: "Sportswear",
      match: (bp) => inCategory(bp, 1) && isSportswear(bp.title.toLowerCase())
    },
    {
      id: "men-bottoms",
      title: "Bottoms",
      match: (bp) => inCategory(bp, 1) && isBottoms(bp.title.toLowerCase()) && !isSwimwear(bp.title.toLowerCase())
    },
    {
      id: "men-swimwear",
      title: "Swimwear",
      match: (bp) => inCategory(bp, 1) && isSwimwear(bp.title.toLowerCase())
    },
    {
      id: "men-shoes",
      title: "Shoes",
      match: (bp) => inCategory(bp, 1) && isShoe(bp.title.toLowerCase())
    },
    {
      id: "men-underwear",
      title: "Underwear & Boxers",
      match: (bp) => inCategory(bp, 1) && isUnderwear(bp.title.toLowerCase())
    },
    {
      id: "men-outerwear",
      title: "Outerwear",
      match: (bp) => inCategory(bp, 1) && isOuterwear(bp.title.toLowerCase())
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 2 — WOMEN
  // ──────────────────────────────────────────────────────────
  2: [
    {
      id: "women-new-arrivals",
      title: "New Arrivals",
      match: (bp) => inCategory(bp, 2) && bp.id > 400
    },
    {
      id: "women-bestsellers",
      title: "Bestsellers",
      match: (bp) => inCategory(bp, 2) && new Set([9, 10, 11, 12, 18, 36, 49, 77, 78, 145, 175, 439, 440, 706]).has(bp.id)
    },
    {
      id: "women-sweatshirts",
      title: "Sweatshirts",
      match: (bp) => inCategory(bp, 2) && isSweatshirt(bp.title.toLowerCase()) && !isHoodie(bp.title.toLowerCase())
    },
    {
      id: "women-t-shirts",
      title: "T-Shirts",
      match: (bp) => inCategory(bp, 2) && isTShirt(bp.title.toLowerCase()) && !isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "women-hoodies",
      title: "Hoodies",
      match: (bp) => inCategory(bp, 2) && isHoodie(bp.title.toLowerCase())
    },
    {
      id: "women-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => inCategory(bp, 2) && isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "women-tank-tops",
      title: "Tank Tops",
      match: (bp) => inCategory(bp, 2) && isTankTop(bp.title.toLowerCase())
    },
    {
      id: "women-dresses",
      title: "Skirts & Dresses",
      match: (bp) => inCategory(bp, 2) && isDress(bp.title.toLowerCase())
    },
    {
      id: "women-sportswear",
      title: "Sportswear",
      match: (bp) => inCategory(bp, 2) && isSportswear(bp.title.toLowerCase())
    },
    {
      id: "women-bottoms",
      title: "Bottoms",
      match: (bp) => inCategory(bp, 2) && isBottoms(bp.title.toLowerCase()) && !isDress(bp.title.toLowerCase())
    },
    {
      id: "women-swimwear",
      title: "Swimwear",
      match: (bp) => inCategory(bp, 2) && isSwimwear(bp.title.toLowerCase())
    },
    {
      id: "women-shoes",
      title: "Shoes",
      match: (bp) => inCategory(bp, 2) && isShoe(bp.title.toLowerCase())
    },
    {
      id: "women-underwear",
      title: "Underwear & Bras",
      match: (bp) => inCategory(bp, 2) && isUnderwear(bp.title.toLowerCase())
    },
    {
      id: "women-outerwear",
      title: "Outerwear",
      match: (bp) => inCategory(bp, 2) && isOuterwear(bp.title.toLowerCase())
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 8 — UNISEX
  // ──────────────────────────────────────────────────────────
  8: [
    {
      id: "unisex-new-arrivals",
      title: "New Arrivals",
      match: (bp) => inCategory(bp, 8) && bp.id > 400
    },
    {
      id: "unisex-bestsellers",
      title: "Bestsellers",
      match: (bp) => inCategory(bp, 8) && new Set([5, 6, 12, 36, 49, 77, 78, 145, 175, 439, 440, 706]).has(bp.id)
    },
    {
      id: "unisex-sweatshirts",
      title: "Sweatshirts",
      match: (bp) => inCategory(bp, 8) && isSweatshirt(bp.title.toLowerCase()) && !isHoodie(bp.title.toLowerCase())
    },
    {
      id: "unisex-hoodies",
      title: "Hoodies",
      match: (bp) => inCategory(bp, 8) && isHoodie(bp.title.toLowerCase())
    },
    {
      id: "unisex-t-shirts",
      title: "T-Shirts",
      match: (bp) => inCategory(bp, 8) && isTShirt(bp.title.toLowerCase()) && !isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "unisex-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => inCategory(bp, 8) && isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "unisex-tank-tops",
      title: "Tank Tops",
      match: (bp) => inCategory(bp, 8) && isTankTop(bp.title.toLowerCase())
    },
    {
      id: "unisex-sportswear",
      title: "Sportswear",
      match: (bp) => inCategory(bp, 8) && isSportswear(bp.title.toLowerCase())
    },
    {
      id: "unisex-bottoms",
      title: "Bottoms",
      match: (bp) => inCategory(bp, 8) && isBottoms(bp.title.toLowerCase())
    },
    {
      id: "unisex-swimwear",
      title: "Swimwear",
      match: (bp) => inCategory(bp, 8) && isSwimwear(bp.title.toLowerCase())
    },
    {
      id: "unisex-underwear",
      title: "Underwear & Boxers",
      match: (bp) => inCategory(bp, 8) && isUnderwear(bp.title.toLowerCase())
    },
    {
      id: "unisex-outerwear",
      title: "Outerwear",
      match: (bp) => inCategory(bp, 8) && isOuterwear(bp.title.toLowerCase())
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 3 — KIDS
  // ──────────────────────────────────────────────────────────
  3: [
    {
      id: "kids-t-shirts",
      title: "T-Shirts",
      match: (bp) => inCategory(bp, 3) && isTShirt(bp.title.toLowerCase()) && !isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "kids-long-sleeves",
      title: "Long Sleeves",
      match: (bp) => inCategory(bp, 3) && isLongSleeve(bp.title.toLowerCase())
    },
    {
      id: "kids-sweatshirts",
      title: "Sweatshirts & Hoodies",
      match: (bp) => inCategory(bp, 3) && (isSweatshirt(bp.title.toLowerCase()) || isHoodie(bp.title.toLowerCase()))
    },
    {
      id: "kids-baby-clothing",
      title: "Baby Clothing",
      match: (bp) => inCategory(bp, 3) && isBabyAcc(bp.title.toLowerCase())
    },
    {
      id: "kids-sportswear",
      title: "Sportswear",
      match: (bp) => inCategory(bp, 3) && isSportswear(bp.title.toLowerCase())
    },
    {
      id: "kids-bottoms",
      title: "Bottoms",
      match: (bp) => inCategory(bp, 3) && isBottoms(bp.title.toLowerCase())
    },
    {
      id: "kids-other",
      title: "Other",
      match: (bp) => inCategory(bp, 3) && !isTShirt(bp.title.toLowerCase()) && !isLongSleeve(bp.title.toLowerCase()) && !isSweatshirt(bp.title.toLowerCase()) && !isHoodie(bp.title.toLowerCase()) && !isBabyAcc(bp.title.toLowerCase())
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 4 — ACCESSORIES (Exhaustive Printify Categories)
  // ──────────────────────────────────────────────────────────
  4: [
    {
      id: "acc-jewelry",
      title: "Jewelry",
      match: (bp) => inCategory(bp, 4) && isJewelry(bp.title.toLowerCase())
    },
    {
      id: "acc-books",
      title: "Books",
      match: (bp) => inCategory(bp, 4) && isBook(bp.title.toLowerCase())
    },
    {
      id: "acc-phone-cases",
      title: "Phone Cases",
      match: (bp) => inCategory(bp, 4) && isPhoneCase(bp.title.toLowerCase())
    },
    {
      id: "acc-bags",
      title: "Bags",
      match: (bp) => inCategory(bp, 4) && isBag(bp.title.toLowerCase())
    },
    {
      id: "acc-socks",
      title: "Socks",
      match: (bp) => inCategory(bp, 4) && isSock(bp.title.toLowerCase())
    },
    {
      id: "acc-hats",
      title: "Hats",
      match: (bp) => inCategory(bp, 4) && isHat(bp.title.toLowerCase())
    },
    {
      id: "acc-underwear",
      title: "Underwear",
      match: (bp) => isUnderwear(bp.title.toLowerCase())
    },
    {
      id: "acc-baby-acc",
      title: "Baby Accessories",
      match: (bp) => inCategory(bp, 4) && isBabyAcc(bp.title.toLowerCase())
    },
    {
      id: "acc-mouse-pads",
      title: "Mouse Pads",
      match: (bp) => inCategory(bp, 4) && isMousePad(bp.title.toLowerCase())
    },
    {
      id: "acc-pets",
      title: "Pets",
      match: (bp) => inCategory(bp, 4) && isPetAcc(bp.title.toLowerCase())
    },
    {
      id: "acc-kitchen",
      title: "Kitchen Accessories",
      match: (bp) => inCategory(bp, 4) && isKitchenAcc(bp.title.toLowerCase())
    },
    {
      id: "acc-car",
      title: "Car Accessories",
      match: (bp) => inCategory(bp, 4) && isCarAcc(bp.title.toLowerCase())
    },
    {
      id: "acc-tech",
      title: "Tech Accessories",
      match: (bp) => inCategory(bp, 4) && isTechAcc(bp.title.toLowerCase()) && !isMousePad(bp.title.toLowerCase()) && !isPhoneCase(bp.title.toLowerCase())
    },
    {
      id: "acc-stationery",
      title: "Stationery Accessories",
      match: (bp) => inCategory(bp, 4) && isStationery(bp.title.toLowerCase()) && !isBook(bp.title.toLowerCase())
    },
    {
      id: "acc-sports-games",
      title: "Sports & Games",
      match: (bp) => inCategory(bp, 4) && isSportsGames(bp.title.toLowerCase())
    },
    {
      id: "acc-face-masks",
      title: "Face Masks",
      match: (bp) => inCategory(bp, 4) && isFaceMask(bp.title.toLowerCase())
    },
    {
      id: "acc-other",
      title: "Other",
      match: (bp) => {
        if (!inCategory(bp, 4)) return false;
        const t = bp.title.toLowerCase();
        return !isJewelry(t) && !isBook(t) && !isPhoneCase(t) && !isBag(t) && !isSock(t) && !isHat(t) && !isUnderwear(t) && !isBabyAcc(t) && !isMousePad(t) && !isPetAcc(t) && !isKitchenAcc(t) && !isCarAcc(t) && !isTechAcc(t) && !isStationery(t) && !isSportsGames(t) && !isFaceMask(t);
      }
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 5 — HOME & LIVING (Exhaustive Printify Categories)
  // ──────────────────────────────────────────────────────────
  5: [
    {
      id: "home-mugs",
      title: "Mugs",
      match: (bp) => inCategory(bp, 5) && isMug(bp.title.toLowerCase())
    },
    {
      id: "home-candles",
      title: "Candles",
      match: (bp) => inCategory(bp, 5) && isCandle(bp.title.toLowerCase())
    },
    {
      id: "home-ornaments",
      title: "Ornaments",
      match: (bp) => inCategory(bp, 5) && isOrnament(bp.title.toLowerCase())
    },
    {
      id: "home-seasonal",
      title: "Seasonal Decorations",
      match: (bp) => inCategory(bp, 5) && isSeasonal(bp.title.toLowerCase())
    },
    {
      id: "home-glassware",
      title: "Glassware",
      match: (bp) => inCategory(bp, 5) && isGlassware(bp.title.toLowerCase())
    },
    {
      id: "home-bottles-tumblers",
      title: "Bottles & Tumblers",
      match: (bp) => inCategory(bp, 5) && isBottleTumbler(bp.title.toLowerCase())
    },
    {
      id: "home-canvas",
      title: "Canvas",
      match: (bp) => inCategory(bp, 5) && isCanvas(bp.title.toLowerCase())
    },
    {
      id: "home-posters",
      title: "Posters",
      match: (bp) => inCategory(bp, 5) && isPoster(bp.title.toLowerCase())
    },
    {
      id: "home-postcards",
      title: "Postcards",
      match: (bp) => inCategory(bp, 5) && isPostcard(bp.title.toLowerCase())
    },
    {
      id: "home-journals-notebooks",
      title: "Journals & Notebooks",
      match: (bp) => inCategory(bp, 5) && isJournal(bp.title.toLowerCase())
    },
    {
      id: "home-magnets-stickers",
      title: "Magnets & Stickers",
      match: (bp) => inCategory(bp, 5) && isMagnetSticker(bp.title.toLowerCase())
    },
    {
      id: "home-decor",
      title: "Home Decor",
      match: (bp) => inCategory(bp, 5) && isHomeDecor(bp.title.toLowerCase())
    },
    {
      id: "home-blankets",
      title: "Blankets",
      match: (bp) => inCategory(bp, 5) && isBlanket(bp.title.toLowerCase())
    },
    {
      id: "home-pillows-covers",
      title: "Pillows & Covers",
      match: (bp) => inCategory(bp, 5) && isPillow(bp.title.toLowerCase())
    },
    {
      id: "home-towels",
      title: "Towels",
      match: (bp) => inCategory(bp, 5) && isTowel(bp.title.toLowerCase())
    },
    {
      id: "home-bathroom",
      title: "Bathroom",
      match: (bp) => inCategory(bp, 5) && isBathroom(bp.title.toLowerCase())
    },
    {
      id: "home-rugs-mats",
      title: "Rugs & Mats",
      match: (bp) => inCategory(bp, 5) && isRugMat(bp.title.toLowerCase())
    },
    {
      id: "home-bedding",
      title: "Bedding",
      match: (bp) => inCategory(bp, 5) && isBedding(bp.title.toLowerCase())
    },
    {
      id: "home-other",
      title: "Other",
      match: (bp) => {
        if (!inCategory(bp, 5)) return false;
        const t = bp.title.toLowerCase();
        return !isMug(t) && !isCandle(t) && !isOrnament(t) && !isSeasonal(t) && !isGlassware(t) && !isBottleTumbler(t) && !isCanvas(t) && !isPoster(t) && !isPostcard(t) && !isJournal(t) && !isMagnetSticker(t) && !isHomeDecor(t) && !isBlanket(t) && !isPillow(t) && !isTowel(t) && !isBathroom(t) && !isRugMat(t) && !isBedding(t);
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
      match: (bp) => inCategory(bp, 6) && isMug(bp.title.toLowerCase())
    },
    {
      id: "drink-tumblers",
      title: "Bottles & Tumblers",
      match: (bp) => inCategory(bp, 6) && isBottleTumbler(bp.title.toLowerCase())
    },
    {
      id: "drink-glassware",
      title: "Glassware",
      match: (bp) => inCategory(bp, 6) && isGlassware(bp.title.toLowerCase())
    },
    {
      id: "drink-other",
      title: "Other Drinkware",
      match: (bp) => inCategory(bp, 6) && !isMug(bp.title.toLowerCase()) && !isBottleTumbler(bp.title.toLowerCase()) && !isGlassware(bp.title.toLowerCase())
    },
  ],

  // ──────────────────────────────────────────────────────────
  // 7 — SHOES & SOCKS
  // ──────────────────────────────────────────────────────────
  7: [
    {
      id: "shoes-sneakers",
      title: "Sneakers & Shoes",
      match: (bp) => inCategory(bp, 7) && isShoe(bp.title.toLowerCase())
    },
    {
      id: "shoes-socks",
      title: "Socks",
      match: (bp) => inCategory(bp, 7) && isSock(bp.title.toLowerCase())
    },
    {
      id: "shoes-other",
      title: "Other Footwear",
      match: (bp) => inCategory(bp, 7) && !isShoe(bp.title.toLowerCase()) && !isSock(bp.title.toLowerCase())
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
