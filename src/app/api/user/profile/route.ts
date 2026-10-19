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
        'SELECT id, name, username, email, phone, role, created_at, profile_img, creator_url FROM users WHERE id = $1 LIMIT 1',
        [userId]
      );
    }
    if (rows.length === 0 && userEmail) {
      rows = await queryDb<any>(
        'SELECT id, name, username, email, phone, role, created_at, profile_img, creator_url FROM users WHERE email = $1 LIMIT 1',
        [userEmail]
      );
    }

    if (rows.length > 0) {
      let creatorUrl = rows[0].creator_url;
      if (!creatorUrl) {
        const crRows = await queryDb<any>(
          `SELECT creator_url FROM creator_requests WHERE (user_id = $1 OR email = $2) AND creator_url IS NOT NULL AND creator_url != '' ORDER BY id DESC LIMIT 1`,
          [rows[0].id, rows[0].email]
        );
        creatorUrl = crRows[0]?.creator_url;
      }
      rows[0].creator_url = creatorUrl || null;
      rows[0].creatorUrl = creatorUrl || null;
      return NextResponse.json({ user: rows[0] });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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
      } catch {}
    }

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, profile_img } = body;
    const incomingUrl = body.creatorUrl !== undefined ? body.creatorUrl : body.creator_url;

    if (name) {
      await queryDb('UPDATE users SET name = $1 WHERE id = $2 OR email = $3', [name, userId || 0, userEmail || '']);
    }
    if (phone) {
      await queryDb('UPDATE users SET phone = $1 WHERE id = $2 OR email = $3', [phone, userId || 0, userEmail || '']);
    }
    if (profile_img) {
      await queryDb('UPDATE users SET profile_img = $1 WHERE id = $2 OR email = $3', [profile_img, userId || 0, userEmail || '']);
    }
    if (incomingUrl !== undefined) {
      const cleanUrl = incomingUrl ? String(incomingUrl).trim() : null;
      await queryDb('UPDATE users SET creator_url = $1, updated_at = NOW() WHERE id = $2 OR email = $3', [cleanUrl, userId || 0, userEmail || '']);
      await queryDb('UPDATE creator_requests SET creator_url = $1, updated_at = NOW() WHERE user_id = $2 OR email = $3', [cleanUrl, userId || 0, userEmail || '']);
    }

    const updatedRows = await queryDb<any>(
      'SELECT id, name, username, email, phone, role, created_at, profile_img, creator_url FROM users WHERE id = $1 OR email = $2 LIMIT 1',
      [userId || 0, userEmail || '']
    );

    if (updatedRows.length > 0) {
      updatedRows[0].creatorUrl = updatedRows[0].creator_url;
      return NextResponse.json({ success: true, user: updatedRows[0] });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
