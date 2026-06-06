/**
 * Printify Shop Products API Routes
 * GET    /api/printify/products                → list shop products
 * POST   /api/printify/products                → create product
 * GET    /api/printify/products/:id            → get product
 * PUT    /api/printify/products/:id            → update product
 * DELETE /api/printify/products/:id            → delete product
 * POST   /api/printify/products/:id/publish    → publish product
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
    const searchParams = request.nextUrl.searchParams;

    // GET /api/printify/products → list all
    if (segments.length === 0) {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const response = await printifyProductsAPI.getProducts({ page, limit });

      // Transform each product for storefront use
      const transformed = response.data.map(p => transformProductForStorefront(p));
      return NextResponse.json({
        success: true,
        data: transformed,
        pagination: {
          total: response.total,
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
        },
      });
    }

    // GET /api/printify/products/:id
    const productId = segments[0];
    const product = await printifyProductsAPI.getProduct(productId);
    const transformed = transformProductForStorefront(product);
    return NextResponse.json({ success: true, data: transformed });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Products request failed';
    console.error('[Printify Products GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];

    // Safely parse body if present
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body is acceptable
    }

    // POST /api/printify/products/:id/publish
    if (segments.length === 2 && segments[1] === 'publish') {
      const productId = segments[0];
      // Run the publishing and completion notification in the background to return instantly to UI
      (async () => {
        try {
          console.log(`[Printify API] Starting background publish for product: ${productId}`);
          await printifyProductsAPI.publishProduct(productId, body);
          console.log(`[Printify API] Publish initiated. Waiting 2 seconds for state registration...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          console.log(`[Printify API] Sending publishing succeeded for product: ${productId}`);
          await printifyProductsAPI.setPublishingSucceeded(productId);
          console.log(`[Printify API] Background publish completed successfully for product: ${productId}`);
        } catch (error) {
          console.error(`[Printify API] Background publish failed for product ${productId}:`, error);
        }
      })();

      return NextResponse.json({ success: true, message: 'Product publishing initiated' });
    }

    // POST /api/printify/products → create
    const product = await printifyProductsAPI.createProduct(body);
    return NextResponse.json({ success: true, data: product }, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Products POST failed';
    console.error('[Printify Products POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];
    const body = await request.json();

    if (segments.length === 0) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await printifyProductsAPI.updateProduct(segments[0], body);
    return NextResponse.json({ success: true, data: product });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Products PUT failed';
    console.error('[Printify Products PUT]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];

    if (segments.length === 0) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    await printifyProductsAPI.deleteProduct(segments[0]);
    return NextResponse.json({ success: true, message: 'Product deleted' });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Products DELETE failed';
    console.error('[Printify Products DELETE]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
