/**
 * Product Image Repair API
 * POST /api/printify/repair-images
 *   - Takes a product_id and tries to patch its thumbnail_url & images via Printify
 * GET  /api/printify/repair-images
 *   - Scans all products with missing thumbnail_url and queues repairs
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyProductsAPI } from '@/services/printify/PrintifyClient';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003').replace(/\/$/, '');

function getAuthHeader(req: NextRequest): string | null {
  return req.headers.get('authorization');
}

async function patchBackendProduct(
  productId: number,
  patch: Record<string, unknown>,
  authHeader: string | null
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });

    if (res.ok) return { ok: true, status: res.status };
    const errText = await res.text().catch(() => '');
    // Try PUT if PATCH not supported
    if (res.status === 405) {
      const res2 = await fetch(`${BACKEND_URL}/api/products/${productId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(patch),
      });
      if (res2.ok) return { ok: true, status: res2.status };
      return { ok: false, status: res2.status };
    }
    return { ok: false, status: res.status, error: errText };
  } catch (err: any) {
    return { ok: false, error: err?.message || String(err) };
  }
}

/** Fetch all products from backend and return those missing images */
async function getProductsMissingImages(): Promise<any[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/products?limit=100&page=1`);
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data) ? data : data.products || data.data || [];
    return products.filter((p: any) => {
      const hasThumb = p.thumbnail_url && !String(p.thumbnail_url).includes('placeholder');
      const hasImages = Array.isArray(p.images) && p.images.some((i: any) => i && !String(i).includes('placeholder'));
      return !hasThumb && !hasImages;
    });
  } catch (err) {
    console.error('[Repair] Failed to fetch products list:', err);
    return [];
  }
}

/** Fetch mockup images from Printify for a product ID */
async function fetchPrintifyImages(printifyId: string): Promise<string[]> {
  try {
    const product = await printifyProductsAPI.getProduct(printifyId);
    if (product.images && product.images.length > 0) {
      return product.images
        .filter((img: any) => img.src && !img.src.includes('placeholder'))
        .map((img: any) => img.src);
    }
    return [];
  } catch (err) {
    console.error(`[Repair] Failed to fetch Printify product ${printifyId}:`, err);
    return [];
  }
}

const PRINTIFY_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export async function GET(request: NextRequest) {
  const authHeader = getAuthHeader(request);
  const repaired: number[] = [];
  const failed: number[] = [];
  const skipped: number[] = [];

  try {
    const products = await getProductsMissingImages();

    if (products.length === 0) {
      return NextResponse.json({ success: true, message: 'No products need repair', repaired: [], failed: [], skipped: [] });
    }

    console.log(`[Repair] Found ${products.length} products missing images`);

    for (const product of products) {
      const pid = product.printify_product_id;

      if (!pid || !PRINTIFY_ID_REGEX.test(String(pid))) {
        console.warn(`[Repair] Product ${product.id} has invalid/missing Printify ID (${pid}), skipping`);
        skipped.push(product.id);
        continue;
      }

      const images = await fetchPrintifyImages(String(pid));

      if (images.length === 0) {
        console.warn(`[Repair] No images found on Printify for product ${product.id} (Printify ID: ${pid})`);
        failed.push(product.id);
        continue;
      }

      const patch = {
        thumbnail_url: images[0],
        thumbnailUrl: images[0],
        images,
      };

      const result = await patchBackendProduct(product.id, patch, authHeader);
      if (result.ok) {
        console.log(`[Repair] ✅ Patched product ${product.id} with ${images.length} images`);
        repaired.push(product.id);
      } else {
        console.error(`[Repair] ❌ Failed to patch product ${product.id}:`, result.error);
        failed.push(product.id);
      }
    }

    return NextResponse.json({
      success: true,
      total: products.length,
      repaired,
      failed,
      skipped,
      message: `Repaired ${repaired.length}/${products.length} products`,
    });
  } catch (err: any) {
    console.error('[Repair] Fatal error:', err);
    return NextResponse.json({ error: err?.message || 'Repair failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authHeader = getAuthHeader(request);

  try {
    const body = await request.json();
    const { product_id, printify_product_id } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 });
    }

    if (!printify_product_id || !PRINTIFY_ID_REGEX.test(String(printify_product_id))) {
      return NextResponse.json({ 
        error: `Invalid or missing printify_product_id: "${printify_product_id}". Must be a 24-char hex string.`
      }, { status: 400 });
    }

    const images = await fetchPrintifyImages(String(printify_product_id));

    if (images.length === 0) {
      return NextResponse.json({ 
        success: false,
        message: `No images found on Printify for product ${printify_product_id}`
      }, { status: 200 });
    }

    const patch = {
      thumbnail_url: images[0],
      thumbnailUrl: images[0],
      images,
    };

    const result = await patchBackendProduct(Number(product_id), patch, authHeader);

    if (result.ok) {
      return NextResponse.json({ 
        success: true,
        message: `Patched product ${product_id} with ${images.length} images`,
        thumbnail_url: images[0],
        images,
      });
    } else {
      return NextResponse.json({ 
        success: false,
        error: result.error,
        status: result.status,
      }, { status: 200 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Repair failed' }, { status: 500 });
  }
}
