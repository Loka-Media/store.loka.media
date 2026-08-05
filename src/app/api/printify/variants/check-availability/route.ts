import { NextRequest, NextResponse } from 'next/server';
import { printifyProductsAPI } from '@/services/printify/PrintifyClient';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function logToFile(msg: string) {
  try {
    const logPath = path.join(process.cwd(), 'sync-debug.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] [CheckAvailability] ${msg}\n`);
  } catch (err) {
    // Ignore errors writing logs
  }
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003').replace(/\/$/, '');

// Helper to extract Authorization header from the incoming Next.js request.
function getAuthHeader(req: NextRequest): string | null {
  return req.headers.get('authorization');
}

async function fetchFromBackend(
  apiPath: string,
  authHeader: string | null
): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const res = await fetch(`${BACKEND_URL}${apiPath}`, {
      method: 'GET',
      headers,
    });
    if (res.ok) {
      return await res.json().catch(() => ({}));
    }
    const errText = await res.text().catch(() => '');
    throw new Error(`Status ${res.status}: ${errText}`);
  } catch (err: any) {
    throw new Error(err?.message || String(err));
  }
}

function isPrintifyId(id: string | number): boolean {
  const strId = String(id);
  // Printify product IDs are 24-character hexadecimal MongoDB ObjectIds
  return /^[0-9a-fA-F]{24}$/.test(strId);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { variants = [] } = body as {
      variants: Array<{ variant_id: string | number; product_id?: string | number; quantity?: number }>;
    };

    if (!variants || variants.length === 0) {
      return NextResponse.json({
        success: true,
        all_available: true,
        checks: []
      });
    }

    const authHeader = getAuthHeader(request);
    logToFile(`Checking availability for ${variants.length} items`);

    // 1. Resolve product IDs and group variants by Printify Product ID
    const groupedByProduct: Record<string, Array<{ variant_id: string | number; quantity?: number }>> = {};
    const unresolvableVariants: Array<{ variant_id: string | number; available: boolean; reason: string }> = [];

    for (const item of variants) {
      const productId = item.product_id;
      const variantId = item.variant_id;

      if (!productId) {
        // If product_id is missing, we cannot verify stock directly, return unavailable
        unresolvableVariants.push({
          variant_id: variantId,
          available: false,
          reason: 'Product ID is missing in request'
        });
        continue;
      }

      let printifyProductId = String(productId);

      // Resolve database product ID to Printify product ID if it's numeric/not a Printify format ID
      if (!isPrintifyId(printifyProductId)) {
        try {
          const dbProduct = await fetchFromBackend(`/api/products/${productId}`, authHeader);
          printifyProductId = dbProduct?.printify_id || dbProduct?.printify_product_id;
          if (!printifyProductId) {
            unresolvableVariants.push({
              variant_id: variantId,
              available: false,
              reason: `Product ${productId} is not connected to a Printify product`
            });
            continue;
          }
        } catch (err: any) {
          console.error(`Failed to resolve DB product ${productId}:`, err);
          unresolvableVariants.push({
            variant_id: variantId,
            available: false,
            reason: `Failed to fetch product details: ${err.message}`
          });
          continue;
        }
      }

      if (!groupedByProduct[printifyProductId]) {
        groupedByProduct[printifyProductId] = [];
      }
      groupedByProduct[printifyProductId].push(item);
    }

    // 2. Fetch Printify details for each unique product ID in parallel
    const checks: Array<{ variant_id: string | number; available: boolean; name?: string; reason?: string }> = [...unresolvableVariants];
    const productIds = Object.keys(groupedByProduct);

    const fetchPromises = productIds.map(async (printifyProductId) => {
      try {
        const printifyProduct = await printifyProductsAPI.getProduct(printifyProductId);
        const requestedItems = groupedByProduct[printifyProductId];

        for (const item of requestedItems) {
          const variantId = item.variant_id;
          // Printify variant lists can have numerical or string IDs depending on client/server contexts
          const pv = printifyProduct.variants?.find(
            (v: any) => String(v.id) === String(variantId)
          );

          if (!pv) {
            checks.push({
              variant_id: variantId,
              available: false,
              reason: 'Variant not found on Printify product'
            });
          } else {
            const isAvailable = pv.is_available && pv.is_enabled;
            checks.push({
              variant_id: variantId,
              available: isAvailable,
              name: pv.title,
              reason: isAvailable ? undefined : (!pv.is_enabled ? 'Variant is disabled' : 'Out of stock')
            });
          }
        }
      } catch (err: any) {
        console.error(`Failed to fetch product details for ${printifyProductId} from Printify:`, err);
        const requestedItems = groupedByProduct[printifyProductId];
        for (const item of requestedItems) {
          checks.push({
            variant_id: item.variant_id,
            available: false,
            reason: `Printify API error: ${err.message || String(err)}`
          });
        }
      }
    });

    await Promise.all(fetchPromises);

    const allAvailable = checks.every(c => c.available);
    const unavailableCount = checks.filter(c => !c.available).length;

    logToFile(`Availability check result: allAvailable=${allAvailable}, unavailableCount=${unavailableCount}`);

    return NextResponse.json({
      success: true,
      all_available: allAvailable,
      unavailable_count: unavailableCount,
      checks
    });
  } catch (error: any) {
    console.error('[Check Variant Availability Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
