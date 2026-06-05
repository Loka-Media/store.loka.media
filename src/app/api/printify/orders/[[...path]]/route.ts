/**
 * Printify Orders API Routes
 * GET  /api/printify/orders               → list orders
 * POST /api/printify/orders               → create order
 * GET  /api/printify/orders/:id           → get order
 * POST /api/printify/orders/:id/production → send to production
 * POST /api/printify/orders/:id/cancel     → cancel order
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyOrdersAPI } from '@/services/printify/PrintifyClient';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];
    const searchParams = request.nextUrl.searchParams;

    // GET /api/printify/orders → list
    if (segments.length === 0) {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || undefined;
      const response = await printifyOrdersAPI.getOrders({ page, limit, status });
      return NextResponse.json({ success: true, data: response });
    }

    // GET /api/printify/orders/:id
    const orderId = segments[0];
    const order = await printifyOrdersAPI.getOrder(orderId);
    return NextResponse.json({ success: true, data: order });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Orders GET failed';
    console.error('[Printify Orders GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];
    const body = await request.json();

    // POST /api/printify/orders/:id/production
    if (segments.length === 2 && segments[1] === 'production') {
      const order = await printifyOrdersAPI.sendToProduction(segments[0]);
      return NextResponse.json({ success: true, data: order });
    }

    // POST /api/printify/orders/:id/cancel
    if (segments.length === 2 && segments[1] === 'cancel') {
      const order = await printifyOrdersAPI.cancelOrder(segments[0]);
      return NextResponse.json({ success: true, data: order });
    }

    // POST /api/printify/orders → create
    const order = await printifyOrdersAPI.createOrder(body);
    return NextResponse.json({ success: true, data: order }, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Orders POST failed';
    console.error('[Printify Orders POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
