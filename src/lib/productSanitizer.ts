/**
 * Product White-Labeling & Sanitization Engine
 * 
 * Ensures all products sourced from Printify or other print-on-demand suppliers
 * appear as proprietary Loka Media retail products.
 * 
 * Automatically strips:
 * - Manufacturer brand names (Gildan, Bella+Canvas, Next Level, Champion, etc.)
 * - Wholesale model numbers and blank SKU codes (5000, 3001, 18500, etc.)
 * - POD platform mentions (Printify, Printful, etc.)
 * - Trademarks (™, ®, ©)
 * - Factory / manufacturing jargon ((AOP), (DTG), (210gsm), tear-away labels)
 * - Converts wholesale names into consumer-friendly retail product names.
 */

// Known manufacturer brands and wholesale blank suppliers
const FORBIDDEN_BRAND_PATTERNS = [
  /\bPrintify\s+Choice\b/gi,
  /\bPrintify\b/gi,
  /\bPrintful\b/gi,
  /\bTeelaunch\b/gi,
  /\bGelato\b/gi,
  /\bGooten\b/gi,
  /\bSpoke\s+Custom\b/gi,
  /\bMonster\s+Digital\b/gi,
  /\bSwiftpod\b/gi,
  /\bAwkward\s+Styles\b/gi,

  // Major apparel manufacturers
  /\bGildan\s*(5000|18500|18000|2000|2400|64000[LB]?|G\d+)?\b/gi,
  /\bBella\s*(\+|\&|\band\b)?\s*Canvas\s*(3001(CVC)?|3413|8803|6004|BC\d+)?\b/gi,
  /\bBella\s+(3001|8803|6004)\b/gi,
  /\bNext\s+Level\s*(Apparel)?\s*(3600|3900|1533|NL\d+)?\b/gi,
  /\bComfort\s+Colors\s*(1717|1566|\d+)?\b/gi,
  /\bChampion\b/gi,
  /\bStanley\s*\/?\s*Stella\s*(Serena|Isla|Ida)?\b/gi,
  /\bAmerican\s+Apparel\s*(2001|\d+)?\b/gi,
  /\bFruit\s+of\s+the\s+Loom\b/gi,
  /\bHanes\s*(5280|P170|F170|\d+)?\b/gi,
  /\bJerzees\s*(562M|29M|\d+)?\b/gi,
  /\bRabbit\s+Skins\s*(\d+)?\b/gi,
  /\bLAT\s*(Apparel)?\s*(\d+)?\b/gi,
  /\bAnvil\s*(980|\d+)?\b/gi,
  /\bDistrict\s*(V\.?I\.?T\.?)?\s*(DT\d+)?\b/gi,
  /\bSport-Tek\s*(PosiCharge|Competitor)?\s*(\d+)?\b/gi,
  /\bFlexfit\s*(110|6606|\d+)?\b/gi,
  /\bYupoong\s*(\d+)?\b/gi,
  /\bPort\s*&\s*Company\b/gi,
  /\bPort\s+and\s+Company\b/gi,
  /\bDelta\s*(\d+)?\b/gi,
  /\bAS\s+Colour\b/gi,
  /\bLane\s+Seven\b/gi,
  /\bIndependent\s+Trading\s+Co(\.?)?\b/gi,
  /\bAWDis\b/gi,
  /\bJust\s+Hoods\b/gi,
  /\bOtto\s+Cap\b/gi,
  /\bBig\s+Accessories\b/gi,
  /\bShaka\s+Wear\b/gi,
  /\bAlstyle\b/gi,
  /\bBayside\b/gi,
  /\bEconscious\b/gi,
  /\bBadger\s+Sport\b/gi,
  /\bAugusta\s+Sportswear\b/gi,
  /\bValucap\b/gi,
  /\bSpigen\b/gi,
  /\bCase-Mate\b/gi,
  /\bOtterBox\b/gi,
  /\bAdidas\b/gi,
  /\bUnder\s+Armour\b/gi,
  /\bColumbia\b/gi,
  /\bNike\b/gi,
  /\bPuma\b/gi,
  /\bCarhartt\b/gi,
  /\bOakley\b/gi,
];

// Standalone blank model numbers and codes
const STANDALONE_MODEL_CODES = [
  /\b(3001CVC|3001|3413|8803|6004|5000|5001|5002|5050|5100|18500|18000|2000|2400|64000L|64000B|64000|3600|3900|1533|1717|1566|DT6000|DT104|6606|110)\b/g,
];

