import { NextRequest, NextResponse } from 'next/server';
import { syncPrintifyOrder, syncAllActivePrintifyOrders } from '@/services/printify/orderSync';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId') || searchParams.get('id');
    const orderNumber = searchParams.get('orderNumber');
    const printifyOrderId = searchParams.get('printifyOrderId');

    const identifier = orderId || orderNumber || printifyOrderId;

    if (identifier) {
      const result = await syncPrintifyOrder(identifier);
      return NextResponse.json({ success: result.success, data: result });
    }

    // If no identifier passed, sync up to 25 recent active orders
    const results = await syncAllActivePrintifyOrders(25);
    return NextResponse.json({
      success: true,
      syncedCount: results.length,
      data: results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync orders from Printify' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const identifier = body.orderId || body.orderNumber || body.printifyOrderId || body.id;

    if (!identifier) {
      // Sync batch of active orders
      const results = await syncAllActivePrintifyOrders(25);
      return NextResponse.json({
        success: true,
        syncedCount: results.length,
        data: results,
      });
    }

    const result = await syncPrintifyOrder(identifier);
    return NextResponse.json({ success: result.success, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync order from Printify' },
      { status: 500 }
    );
  }
}
