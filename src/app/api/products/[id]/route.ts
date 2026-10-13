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
    let numericId: number | null = Number(id);

    // If id is a slug (e.g. custom-sublimation-socks-305), extract the numeric ID from the end
    if (isNaN(numericId)) {
      const match = id.match(/-(\d+)$/);
      if (match) {
        numericId = parseInt(match[1], 10);
      }
    }

    if (numericId && !isNaN(numericId)) {
      const products = await queryDb(
        `SELECT p.*, u.name as creator_name, u.username as creator_username 
         FROM products p 
         LEFT JOIN users u ON p.created_by = u.id 
         WHERE p.id = $1 LIMIT 1`,
        [numericId]
      );

      if (products && products.length > 0) {
        const product = products[0];

        const variants = await queryDb(
          `SELECT * FROM product_variants WHERE product_id = $1 ORDER BY id ASC`,
          [numericId]
        );

        // Normalize images and tags
        let images: string[] = [];
        if (Array.isArray(product.images)) {
          images = product.images;
        } else if (typeof product.images === 'string') {
          try {
            images = JSON.parse(product.images);
          } catch (_) {
            images = [product.images];
          }
        }

        let tags: string[] = [];
        if (Array.isArray(product.tags)) {
          tags = product.tags;
        } else if (typeof product.tags === 'string') {
          try {
            tags = JSON.parse(product.tags);
          } catch (_) {
            tags = [product.tags];
          }
        }

        // Calculate retail price range from variants and base_price
        const variantPrices = variants
          .map((v: any) => v.price ? parseFloat(String(v.price)) : 0)
          .filter((p: number) => p > 0);

        const baseRetailPrice = product.base_price ? ensure99Pricing(product.base_price) : 14.99;
        const minPrice = variantPrices.length > 0 ? ensure99Pricing(Math.min(...variantPrices)) : baseRetailPrice;
        const maxPrice = variantPrices.length > 0 ? ensure99Pricing(Math.max(...variantPrices)) : baseRetailPrice;

        const normalizedVariants = variants.map((v: any) => ({
          id: v.id,
          product_id: v.product_id,
          title: v.title || `${v.size || 'Default'} - ${v.color || 'Default'}`,
          price: v.price ? ensure99Pricing(v.price).toFixed(2) : minPrice.toFixed(2),
          sku: v.sku || `variant-${v.id}`,
          printify_variant_id: v.printify_variant_id,
          shopify_variant_id: v.shopify_variant_id,
          printify_availability_regions: v.printify_availability_regions || [],
          availability_regions: v.availability_regions || [],
          color: v.color || 'Default',
          size: v.size || 'Default',
          image_url: v.image_url || null,
          cost: v.base_cost ? parseFloat(String(v.base_cost)) : undefined,
          base_cost: v.base_cost ? parseFloat(String(v.base_cost)) : undefined,
        }));

        return NextResponse.json({
          id: product.id,
          creator_id: product.created_by,
          name: product.name,
          description: product.description,
          source: product.source || 'printify',
          category: product.category || 'Uncategorized',
          tags: tags.length > 0 ? tags : ['Popular'],
          thumbnail_url: product.thumbnail_url || images[0] || '',
          images: images.length > 0 ? images : (product.thumbnail_url ? [product.thumbnail_url] : []),
          base_price: baseRetailPrice,
          markup_percentage: parseFloat(product.markup_percentage) || 30,
          status: product.status || 'active',
          created_at: product.created_at,
          updated_at: product.updated_at,
          creator: {
            name: product.creator_name || 'Creator',
            username: product.creator_username || 'creator',
          },
          creator_name: product.creator_name || 'Creator',
          creator_username: product.creator_username || 'creator',
          variant_count: normalizedVariants.length,
          min_price: minPrice.toFixed(2),
          max_price: maxPrice.toFixed(2),
          price_range: {
            min: minPrice.toFixed(2),
            max: maxPrice.toFixed(2),
          },
          printify_product_id: product.printify_product_id,
          printify_blueprint_id: product.printify_blueprint_id,
          printify_print_provider_id: product.printify_print_provider_id,
          variants: normalizedVariants,
          mockups: [],
        });
      }
    }

    // Fallback to backend API if not found directly in PostgreSQL
    const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
      cache: 'no-store',
    });
    const data = await res.text();
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

