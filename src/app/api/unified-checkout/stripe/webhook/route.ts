import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '@/lib/getApiUrl';

// Stripe webhooks are verified and processed by the backend (store-api /api/webhooks/stripe).
// This route only forwards the untouched raw body and signature header.
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const res = await fetch(`${getApiUrl()}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': request.headers.get('stripe-signature') || '',
      },
      body: rawBody,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    console.error('[Stripe Webhook Proxy] Error:', error?.message || error);
    return NextResponse.json({ error: 'Webhook forwarding failed' }, { status: 502 });
  }
}
