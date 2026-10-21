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
    const rejectionReason = body.rejectionReason || 'Rejected by Admin';
    const adminNotes = body.adminNotes || null;

    const withdrawalId = parseInt(id, 10);
    if (isNaN(withdrawalId)) {
      return NextResponse.json({ success: false, error: 'Invalid withdrawal ID' }, { status: 400 });
    }

    // 1. Atomically transition status from 'pending' to 'rejected' only
    // If it's already rejected or completed, this update affects 0 rows.
    const updateResult = await queryDb<any>(
      `UPDATE withdrawal_requests 
       SET status = 'rejected', rejection_reason = $1, admin_notes = COALESCE($2, admin_notes), processed_at = NOW() 
       WHERE id = $3 AND status = 'pending'
       RETURNING id, creator_id, amount, wallet_id`,
      [rejectionReason, adminNotes, withdrawalId]
    );

    if (!updateResult || updateResult.length === 0) {
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
          error: `Withdrawal request #${withdrawalId} cannot be rejected because its current status is '${existing[0].status}'. Replay prevented.`,
        },
        { status: 409 }
      );
    }

    // 2. ONLY restore available balance once upon verified transition from pending to rejected
    const { creator_id, amount, wallet_id } = updateResult[0];
    const refundAmt = parseFloat(amount || '0');

    if (refundAmt > 0) {
      if (wallet_id) {
        await queryDb(
          `UPDATE wallets 
           SET available_balance = (CAST(available_balance AS numeric) + $1)::text, updated_at = NOW() 
           WHERE id = $2`,
          [refundAmt, wallet_id]
        );
      } else {
        await queryDb(
          `UPDATE wallets 
           SET available_balance = (CAST(available_balance AS numeric) + $1)::text, updated_at = NOW() 
           WHERE creator_id = $2`,
          [refundAmt, creator_id]
        );
      }

      // 3. Mark the pending debit transaction as rejected and record a refund transaction
      await queryDb(
        `UPDATE wallet_transactions 
         SET status = 'rejected' 
         WHERE reference_id = $1 AND type = 'debit' AND status = 'pending'`,
        [withdrawalId.toString()]
      ).catch(() => null);

      if (wallet_id) {
        await queryDb(
          `INSERT INTO wallet_transactions 
           (wallet_id, type, amount, source, reference_id, status, description, created_at) 
           VALUES ($1, 'credit', $2, 'refund', $3, 'completed', $4, NOW())`,
          [wallet_id, refundAmt.toFixed(2), withdrawalId.toString(), `Refund for rejected withdrawal #${withdrawalId}: ${rejectionReason}`]
        ).catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal rejected and funds restored exactly once.',
      data: updateResult[0]
    });
  } catch (error: any) {
    console.error('[Admin Reject Withdrawal] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject withdrawal' },
      { status: 500 }
    );
  }
}
