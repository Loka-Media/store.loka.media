/**
 * Printify Catalog API Routes
 * GET /api/printify/catalog                                          → list & filter transformed blueprints
 * GET /api/printify/catalog/categories                               → list static blueprint categories
 * GET /api/printify/catalog/:blueprintId                             → blueprint details with merged print provider variants
 * GET /api/printify/catalog/:blueprintId/providers                   → print providers
 * GET /api/printify/catalog/:blueprintId/providers/:providerId/variants → variants
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  printifyCatalogAPI,
} from '@/services/printify/PrintifyClient';

const STATIC_CATEGORIES = [
  { id: 1, parent_id: 0, title: "T-Shirts", image_url: "https://images.printify.com/api/catalog/6013ebb8868c2d1b463283c7.jpg" },
  { id: 2, parent_id: 0, title: "Hoodies & Sweatshirts", image_url: "https://images.printify.com/api/catalog/60829871758c0e6db614f04c.jpg" },
  { id: 3, parent_id: 0, title: "Mugs & Drinkware", image_url: "https://images.printify.com/api/catalog/60d2cc950d87ab060e2db401.jpg" },
  { id: 4, parent_id: 0, title: "Home & Living", image_url: "https://images.printify.com/api/catalog/5c7d1e8d6f1b34000868f047.jpg" },
  { id: 5, parent_id: 0, title: "Accessories", image_url: "https://images.printify.com/api/catalog/5e3bded4cb3a1100084f7b2c.jpg" }
];

const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  blue: '#0000ff',
  green: '#008000',
  yellow: '#ffff00',
  navy: '#000080',
  grey: '#808080',
  gray: '#808080',
  orange: '#ffa500',
  pink: '#ffc0cb',
  purple: '#800080',
  brown: '#a52a2a',
  gold: '#ffd700',
  silver: '#c0c0c0',
  charcoal: '#36454f',
  heather: '#9aa0a6',
  royal: '#4169e1',
  forest: '#228b22',
  maroon: '#800000',
  sand: '#c2b280',
  olive: '#808000',
  cream: '#fffdd0',
};

function getColorCode(colorName: string): string {
  const name = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (name.includes(key)) return hex;
  }
  return '#cccccc';
}

const blueprintCache = new Map<number, { data: any; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];
    const searchParams = request.nextUrl.searchParams;

    // GET /api/printify/catalog/categories
    if (segments.length === 1 && segments[0] === 'categories') {
      return NextResponse.json({
        success: true,
        result: {
          categories: STATIC_CATEGORIES
        }
      });
    }

    // GET /api/printify/catalog  → list all blueprints (transformed and filtered)
    if (segments.length === 0) {
      const blueprints = await printifyCatalogAPI.getBlueprints();
      const categoryId = parseInt(searchParams.get('category') || '0');
      const search = (searchParams.get('search') || '').toLowerCase();

      // Filter blueprints by static category matching rules
      let filtered = blueprints;
      if (categoryId > 0) {
        filtered = blueprints.filter(bp => {
          const title = bp.title.toLowerCase();
          if (categoryId === 1) {
            return title.includes('tee') || title.includes('t-shirt') || title.includes('t shirt');
          } else if (categoryId === 2) {
            return title.includes('hoodie') || title.includes('sweatshirt') || title.includes('sweater') || title.includes('pullover');
          } else if (categoryId === 3) {
            return title.includes('mug') || title.includes('tumbler') || title.includes('bottle') || title.includes('drink');
          } else if (categoryId === 4) {
            return title.includes('poster') || title.includes('canvas') || title.includes('blanket') || title.includes('pillow') || title.includes('frame') || title.includes('towel') || title.includes('rug');
          } else if (categoryId === 5) {
            // Accessories: everything else that doesn't match above categories
            const isTshirt = title.includes('tee') || title.includes('t-shirt') || title.includes('t shirt');
            const isHoodie = title.includes('hoodie') || title.includes('sweatshirt') || title.includes('sweater') || title.includes('pullover');
            const isMug = title.includes('mug') || title.includes('tumbler') || title.includes('bottle') || title.includes('drink');
            const isHome = title.includes('poster') || title.includes('canvas') || title.includes('blanket') || title.includes('pillow') || title.includes('frame') || title.includes('towel') || title.includes('rug');
            return !isTshirt && !isHoodie && !isMug && !isHome;
          }
          return true;
        });
      }

      if (search) {
        filtered = filtered.filter(bp => 
          bp.title.toLowerCase().includes(search) || 
          bp.brand.toLowerCase().includes(search) || 
          bp.model.toLowerCase().includes(search)
        );
      }

      // Transform to match the PrintfulProduct structure expected by frontend
      const transformed = filtered.map(bp => ({
        id: bp.id,
        title: bp.title,
        brand: bp.brand,
        model: bp.model,
        image: bp.images?.[0] || '/placeholder-product.png',
        type_name: bp.brand || 'Apparel',
        variant_count: 12,
        is_discontinued: false
      }));

      return NextResponse.json({ success: true, result: transformed });
    }

    // GET /api/printify/catalog/print_providers
    if (segments.length === 1 && segments[0] === 'print_providers') {
      const providers = await printifyCatalogAPI.getPrintProvidersList();
      return NextResponse.json({ success: true, data: providers });
    }

    // GET /api/printify/catalog/:blueprintId
    const blueprintId = parseInt(segments[0]);
    if (isNaN(blueprintId)) {
      return NextResponse.json({ error: 'Invalid blueprint ID' }, { status: 400 });
    }

    // Check if blueprintId details are cached
    const cached = blueprintCache.get(blueprintId);
    if (segments.length === 1 && cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      console.log(`[Printify Catalog Cache] Returning cached details for blueprint ${blueprintId}`);
      return NextResponse.json({ success: true, data: cached.data });
    }

    // GET /api/printify/catalog/:blueprintId/providers
    if (segments[1] === 'providers') {
      // GET /api/printify/catalog/:blueprintId/providers/:providerId/variants
      if (segments[2] && segments[3] === 'variants') {
        const providerId = parseInt(segments[2]);
        if (isNaN(providerId)) {
          return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 });
        }
        const variants = await printifyCatalogAPI.getBlueprintVariants(blueprintId, providerId);
        return NextResponse.json({ success: true, data: variants });
      }

      // GET /api/printify/catalog/:blueprintId/providers/:providerId/shipping
      if (segments[2] && segments[3] === 'shipping') {
        const providerId = parseInt(segments[2]);
        if (isNaN(providerId)) {
          return NextResponse.json({ error: 'Invalid provider ID' }, { status: 400 });
        }
        const shipping = await printifyCatalogAPI.getShippingProfiles(blueprintId, providerId);
        return NextResponse.json({ success: true, data: shipping });
      }

      const providers = await printifyCatalogAPI.getPrintProviders(blueprintId);
      return NextResponse.json({ success: true, data: providers });
    }

    // GET /api/printify/catalog/:blueprintId
    // Fetch base blueprint & providers in parallel
    const [blueprint, providers] = await Promise.all([
      printifyCatalogAPI.getBlueprint(blueprintId),
      printifyCatalogAPI.getPrintProviders(blueprintId).catch(e => {
        console.warn(`Failed to fetch print providers for blueprint ${blueprintId}:`, e);
        return [];
      })
    ]);

    // Choose the first print provider as default and fetch its variants
    const providerId = providers[0]?.id;
    let variants: any[] = [];
    if (providerId) {
      try {
        const variantsData = await printifyCatalogAPI.getBlueprintVariants(blueprintId, providerId);
        variants = (variantsData.variants || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          color: v.options?.color || 'Default',
          color_code: getColorCode(v.options?.color || ''),
          size: v.options?.size || 'OS',
          image: blueprint.images?.[0] || '/placeholder-product.png',
          price: '15.00',
          is_available: true,
          placeholders: v.placeholders
        }));
      } catch (e) {
        console.warn(`Failed to fetch variants for blueprint ${blueprintId} and provider ${providerId}:`, e);
      }
    }

    const mergedBlueprint = {
      ...blueprint,
      image: blueprint.images?.[0] || '/placeholder-product.png',
      type_name: blueprint.brand || 'Apparel',
      variants,
      providers,
      print_provider_id: providerId,
      printProviderId: providerId
    };

    // Cache the blueprint details
    blueprintCache.set(blueprintId, { data: mergedBlueprint, timestamp: Date.now() });

    return NextResponse.json({ success: true, data: mergedBlueprint });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Catalog request failed';
    console.error('[Printify Catalog API]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