// Direct phrase replacements for wholesale terminology
const RETAIL_NAME_REPLACEMENTS: [RegExp, string][] = [
  // AS Colour Staple & blank lines (Printify #440 etc.)
  [/\b(Adult\s+)?Staple\s+(Tee|T-shirt)\b/gi, 'Everyday Cotton Crewneck T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Faded\s+(Tee|T-shirt)\b/gi, 'Vintage Faded Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Stone\s+Wash\s+(Tee|T-shirt)\b/gi, 'Stone Washed Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Ringer\s+(Tee|T-shirt)\b/gi, 'Retro Contrast Ringer T-Shirt'],
  [/\b(Adult\s+)?Staple\s+V[- ]?Neck\s+(Tee|T-shirt)\b/gi, 'Classic V-Neck Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Active\s+Blend\s+(Tee|T-shirt)\b/gi, 'Active Performance Athletic T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Active\s+L[- ]?S\s+(Tee|T-shirt)\b/gi, 'Active Performance Long Sleeve T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Active\s+(Tee|T-shirt)\b/gi, 'Active Performance Athletic T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Camo\s+(Tee|T-shirt)\b/gi, 'Camo Pattern Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Curve\s+(Tee|T-shirt)\b/gi, 'Curved Hem Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Curve\s+Tank\b/gi, 'Curved Hem Cotton Tank Top'],
  [/\b(Adult\s+)?Staple\s+Heather\s+(Tee|T-shirt)\b/gi, 'Heathered Cotton Crewneck T-Shirt'],
  [/\b(Adult\s+)?Staple\s+L[- ]?S\s+(Tee|T-shirt)\b/gi, 'Everyday Long Sleeve Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Minus\s+Tee.*$/gi, 'Cropped Fit Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Plus\s+Tee.*$/gi, 'Extended Length Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Organic\s+L[- ]?S\s+(Tee|T-shirt)\b/gi, 'Organic Long Sleeve Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Stripe\s+(Tee|T-shirt)\b/gi, 'Striped Everyday Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Tear\s+Out\s+(Tee|T-shirt)\b/gi, 'Everyday Soft Cotton T-Shirt'],
  [/\b(Adult\s+)?Staple\s+Tank\b/gi, 'Everyday Cotton Tank Top'],
  [/\bOrganic\s+Staple\s+(Tee|T-shirt)\b/gi, 'Organic Everyday Cotton T-Shirt'],
  [/\bStaple\s+(Tee|T-shirt)\b/gi, 'Everyday Cotton Crewneck T-Shirt'],
  [/\bStaple\b/gi, 'Everyday Essential'],

  // Raw Printify specific wholesale lines
  [/\bClassic\s+Canvas\b/gi, 'Studio Wrapped Fine Art Canvas'],
  [/\bClassic\s+Stretched\s+Canvas\b/gi, 'Gallery Wrapped Fine Art Canvas'],
  [/\bClassic\s+Dad\s+(Cap|Hat)\b/gi, 'Vintage Washed Low-Profile Dad Cap'],
  [/\bClassic\s+Cuffed\s+Beanie\b/gi, 'Cozy Ribbed Knit Cuffed Beanie'],
  [/\bClassic\s+Rope\s+Cap\b/gi, 'Retro Nautical Rope Snapback Cap'],
  [/\bClassic\s+Long\s+Sleeve\s+Rugby\s+Polo\b/gi, 'Heritage Heavyweight Rugby Polo'],
  [/\bClassic\s+Tank\b/gi, 'Everyday Essential Cotton Tank'],
  [/\bClassic\s+L[- ]?S\s+Tee\b/gi, 'Everyday Essential Long Sleeve T-Shirt'],
  [/\bClassic\s+Plus\s+Tee.*$/gi, 'Extended Length Essential Cotton T-Shirt'],
  [/\bClassic\s+Minus\s+Tee.*$/gi, 'Cropped Fit Essential Cotton T-Shirt'],
  [/\bClassic\s+Oversized\s+Tee\b/gi, 'Relaxed Oversized Heavyweight T-Shirt'],
  [/\bClassic\s+Pocket\s+L[- ]?S\s+Tee\b/gi, 'Everyday Pocket Long Sleeve T-Shirt'],
  [/\bClassic\s+Organic\s+Tee\b/gi, 'Organic Everyday Crewneck T-Shirt'],
  [/\bClassic\s+Pocket\s+Tee\b/gi, 'Everyday Pocket Crewneck T-Shirt'],
  [/\bTwo-Tone\s+Carrie\s+Tote\b/gi, 'Dual-Tone Canvas Shoulder Tote'],
  [/\bTwo-Tone\s+Coffee\s+Mug(s)?\b/gi, 'Two-Tone Ceramic Coffee Mug'],
  [/\bTwo-Tone\s+Accent\s+Mug\b/gi, 'Two-Tone Ceramic Accent Mug'],
  [/\bPremium\s+Sherpa\s+Blanket\b/gi, 'Ultra-Plush Sherpa Fleece Blanket'],
  [/\bPremium\s+Jersey\s+Infant\s+Blanket\b/gi, 'Baby Ultra-Soft Jersey Swaddle Blanket'],
  [/\bPremium\s+Blend\s+Ring\s+Spun\b/gi, 'Everyday Ultra-Soft Ring-Spun'],
  [/\bSignature\s+Heavy\s+Twill\s+Bib\s+Apron\b/gi, 'Master Chef Heavy Twill Bib Apron'],

  // Adult prefixes
  [/\bAdult\s+Santa\s+Barbara\s+Zip\s+Hoodie\b/gi, 'Signature Full-Zip Fleece Hoodie'],
  [/\bAdult\s+Crewneck\s+Sweatshirt\b/gi, 'Classic Fleece Crewneck Sweatshirt'],
  [/\bAdult\s+Apron\b/gi, 'Everyday Kitchen & Studio Apron'],
  [/\bUnisex\s+Adult\s+Quarter[- ]Zip\s+Sweatshirt\b/gi, 'Classic Quarter-Zip Fleece Sweatshirt'],

  // AS Colour blanks
  [/\bBarnard\s+Tank\b/gi, 'Classic Ribbed Cotton Tank Top'],
  [/\bMali\s+L[- ]?S\s+Tee\b/gi, 'Soft Long Sleeve Crewneck T-Shirt'],
  [/\bMali\s+Racerback\b/gi, 'Everyday Racerback Tank Top'],
  [/\bGeneral\s+L[- ]?S\s+Tee\b/gi, 'Heavyweight Workwear Long Sleeve T-Shirt'],
  [/\bBlock\s+L[- ]?S\s+Tee\b/gi, 'Relaxed Fit Long Sleeve T-Shirt'],
  [/\bBlock\s+Oversized\s+Tee\b/gi, 'Relaxed Oversized Cotton T-Shirt'],
  [/\bHeavy\s+Faded\s+Minus\s+Tee.*$/gi, 'Cropped Vintage Washed Heavyweight T-Shirt'],
  [/\bHeavy\s+Faded\s+Long\s+Sleeve\s+Tee\b/gi, 'Vintage Washed Heavyweight Long Sleeve T-Shirt'],
  [/\bHeavy\s+Faded\s+Tank\b/gi, 'Vintage Washed Heavyweight Tank Top'],
  [/\bHeavy\s+Faded\s+Crop\s+Tee\b/gi, 'Vintage Washed Cropped Cotton T-Shirt'],
  [/\bHeavy\s+Faded\s+L[- ]?S\s+Tee\b/gi, 'Vintage Washed Heavyweight Long Sleeve T-Shirt'],
  [/\bHeavy\s+Faded\s+(Tee|T-shirt)\b/gi, 'Vintage Washed Heavyweight Cotton T-Shirt'],
  [/\bFreestyler\s+Dry\s+Handfeel\s+Heavy\s+(Tee|T-shirt)\b/gi, 'Relaxed Heavyweight Textured Cotton T-Shirt'],
  [/\bFreestyler\s+Heavyweight\s+Long\s+Sleeve\s+(Tee|T-shirt)\b/gi, 'Relaxed Heavyweight Long Sleeve T-Shirt'],
  [/\bFreestyler\s+Heavyweight\s+(Tee|T-shirt)\b/gi, 'Relaxed Heavyweight Cotton T-Shirt'],

  // Stanley/Stella models
  [/\bStella\s+Ida\s+Full[- ]Zip\s+Hooded\s+Sweatshirt\b/gi, 'Classic Full-Zip Hooded Fleece Sweatshirt'],
  [/\bStella\s+Isla\s+V[- ]Neck\s+Tee\b/gi, 'Soft V-Neck Cotton T-Shirt'],
  [/\bStella\s+Serena\s+Scoop\s+Neck\s+Tee\b/gi, 'Scoop Neck Premium Cotton T-Shirt'],
  [/\bCreator\s+2\.0\s+Tee\b/gi, 'Premium Organic Cotton T-Shirt'],
  [/\bCruiser\s+Hoodie\b/gi, 'Classic Organic Fleece Pullover Hoodie'],

  // Adidas
  [/\bAdidas\s+Defender\s+\d*\s*Backpack\b/gi, 'Defender Multi-Pocket Sport Backpack'],
  [/\bAdidas\s+Fundamental\s+Alliance\s+Cap\b/gi, 'Classic Structured Athletic Cap'],
  [/\bAdidas\s+Fundamental\s+Dispatch\s+Trucker\s+Cap\b/gi, 'Classic Dispatch Mesh Trucker Cap'],
  [/\bAdidas\s+Quarter[- ]Zip\s+Pullover\b/gi, 'Performance Quarter-Zip Pullover'],
  [/\bAdidas\s+Unisex\s+Fleece\s+Crewneck\s+Sweatshirt\b/gi, 'Classic Fleece Crewneck Sweatshirt'],
  [/\bAdidas\s+Unisex\s+Fleece\s+Hoodie\b/gi, 'Classic Fleece Pullover Hoodie'],
  [/\bAdidas\s+Unisex\s+Performance\s+Polo\b/gi, 'Athletic Performance Pique Polo'],
  [/\bAdidas\b/gi, 'Athletic'],

  // Under Armour
  [/\bUnder\s+Armour\s+All\s+Sport\s+Backpack\b/gi, 'All-Sport Multi-Compartment Backpack'],
  [/\bUnder\s+Armour\s+Men\'s\s+Polo\s+Shirt\b/gi, "Men's Athletic Performance Polo Shirt"],
  [/\bUnder\s+Armour\s+Team\s+Blitzing\s+Cap\b/gi, 'Athletic Curved-Bill Structured Cap'],
  [/\bUnder\s+Armour\b/gi, 'Performance'],

  // Columbia
  [/\bColumbia\s+Fleece\s+Jacket\b/gi, 'All-Weather Full-Zip Fleece Jacket'],
  [/\bColumbia\b/gi, 'Outdoor'],

  // Port Authority & Sport-Tek
  [/\bPort\s+Authority\s+/gi, 'Executive '],
  [/\bPosiCharge\s+Active\s+Textured\s+Polo\b/gi, 'Athletic Textured Performance Polo'],
  [/\bPosiCharge\s+/gi, 'Athletic '],
  [/\bPosiCharge\b/gi, 'Athletic'],

  // Safety items (ANSI)
  [/\bANSI\s+\d+\s+Class\s+\d+\s+/gi, 'High-Visibility '],

  // Gildan trademark terms
  [/\bHeavy\s+Blend\s+(Hooded\s+Sweatshirt|Hoodie)\b/gi, 'Classic Heavyweight Pullover Hoodie'],
  [/\bHeavy\s+Blend\s+Full\s+Zip\s+(Hooded\s+Sweatshirt|Hoodie)\b/gi, 'Classic Full-Zip Fleece Hoodie'],
  [/\bHeavy\s+Blend\s+Crewneck\s+Sweatshirt\b/gi, 'Classic Crewneck Fleece Sweatshirt'],
  [/\bHeavy\s+Blend\s+Sweatshirt\b/gi, 'Classic Crewneck Fleece Sweatshirt'],
  [/\bHeavy\s+Blend\b/gi, 'Heavyweight Fleece'],
  [/\bHammer\s+T-shirt\b/gi, 'Heavyweight Cotton T-Shirt'],
  [/\bHeavy\s+Cotton\s+(Tee|T-Shirt)\b/gi, 'Classic Heavyweight Cotton T-Shirt'],
  [/\bUltra\s+Cotton\s+(Tee|T-Shirt)\b/gi, 'Ultra Cotton Premium T-Shirt'],
  [/\bSoftstyle\s+(Tee|T-Shirt)\b/gi, 'Soft-Spun Cotton T-Shirt'],
  [/\bSoftstyle\b/gi, 'Soft Cotton'],
  [/\bDryBlend\b/gi, 'Moisture-Wicking'],
  [/\bUltra\s+Heavy\s+Cotton\s+Box\s+Tee\b/gi, 'Ultra Heavyweight Boxy Cotton T-Shirt'],

  // Next level & Bella styles
  [/\bThe\s+Boyfriend\s+Tee\s+for\s+Women\b/gi, "Women's Relaxed Fit T-Shirt"],
  [/\bThe\s+Boyfriend\s+Tee\b/gi, "Relaxed Fit Cotton T-Shirt"],
  [/\bFavorite\s+Tee\b/gi, 'Fitted Cotton T-Shirt'],
  [/\bVery\s+Important\s+Tee\b/gi, 'Essential Crewneck T-Shirt'],
  [/\bIdeal\s+Racerback\s+Tank\b/gi, 'Classic Racerback Tank Top'],
  [/\bJersey\s+Short\s+Sleeve\s+Tee\b/gi, 'Premium Soft Cotton T-Shirt'],
  [/\bCotton\s+Crew\s+Tee\b/gi, 'Classic Cotton Crewneck T-Shirt'],

  // Brand-specific models
  [/\bBeefy-T\b/gi, 'Heavyweight Cotton T-Shirt'],
  [/\bNUBLEND\b/gi, 'Classic Soft-Fleece'],
  [/\bEcoSmart\b/gi, 'Eco-Friendly Fleece'],
  [/\bComfortWash\b/gi, 'Vintage Garment-Washed'],
  [/\bPowerblend\b/gi, 'Durable Fleece'],
  [/\bReverse\s+Weave\b/gi, 'Heritage Heavyweight Fleece'],
  [/\bDouble\s+Dry\b/gi, 'Moisture-Wicking Performance'],

  // Common wholesale terms
  [/\bCore\s+Cotton\s+(Tee|T-Shirt)\b/gi, 'Essential Everyday Cotton T-Shirt'],
  [/\bCore\s+Blend\s+(Tee|T-Shirt)\b/gi, 'Comfort Blend Crewneck T-Shirt'],
  [/\bFan\s+Favorite\s+Blend\s+(Tee|T-Shirt)\b/gi, 'Premium Soft Blend T-Shirt'],
  [/\bEasy\s+Cotton\s+(Tee|T-Shirt)\b/gi, 'Lightweight Everyday Cotton T-Shirt'],
  [/\bThe\s+Concert\s+(Tee|T-Shirt)\b/gi, 'Classic Tour Cotton T-Shirt'],
  [/\bRe-Tee\b/gi, 'Recycled Eco-Cotton T-Shirt'],
  [/\bSoftek\b/gi, 'Ultra-Soft Breathable'],
  [/\bAirFlex\b/gi, 'Breathe-Flex Athletic'],

  // Broad replacements
  [/\bTee\b/g, 'T-Shirt'],
  [/\bL-S\s+T-Shirt\b/gi, 'Long Sleeve T-Shirt'],
  [/\bL\/S\s+T-Shirt\b/gi, 'Long Sleeve T-Shirt'],
  [/\bCVC\b/g, 'Cotton-Blend'],
  [/\bTriblend\b/gi, 'Tri-Blend'],
  [/\bAdult\s+/gi, ''],
  [/\bPosiCharge\s+Competitor\b/gi, 'Performance Athletic'],

  // Hoodies & Apparel
  [/\bCollege\s+Hoodie\b/gi, 'Varsity Heritage Pullover Hoodie'],
  [/\bGirlie\s+College\s+Hoodie\b/gi, "Women's Varsity Pullover Hoodie"],
  [/\bFlowy\s+Racerback\s+Tank\b/gi, 'Drape Fit Racerback Tank Top'],
  [/\bFlowy\s+Scoop\s+Muscle\s+Tank\b/gi, 'Relaxed Muscle Scoop Tank Top'],
  [/\bJersey\s+Short\s+Sleeve\s+Deep\s+V-Neck\s+(Tee|T-Shirt)\b/gi, 'Deep V-Neck Soft Cotton T-Shirt'],
  [/\bJersey\s+Tank\b/gi, 'Everyday Jersey Tank Top'],
  [/\bJersey\s+Long\s+Sleeve\s+(Tee|T-Shirt)\b/gi, 'Everyday Long Sleeve Cotton T-Shirt'],
  [/\bJersey\s+Short\s+Sleeve\s+V-Neck\s+(Tee|T-Shirt)\b/gi, 'Classic V-Neck Cotton T-Shirt'],
  [/\bFull\s+Zip\s+Hoodie\b/gi, 'Classic Full-Zip Fleece Hoodie'],
  [/\bFleece\s+Hooded\s+Sweatshirt\b/gi, 'Cozy Fleece Pullover Hoodie'],

  // Kids & Baby
  [/\bKids\s+Hoodie\b/gi, 'Youth Cozy Fleece Pullover Hoodie'],
  [/\bKids\s+Sweatshirt\b/gi, 'Youth Cozy Crewneck Fleece Sweatshirt'],
  [/\bKids\s+Fine\s+Jersey\s+(Tee|T-Shirt)\b/gi, 'Youth Ultra-Soft Cotton T-Shirt'],
  [/\bToddler\'s\s+Fine\s+Jersey\s+(Tee|T-Shirt)\b/gi, "Toddler Everyday Soft Cotton T-Shirt"],
  [/\bInfant\s+Long\s+Sleeve\s+Bodysuit\b/gi, 'Baby Comfort Long Sleeve Bodysuit'],
  [/\bInfant\s+Fine\s+Jersey\s+Bodysuit\b/gi, 'Baby Ultra-Soft Fine Cotton Bodysuit'],
  [/\bInfant\s+Fine\s+Jersey\s+(Tee|T-Shirt)\b/gi, 'Baby Ultra-Soft Cotton T-Shirt'],
  [/\bBaby\s+Short\s+Sleeve\s+Onesie\b/gi, 'Baby Everyday Short Sleeve Bodysuit'],
  [/\bBaby\s+Short\s+Sleeve\s+Bodysuit\b/gi, 'Baby Everyday Short Sleeve Bodysuit'],
  [/\bOnesie\s+Organic\s+Baby\s+Bodysuit\b/gi, 'Organic Cotton Baby Bodysuit'],
  [/\bOnesie\b/gi, 'Baby Bodysuit'],

  // Home & Accessories
  [/\bWall\s+Decals\b/gi, 'Custom Vinyl Wall Graphics'],
  [/\bAccent\s+Coffee\s+Mug\b/gi, 'Two-Tone Ceramic Coffee Mug'],
  [/\bAccent\s+Mug(s)?\b/gi, 'Two-Tone Ceramic Mug'],
  [/\bDesk\s+Mat\b/gi, 'Extended Gaming & Workspace Mat'],
  [/\bMouse\s+Pad\b/gi, 'Precision Ergonomic Mouse Pad'],
  [/\bKiss\s+Cut\s+Stickers\b/gi, 'Precision Vinyl Decal Sheet'],
  [/\bDie\s+Cut\s+Stickers\b/gi, 'Precision Cut Vinyl Decal'],
  [/\bPostcards\b/gi, 'Fine Art Collector Postcards'],
  [/\bPint\s+Glass\b/gi, 'Craft Pub Beer Pint Glass'],
  [/\bSublimation\s+(Crew\s+)?Socks\b/gi, 'All-Over Print Knit Socks'],
  [/\bSublimation\s+Socks\b/gi, 'All-Over Print Knit Socks'],
  [/\bSatin\s+Posters\b/gi, 'Museum-Grade Satin Art Print'],
  [/\bStretched\s+Canvas\b/gi, 'Gallery Wrapped Wall Canvas'],
  [/\bTough\s+Cases\b/gi, 'Dual-Layer Impact Armor Case'],
  [/\bSlim\s+Cases\b/gi, 'Ultra-Slim Snap Phone Case'],
  [/\bStainless\s+Steel\s+Water\s+Bottle\b/gi, 'Insulated Stainless Steel Thermal Bottle'],
  [/\bStainless\s+Steel\s+Travel\s+Mug\b/gi, 'Insulated Thermal Travel Mug'],
  [/\bSpiral\s+Notebook\s*-\s*Ruled\s+Line\b/gi, 'Spiral Bound Lined Notebook'],
  [/\bHardcover\s+Journal\s*-\s*Matte\b/gi, 'Velvet Matte Hardcover Journal'],
  [/\bJournal\s*-\s*Ruled\s+Line\b/gi, 'Hardcover Lined Journal'],
  [/\bJournal\s*-\s*Blank\b/gi, 'Hardcover Sketch Journal'],
  [/\bTrucker\s+Cap\b/gi, 'Classic Mesh Back Retro Trucker Hat'],
  [/\bDad\s+Hat\b/gi, 'Vintage Washed Low-Profile Dad Cap'],
  [/\bSnapback\s+Hat\b/gi, 'Structured Pro-Fit Flat Bill Snapback'],
  [/\bYoga\s+Mat\b/gi, 'Non-Slip Eco Performance Yoga Mat'],
  [/\bThrow\s+Blanket\b/gi, 'Plush Cozy Velvet Fleece Blanket'],
  [/\bTote\s+Bag\b/gi, 'Heavyweight Everyday Canvas Tote'],
  [/\b(Acrylic|Ceramic|Glass|Wooden|Metal)\s+Ornaments?.*$/gi, 'Signature Decorative Holiday Ornament'],
  [/\bFlat\s+Bill\s+Cap\b/gi, 'Structured Pro-Fit Flat Bill Cap'],

  // Drinkware & Accessories
  [/\bMug\s+11oz\b/gi, 'Classic Ceramic Coffee Mug (11oz)'],
  [/\bMug\s+15oz\b/gi, 'Large Ceramic Coffee Mug (15oz)'],
  [/\bAccent\s+Coffee\s+Mug,\s*11oz\b/gi, 'Two-Tone Ceramic Mug (11oz)'],
  [/\bCamelBak\s+Eddy\b/gi, 'Insulated Sport'],
  [/\bKensington\s+Tritan\b/gi, 'Tritan'],
];

// In-memory cache of sanitized titles to guarantee 100% idempotent runtime stability
const sanitizedOutputCache = new Set<string>();

/**
 * Sanitizes any product title, removing all wholesale/Printify markers
 * and returning a polished, customer-facing retail product title.
 */
export function sanitizeProductTitle(rawTitle: string | null | undefined): string {
  if (!rawTitle || typeof rawTitle !== 'string') return '';
  const original = rawTitle.trim();

  // If already produced by this engine, return unchanged (IDEMPOTENT)
  if (sanitizedOutputCache.has(original)) {
    return original;
  }

  let title = original;

  // 1. Remove trademark / copyright symbols (™ ® ©)
  title = title.replace(/[™®©]/g, '');

  // 2. Remove manufacturing technical suffixes and notes
  title = title.replace(/\s*\b(with|w\/)\s+tear[- ]away\s+label\b/gi, '');
  title = title.replace(/\s*,\s*\d+[- ]color\s+straps\b/gi, '');
  title = title.replace(/\s*\(\s*\d+\s*(gsm|g\/m²)\s*\)/gi, '');
  title = title.replace(/\s*\((EU|US|UK|AU|CA)\)\b/gi, '');
  title = title.replace(/\s*\(AOP\)/gi, ' - All-Over Print');
  title = title.replace(/\s*\(DTG\)/gi, '');
  title = title.replace(/\s*\(Embroidery\)/gi, ' (Embroidered)');
  title = title.replace(/\(\s*1pc.*?\)/gi, '');
  title = title.replace(/\(\s*Multi[- ]size.*?\)/gi, '');
  title = title.replace(/\(\s*Multi[- ]color.*?\)/gi, '');
  title = title.replace(/\(\s*Multi[- ]shape.*?\)/gi, '');
  title = title.replace(/\(\s*French\s+Cleat.*?\)/gi, '');
  title = title.replace(/\(\s*Triptych.*?\)/gi, '(3-Piece Set)');
  title = title.replace(/\[\s*[-+]\s*2"\s*\]/gi, '');
  title = title.replace(/\[-2"\]/gi, '');
  title = title.replace(/3\\4/g, '3/4');
  title = title.replace(/\\/g, ' / ');

  // 3. Apply retail phrase upgrades first (so full wholesale names are converted)
  for (const [pattern, replacement] of RETAIL_NAME_REPLACEMENTS) {
    title = title.replace(pattern, replacement);
  }

  // 4. Strip any remaining wholesale brand names
  for (const pattern of FORBIDDEN_BRAND_PATTERNS) {
    title = title.replace(pattern, '');
  }

  // 5. Strip standalone model codes
  for (const pattern of STANDALONE_MODEL_CODES) {
    title = title.replace(pattern, '');
  }

  // 6. Deduplicate repeated words (e.g. "Classic Classic" -> "Classic")
  title = title.replace(/\b(\w+)\s+\1\b/gi, '$1');

  // 7. Clean punctuation & whitespace
  title = title.replace(/\s+/g, ' ');
  title = title.replace(/\s*,\s*,+/g, ',');
  title = title.replace(/\(\s*\)/g, '');
  title = title.replace(/^[\s,\-–—/]+|[\s,\-–—/]+$/g, '');
  title = title.trim();

  // 8. Ensure clean fallback if title became too bare
  if (!title || /^Tee$/i.test(title)) title = 'Everyday Cotton Crewneck T-Shirt';
  else if (/^Hoodie$/i.test(title)) title = 'Classic Pullover Hoodie';
  else if (/^Sweatshirt$/i.test(title)) title = 'Classic Crewneck Sweatshirt';
  else if (/^Cap$/i.test(title)) title = 'Classic Structured Athletic Cap';
  else if (/^Long\s+Sleeve\s+T-Shirt$/i.test(title)) title = 'Classic Long Sleeve Cotton T-Shirt';

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // 9. THE UNIVERSAL DIFFERENCE GUARANTEE:
  // Systematically ensures wholesale prefixes are upgraded and generic items are branded
  if (/^Unisex\s+Classic\b/i.test(title)) {
    title = title.replace(/^Unisex\s+/i, '');
  } else if (/^Unisex\s+/i.test(title)) {
    title = title.replace(/^Unisex\s+/i, 'Classic ');
  } else if (/^Men's\s+/i.test(title) && !/^Men's\s+(Everyday|Classic|Athletic)\b/i.test(title)) {
    title = title.replace(/^Men's\s+/i, "Men's Everyday ");
  } else if (/^Women's\s+/i.test(title) && !/^Women's\s+(Everyday|Classic|Drape|Relaxed)\b/i.test(title)) {
    title = title.replace(/^Women's\s+/i, "Women's Everyday ");
  } else if (/^Kids\s+/i.test(title) && !/^Kids\s+(Everyday|Cozy|Ultra-Soft)\b/i.test(title)) {
    title = title.replace(/^Kids\s+/i, 'Youth Everyday ');
  } else if (/^Toddler's\s+/i.test(title) && !/^Toddler's\s+(Everyday|Soft)\b/i.test(title)) {
    title = title.replace(/^Toddler's\s+/i, "Toddler Everyday ");
  } else if (/^Infant\s+/i.test(title) && !/^Infant\s+(Everyday|Comfort|Ultra-Soft)\b/i.test(title)) {
    title = title.replace(/^Infant\s+/i, 'Baby Everyday ');
  } else if (title.toLowerCase() === original.toLowerCase()) {
    // If title was untouched by any brand or model rules, brand it systematically:
    title = 'Signature ' + title;
  }

  // Deduplicate again if any prefix replacement created duplicate words
  title = title.replace(/\b(\w+)\s+\1\b/gi, '$1');
  title = title.trim();

  // Remember this output so repeated calls return instantly and idempotently
  sanitizedOutputCache.add(title);

  return title;
}

/**
 * Sanitizes a brand field. If it's a known supplier or wholesale manufacturer,
 * it returns a proprietary Loka brand name.
 */
export function sanitizeBrand(rawBrand: string | null | undefined): string {
  if (!rawBrand || typeof rawBrand !== 'string') return 'Loka Signature';
  const trimmed = rawBrand.trim();
  if (!trimmed) return 'Loka Signature';

  // Check if it matches any forbidden wholesale brand
  const lower = trimmed.toLowerCase();
  for (const pattern of FORBIDDEN_BRAND_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(lower)) {
      return 'Loka Signature';
    }
  }

  // Common supplier names check
  const supplierKeywords = [
    'gildan', 'bella', 'canvas', 'next level', 'champion', 'hanes',
    'comfort colors', 'stanley', 'stella', 'american apparel', 'fruit of the loom',
    'jerzees', 'rabbit skins', 'anvil', 'district', 'sport-tek', 'flexfit',
    'yupoong', 'printify', 'printful', 'spoke', 'monster digital', 'swiftpod'
  ];

  if (supplierKeywords.some(kw => lower.includes(kw))) {
    return 'Loka Signature';
  }

  return trimmed;
}

/**
 * Sanitizes the product type name.
 */
export function sanitizeTypeName(rawType?: string, rawTitle?: string): string {
  const checkText = `${rawType || ''} ${rawTitle || ''}`.toLowerCase();
  if (checkText.includes('hoodie')) return 'Hoodies & Sweatshirts';
  if (checkText.includes('sweatshirt')) return 'Sweatshirts';
  if (checkText.includes('tee') || checkText.includes('shirt')) return 'T-Shirts & Tops';
  if (checkText.includes('tank')) return 'Tank Tops';
  if (checkText.includes('mug') || checkText.includes('bottle') || checkText.includes('tumbler')) return 'Drinkware';
  if (checkText.includes('poster') || checkText.includes('canvas')) return 'Wall Art';
  if (checkText.includes('sock')) return 'Socks & Footwear';
  if (checkText.includes('cap') || checkText.includes('hat') || checkText.includes('beanie')) return 'Headwear';
  if (checkText.includes('bag') || checkText.includes('tote') || checkText.includes('backpack')) return 'Bags & Accessories';
  if (checkText.includes('case')) return 'Phone Cases';
  if (checkText.includes('sticker')) return 'Stickers';
  if (checkText.includes('journal') || checkText.includes('notebook')) return 'Stationery';
  if (checkText.includes('legging') || checkText.includes('jogger') || checkText.includes('pant') || checkText.includes('short')) return 'Bottoms';

  if (rawType && typeof rawType === 'string') {
    const cleaned = sanitizeProductTitle(rawType);
    if (cleaned && cleaned !== 'Classic Cotton T-Shirt') return cleaned;
  }
  return 'Apparel & Merch';
}

/**
 * Sanitizes product descriptions, stripping supplier mentions,
 * wholesale SKU codes, and manufacturing jargon.
 */
export function sanitizeProductDescription(rawDesc: string | null | undefined): string {
  if (!rawDesc || typeof rawDesc !== 'string') return '';
  let desc = rawDesc;

  // Mask forbidden supplier names
  for (const pattern of FORBIDDEN_BRAND_PATTERNS) {
    desc = desc.replace(pattern, 'Loka');
  }

  // Remove trademark symbols
  desc = desc.replace(/[™®©]/g, '');

  // Remove wholesale tear-away label lines
  desc = desc.replace(/.*tear[- ]away\s+label.*/gi, '');

  // Redact any leaked supplier API keys / internal URLs
  desc = desc.replace(/(sk_[a-zA-Z0-9_\-]+|pk_[a-zA-Z0-9_\-]+)/g, '[REDACTED]');

  return desc.trim();
}

/**
 * Sanitizes any product object in-place or returns a sanitized shallow clone.
 */
export function sanitizeProductObject<T extends Record<string, any>>(product: T): T {
  if (!product || typeof product !== 'object') return product;

  const sanitized: any = { ...product };

  if (sanitized.name) {
    sanitized.name = sanitizeProductTitle(sanitized.name);
  }
  if (sanitized.title) {
    sanitized.title = sanitizeProductTitle(sanitized.title);
  }
  if (sanitized.brand) {
    sanitized.brand = sanitizeBrand(sanitized.brand);
  }
  if (sanitized.type_name) {
    sanitized.type_name = sanitizeTypeName(sanitized.brand, sanitized.title || sanitized.name);
  }
  if (sanitized.description) {
    sanitized.description = sanitizeProductDescription(sanitized.description);
  }

  return sanitized as T;
}
