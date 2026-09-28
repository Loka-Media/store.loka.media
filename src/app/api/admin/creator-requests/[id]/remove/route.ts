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
    const deactivateProducts = body.deactivateProducts !== false; // default true

    if (!id) {
      return NextResponse.json({ error: 'Request ID or User ID is required' }, { status: 400 });
    }

    // 1. Find the creator request
    const reqRows = await queryDb<any>(
      `SELECT cr.*, u.id as user_table_id, u.email as user_email, u.name as user_name, u.role as user_role
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
      // If not found in creator_requests, check users table directly
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

    // 2. Update creator_requests status to 'rejected'
    if (targetRequestId) {
      await queryDb(
        `UPDATE creator_requests 
         SET status = 'rejected', updated_at = NOW() 
         WHERE id = $1`,
        [targetRequestId]
      );
    } else if (targetUserId) {
      await queryDb(
        `UPDATE creator_requests 
         SET status = 'rejected', updated_at = NOW() 
         WHERE user_id = $1`,
        [targetUserId]
      );
    }

    // 3. Demote user role back to 'user' and creator_status to 'rejected'
    let deactivatedProductsCount = 0;
    if (targetUserId) {
      await queryDb(
        `UPDATE users 
         SET role = 'user', creator_status = 'rejected', updated_at = NOW() 
         WHERE id = $1`,
        [targetUserId]
      );

      // 4. Deactivate ALL products belonging to this creator
      if (deactivateProducts) {
        const prodResult = await queryDb<any>(
          `UPDATE products 
           SET status = 'inactive', updated_at = NOW() 
           WHERE created_by = $1
           RETURNING id`,
          [targetUserId]
        );
        deactivatedProductsCount = prodResult?.length || 0;

        // Clean up pending cart items containing this creator's products
        await queryDb(
          `DELETE FROM cart_items 
           WHERE product_id IN (SELECT id FROM products WHERE created_by = $1)`,
          [targetUserId]
        ).catch(() => null);

        // Clean up wishlist items containing this creator's products
        await queryDb(
          `DELETE FROM wishlist_items 
           WHERE product_id IN (SELECT id FROM products WHERE created_by = $1)`,
          [targetUserId]
        ).catch(() => null);
      }
    }

    // 5. Best-effort sync with backend service catalog.loka.media
    if (targetRequestId) {
      try {
        const authHeader = request.headers.get('authorization');
        const headers: Record<string, string> = {};
        if (authHeader) headers['Authorization'] = authHeader;
        await axios.post(
          `${getApiUrl()}/api/admin/creator-requests/${targetRequestId}/reject`,
          {},
          { headers, timeout: 5000 }
        ).catch(() => null);
      } catch (backendErr) {
        console.warn('[Remove Creator] Backend sync warning:', backendErr);
      }
    }

    // 6. Send email notification via internal route
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
            type: 'rejected',
          }),
        }).catch((e) => console.warn('Failed to send creator removal email:', e));
      } catch (e) {
        console.warn('Failed to trigger email notification:', e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Creator privileges revoked, status set to rejected, and active products deactivated.',
      userId: targetUserId,
      requestId: targetRequestId,
      deactivatedProductsCount,
    });
  } catch (error: any) {
    console.error('[Remove Creator Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove creator' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paramId } = await params;
    const body = await request.json().catch(() => ({}));
    const id = paramId || body?.id || body?.requestId;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Find request first
    const reqRows = await queryDb<any>(
      `SELECT * FROM creator_requests WHERE id::text = $1`,
      [id]
    );

    const targetUserId = reqRows?.[0]?.user_id;

    // Delete request
    await queryDb(`DELETE FROM creator_requests WHERE id::text = $1`, [id]);

    // Revert user if needed
    if (targetUserId) {
      await queryDb(
        `UPDATE users 
         SET role = 'user', creator_status = NULL, updated_at = NOW() 
         WHERE id = $1 AND role = 'creator'`,
        [targetUserId]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Creator request record permanently deleted.',
    });
  } catch (error: any) {
    console.error('[Delete Creator Request Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete creator request' },
      { status: 500 }
    );
  }
}
