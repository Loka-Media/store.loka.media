import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { ensure99Pricing } from '@/lib/pricing-utils';
import { sanitizeProductTitle, sanitizeProductDescription } from '@/lib/productSanitizer';

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10), 1), 1000);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);
    const category = searchParams.get('category')?.trim() || '';
    const creator = searchParams.get('creator')?.trim() || '';
    const search = searchParams.get('search')?.trim() || '';
    const source = searchParams.get('source')?.trim() || '';
    const statusParam = searchParams.get('status')?.trim() || 'active';
    const sortBy = searchParams.get('sortBy') || 'id';
    const sortOrder = searchParams.get('sortOrder')?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Attempt direct PostgreSQL query first for maximum speed and data freshness
    try {
      const conditions: string[] = [];
      const queryParams: any[] = [];

      // 1. Status filter
      if (statusParam && statusParam !== 'all') {
        queryParams.push(statusParam);
        conditions.push(`p.status = $${queryParams.length}`);
      }

      // 2. Category filter
      if (category && category !== 'all') {
        queryParams.push(`%${category}%`);
        conditions.push(`p.category ILIKE $${queryParams.length}`);
      }

      // 3. Source filter
      if (source && source !== 'all') {
        queryParams.push(source);
        conditions.push(`p.source = $${queryParams.length}`);
      }

      // 4. Creator filter (matches username, name, or user_id)
      if (creator && creator !== 'all') {
        queryParams.push(creator.toLowerCase());
        conditions.push(`(
          LOWER(u.username) = $${queryParams.length} 
          OR LOWER(u.name) = $${queryParams.length}
          OR CAST(p.created_by AS TEXT) = $${queryParams.length}
        )`);
      }

      // 5. Search query (title, description, category, tags, creator name)
      if (search) {
        queryParams.push(`%${search}%`);
        const idx = queryParams.length;
        conditions.push(`(
          p.name ILIKE $${idx}
          OR p.description ILIKE $${idx}
          OR p.category ILIKE $${idx}
          OR u.name ILIKE $${idx}
          OR u.username ILIKE $${idx}
          OR EXISTS (
            SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE $${idx}
          )
        )`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Count total matching items
      const countQuery = `
        SELECT COUNT(DISTINCT p.id) as total
        FROM products p
        LEFT JOIN users u ON u.id = p.created_by
        ${whereClause}
      `;
      const countRes = await queryDb<{ total: string }>(countQuery, queryParams);
      const total = parseInt(countRes[0]?.total || '0', 10);

      // Add pagination params
      queryParams.push(limit);
      const limitIdx = queryParams.length;
      queryParams.push(offset);
      const offsetIdx = queryParams.length;

      // Determine order column
      let orderCol = 'p.id';
      if (sortBy === 'created_at') orderCol = 'p.created_at';
      else if (sortBy === 'name') orderCol = 'p.name';
      else if (sortBy === 'base_price' || sortBy === 'price') orderCol = 'p.base_price';

      const dataQuery = `
        SELECT 
          p.id,
          p.name,
          p.description,
          p.base_price,
          p.markup_percentage,
          p.category,
          p.tags,
          p.thumbnail_url,
          p.images,
          p.status,
          p.source,
          p.created_by as creator_id,
          p.created_at,
          p.updated_at,
          p.regional_settings,
          u.name as creator_name,
          u.username as creator_username,
          json_build_object(
            'id', u.id,
            'name', COALESCE(u.name, 'Creator'),
            'username', COALESCE(u.username, 'creator')
          ) as creator,
          COALESCE(
            json_agg(
              json_build_object(
                'id', pv.id,
                'product_id', pv.product_id,
                'printify_variant_id', pv.printify_variant_id,
                'name', pv.title,
                'title', pv.title,
                'price', pv.price,
                'cost', pv.base_cost,
                'base_cost', pv.base_cost,
                'size', pv.size,
                'color', pv.color,
                'sku', pv.sku,
                'image_url', pv.image_url,
                'is_available', COALESCE(pv.available_for_sale, true)
              )
            ) FILTER (WHERE pv.id IS NOT NULL),
            '[]'::json
          ) as variants
        FROM products p
        LEFT JOIN users u ON u.id = p.created_by
        LEFT JOIN product_variants pv ON pv.product_id = p.id
        ${whereClause}
        GROUP BY p.id, u.id, u.name, u.username
        ORDER BY ${orderCol} ${sortOrder}
        LIMIT $${limitIdx} OFFSET $${offsetIdx};
      `;

      const dataRes = await queryDb<any>(dataQuery, queryParams);

      const products = dataRes.map((row) => {
        const basePriceNum = parseFloat(row.base_price || '0');
        const markupNum = parseFloat(row.markup_percentage || '0');

        let variantPrices: number[] = [];
        if (Array.isArray(row.variants)) {
          variantPrices = row.variants
            .map((v: any) => parseFloat(v.price || '0'))
            .filter((p: number) => p > 0);
        }

        let minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : basePriceNum;
        let maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : basePriceNum;
        if (minPrice <= 0) minPrice = basePriceNum;
        if (maxPrice <= 0) maxPrice = minPrice;

        minPrice = ensure99Pricing(minPrice);
        maxPrice = ensure99Pricing(maxPrice);
        const finalBase = ensure99Pricing(basePriceNum);

        const thumb =
          row.thumbnail_url ||
          (Array.isArray(row.images) && row.images[0]) ||
          '/placeholder-product.png';

        const imageList =
          Array.isArray(row.images) && row.images.length > 0
            ? row.images
            : [thumb];

        return {
          id: row.id,
          name: sanitizeProductTitle(row.name),
          description: sanitizeProductDescription(row.description || ''),
          base_price: finalBase,
          markup_percentage: markupNum,
          min_price: minPrice,
          max_price: maxPrice,
          selling_price: minPrice,
          retail_price: minPrice,
          price: minPrice,
          status: row.status,
          is_active: row.status === 'active',
          category: row.category || 'General',
          tags: Array.isArray(row.tags) ? row.tags : [],
          thumbnail_url: thumb,
          images: imageList,
          source: row.source || 'printify',
          creator_id: row.creator_id,
          creator_name: row.creator_name || 'Creator',
          creator_username: row.creator_username || 'creator',
          creator: row.creator,
          variants: Array.isArray(row.variants)
            ? row.variants.map((v: any) => ({
                ...v,
                price: ensure99Pricing(v.price) || minPrice,
              }))
            : [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          regional_settings: row.regional_settings,
        };
      });

      return NextResponse.json({
        products,
        pagination: {
          total,
          limit,
          offset,
          hasNext: offset + limit < total,
        },
      });
    } catch (dbErr: any) {
      console.warn('[API /api/products] DB query error, attempting backend proxy:', dbErr.message);

      // Fallback: proxy to backend service catalog.loka.media
      const queryString = searchParams.toString();
      const targetUrl = `${BACKEND_URL}/api/products${queryString ? `?${queryString}` : ''}`;
      const backendRes = await fetch(targetUrl, {
        headers: {
          Authorization: request.headers.get('authorization') || '',
          Origin: 'https://store-loka-ui-v2-glksz.ondigitalocean.app',
          Referer: 'https://store-loka-ui-v2-glksz.ondigitalocean.app/',
        },
        cache: 'no-store',
      });

      if (!backendRes.ok) {
        throw new Error(`Backend returned status ${backendRes.status}`);
      }

      const backendData = await backendRes.json();
      if (backendData && Array.isArray(backendData.products)) {
        backendData.products = backendData.products.map((p: any) => ({
          ...p,
          name: sanitizeProductTitle(p.name || p.title),
          description: sanitizeProductDescription(p.description),
        }));
      }
      return NextResponse.json(backendData);
    }
  } catch (error: any) {
    console.error('[API /api/products] Error:', error);
    return NextResponse.json(
      {
        products: [],
        pagination: { total: 0, limit: 50, offset: 0, hasNext: false },
        error: error.message || 'Failed to fetch products',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    let sanitizedBody = body;
    try {
      const parsed = JSON.parse(body);
      if (parsed.name) parsed.name = sanitizeProductTitle(parsed.name);
      if (parsed.description) parsed.description = sanitizeProductDescription(parsed.description);
      sanitizedBody = JSON.stringify(parsed);
    } catch {}

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Origin: 'https://store-loka-ui-v2-glksz.ondigitalocean.app',
      Referer: 'https://store-loka-ui-v2-glksz.ondigitalocean.app/',
    };

    const auth = request.headers.get('authorization');
    if (auth) headers['Authorization'] = auth;

    const res = await fetch(`${BACKEND_URL}/api/products`, {
      method: 'POST',
      headers,
      body: sanitizedBody,
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API POST /api/products] Error:', err);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}

