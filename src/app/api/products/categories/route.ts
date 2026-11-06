import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    try {
      const rows = await queryDb<{ category: string; product_count: string }>(`
        SELECT category, count(*)::text as product_count
        FROM products
        WHERE status = 'active' AND category IS NOT NULL AND TRIM(category) != ''
        GROUP BY category
        ORDER BY count(*) DESC;
      `);

      if (rows && rows.length > 0) {
        return NextResponse.json({
          categories: rows.map(r => ({
            category: r.category,
            product_count: parseInt(r.product_count, 10),
          }))
        });
      }
    } catch (dbErr: any) {
      console.warn('[API /api/products/categories] DB fallback to backend:', dbErr.message);
    }

    // Fallback to backend service
    const res = await fetch(`${BACKEND_URL}/api/products/categories`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ categories: [] });
  } catch (err: any) {
    console.error('[API /api/products/categories] Error:', err);
    return NextResponse.json({ categories: [] });
  }
}

