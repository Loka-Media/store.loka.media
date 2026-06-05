/**
 * Printify Mockups API Route
 * GET  /api/printify/mockups/:productId  → get all mockups for a product
 *
 * Printify pre-generates mockups when products are created.
 * We simply return the images array from the product, sorted by position.
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyProductsAPI } from '@/services/printify/PrintifyClient';
import { transformProductForStorefront } from '@/services/printify/PrintifyProductService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];

    if (segments.length === 0) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const productId = segments[0];
    const product = await printifyProductsAPI.getProduct(productId);
    const transformed = transformProductForStorefront(product);

    // Return mockups sorted by position
    return NextResponse.json({
      success: true,
      data: {
        productId,
        mockups: transformed.mockups,
        printAreas: transformed.printAreas,
      },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Mockups request failed';
    console.error('[Printify Mockups GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
