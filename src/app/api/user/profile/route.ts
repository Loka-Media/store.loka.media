import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    let userId: number | null = null;
    let userEmail: string | null = null;

    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.id || payload.userId || null;
        userEmail = payload.email || null;
      } catch {
        // Token parse failed
      }
    }

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let rows: any[] = [];
    if (userId) {
      rows = await queryDb<any>(
        'SELECT id, name, username, email, phone, role, created_at FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );
    }
    if (rows.length === 0 && userEmail) {
      rows = await queryDb<any>(
        'SELECT id, name, username, email, phone, role, created_at FROM users WHERE email = $1 LIMIT 1',
        [userEmail]
      );
    }

    if (rows.length > 0) {
      return NextResponse.json({ user: rows[0] });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
