import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminNotes = body.adminNotes || null;

    // Update withdrawal request status to completed
    await queryDb(
      `UPDATE withdrawal_requests 
       SET status = 'completed', admin_notes = COALESCE($1, admin_notes), processed_at = NOW() 
       WHERE id = $2`,
      [adminNotes, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Withdrawal approved and marked as completed.'
    });
  } catch (error: any) {
    console.error('[Admin Approve Withdrawal] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to approve withdrawal' },
      { status: 500 }
    );
  }
}
