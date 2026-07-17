export const CATEGORIES_MAP = [
  { id: 1, title: "Men" },
  { id: 2, title: "Women" },
  { id: 3, title: "Kids" },
  { id: 4, title: "Accessories" },
  { id: 5, title: "Home & Living" },
  { id: 6, title: "Mugs & Drinkware" },
  { id: 7, title: "Shoes & Socks" }
];

export const SUBCATEGORIES_CONFIG: Record<number, Array<{ id: string; title: string; match: (bp: any) => boolean }>> = {
  1: [ // Men
    { id: "men-new-arrivals", title: "New Arrivals", match: (bp) => bp.title.toLowerCase().includes("new") || bp.id % 5 === 0 },
    { id: "men-bestsellers", title: "Bestsellers", match: (bp) => bp.title.toLowerCase().includes("heavy") || bp.title.toLowerCase().includes("crew") || bp.id % 3 === 0 },
    { id: "men-sweatshirts", title: "Sweatshirts", match: (bp) => bp.title.toLowerCase().includes("sweatshirt") },
    { id: "men-hoodies", title: "Hoodies", match: (bp) => bp.title.toLowerCase().includes("hoodie") },
    { id: "men-t-shirts", title: "T-Shirts", match: (bp) => bp.title.toLowerCase().includes("tee") || bp.title.toLowerCase().includes("t-shirt") || bp.title.toLowerCase().includes("t shirt") },
    { id: "men-long-sleeves", title: "Long Sleeves", match: (bp) => bp.title.toLowerCase().includes("long sleeve") || bp.title.toLowerCase().includes("long-sleeve") },
    { id: "men-tank-tops", title: "Tank Tops", match: (bp) => bp.title.toLowerCase().includes("tank") },
    { id: "men-sportswear", title: "Sportswear", match: (bp) => bp.title.toLowerCase().includes("sport") || bp.title.toLowerCase().includes("active") || bp.title.toLowerCase().includes("jersey") || bp.title.toLowerCase().includes("athletic") },
    { id: "men-bottoms", title: "Bottoms", match: (bp) => bp.title.toLowerCase().includes("pant") || bp.title.toLowerCase().includes("jogger") || bp.title.toLowerCase().includes("shorts") || bp.title.toLowerCase().includes("sweatpants") },
    { id: "men-swimwear", title: "Swimwear", match: (bp) => bp.title.toLowerCase().includes("swim") || bp.title.toLowerCase().includes("bikini") || bp.title.toLowerCase().includes("trunk") },
    { id: "men-shoes", title: "Shoes", match: (bp) => bp.title.toLowerCase().includes("shoe") || bp.title.toLowerCase().includes("sneaker") || bp.title.toLowerCase().includes("boot") || bp.title.toLowerCase().includes("slipper") },
    { id: "men-outerwear", title: "Outerwear", match: (bp) => bp.title.toLowerCase().includes("jacket") || bp.title.toLowerCase().includes("coat") || bp.title.toLowerCase().includes("windbreaker") }
  ],
  2: [ // Women
    { id: "women-new-arrivals", title: "New Arrivals", match: (bp) => bp.title.toLowerCase().includes("new") || bp.id % 5 === 0 },
    { id: "women-bestsellers", title: "Bestsellers", match: (bp) => bp.title.toLowerCase().includes("favorite") || bp.title.toLowerCase().includes("flowy") || bp.id % 3 === 0 },
    { id: "women-t-shirts", title: "T-Shirts", match: (bp) => bp.title.toLowerCase().includes("tee") || bp.title.toLowerCase().includes("t-shirt") || bp.title.toLowerCase().includes("t shirt") },
    { id: "women-hoodies", title: "Hoodies", match: (bp) => bp.title.toLowerCase().includes("hoodie") },
    { id: "women-sweatshirts", title: "Sweatshirts", match: (bp) => bp.title.toLowerCase().includes("sweatshirt") },
    { id: "women-tank-tops", title: "Tank Tops", match: (bp) => bp.title.toLowerCase().includes("tank") },
    { id: "women-dresses", title: "Dresses", match: (bp) => bp.title.toLowerCase().includes("dress") || bp.title.toLowerCase().includes("skirt") },
    { id: "women-leggings", title: "Leggings", match: (bp) => bp.title.toLowerCase().includes("legging") || bp.title.toLowerCase().includes("tights") },
    { id: "women-bottoms", title: "Bottoms", match: (bp) => bp.title.toLowerCase().includes("pant") || bp.title.toLowerCase().includes("jogger") || bp.title.toLowerCase().includes("shorts") || bp.title.toLowerCase().includes("sweatpants") },
    { id: "women-swimwear", title: "Swimwear", match: (bp) => bp.title.toLowerCase().includes("swim") || bp.title.toLowerCase().includes("bikini") },
    { id: "women-shoes", title: "Shoes", match: (bp) => bp.title.toLowerCase().includes("shoe") || bp.title.toLowerCase().includes("sneaker") || bp.title.toLowerCase().includes("boot") || bp.title.toLowerCase().includes("slipper") },
    { id: "women-outerwear", title: "Outerwear", match: (bp) => bp.title.toLowerCase().includes("jacket") || bp.title.toLowerCase().includes("coat") || bp.title.toLowerCase().includes("windbreaker") }
  ],
  3: [ // Kids
    { id: "kids-t-shirts", title: "T-Shirts", match: (bp) => bp.title.toLowerCase().includes("tee") || bp.title.toLowerCase().includes("t-shirt") || bp.title.toLowerCase().includes("t shirt") },
    { id: "kids-hoodies", title: "Hoodies", match: (bp) => bp.title.toLowerCase().includes("hoodie") },
    { id: "kids-sweatshirts", title: "Sweatshirts", match: (bp) => bp.title.toLowerCase().includes("sweatshirt") },
    { id: "kids-bodysuits", title: "Bodysuits", match: (bp) => bp.title.toLowerCase().includes("bodysuit") || bp.title.toLowerCase().includes("creeper") || bp.title.toLowerCase().includes("baby") || bp.title.toLowerCase().includes("infant") },
    { id: "kids-accessories", title: "Accessories", match: (bp) => bp.title.toLowerCase().includes("bag") || bp.title.toLowerCase().includes("backpack") || bp.title.toLowerCase().includes("hat") || bp.title.toLowerCase().includes("beanie") || bp.title.toLowerCase().includes("bib") }
  ],
  4: [ // Accessories
    { id: "acc-bags", title: "Bags", match: (bp) => bp.title.toLowerCase().includes("bag") || bp.title.toLowerCase().includes("backpack") || bp.title.toLowerCase().includes("tote") || bp.title.toLowerCase().includes("pouch") || bp.title.toLowerCase().includes("wallet") || bp.title.toLowerCase().includes("purse") },
    { id: "acc-hats", title: "Hats", match: (bp) => bp.title.toLowerCase().includes("hat") || bp.title.toLowerCase().includes("cap") || bp.title.toLowerCase().includes("beanie") },
    { id: "acc-phone-cases", title: "Phone Cases", match: (bp) => bp.title.toLowerCase().includes("phone") || bp.title.toLowerCase().includes("case") },
    { id: "acc-stickers", title: "Stickers", match: (bp) => bp.title.toLowerCase().includes("sticker") || bp.title.toLowerCase().includes("decal") },
    { id: "acc-stationery", title: "Stationery", match: (bp) => bp.title.toLowerCase().includes("notebook") || bp.title.toLowerCase().includes("journal") || bp.title.toLowerCase().includes("pen") || bp.title.toLowerCase().includes("pencil") || bp.title.toLowerCase().includes("card") },
    { id: "acc-tech", title: "Tech Accessories", match: (bp) => bp.title.toLowerCase().includes("charger") || bp.title.toLowerCase().includes("mouse pad") || bp.title.toLowerCase().includes("mousepad") || bp.title.toLowerCase().includes("sleeve") || bp.title.toLowerCase().includes("skin") || bp.title.toLowerCase().includes("band") }
  ],
  5: [ // Home & Living
    { id: "home-posters", title: "Posters", match: (bp) => bp.title.toLowerCase().includes("poster") || bp.title.toLowerCase().includes("print") },
    { id: "home-canvas", title: "Canvas", match: (bp) => bp.title.toLowerCase().includes("canvas") || bp.title.toLowerCase().includes("wall art") },
    { id: "home-blankets", title: "Blankets", match: (bp) => bp.title.toLowerCase().includes("blanket") || bp.title.toLowerCase().includes("throw") },
    { id: "home-pillows", title: "Pillows", match: (bp) => bp.title.toLowerCase().includes("pillow") },
    { id: "home-towels", title: "Towels", match: (bp) => bp.title.toLowerCase().includes("towel") },
    { id: "home-mugs", title: "Mugs", match: (bp) => bp.title.toLowerCase().includes("mug") },
    { id: "home-drinkware", title: "Drinkware", match: (bp) => bp.title.toLowerCase().includes("bottle") || bp.title.toLowerCase().includes("tumbler") || bp.title.toLowerCase().includes("cup") || bp.title.toLowerCase().includes("glass") || bp.title.toLowerCase().includes("flask") || bp.title.toLowerCase().includes("pint") },
    { id: "home-wall-art", title: "Wall Art", match: (bp) => bp.title.toLowerCase().includes("poster") || bp.title.toLowerCase().includes("canvas") || bp.title.toLowerCase().includes("tapestry") || bp.title.toLowerCase().includes("frame") || bp.title.toLowerCase().includes("clock") }
  ],
  6: [ // Mugs & Drinkware
    { id: "drink-mugs", title: "Mugs", match: (bp) => bp.title.toLowerCase().includes("mug") },
    { id: "drink-tumblers", title: "Tumblers & Bottles", match: (bp) => bp.title.toLowerCase().includes("tumbler") || bp.title.toLowerCase().includes("bottle") || bp.title.toLowerCase().includes("cup") || bp.title.toLowerCase().includes("glass") }
  ],
  7: [ // Shoes & Socks
    { id: "shoes-sneakers", title: "Sneakers & Shoes", match: (bp) => bp.title.toLowerCase().includes("shoe") || bp.title.toLowerCase().includes("sneaker") || bp.title.toLowerCase().includes("boot") },
    { id: "shoes-socks", title: "Socks", match: (bp) => bp.title.toLowerCase().includes("sock") || bp.title.toLowerCase().includes("socks") }
  ]
};

/** Get a flat list of all unique category names (main categories + subcategories) */
export function getFlatCategoryNames(): string[] {
  const categories = new Set<string>();

  // Add main categories
  CATEGORIES_MAP.forEach(cat => categories.add(cat.title));

  // Add subcategories
  Object.values(SUBCATEGORIES_CONFIG).forEach(subList => {
    subList.forEach(sub => {
      // Exclude generic non-category descriptors if needed, but allow everything listed
      if (sub.title !== "New Arrivals" && sub.title !== "Bestsellers") {
        categories.add(sub.title);
      }
    });
  });

  return Array.from(categories);
}
