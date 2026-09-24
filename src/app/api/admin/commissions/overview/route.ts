import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    let totalCommissionsTracked = 0;
    let totalCommissionsAmount = 0;
    let pendingCommissions = 0;
    let processingCommissions = 0;
    let paidCommissions = 0;
    let refundedCommissions = 0;
    let totalPayouts = 0;
    let totalPayoutAmount = 0;
    let creatorsWithPendingPayouts = 0;

    let dbSuccess = false;

    try {
      // 1. Query creator_commission_tracking
      const commStats = await queryDb<any>(
        `SELECT 
          COUNT(*) as total_count,
          COALESCE(SUM(CAST(creator_revenue AS numeric)), 0) as total_amount,
          COUNT(*) FILTER (WHERE status IN ('pending', 'processing')) as pending_count,
          COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
          COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
          COUNT(*) FILTER (WHERE status IN ('refunded', 'cancelled')) as refunded_count
        FROM creator_commission_tracking`
      );

      if (commStats && commStats[0]) {
        totalCommissionsTracked = parseInt(commStats[0].total_count || '0', 10);
        totalCommissionsAmount = parseFloat(commStats[0].total_amount || '0');
        pendingCommissions = parseInt(commStats[0].pending_count || '0', 10);
        processingCommissions = parseInt(commStats[0].processing_count || '0', 10);
        paidCommissions = parseInt(commStats[0].paid_count || '0', 10);
        refundedCommissions = parseInt(commStats[0].refunded_count || '0', 10);
        if (totalCommissionsTracked > 0) dbSuccess = true;
      }

      // 2. Query withdrawal requests
      try {
        const withdrawalStats = await queryDb<any>(
          `SELECT 
            COUNT(*) FILTER (WHERE status = 'completed') as settled_count,
            COALESCE(SUM(CAST(amount AS numeric)) FILTER (WHERE status = 'completed'), 0) as settled_amount,
            COUNT(DISTINCT creator_id) FILTER (WHERE status = 'pending') as pending_creators
          FROM withdrawal_requests`
        );
        if (withdrawalStats && withdrawalStats[0]) {
          totalPayouts = parseInt(withdrawalStats[0].settled_count || '0', 10);
          totalPayoutAmount = parseFloat(withdrawalStats[0].settled_amount || '0');
          creatorsWithPendingPayouts = parseInt(withdrawalStats[0].pending_creators || '0', 10);
        }
      } catch (e) {
        // withdrawal_requests table query fallback
      }
    } catch (dbErr) {
      console.warn('[Admin Commissions Overview] Direct DB query error:', dbErr);
    }

    // 3. Fallback to backend / earnings query if DB commission tracking was empty
    if (!dbSuccess || totalCommissionsAmount === 0) {
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
      const authHeader = request.headers.get('authorization') || '';
      try {
        const headers: Record<string, string> = {};
        if (authHeader) headers['Authorization'] = authHeader;

        const earningsRes = await fetch(`${backendUrl}/api/admin/creators/earnings`, { headers }).catch(() => null);
        if (earningsRes && earningsRes.ok) {
          const json = await earningsRes.json();
          const earningsList: any[] = json?.data || [];
          if (Array.isArray(earningsList) && earningsList.length > 0) {
            totalCommissionsAmount = earningsList.reduce((sum, e) => sum + (parseFloat(e.totalEarned) || 0), 0);
            totalCommissionsTracked = earningsList.reduce((sum, e) => sum + (parseInt(e.commissionsCount) || 1), 0);
            pendingCommissions = earningsList.filter(e => parseFloat(e.pendingAmount) > 0).length;
            totalPayoutAmount = earningsList.reduce((sum, e) => sum + (parseFloat(e.processedAmount) || 0), 0);
          }
        }
      } catch (fetchErr) {
        console.warn('[Admin Commissions Overview] Backend fallback error:', fetchErr);
      }
    }

    const averageCommission = totalCommissionsTracked > 0 
      ? Math.round((totalCommissionsAmount / totalCommissionsTracked) * 100) / 100 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCommissionsTracked,
        totalCommissionsAmount,
        pendingCommissions: pendingCommissions || processingCommissions,
        processingCommissions,
        paidCommissions,
        refundedCommissions,
        averageCommission,
        totalPayouts,
        totalPayoutAmount,
        creatorsWithPendingPayouts
      }
    });
  } catch (error: any) {
    console.error('[Admin Commissions Overview] Route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch commissions overview' },
      { status: 500 }
    );
  }
}
