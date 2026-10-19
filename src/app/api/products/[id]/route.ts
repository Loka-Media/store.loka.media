import { NextRequest, NextResponse } from 'next/server';

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

    // The backend product has no base_price; the PDP falls back to $14.99 without it
    if (res.ok) {
      try {
        const product = JSON.parse(data);
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

