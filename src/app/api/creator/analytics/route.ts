import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    let userId: number | null = null;
    let role = '';

    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.id || payload.userId || null;
        role = payload.role || '';
      } catch {
        // Token parse fallback
      }
    }

    const { searchParams } = new URL(request.url);
    const creatorIdParam = searchParams.get('creatorId');

    let targetCreatorId: number | null = null;
    if (role === 'admin') {
      if (creatorIdParam && creatorIdParam !== 'all') {
        targetCreatorId = parseInt(creatorIdParam, 10);
      }
    } else if (userId) {
      targetCreatorId = userId;
    } else if (creatorIdParam && creatorIdParam !== 'all') {
      targetCreatorId = parseInt(creatorIdParam, 10);
    }

    // 1. Get creator info if targeting a specific creator
    let creatorUsername = '';
    if (targetCreatorId) {
      const uRes = await queryDb<any>('SELECT username FROM users WHERE id = $1 LIMIT 1', [targetCreatorId]);
      if (uRes.length > 0 && uRes[0].username) {
        creatorUsername = uRes[0].username;
      }
    }

    // 2. Query real commission & sales metrics from creator_commission_tracking
    let commQuery = `
      SELECT 
        COUNT(id)::int as total_sales,
        COALESCE(SUM(CAST(creator_revenue AS numeric)), 0) as total_revenue
      FROM creator_commission_tracking
    `;
    const commParams: any[] = [];
    if (targetCreatorId) {
      commQuery += ` WHERE creator_id = $1`;
      commParams.push(targetCreatorId);
    }

    const commRes = await queryDb<any>(commQuery, commParams);
    const totalSales = parseInt(commRes[0]?.total_sales || '0', 10);
    const revenue = parseFloat(parseFloat(commRes[0]?.total_revenue || '0').toFixed(2));

    // 3. Query real views from storefront_views
    let viewsQuery = `SELECT COUNT(*)::int as count FROM storefront_views`;
    const viewsParams: any[] = [];
    if (targetCreatorId) {
      if (creatorUsername) {
        viewsQuery += ` WHERE creator_id = $1 OR creator_username = $2`;
        viewsParams.push(targetCreatorId, creatorUsername);
      } else {
        viewsQuery += ` WHERE creator_id = $1`;
        viewsParams.push(targetCreatorId);
      }
    }

    const viewsRes = await queryDb<any>(viewsQuery, viewsParams);
    let totalViews = parseInt(viewsRes[0]?.count || '0', 10);

    // If total sales exist but views were never logged before, baseline to at least sales
    if (totalViews < totalSales) {
      totalViews = totalSales;
    }

    const conversionRate = totalViews > 0 ? parseFloat(((totalSales / totalViews) * 100).toFixed(2)) : 0;

    // 4. Query real top-selling products
    let topProdQuery = `
      SELECT 
        c.product_id as id,
        COALESCE(p.name, 'Product #' || c.product_id) as name,
        COALESCE(p.thumbnail_url, '/placeholder-product.png') as image,
        COUNT(c.id)::int as sales,
        COALESCE(SUM(CAST(c.creator_revenue AS numeric)), 0) as revenue
      FROM creator_commission_tracking c
      LEFT JOIN products p ON p.id = c.product_id
    `;
    const topProdParams: any[] = [];
    if (targetCreatorId) {
      topProdQuery += ` WHERE c.creator_id = $1`;
      topProdParams.push(targetCreatorId);
    }
    topProdQuery += ` GROUP BY c.product_id, p.name, p.thumbnail_url ORDER BY sales DESC, revenue DESC LIMIT 5`;

    const topProdRes = await queryDb<any>(topProdQuery, topProdParams);
    const topProducts = topProdRes.map((r: any) => ({
      id: r.id,
      name: r.name,
      image: r.image || '/placeholder-product.png',
      sales: parseInt(r.sales || '0', 10),
      revenue: parseFloat(parseFloat(r.revenue || '0').toFixed(2)),
    }));

    return NextResponse.json({
      success: true,
      data: {
        totalViews,
        conversionRate,
        totalSales,
        revenue,
        topProducts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching creator analytics:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorSlug, creatorId } = body;

    if (!creatorSlug && !creatorId) {
      return NextResponse.json({ error: 'Missing creatorSlug or creatorId' }, { status: 400 });
    }

    let resolvedCreatorId = creatorId ? parseInt(creatorId, 10) : null;
    let resolvedUsername = creatorSlug ? String(creatorSlug).trim().toLowerCase() : '';

    if (!resolvedCreatorId && resolvedUsername) {
      const uRes = await queryDb<any>(
        'SELECT id, username FROM users WHERE LOWER(username) = $1 LIMIT 1',
        [resolvedUsername]
      );
      if (uRes.length > 0) {
        resolvedCreatorId = uRes[0].id;
        resolvedUsername = uRes[0].username;
      }
    } else if (resolvedCreatorId && !resolvedUsername) {
      const uRes = await queryDb<any>(
        'SELECT username FROM users WHERE id = $1 LIMIT 1',
        [resolvedCreatorId]
      );
      if (uRes.length > 0) {
        resolvedUsername = uRes[0].username;
      }
    }

    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'browser';

    await queryDb(
      `INSERT INTO storefront_views (creator_id, creator_username, viewer_ip, user_agent, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [resolvedCreatorId, resolvedUsername || creatorSlug, ip, userAgent]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error recording storefront view:', error);
    return NextResponse.json({ error: error.message || 'Failed to record view' }, { status: 500 });
  }
}
