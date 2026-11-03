import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { getApiUrl } from '@/lib/getApiUrl';
import axios from 'axios';

export async function POST(request: NextRequest) {
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
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to apply.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const rawUrl = body?.creatorUrl || body?.creator_url || body?.instagramUrl || '';
    const cleanUrl = String(rawUrl).trim();

    if (!cleanUrl) {
      return NextResponse.json(
        { error: 'Please provide your Instagram or social media profile link.' },
        { status: 400 }
      );
    }

    // 1. Fetch current user from DB
    const userRows = await queryDb<any>(
      `SELECT id, name, username, email, phone, role, creator_status FROM users WHERE id = $1 OR email = $2 LIMIT 1`,
      [userId || 0, userEmail || '']
    );

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    const currentUser = userRows[0];

    // Already an approved creator?
    if (currentUser.role === 'creator' && currentUser.creator_status === 'approved') {
      return NextResponse.json({
        success: true,
        message: 'Your creator account is already approved!',
        alreadyApproved: true
      });
    }

    // 2. Update users table with creator_status = 'pending' and creator_url
    await queryDb(
      `UPDATE users 
       SET creator_url = $1, creator_status = 'pending', updated_at = NOW() 
       WHERE id = $2`,
      [cleanUrl, currentUser.id]
    );

    // 3. Upsert in creator_requests table
    const existingReq = await queryDb<any>(
      `SELECT id FROM creator_requests WHERE user_id = $1 OR email = $2 LIMIT 1`,
      [currentUser.id, currentUser.email]
    );

    if (existingReq && existingReq.length > 0) {
      await queryDb(
        `UPDATE creator_requests 
         SET creator_url = $1, status = 'pending', updated_at = NOW() 
         WHERE id = $2`,
        [cleanUrl, existingReq[0].id]
      );
    } else {
      await queryDb(
        `INSERT INTO creator_requests (user_id, email, creator_url, status, created_at, updated_at)
         VALUES ($1, $2, $3, 'pending', NOW(), NOW())`,
        [
          currentUser.id,
          currentUser.email,
          cleanUrl
        ]
      );
    }

    // 4. Best-effort sync with backend service catalog.loka.media
    try {
      await axios.put(
        `${getApiUrl()}/api/auth/me`,
        { creator_url: cleanUrl, creatorUrl: cleanUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 4000
        }
      ).catch(() => null);
    } catch {}

    // 5. Best-effort email notification
    try {
      fetch(`${request.nextUrl.origin}/api/notifications/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: currentUser.email,
          name: currentUser.name || currentUser.username,
          type: 'pending_approval'
        })
      }).catch(() => null);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Your creator application has been submitted for review! You will be notified once approved.',
      creatorStatus: 'pending',
      creatorUrl: cleanUrl
    });
  } catch (error: any) {
    console.error('[CreatorApplyAPI] Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to submit application. Please try again.' },
      { status: 500 }
    );
  }
}

