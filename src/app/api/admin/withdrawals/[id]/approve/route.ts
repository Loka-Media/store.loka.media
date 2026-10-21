import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { requireAdminAuth } from '@/lib/serverAuth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Security (C9): Require verified admin role
  const auth = await requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNotes = body.adminNotes || null;

    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return NextResponse.json({ success: false, error: 'Invalid withdrawal ID' }, { status: 400 });
    }

    // Atomically transition status from 'pending' to 'completed' only
    const updateResult = await queryDb<any>(
      `UPDATE withdrawal_requests 
       SET status = 'completed', admin_notes = COALESCE($1, admin_notes), processed_at = NOW() 
       WHERE id = $2 AND status = 'pending'
       RETURNING id, creator_id, amount, wallet_id`,
      [adminNotes, withdrawalId]
    );

    if (!updateResult || updateResult.length === 0) {
      // Check current status to give precise non-duplicating error response
      const existing = await queryDb<any>(
        `SELECT id, status FROM withdrawal_requests WHERE id = $1`,
        [withdrawalId]
      );

      if (!existing || existing.length === 0) {
        return NextResponse.json({ success: false, error: 'Withdrawal request not found' }, { status: 404 });
      }

      return NextResponse.json(
        {
          success: false,
          error: `Withdrawal request #${withdrawalId} cannot be approved because its current status is '${existing[0].status}'.`,
        },
        { status: 409 }
      );
    }

    // Update corresponding pending wallet_transactions record
    await queryDb(
      `UPDATE wallet_transactions 
       SET status = 'completed' 
       WHERE reference_id = $1 AND type = 'debit' AND status = 'pending'`,
      [withdrawalId.toString()]
    ).catch(err => console.warn('[Admin Approve Withdrawal] Transaction status update warning:', err));

    return NextResponse.json({
      success: true,
      message: 'Withdrawal approved and marked as completed.',
      data: updateResult[0]
    });
  } catch (error: any) {
    console.error('[Admin Approve Withdrawal] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve withdrawal' },
      { status: 500 }
    );
  }
}
