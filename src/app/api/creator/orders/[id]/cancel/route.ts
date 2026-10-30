import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/getApiUrl';

// Cancellation (Printify cancel, Stripe refund, DB updates, customer email) is handled by
// the backend, which also checks that the caller owns the order or is an admin.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const res = await fetch(`${getApiUrl()}/api/creator/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: request.headers.get('authorization') || '',
      },
      body: (await request.text()) || '{}',
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Cancel Order Proxy] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 502 });
  }
}
