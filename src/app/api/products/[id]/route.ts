import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { ensure99Pricing } from '@/lib/pricing-utils';

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    let productId = id;

    // If id is a slug (e.g. custom-sublimation-socks-305), extract the numeric ID from the end
    if (!/^\d+$/.test(id)) {
      const match = id.match(/-(\d+)$/);
      if (match) {
        productId = match[1];
      }
    }

    const res = await fetch(`${BACKEND_URL}/api/products/${encodeURIComponent(productId)}`, {
      cache: 'no-store',
    });
    const data = await res.text();

    // Ensure accurate pricing matching PostgreSQL DB and creator studio
    if (res.ok) {
      try {
        const product = JSON.parse(data);

        try {
          const dbRows = await queryDb(
            `SELECT p.base_price, p.markup_percentage,
                    json_agg(json_build_object('id', pv.id, 'price', pv.price, 'printify_variant_id', pv.printify_variant_id)) as db_variants
             FROM products p
             LEFT JOIN product_variants pv ON pv.product_id = p.id
             WHERE p.id = $1
             GROUP BY p.id, p.base_price, p.markup_percentage`,
            [productId]
          );

          if (dbRows && dbRows.length > 0) {
            const dbP = dbRows[0];
            const realBase = dbP.base_price != null ? ensure99Pricing(dbP.base_price) : null;
            if (realBase && realBase > 0) {
              product.base_price = realBase;
              product.min_price = realBase;
            }
            if (Array.isArray(dbP.db_variants) && Array.isArray(product.variants)) {
              product.variants.forEach((v: any) => {
                const match = dbP.db_variants.find((dv: any) => 
                  dv.id === v.id || (dv.printify_variant_id != null && dv.printify_variant_id === v.printify_variant_id)
                );
                if (match && match.price) {
                  v.price = ensure99Pricing(match.price);
                } else if (realBase) {
                  v.price = realBase;
                }
              });
            }
          }
        } catch (_dbErr) {
          // If direct DB query fails, fallback to backend API data
        }

        if (product && product.base_price == null && product.min_price != null) {
          product.base_price = product.min_price;
        }
        return NextResponse.json(product, { status: res.status });
      } catch {
        // Not JSON: pass through unchanged
      }
    }

    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`[API /api/products/[id]] Error:`, err);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const bodyText = await request.text();
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: 'PUT',
    headers,
    body: bodyText,
    cache: 'no-store',
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const bodyText = await request.text();
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: 'PATCH',
    headers,
    body: bodyText,
    cache: 'no-store',
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const authHeader = request.headers.get('authorization');
  const headers: Record<string, string> = {};
  if (authHeader) headers['Authorization'] = authHeader;

  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    method: 'DELETE',
    headers,
    cache: 'no-store',
  });
  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

