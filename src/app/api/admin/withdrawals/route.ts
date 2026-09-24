import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    let withdrawals: any[] = [];
    let dbSuccess = false;

    try {
      withdrawals = await queryDb<any>(
        `SELECT 
          w.id,
          w.creator_id,
          w.amount,
          w.payout_method,
          w.status,
          w.stripe_payout_id,
          w.metadata,
          w.admin_notes,
          w.rejection_reason,
          w.processed_at,
          w.created_at,
          COALESCE(u.name, 'Creator #' || w.creator_id) as creator_name,
          COALESCE(u.email, 'creator' || w.creator_id || '@store.loka.media') as creator_email,
          COALESCE(u.username, 'creator' || w.creator_id) as creator_username,
          u.stripe_connect_account_id,
          COALESCE(u.stripe_onboarding_complete, false) as stripe_onboarding_complete
        FROM withdrawal_requests w
        LEFT JOIN users u ON w.creator_id = u.id
        ORDER BY w.created_at DESC`
      );
      if (Array.isArray(withdrawals) && withdrawals.length > 0) {
        dbSuccess = true;
      }
    } catch (dbErr) {
      console.warn('[Admin Withdrawals] DB query error, falling back:', dbErr);
    }

    if (!dbSuccess) {
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
      const authHeader = request.headers.get('authorization') || '';
      try {
        const headers: Record<string, string> = {};
        if (authHeader) headers['Authorization'] = authHeader;

        const res = await fetch(`${backendUrl}/api/admin/withdrawals`, { headers }).catch(() => null);
        if (res && res.ok) {
          const json = await res.json();
          withdrawals = json?.data || [];
        }
      } catch (fetchErr) {
        console.warn('[Admin Withdrawals] Backend fallback error:', fetchErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: withdrawals
    });
  } catch (error: any) {
    console.error('[Admin Withdrawals] Route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch withdrawals' },
      { status: 500 }
    );
  }
}
