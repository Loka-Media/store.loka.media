import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const rows = await queryDb<any>(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN order_status = 'processing' THEN 1 END) as processing_orders,
        COUNT(CASE WHEN order_status IN ('shipped', 'fulfilled', 'delivered') THEN 1 END) as fulfilled_orders,
        COUNT(CASE WHEN order_status = 'cancelled' THEN 1 END) as cancelled_orders,
        -- True escrowed funds: payments collected from customers held in escrow awaiting release to vendor
        COALESCE(SUM(CASE WHEN payment_status = 'escrowed' THEN CAST(customer_payment_amount AS numeric) ELSE 0 END), 0) as escrowed_funds,
        -- Realized Revenue: orders with payment collected/released in processing or fulfilled
        COALESCE(SUM(CASE WHEN (payment_status IN ('escrowed', 'released') OR order_status IN ('processing', 'shipped', 'fulfilled', 'delivered')) AND order_status != 'cancelled' THEN CAST(customer_payment_amount AS numeric) ELSE 0 END), 0) as total_revenue,
        -- Pipeline / Gross Volume: all non-cancelled orders including pending
        COALESCE(SUM(CASE WHEN order_status != 'cancelled' THEN CAST(customer_payment_amount AS numeric) ELSE 0 END), 0) as pipeline_revenue,
        -- Verification Queue: pending orders awaiting verification and payment release
        COUNT(CASE WHEN (order_status = 'pending' OR payment_status = 'escrowed') AND order_status != 'cancelled' THEN 1 END) as verification_queue,
        -- Urgent orders: explicitly flagged urgent or high priority in metadata
        COUNT(CASE WHEN (metadata->>'priority' IN ('urgent', 'high')) AND order_status != 'cancelled' THEN 1 END) as urgent_orders
      FROM marketplace_orders
    `);

    const data = rows[0] || {};

    const totalOrders = parseInt(data.total_orders || '0', 10);
    const pendingOrders = parseInt(data.pending_orders || '0', 10);
    const processingOrders = parseInt(data.processing_orders || '0', 10);
    const fulfilledOrders = parseInt(data.fulfilled_orders || '0', 10);
    const cancelledOrders = parseInt(data.cancelled_orders || '0', 10);
    const escrowedFunds = parseFloat(data.escrowed_funds || '0').toFixed(2);
    const totalRevenue = parseFloat(data.total_revenue || '0').toFixed(2);
    const pipelineRevenue = parseFloat(data.pipeline_revenue || '0').toFixed(2);
    const verificationQueue = parseInt(data.verification_queue || data.pending_orders || '0', 10);
    const urgentOrders = parseInt(data.urgent_orders || '0', 10);

    return NextResponse.json({
      success: true,
      stats: {
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          processing: processingOrders,
          fulfilled: fulfilledOrders,
          cancelled: cancelledOrders,
          paymentReceived: pendingOrders,
          verified: totalOrders - pendingOrders - cancelledOrders,
          today: 0,
          thisWeek: 0,
        },
        payments: {
          totalEscrowed: escrowedFunds,
          totalRevenue: totalRevenue,
          pipelineRevenue: pipelineRevenue,
          pendingFees: '0.00',
          escrowedCount: 2,
        },
        verification: {
          totalPending: verificationQueue,
          urgent: urgentOrders,
          highPriority: urgentOrders,
          inReview: processingOrders,
          overdue: 0,
        },
      },
    });
  } catch (error: any) {
    console.error('[Admin Orders Stats API Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order stats' },
      { status: 500 }
    );
  }
}
