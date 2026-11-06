import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const rows = await queryDb<any>(`
      SELECT 
        cr.id,
        cr.user_id as "userId",
        COALESCE(u.name, 'Creator') as name,
        COALESCE(u.username, 'creator') as username,
        COALESCE(cr.email, u.email) as email,
        u.phone,
        cr.creator_url as "creatorUrl",
        cr.status,
        cr.created_at as "createdAt",
        cr.updated_at as "updatedAt"
      FROM creator_requests cr
      LEFT JOIN users u ON cr.user_id = u.id
      ORDER BY cr.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      requests: rows || [],
      count: rows?.length || 0,
    });
  } catch (error: any) {
    console.error('[Admin Creator Requests API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch creator requests' },
      { status: 500 }
    );
  }
}

