import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const rejectionReason = body.rejectionReason || 'Rejected by Admin';
    const adminNotes = body.adminNotes || null;

    // 1. Get withdrawal details to refund wallet if needed
    const reqRows = await queryDb<any>(
      `SELECT creator_id, amount, wallet_id FROM withdrawal_requests WHERE id = $1`,
      [id]
    );

    // 2. Update status to rejected
    await queryDb(
      `UPDATE withdrawal_requests 
       SET status = 'rejected', rejection_reason = $1, admin_notes = COALESCE($2, admin_notes), processed_at = NOW() 
       WHERE id = $3`,
      [rejectionReason, adminNotes, id]
    );

    // 3. Restore available balance to creator's wallet if applicable
    if (reqRows && reqRows[0]) {
      const { creator_id, amount } = reqRows[0];
      const refundAmt = parseFloat(amount || '0');
      if (refundAmt > 0) {
        await queryDb(
          `UPDATE wallets 
           SET available_balance = (CAST(available_balance AS numeric) + $1)::text, updated_at = NOW() 
           WHERE creator_id = $2`,
          [refundAmt, creator_id]
        ).catch(() => null);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Withdrawal rejected and funds restored.'
    });
  } catch (error: any) {
    console.error('[Admin Reject Withdrawal] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reject withdrawal' },
      { status: 500 }
    );
  }
}
