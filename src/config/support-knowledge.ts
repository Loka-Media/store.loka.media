/**
 * Loka Media - Official Support Knowledge Base
 * 
 * Source of truth for customer support chatbot.
 * All answers must be grounded in this knowledge base.
 * STRICT RULE: Never mention Printify or internal supplier names.
 */

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'brand' | 'products' | 'shipping' | 'returns' | 'orders' | 'payments' | 'creator' | 'support';
  content: string;
  source: string;
  tags: string[];
  lastUpdated: string;
}

export const SUPPORT_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // ── BRAND & PLATFORM ──────────────────────────────────────
  {
    id: 'brand-overview',
    title: 'About Loka Media',
    category: 'brand',
    content: `Loka Media (store.loka.media / loka.media) is a premium creator monetization platform and design marketplace. We empower independent artists, influencers, and creators worldwide to launch custom branded product lines and storefronts. Customers can discover and shop curated, high-quality merchandise created by their favorite independent creators.`,
    source: '/about, /terms',
    tags: ['about', 'company', 'brand', 'who is loka', 'what is loka', 'marketplace'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'brand-mission',
    title: 'Quality Guarantee & Custom Made-to-Order',
    category: 'brand',
    content: `All products on Loka Media are custom made-to-order especially for each customer. Because each product is crafted individually upon order, we prioritize exceptional print quality, durable materials, and premium finishes. Quality is 100% guaranteed: if an item arrives with a print defect or physical damage, we replace or refund it promptly within 30 days.`,
    source: '/returns, /help',
    tags: ['quality', 'guarantee', 'made to order', 'print quality', 'craftsmanship'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'brand-founder',
    title: 'Loka Media Founders, Leadership & Executive Team',
    category: 'brand',
    content: `The founder of Loka Media is Perry Mangat (Founder & CEO), who established the platform alongside co-founder Rupan Bal and an experienced team of creators and e-commerce innovators. Perry Mangat leads Loka Media to empower creators, influencers, and artists worldwide with seamless merchandise customization, automated printing, and global distribution. For corporate inquiries or executive partnerships, email hello@loka.media.`,
    source: '/about, Leadership',
    tags: ['founder', 'perry mangat', 'perry', 'mangat', 'co-founder', 'who founded loka', 'founder name', 'rupan bal', 'ceo', 'owner', 'who started loka', 'leadership', 'team'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'brand-stats-milestones',
    title: 'Loka Media Creator Community & Platform Statistics',
    category: 'brand',
    content: `Key platform statistics for Loka Media:
- Over $2 Million+ paid out directly to creators.
- 10,000+ active creators running customized merchandise storefronts.
- Creators keep up to 90% of their custom profit markups.
- Worldwide shipping to over 180 countries.`,
    source: 'Homepage /',
    tags: ['stats', 'paid to creators', 'how many creators', 'milestones', 'revenue', 'platform stats', 'community'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'creator-canvas-studio',
    title: 'Canvas Design Studio & Interactive 360° Preview Tools',
    category: 'creator',
    content: `Loka Media provides powerful creator tools:
- Canvas Editor: Drag-and-drop design workspace with rich typography, clipart library, layer positioning, and high-resolution artwork uploads.
- 360° Mockup Preview: Customers and creators can rotate merchandise across front, back, and sleeve angles on real garment colors before ordering.
- Zero Upfront Costs: Signing up and publishing products is 100% free; printing and shipping occur only on demand when an order is placed.`,
    source: '/creator/studio, /about',
    tags: ['canvas', 'studio', 'design tools', 'editor', '360 preview', 'mockup', 'how to design'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'creator-how-to-customize',
    title: 'How to Customize and Design Products on Loka Media',
    category: 'creator',
    content: `Customizing products on Loka Media is simple with our built-in Canvas Studio:
1. Sign in or apply as a creator at store.loka.media/creators.
2. Select a blank product from our catalog (Unisex T-Shirts, Hoodies, Coffee Mugs, Hard-Shell Suitcases, Posters, Phone Cases, etc.).
3. Open the Canvas Studio to upload high-res artwork, add custom text, browse clipart, and position design layers.
4. Preview in 360°: Use the interactive 360° product spinner to inspect mockups across front, back, and sleeve angles on real garment colors.
5. Set your selling price and profit markup (you keep up to 90% profit), then publish to your custom shop with zero upfront cost!`,
    source: '/creator/studio, /creators',
    tags: ['how to customize', 'customize product', 'design product', 'canvas editor', 'customised', 'cusotmised', 'create design', '360 preview', 'how to design', 'customise', 'kese customise kare', 'kaise customize kare', 'how do we customize'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'customer-how-to-buy',
    title: 'How Customers Buy Products on Loka Media',
    category: 'products',
    content: `Buying products on Loka Media is fast, easy, and secure:
1. Browse & Discover: Explore creator designs at store.loka.media/products or visit a specific creator storefront (store.loka.media/creator/[id]).
2. Select Variant & Size: On the Product Details Page, view the interactive 360° mockup angles, select your preferred garment color, and choose your size (consult our size chart for true-to-size unisex fit).
3. Add to Cart: Click "Add to Cart" and review your items in the shopping bag.
4. Unified Checkout: Head to /checkout-unified, enter your shipping destination address, and pick your preferred shipping speed (Standard or Express).
5. Secure Payment: Pay safely using Credit/Debit Card (Stripe), PayPal, Apple Pay, Google Pay, Klarna, or AfterPay.
6. Order Confirmation & Tracking: You will receive an instant confirmation email, and when your made-to-order item ships within 2–5 business days, an automated tracking email is sent with your live delivery link!`,
    source: '/products, /checkout-unified',
    tags: ['how to buy', 'buy product', 'how customers buy', 'purchase', 'order product', 'how to order', 'checkout flow', 'kese buy kare', 'kaise kharide', 'how do i buy', 'shopping guide', 'how to purchase'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'brand-supplier-safe',
    title: 'Manufacturing & Fulfillment Operations',
    category: 'brand',
    content: `All Loka Media products are custom manufactured and fulfilled on demand through vetted global production and printing facilities located across North America, Europe, and key international hubs. This distributed production model ensures fast local fulfillment, reduces shipping times, and minimizes environmental waste. We do not disclose confidential backend vendor arrangements.`,
    source: 'Website Policies',
    tags: ['supplier', 'manufacturer', 'fulfillment partner', 'where made', 'production', 'who makes'],
    lastUpdated: '2026-10-06'
  },

  // ── PRODUCTS & CATALOG ────────────────────────────────────
  {
    id: 'products-overview',
    title: 'Products & Catalog Overview',
    category: 'products',
    content: `Loka Media offers a diverse catalog of high-quality custom merchandise designed by creators worldwide:
1. Apparel: Premium unisex t-shirts, heavy blend fleece hoodies, crewnecks, tank tops, crop tops, joggers, and activewear (sizes XS–5XL).
2. Drinkware: Ceramic coffee mugs (11oz & 15oz, dishwasher & microwave safe), accent mugs, stainless steel tumblers, and water bottles.
3. Luggage & Bags: Hard-shell polycarbonate suitcases (with 360° spinner wheels & security locks), canvas tote bags, duffel bags, and everyday backpacks.
4. Accessories: Dual-layer shockproof phone cases, embroidered caps, beanies, socks, and enamel pins.
5. Home & Living: Gallery canvas wall art, matte posters, fleece throw blankets, and decorative accent pillows.
All items are custom crafted on demand using professional-grade DTG, sublimation, or UV print technology for lasting durability.`,
    source: '/catalog, /shop',
    tags: ['products', 'catalog', 'what do you sell', 'kinds of products', 'what products', 'merchandise', 'tell me about your products', 'all products', 'items', 'categories'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'products-apparel',
    title: 'Apparel Products (T-Shirts, Hoodies, Sweatshirts, Tanks)',
    category: 'products',
    content: `We offer a wide collection of premium apparel including:
- T-Shirts: Unisex heavy cotton tees, premium jersey crewnecks, garment-dyed tees, and relaxed crop tees. Available in sizes XS through 5XL with up to 60+ vibrant colors.
- Hoodies & Sweatshirts: Heavy blend fleece pullover hoodies, zip-up hooded sweatshirts, and crewneck sweaters with double-needle stitching and ribbed cuffs.
- Tank Tops & Crop Tops: Flowy racerback tanks, unisex jersey tanks, and athletic tops.
- Bottoms & Activewear: Joggers, fleece sweatpants, athletic shorts, and compression leggings.
All apparel uses high-grade DTG (Direct-to-Garment) or dye-sublimation printing for vivid, wash-resistant graphics that won't crack or peel.`,
    source: '/catalog, /shop',
    tags: ['t-shirt', 'tee', 'hoodie', 'sweatshirt', 'tank top', 'clothing', 'apparel', 'sizes', 'materials', 'cotton'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'products-drinkware',
    title: 'Mugs & Drinkware',
    category: 'products',
    content: `Our drinkware catalog features:
- Ceramic Mugs: 11oz and 15oz glossy white ceramic mugs with comfortable C-handles. Microwave and dishwasher safe.
- Black Ceramic Mugs: 11oz and 15oz sleek black mugs.
- Accent Mugs: Two-tone mugs with colored handles and interiors.
- Travel Drinkware: Stainless steel insulated tumblers, water bottles with leak-proof lids, and camping mugs.
Prints are heat-pressed using dye sublimation for permanent, scratch-proof, high-gloss color.`,
    source: '/catalog',
    tags: ['mug', 'mugs', 'coffee mug', 'tumbler', 'water bottle', 'drinkware', 'dishwasher safe', 'cup'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'products-accessories-luggage',
    title: 'Bags, Luggage & Accessories',
    category: 'products',
    content: `Our accessories range includes:
- Suitcases & Luggage: Custom hard-shell suitcases featuring 100% durable polycarbonate front, black ABS back, 360-degree swivel wheels, built-in security lock, inner pockets, and expandable storage. Available in Small (carry-on), Medium, and Large.
- Bags & Backpacks: Everyday zip backpacks, cotton canvas tote bags, duffel bags, and accessory pouches.
- Phone Cases: Tough dual-layer shockproof cases and slim snap cases for popular iPhone and Samsung Galaxy models.
- Accessories: Ribbed beanies, trucker hats, embroidered caps, socks, and enamel pins.`,
    source: '/catalog',
    tags: ['suitcase', 'luggage', 'bag', 'backpack', 'tote bag', 'phone case', 'hat', 'cap', 'beanie', 'socks', 'accessories'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'products-home-living',
    title: 'Home & Living Products',
    category: 'products',
    content: `Home decor products include:
- Wall Art: Gallery-wrapped canvas prints (pine frame with protective coating) and museum-grade matte vertical/horizontal posters.
- Comfort Items: Plush fleece throw blankets, sherpa blankets, and spun polyester square indoor accent pillows with hidden zippers.
- Living Essentials: Ceramic scented soy candles, absorbent beach/bath towels, and desk mousepads.`,
    source: '/catalog',
    tags: ['canvas', 'poster', 'wall art', 'pillow', 'blanket', 'candle', 'towel', 'home', 'living', 'decor'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'products-sizing',
    title: 'Sizing & Fit Advice',
    category: 'products',
    content: `Most apparel items run true to size with a standard retail unisex fit. Detailed size charts (width, length, and sleeve measurements) are displayed on each product's page. If you prefer a loose or oversized streetwear aesthetic, we recommend sizing up one size. Because all products are custom printed upon order, we do not accept returns for sizing errors, so please check measurements before ordering.`,
    source: '/help, /returns',
    tags: ['sizing', 'size chart', 'fit', 'runs small', 'runs large', 'measurements', 'what size'],
    lastUpdated: '2026-10-06'
  },

  // ── SHIPPING & DELIVERY ───────────────────────────────────
  {
    id: 'shipping-times',
    title: 'Shipping Times & Production Turnaround',
    category: 'shipping',
    content: `Because products are custom printed to order:
1. Production Time: Each item is printed and quality checked within 2 to 5 business days.
2. Delivery Times (after production):
- United States: 3 to 7 business days.
- Europe / UK: 5 to 10 business days.
- Canada / Australia: 5 to 12 business days.
- Other International: 7 to 15 business days.
Total expected arrival is typically 5 to 12 business days for US domestic orders. Tracking links are emailed as soon as the order leaves the facility.`,
    source: '/returns, /help',
    tags: ['shipping', 'delivery time', 'how long', 'when will it arrive', 'transit time', 'production time', 'turnaround'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'shipping-costs',
    title: 'Shipping Rates & Express Options',
    category: 'shipping',
    content: `Shipping rates are dynamically calculated at checkout based on destination country, package weight, and number of items. Standard shipping starts at approximately $4.99–$6.99 for light apparel within the United States. Express/priority shipping methods may be offered at checkout depending on your location and items.`,
    source: '/checkout-unified, /returns',
    tags: ['shipping cost', 'shipping rate', 'free shipping', 'express shipping', 'postage', 'delivery cost'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'shipping-international',
    title: 'International Shipping, Customs & Duties',
    category: 'shipping',
    content: `We ship to over 180 countries worldwide! For international orders, shipments may be subject to local import taxes, customs duties, and brokerage fees imposed by your country's government upon arrival. These charges vary by country and are the responsibility of the recipient. Delivery times for international orders range from 7 to 15 business days.`,
    source: '/returns, /help',
    tags: ['international', 'customs', 'duties', 'taxes', 'worldwide shipping', 'uk', 'europe', 'canada', 'australia'],
    lastUpdated: '2026-10-06'
  },

  // ── ORDERS & TRACKING ─────────────────────────────────────
  {
    id: 'orders-overview',
    title: 'Order Support & Management Overview',
    category: 'orders',
    content: `For any order-related questions, here is how we can help:
1. Tracking: You will automatically receive a tracking link via email once shipped, or you can check your order status in your profile at store.loka.media/profile.
2. Address Changes: Address updates must be requested within 2–4 hours of ordering before printing begins by emailing support@loka.media with your order number.
3. Cancellations: Orders can be cancelled free of charge before production starts.
4. Damaged or Lost Orders: If your package is lost in transit or arrives damaged/misprinted, email support@loka.media with photos and your order number for an immediate free replacement or full refund.`,
    source: '/returns, /help, /profile',
    tags: ['order', 'orders', 'order related', 'order help', 'need help with an order', 'about my order', 'order issue', 'order status', 'my order', 'orders related'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'orders-tracking',
    title: 'How to Track Your Order',
    category: 'orders',
    content: `Once your package is printed, inspected, and handed over to the courier (such as USPS, DHL, FedEx, or local postal services), you will automatically receive an email containing your tracking number and a direct tracking link. You can also view order status by logging into your account at store.loka.media/profile. Tracking updates may take 24–48 hours to appear after the label is generated.`,
    source: '/help, /returns',
    tags: ['track order', 'where is my order', 'tracking number', 'order status', 'shipment tracking'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'orders-change-address',
    title: 'Changing Shipping Address or Order Details',
    category: 'orders',
    content: `Address corrections or item modifications can only be made BEFORE your order enters production (usually within 2-4 hours of placing the order). If you noticed a mistake in your address, email support@loka.media immediately with:
1. Your Order Number (e.g., LOKA-1234)
2. The complete updated address.
Once an order has begun printing or has been shipped, the delivery address cannot be altered.`,
    source: '/returns, /help',
    tags: ['change address', 'wrong address', 'modify order', 'update shipping address', 'edit order'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'orders-cancellation',
    title: 'Order Cancellation Policy',
    category: 'orders',
    content: `Orders can be cancelled free of charge if you contact us before the item moves into active production. To cancel, immediately email support@loka.media with your order number and request. Once printing has commenced, made-to-order items cannot be cancelled.`,
    source: '/returns',
    tags: ['cancel order', 'cancellation', 'stop order', 'cancel'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'orders-lost-package',
    title: 'Lost, Stolen, or Delayed Packages',
    category: 'orders',
    content: `If your tracking information has not updated for more than 7 business days, or if the package is marked as delivered but you cannot locate it:
1. Check with household members, neighbors, or building management.
2. Confirm the shipping address entered at checkout.
3. If still missing, email support@loka.media with your order number. Our support team will open an inquiry with the carrier and provide a free replacement or resolution if the package is verified lost in transit.`,
    source: '/returns, /help',
    tags: ['lost package', 'stolen', 'not delivered', 'missing package', 'delayed delivery', 'package not received'],
    lastUpdated: '2026-10-06'
  },

  // ── RETURNS, REFUNDS & REPLACEMENTS ───────────────────────
  {
    id: 'returns-policy',
    title: 'Returns & Exchange Policy',
    category: 'returns',
    content: `Because every item on Loka Media is custom printed individually on demand for each customer, WE DO NOT ACCEPT RETURNS OR EXCHANGES FOR SIZING PREFERENCES, BUYER'S REMORSE, OR UNWANTED STYLES. 
However, quality is 100% guaranteed! We gladly issue free replacements or full refunds for items that arrive defective, damaged, or misprinted. You have 30 days from delivery to report any quality issues.`,
    source: '/returns',
    tags: ['return policy', 'returns', 'exchange', 'wrong size', 'can i return', 'send back'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'returns-damaged-defective',
    title: 'Reporting Damaged, Defective, or Misprinted Items',
    category: 'returns',
    content: `If your product arrives damaged or with a print defect:
1. Take clear, well-lit photos of the item lying on a flat surface showing the defect, garment tag, and damaged area.
2. Email support@loka.media within 30 days of delivery.
3. Include your Order Number and a brief description of the issue.
Our customer support team will review the photos and immediately ship a free replacement or issue a full refund—no need to mail the defective item back!`,
    source: '/returns',
    tags: ['damaged item', 'defective', 'print error', 'misprint', 'broken', 'torn', 'tear', 'smudge', 'smudged', 'quality issue', 'replacement', 'damaged package', 'flawed', 'defect'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'returns-refund-timeline',
    title: 'Refund Processing Timelines',
    category: 'returns',
    content: `When a refund is approved by our support team:
- PayPal: Funds appear in your PayPal account within 24 business hours.
- Credit / Debit Cards (Stripe): Funds return to your bank account within 7 to 10 business days, depending on your financial institution.
Refunds are always issued back to the original payment method used at checkout.`,
    source: '/returns',
    tags: ['refund timeline', 'how long refund', 'money back', 'refund processing', 'paypal refund', 'card refund'],
    lastUpdated: '2026-10-06'
  },

  // ── PAYMENTS & CHECKOUT ───────────────────────────────────
  {
    id: 'payments-accepted',
    title: 'Accepted Payment Methods & Security',
    category: 'payments',
    content: `Loka Media supports safe, encrypted checkout via Stripe and PayPal. We accept:
- Credit & Debit Cards: Visa, MasterCard, American Express, Discover, Diners Club, JCB.
- Digital Wallets: Apple Pay, Google Pay, PayPal.
- Buy Now Pay Later: Klarna and AfterPay (where eligible by region).
All transactions use bank-level 256-bit SSL encryption. We never store credit card numbers on our servers.`,
    source: '/returns, /checkout-unified',
    tags: ['payment methods', 'credit card', 'paypal', 'apple pay', 'google pay', 'klarna', 'security', 'checkout'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'payments-currency',
    title: 'Supported Currencies & Pricing Display',
    category: 'payments',
    content: `Prices on Loka Media can be viewed in multiple currencies (USD, EUR, GBP, CAD, AUD, INR) using the currency switcher in the header. Orders are finalized and processed in the selected checkout currency or USD at the current exchange rate.`,
    source: '/checkout-unified',
    tags: ['currency', 'usd', 'eur', 'gbp', 'inr', 'cad', 'exchange rate', 'payment currency'],
    lastUpdated: '2026-10-06'
  },

  // ── CREATOR PROGRAM ───────────────────────────────────────
  {
    id: 'creator-how-it-works',
    title: 'How Creator Shops Work on Loka Media',
    category: 'creator',
    content: `Loka Media allows creators, influencers, and artists to launch custom branded e-commerce storefronts with zero upfront fees. Creators upload their original artwork, select products from our catalog, set their desired profit markups, and publish them to their custom shop. Loka Media handles payment processing, on-demand printing, worldwide shipping, and customer support.`,
    source: '/creators, /help',
    tags: ['become a creator', 'creator program', 'sell on loka', 'creator shop', 'how creators earn', 'artist store'],
    lastUpdated: '2026-10-06'
  },
  {
    id: 'creator-earnings-payouts',
    title: 'Creator Earnings & Payout Schedule',
    category: 'creator',
    content: `Creators earn the markup they set on each product above the platform base cost. Earnings accumulate in the creator's wallet and can be withdrawn via Stripe Connect or PayPal once the minimum threshold is met. Payouts are processed on a regular monthly schedule.`,
    source: '/help, /dashboard/creator/payouts',
    tags: ['creator earnings', 'payouts', 'creator profit', 'when do creators get paid', 'stripe connect'],
    lastUpdated: '2026-10-06'
  },

  // ── CUSTOMER SUPPORT & CONTACT ────────────────────────────
  {
    id: 'support-contact-info',
    title: 'How to Contact Human Support',
    category: 'support',
    content: `Our customer support team is ready to help you with any issue:
- Customer Support (orders, shipping, damaged items, refunds): support@loka.media
- Creator Inquiries (onboarding, shop setup, payouts): creators@loka.media
- General Brand Inquiries: hello@loka.media
Support hours: Monday to Friday, 9:00 AM – 6:00 PM EST. Typical email response time is within 12 to 24 business hours. Please include your Order Number for faster assistance.`,
    source: '/contact, /help',
    tags: ['contact support', 'human agent', 'customer service', 'email support', 'phone number', 'help desk'],
    lastUpdated: '2026-10-06'
  }
];

export const FORBIDDEN_SUPPLIER_NAMES = ['printify', 'printful', 'teelaunch', 'gelato', 'gooten'];

export const CANNED_RESPONSES = {
  SUPPLIER_PROBE: "Our products are custom-manufactured and fulfilled through our vetted global production and printing partners. I'm unable to share internal supplier details, but I'm happy to help with questions about our products, sizing, shipping, or orders!",
  SECURITY_PROBE: "I can help with questions about our products, orders, shipping, returns, and other customer support topics. How can I assist you today?",
  UNKNOWN_FALLBACK: "At the moment, I don't have this information on our website. Please reach out to our support team at support@loka.media who will be happy to assist you!",
  ESCALATION_PROMPT: "For this specific request, our human support team will need to assist you directly. Please email support@loka.media with your order details."
};
