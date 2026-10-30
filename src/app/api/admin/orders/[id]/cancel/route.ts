import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/getApiUrl';
import { requireAdminAuth } from '@/lib/serverAuth';

// Cancellation (Printify cancel, Stripe refund, DB updates, customer email) is handled by the backend.
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdminAuth(request);
  if (!authResult.authorized) return authResult.response;

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const res = await fetch(`${getApiUrl()}/api/admin/orders/${encodeURIComponent(id)}/cancel`, {
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
    console.error('[Admin Cancel Order Proxy] Error:', error?.message || error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 502 });
  }
}
