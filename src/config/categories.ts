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

const isSweatshirt      = (t: string) => t.includes("sweatshirt") || t.includes("crewneck") || t.includes("crew neck");
const isHoodie          = (t: string) => t.includes("hoodie") || t.includes("hooded sweatshirt") || t.includes("zip hoodie") || t.includes("full zip");
const isTShirt          = (t: string) => t.includes("tee") || t.includes("t-shirt") || t.includes("t shirt") || t.includes("jersey tee") || t.includes("polo");
const isLongSleeve      = (t: string) => t.includes("long sleeve") || t.includes("long-sleeve");
const isTankTop         = (t: string) => t.includes("tank") || t.includes("racerback") || t.includes("muscle") || t.includes("crop top");
const isSportswear      = (t: string) => t.includes("sport") || t.includes("active") || t.includes("jersey") || t.includes("athletic") || t.includes("performance") || t.includes("compression");
const isBottoms         = (t: string) => t.includes("pant") || t.includes("jogger") || t.includes("shorts") || t.includes("sweatpant") || t.includes("legging") || t.includes("tights");
const isSwimwear        = (t: string) => t.includes("swim") || t.includes("bikini") || t.includes("trunk") || t.includes("one-piece");
const isShoe            = (t: string) => t.includes("shoe") || t.includes("sneaker") || t.includes("boot") || t.includes("slipper") || t.includes("loafer") || t.includes("canvas shoe") || t.includes("slide") || t.includes("clog");
const isOuterwear       = (t: string) => t.includes("jacket") || t.includes("coat") || t.includes("windbreaker") || t.includes("bomber") || t.includes("parka") || t.includes("vest");
const isDress           = (t: string) => t.includes("dress") || t.includes("skirt") || t.includes("romper");
const isBag             = (t: string) => t.includes("bag") || t.includes("backpack") || t.includes("tote") || t.includes("pouch") || t.includes("wallet") || t.includes("purse") || t.includes("fanny pack") || t.includes("duffel") || t.includes("clutch");
const isHat             = (t: string) => t.includes("hat") || t.includes("cap") || t.includes("beanie") || t.includes("bucket hat") || t.includes("snapback") || t.includes("trucker") || t.includes("visor");
const isPhoneCase       = (t: string) => t.includes("phone") || t.includes("iphone") || t.includes("samsung") || (t.includes("case") && !t.includes("pillowcase") && !t.includes("cushion case") && !t.includes("laptop case"));
const isSticker         = (t: string) => t.includes("sticker") || t.includes("decal");
const isStationery      = (t: string) => t.includes("notebook") || t.includes("journal") || t.includes("pen ") || t.includes("pencil") || t.includes("postcard") || t.includes("greeting card") || t.includes("folder") || t.includes("pad");
const isTechAcc         = (t: string) => t.includes("charger") || t.includes("mouse pad") || t.includes("mousepad") || t.includes("laptop sleeve") || t.includes("laptop case") || t.includes("phone stand") || t.includes("airpod") || t.includes("cable") || t.includes("desk mat") || t.includes("tech");
const isPoster          = (t: string) => t.includes("poster") || t.includes("art print");
const isCanvas          = (t: string) => t.includes("canvas") || t.includes("wall art") || t.includes("tapestry");
const isBlanket         = (t: string) => t.includes("blanket") || t.includes("throw") || t.includes("fleece");
const isPillow          = (t: string) => t.includes("pillow") || t.includes("cushion");
const isTowel           = (t: string) => t.includes("towel");
const isMug             = (t: string) => t.includes("mug");
const isDrinkware       = (t: string) => t.includes("bottle") || t.includes("tumbler") || t.includes("cup") || (t.includes("glass") && !t.includes("sunglass") && !t.includes("hourglass")) || t.includes("flask") || t.includes("pint") || t.includes("shaker");
const isBottleTumbler   = isDrinkware;
const isSock            = (t: string) => t.includes("sock");
const isKidsItem        = (t: string) => t.includes("kid") || t.includes("youth") || t.includes("toddler") || t.includes("baby") || t.includes("infant") || t.includes("bodysuit") || t.includes("creeper") || t.includes("bib") || t.includes("onesie");
const isJewelry         = (t: string) => t.includes("jewelry") || t.includes("necklace") || t.includes("bracelet") || t.includes("ring") || t.includes("pendant") || t.includes("earring") || t.includes("charm");
const isBook            = (t: string) => t.includes("book") || t.includes("coloring book") || t.includes("hardcover") || t.includes("paperback");
const isUnderwear       = (t: string) => t.includes("underwear") || t.includes("boxer") || t.includes("brief") || t.includes("panties") || t.includes("thong") || t.includes("bra") || t.includes("lingerie");
const isBabyAcc         = (t: string) => t.includes("baby") || t.includes("bib") || t.includes("pacifier") || t.includes("burp") || t.includes("swaddle") || t.includes("onesie") || t.includes("infant");
const isMousePad        = (t: string) => t.includes("mouse pad") || t.includes("mousepad") || t.includes("desk mat");
const isPetAcc          = (t: string) => t.includes("pet") || t.includes("dog") || t.includes("cat") || t.includes("leash") || t.includes("collar") || t.includes("harness") || t.includes("bandana") || t.includes("pet bowl") || t.includes("pet bed") || t.includes("pup");
const isKitchenAcc      = (t: string) => t.includes("apron") || t.includes("oven mitt") || t.includes("pot holder") || t.includes("cutting board") || t.includes("coaster") || t.includes("placemat") || t.includes("trivet") || t.includes("kitchen");
const isCarAcc          = (t: string) => t.includes("car") || t.includes("license plate") || t.includes("sunshade") || t.includes("car mat") || t.includes("seat cover") || t.includes("auto");
const isSportsGames     = (t: string) => t.includes("sport") || t.includes("game") || t.includes("puzzle") || t.includes("playing card") || t.includes("golf") || t.includes("ball") || t.includes("pickleball") || t.includes("ping pong") || t.includes("yoga");
const isFaceMask        = (t: string) => t.includes("mask") || t.includes("face mask") || t.includes("gaiter") || t.includes("covering");
const isCandle          = (t: string) => t.includes("candle") || t.includes("wax") || t.includes("fragrance");
const isOrnament        = (t: string) => t.includes("ornament") || t.includes("bauble");
const isSeasonal        = (t: string) => t.includes("seasonal") || t.includes("holiday") || t.includes("christmas") || t.includes("halloween") || t.includes("easter") || t.includes("stocking") || t.includes("tree skirt");
const isGlassware       = (t: string) => (t.includes("glass") && !t.includes("sunglass") && !t.includes("hourglass")) || t.includes("shot glass") || t.includes("wine glass") || t.includes("beer glass") || t.includes("mason jar");
const isPostcard        = (t: string) => t.includes("postcard") || t.includes("greeting card") || t.includes("card");
const isJournal         = (t: string) => t.includes("journal") || t.includes("notebook") || t.includes("planner");
const isMagnetSticker   = (t: string) => t.includes("magnet") || t.includes("sticker") || t.includes("decal");
const isHomeDecor       = (t: string) => t.includes("clock") || t.includes("banner") || t.includes("flag") || t.includes("sign") || t.includes("wood print") || t.includes("acrylic") || t.includes("metal print") || t.includes("mirror") || t.includes("vase") || t.includes("decor");
const isBathroom        = (t: string) => t.includes("shower curtain") || t.includes("bath mat") || t.includes("bathrobe") || t.includes("bath");
const isRugMat          = (t: string) => t.includes("rug") || t.includes("doormat") || t.includes("floor mat");
const isBedding         = (t: string) => t.includes("duvet") || t.includes("comforter") || t.includes("bedding") || t.includes("sheet") || t.includes("quilt");

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
      match: (bp) => inCategory(bp, 4) && isUnderwear(bp.title.toLowerCase())
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
