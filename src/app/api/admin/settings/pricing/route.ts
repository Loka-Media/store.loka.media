import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { printifyCatalogAPI } from '@/services/printify/PrintifyClient';
import { resolveProductCategoryName } from '@/lib/pricing';

const CONFIG_PATH = path.join(process.cwd(), 'src/config/global_settings.json');

// Memory cache for dynamic categories list
let categoriesCache: { data: string[]; timestamp: number } | null = null;
const CACHE_TTL = 300000; // 5 minutes in milliseconds

async function getDynamicCategories(): Promise<string[]> {
  if (categoriesCache && (Date.now() - categoriesCache.timestamp < CACHE_TTL)) {
    return categoriesCache.data;
  }

  try {
    const blueprints = await printifyCatalogAPI.getBlueprints();
    const categoriesSet = new Set<string>();

    blueprints.forEach((bp: any) => {
      const categoryName = resolveProductCategoryName(bp);
      if (categoryName && categoryName !== 'Other') {
        categoriesSet.add(categoryName);
      }
    });

    // Seeding standard categories first to keep order consistent, then dynamic categories alphabetically
    const standardCategories = [
      "Men", "Women", "Kids", "Accessories", "Home & Living", 
      "Mugs & Drinkware", "Shoes & Socks", "Tank Tops", "Hoodies", 
      "Sweatshirts", "Long Sleeves", "T-Shirts", "Sportswear", 
      "Phone Cases", "Bags", "Stickers", "Posters"
    ];

    const resolvedList = Array.from(categoriesSet);
    const sortedCategories = standardCategories.filter(c => resolvedList.includes(c));
    const otherCategories = resolvedList.filter(c => !standardCategories.includes(c)).sort();
    const finalCategories = [...sortedCategories, ...otherCategories];

    categoriesCache = { data: finalCategories, timestamp: Date.now() };
    return finalCategories;
  } catch (error) {
    console.error('[Pricing Settings API] Error fetching blueprints from Printify:', error);
    // Return default fallback categories if Printify is unavailable
    return [
      "Men", "Women", "Kids", "Accessories", "Home & Living", 
      "Mugs & Drinkware", "Shoes & Socks", "Tank Tops", "Hoodies", 
      "Sweatshirts", "Long Sleeves", "T-Shirts", "Sportswear", 
      "Phone Cases", "Bags", "Stickers", "Posters"
    ];
  }
}

// Helper to safely load settings
function loadSettings() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      const parsed = JSON.parse(data);
      return {
        globalMarkup: parsed.globalMarkup !== undefined ? parsed.globalMarkup : 35,
        categoryMarkup: parsed.categoryMarkup || {}
      };
    }
  } catch (error) {
    console.error('[Pricing Settings API] Error loading settings:', error);
  }
  return { globalMarkup: 35, categoryMarkup: {} }; // Default fallback
}

// Helper to safely save settings
function saveSettings(settings: { globalMarkup: number; categoryMarkup: Record<string, number> }) {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('[Pricing Settings API] Error saving settings:', error);
    return false;
  }
}

export async function GET() {
  const settings = loadSettings();
  const categories = await getDynamicCategories();
  return NextResponse.json({
    success: true,
    globalMarkup: settings.globalMarkup,
    categoryMarkup: settings.categoryMarkup,
    categories
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const markup = parseFloat(body.globalMarkup);
    const categoryMarkupInput = body.categoryMarkup || {};
    
    if (isNaN(markup) || markup < 0 || markup > 100) {
      return NextResponse.json(
        { success: false, error: 'Invalid global markup percentage. Must be between 0 and 100.' },
        { status: 400 }
      );
    }

    // Validate category markup values
    const categoryMarkup: Record<string, number> = {};
    for (const [key, val] of Object.entries(categoryMarkupInput)) {
      const parsedVal = parseFloat(String(val));
      if (isNaN(parsedVal) || parsedVal < 0 || parsedVal > 100) {
        return NextResponse.json(
          { success: false, error: `Invalid markup percentage for category "${key}". Must be between 0 and 100.` },
          { status: 400 }
        );
      }
      categoryMarkup[key] = parsedVal;
    }
    
    const success = saveSettings({ globalMarkup: markup, categoryMarkup });
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Failed to write settings to disk' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      globalMarkup: markup,
      categoryMarkup
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
