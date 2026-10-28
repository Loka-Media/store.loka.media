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
  try {
    const { id } = await context.params;
    const numId = Number(id);
    const bodyText = await request.text();
    let body: any = {};
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = {};
    }

    const {
      name,
      description,
      markupPercentage,
      markup_percentage,
      price,
      base_price,
      basePrice,
      selling_price,
      retail_price,
      category,
      tags,
      thumbnailUrl,
      thumbnail_url,
      images,
      status,
      is_active,
      isActive,
      variantPrices,
    } = body;

    const rawRetailPrice = price || base_price || basePrice || selling_price || retail_price || null;
    let finalRetailPrice = rawRetailPrice != null ? ensure99Pricing(rawRetailPrice) : null;
    const markupVal = markupPercentage !== undefined 
      ? parseFloat(String(markupPercentage)) 
      : (markup_percentage !== undefined ? parseFloat(String(markup_percentage)) : null);

    const coverUrl = thumbnailUrl || thumbnail_url || (Array.isArray(images) && images[0]) || '';
    const imagesArr = Array.isArray(images) ? images : [];
    const tagsArr = Array.isArray(tags) ? tags : [];
    const activeStatus = status || (is_active === false || isActive === false ? 'inactive' : 'active');

    // If finalRetailPrice not specified but markupVal is present, auto-calculate from existing variants
    if (finalRetailPrice == null && markupVal !== null && numId && !isNaN(numId)) {
      try {
        const existingVariants = await queryDb(
          `SELECT id, printify_variant_id, base_cost, price FROM product_variants WHERE product_id = $1`,
          [numId]
        );
        if (existingVariants && existingVariants.length > 0) {
          const calculatedPrices: { id: any; price: number }[] = [];
          for (const ev of existingVariants) {
            const baseCost = parseFloat(ev.base_cost || '0');
            if (baseCost > 0) {
              const platformCost = baseCost * 1.50; // standard 50% global platform markup
              const retail = ensure99Pricing(platformCost * (1 + markupVal / 100));
              calculatedPrices.push({ id: ev.id, price: retail });
            }
          }
          if (calculatedPrices.length > 0) {
            finalRetailPrice = ensure99Pricing(Math.min(...calculatedPrices.map(c => c.price)));
          }
        }
      } catch (calcErr) {
        console.warn(`[PUT /api/products/[id]] Auto-calc notice:`, calcErr);
      }
    }

    // Helper to sync PostgreSQL directly
    const syncPostgres = async () => {
      if (!numId || isNaN(numId)) return;
      try {
        await queryDb(
          `UPDATE products 
           SET 
             name = COALESCE($1, name),
             description = COALESCE($2, description),
             markup_percentage = COALESCE($3, markup_percentage),
             base_price = COALESCE($4, base_price),
             category = COALESCE($5, category),
             tags = COALESCE($6, tags),
             thumbnail_url = COALESCE($7, thumbnail_url),
             images = COALESCE($8, images),
             status = COALESCE($9, status),
             updated_at = NOW()
           WHERE id = $10`,
          [
            name || null,
            description || null,
            markupVal,
            finalRetailPrice,
            category || null,
            tagsArr.length > 0 ? tagsArr : null,
            coverUrl || null,
            imagesArr.length > 0 ? imagesArr : null,
            activeStatus,
            numId
          ]
        );

        if (Array.isArray(variantPrices) && variantPrices.length > 0) {
          for (const vp of variantPrices) {
            const rawVpPrice = vp.price ? ensure99Pricing(vp.price) : (finalRetailPrice || 0);
            const vpPrice = (finalRetailPrice && rawVpPrice < finalRetailPrice) ? finalRetailPrice : rawVpPrice;
            if (vpPrice > 0) {
              let updateRes = await queryDb(
                `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE (id = $2 OR printify_variant_id = $2) AND product_id = $3 RETURNING id`,
                [vpPrice, vp.id || vp.printify_variant_id, numId]
              );
              if ((!updateRes || updateRes.length === 0) && (vp.size || vp.title)) {
                if (vp.size && vp.color) {
                  await queryDb(
                    `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2 AND LOWER(size) = LOWER($3) AND LOWER(color) = LOWER($4)`,
                    [vpPrice, numId, vp.size, vp.color]
                  );
                } else if (vp.title) {
                  await queryDb(
                    `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2 AND LOWER(title) = LOWER($3)`,
                    [vpPrice, numId, vp.title]
                  );
                }
              }
            }
          }
          if (finalRetailPrice != null && finalRetailPrice > 0) {
            await queryDb(
              `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2 AND (price IS NULL OR price = 0 OR price < $1)`,
              [finalRetailPrice, numId]
            );
          }
        } else if (finalRetailPrice != null && finalRetailPrice > 0) {
          await queryDb(
            `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2`,
            [finalRetailPrice, numId]
          );
        }
      } catch (err: any) {
        console.warn(`[PUT /api/products/[id]] DB sync error:`, err.message);
      }
    };

    // 1. Initial direct PostgreSQL update
    await syncPostgres();

    // 2. Prepare sanitized payload for backend (strip markupPercentage to prevent backend legacy 35% recalculation)
    const backendPayload: any = {
      ...body,
      basePrice: finalRetailPrice || body.basePrice,
      base_price: finalRetailPrice || body.base_price,
      price: finalRetailPrice || body.price,
      selling_price: finalRetailPrice || body.selling_price,
      retail_price: finalRetailPrice || body.retail_price,
      min_price: finalRetailPrice || body.min_price,
      max_price: body.max_price || finalRetailPrice,
      minPrice: finalRetailPrice || body.minPrice,
      maxPrice: body.maxPrice || finalRetailPrice,
    };
    delete backendPayload.markupPercentage;
    delete backendPayload.markup_percentage;

    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(backendPayload),
      cache: 'no-store',
    });
    const data = await res.text();

    // 3. Re-affirm PostgreSQL update to guarantee backend didn't overwrite prices with stale data
    await syncPostgres();

    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error(`[API PUT /api/products/[id]] Error:`, err);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
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

