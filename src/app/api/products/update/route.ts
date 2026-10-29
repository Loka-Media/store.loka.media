import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { ensure99Pricing } from '@/lib/pricing-utils';
import { requireCreatorOrAdminAuth } from '@/lib/serverAuth';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

async function handleUpdate(req: NextRequest) {
  // This route writes straight to PostgreSQL, so only the product's creator (or an admin) may call it
  const auth = await requireCreatorOrAdminAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const {
      productId,
      name,
      description,
      markupPercentage,
      price,
      base_price,
      basePrice,
      category,
      tags,
      thumbnailUrl,
      thumbnail_url,
      images,
      status,
      variantPrices,
    } = body;

    const id = Number(productId);
    if (!id || isNaN(id)) {
      return NextResponse.json({ error: 'Valid productId is required' }, { status: 400 });
    }

    const owner = await queryDb(`SELECT created_by FROM products WHERE id = $1`, [id]);
    if (!owner || owner.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    if (auth.user.role !== 'admin' && Number(owner[0].created_by) !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden: you can only update your own products' }, { status: 403 });
    }

    // Determine final retail price with uniform .99 rule
    const rawRetailPrice = price || base_price || basePrice || null;
    const finalRetailPrice = rawRetailPrice != null ? ensure99Pricing(rawRetailPrice) : null;
    const markupVal = markupPercentage !== undefined ? parseFloat(String(markupPercentage)) : null;
    const coverUrl = thumbnailUrl || thumbnail_url || (Array.isArray(images) && images[0]) || '';
    const imagesArr = Array.isArray(images) ? images : [];
    const tagsArr = Array.isArray(tags) ? tags : [];

    console.log(`[Product Update Route] Updating product ${id} with uniform retail price: $${finalRetailPrice ?? 'unchanged'}`);

    // 1. Direct PostgreSQL Update on products table
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
          tagsArr,
          coverUrl || null,
          imagesArr,
          status || 'active',
          id
        ]
      );

      // 2. Direct PostgreSQL Update on product_variants table
      if (Array.isArray(variantPrices) && variantPrices.length > 0) {
        for (const vp of variantPrices) {
          const rawVpPrice = vp.price ? ensure99Pricing(vp.price) : (finalRetailPrice || 0);
          const vpPrice = (finalRetailPrice && rawVpPrice < finalRetailPrice) ? finalRetailPrice : rawVpPrice;
          if (vpPrice > 0) {
            let updateRes = await queryDb(
              `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE (id = $2 OR printify_variant_id = $2) AND product_id = $3 RETURNING id`,
              [vpPrice, vp.id || vp.printify_variant_id, id]
            );
            if ((!updateRes || updateRes.length === 0) && (vp.size || vp.title)) {
              if (vp.size && vp.color) {
                await queryDb(
                  `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2 AND LOWER(size) = LOWER($3) AND LOWER(color) = LOWER($4)`,
                  [vpPrice, id, vp.size, vp.color]
                );
              } else if (vp.title) {
                await queryDb(
                  `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2 AND LOWER(title) = LOWER($3)`,
                  [vpPrice, id, vp.title]
                );
              }
            }
          }
        }
        if (finalRetailPrice != null && finalRetailPrice > 0) {
          await queryDb(
            `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2 AND (price IS NULL OR price = 0 OR price < $1)`,
            [finalRetailPrice, id]
          );
        }
      } else if (finalRetailPrice != null && finalRetailPrice > 0) {
        // Uniformly update all variants of this product to the exact final retail price
        await queryDb(
          `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE product_id = $2`,
          [finalRetailPrice, id]
        );
      }

      console.log(`[Product Update Route] Successfully synced product ${id} and variants in PostgreSQL to $${finalRetailPrice}`);
    } catch (dbErr: any) {
      console.warn(`[Product Update Route] Direct PostgreSQL update error (proceeding to backend sync):`, dbErr.message);
    }

    // 3. Forward update to backend API (catalog.loka.media)
    const authHeader = req.headers.get('authorization');
    try {
      const backendPayload: any = {
        name,
        description,
        basePrice: finalRetailPrice,
        base_price: finalRetailPrice,
        price: finalRetailPrice,
        selling_price: finalRetailPrice,
        retail_price: finalRetailPrice,
        min_price: finalRetailPrice,
        max_price: finalRetailPrice,
        minPrice: finalRetailPrice,
        maxPrice: finalRetailPrice,
        category,
        tags: tagsArr,
        thumbnailUrl: coverUrl,
        thumbnail_url: coverUrl,
        images: imagesArr,
        status: status || 'active',
        is_active: true,
        isActive: true,
        variantPrices: variantPrices || [],
      };
      // Only send markupPercentage to backend PUT if no retail price was specified,
      // to avoid triggering legacy backend recalculation
      if (finalRetailPrice == null && markupVal !== null) {
        backendPayload.markupPercentage = markupVal;
        backendPayload.markup_percentage = markupVal;
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authHeader) headers['Authorization'] = authHeader;

      const backendRes = await fetch(`${BACKEND_URL}/api/products/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(backendPayload),
      });

      if (!backendRes.ok) {
        console.warn(`[Product Update Route] Backend PUT returned ${backendRes.status}:`, await backendRes.text().catch(() => ''));
      }

      // Re-affirm PostgreSQL update to prevent any backend overwrite
      try {
        if (finalRetailPrice != null && finalRetailPrice > 0) {
          await queryDb(
            `UPDATE products SET base_price = $1, markup_percentage = COALESCE($2, markup_percentage), updated_at = NOW() WHERE id = $3`,
            [finalRetailPrice, markupVal, id]
          );
          if (Array.isArray(variantPrices) && variantPrices.length > 0) {
            for (const vp of variantPrices) {
              const vpPrice = vp.price ? ensure99Pricing(vp.price) : finalRetailPrice;
              if (vpPrice > 0) {
                await queryDb(
                  `UPDATE product_variants SET price = $1, updated_at = NOW() WHERE (id = $2 OR printify_variant_id = $2) AND product_id = $3`,
                  [vpPrice, vp.id || vp.printify_variant_id, id]
                );
              }
            }
          }
        }
      } catch (reaffirmErr: any) {
        console.warn(`[Product Update Route] Post-sync reaffirm notice:`, reaffirmErr.message);
      }
    } catch (backendErr: any) {
      console.warn(`[Product Update Route] Backend forward error:`, backendErr.message);
    }

    return NextResponse.json({
      success: true,
      productId: id,
      price: finalRetailPrice,
      message: finalRetailPrice != null 
        ? `Product ${id} updated to $${finalRetailPrice.toFixed(2)} successfully`
        : `Product ${id} updated successfully`,
    });
  } catch (err: any) {
    console.error(`[Product Update Route] Unexpected error:`, err);
    return NextResponse.json({ error: err?.message || 'Failed to update product' }, { status: 500 });
  }
}
