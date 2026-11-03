import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');

export async function GET(request: NextRequest) {
  try {
    try {
      const rows = await queryDb<any>(`
        SELECT 
          u.id, 
          u.name, 
          u.username, 
          u.profile_img, 
          count(p.id)::text as product_count,
          min(p.created_at) as first_product_date
        FROM products p
        JOIN users u ON u.id = p.created_by
        WHERE p.status = 'active'
        GROUP BY u.id, u.name, u.username, u.profile_img
        HAVING count(p.id) > 0
        ORDER BY count(p.id) DESC;
      `);

      if (rows && rows.length > 0) {
        return NextResponse.json({
          creators: rows.map(r => ({
            id: r.id,
            name: r.name || r.username || 'Creator',
            username: r.username || 'creator',
            profile_img: r.profile_img || null,
            product_count: parseInt(r.product_count, 10),
            first_product_date: r.first_product_date,
          }))
        });
      }
    } catch (dbErr: any) {
      console.warn('[API /api/products/creators] DB fallback to backend:', dbErr.message);
    }

    // Fallback to backend service
    const res = await fetch(`${BACKEND_URL}/api/products/creators`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ creators: [] });
  } catch (err: any) {
    console.error('[API /api/products/creators] Error:', err);
    return NextResponse.json({ creators: [] });
  }
}

