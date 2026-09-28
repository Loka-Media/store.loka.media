import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { getApiUrl } from '@/lib/getApiUrl';
import axios from 'axios';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const body = await request.json().catch(() => ({}));
    const id = paramId || body?.id || body?.requestId;

    if (!id) {
      return NextResponse.json({ error: 'Request ID or User ID is required' }, { status: 400 });
    }

    // 1. Find the creator request
    const reqRows = await queryDb<any>(
      `SELECT cr.*, u.id as user_table_id, u.email as user_email, u.name as user_name
       FROM creator_requests cr
       LEFT JOIN users u ON cr.user_id = u.id
       WHERE cr.id::text = $1 OR cr.user_id::text = $1`,
      [id]
    );

    let targetUserId: number | null = null;
    let targetRequestId: number | null = null;
    let userEmail: string = '';
    let userName: string = '';

    if (reqRows && reqRows.length > 0) {
      const row = reqRows[0];
      targetRequestId = row.id;
      targetUserId = row.user_id || row.user_table_id || body.userId;
      userEmail = row.email || row.user_email || '';
      userName = row.user_name || row.name || '';
    } else {
      const userRows = await queryDb<any>(
        `SELECT id, email, name, role FROM users WHERE id::text = $1`,
        [id]
      );
      if (userRows && userRows.length > 0) {
        targetUserId = userRows[0].id;
        userEmail = userRows[0].email;
        userName = userRows[0].name;
      } else {
        return NextResponse.json({ error: `Creator or request with ID ${id} not found` }, { status: 404 });
      }
    }

    // 2. Update creator_requests status to 'approved'
    if (targetRequestId) {
      await queryDb(
        `UPDATE creator_requests 
         SET status = 'approved', updated_at = NOW() 
         WHERE id = $1`,
        [targetRequestId]
      );
    } else if (targetUserId) {
      await queryDb(
        `UPDATE creator_requests 
         SET status = 'approved', updated_at = NOW() 
         WHERE user_id = $1`,
        [targetUserId]
      );
    }

    // 3. Promote user role to 'creator' and creator_status to 'approved'
    if (targetUserId) {
      await queryDb(
        `UPDATE users 
         SET role = 'creator', creator_status = 'approved', updated_at = NOW() 
         WHERE id = $1`,
        [targetUserId]
      );
    }

    // 4. Best-effort sync with backend service catalog.loka.media
    if (targetRequestId) {
      try {
        const authHeader = request.headers.get('authorization');
        const headers: Record<string, string> = {};
        if (authHeader) headers['Authorization'] = authHeader;
        await axios.post(
          `${getApiUrl()}/api/admin/creator-requests/${targetRequestId}/approve`,
          {},
          { headers, timeout: 5000 }
        ).catch(() => null);
      } catch (backendErr) {
        console.warn('[Approve Creator] Backend sync warning:', backendErr);
      }
    }

    // 5. Send approval email notification via internal route
    if (userEmail) {
      try {
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
        const proto = request.headers.get('x-forwarded-proto') || 'https';
        const origin = request.headers.get('origin') || (host ? `${proto}://${host}` : undefined);
        fetch(`${origin || getApiUrl()}/api/notifications/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: userEmail,
            name: userName,
            type: 'approved',
            appUrl: origin || 'https://shop.loka.media',
          }),
        }).catch((e) => console.warn('Failed to send creator approval email:', e));
      } catch (e) {
        console.warn('Failed to trigger email notification:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Creator request approved and privileges granted.',
      userId: targetUserId,
      requestId: targetRequestId,
    });
  } catch (error: any) {
    console.error('[Approve Creator Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve creator' },
      { status: 500 }
    );
  }
}
