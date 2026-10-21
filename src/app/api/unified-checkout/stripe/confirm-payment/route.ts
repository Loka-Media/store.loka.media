import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { processOrderPaymentConfirmation } from '@/lib/orderPaymentConfirmation';

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
const ALLOWED_ORIGIN = 'https://store-loka-ui-v2-glksz.ondigitalocean.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { paymentIntentId, orderNumber } = body;

    // Security (C1, C4): Both paymentIntentId and orderNumber are strictly required
    if (!paymentIntentId || typeof paymentIntentId !== 'string' || paymentIntentId.trim().length === 0) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.trim().length === 0) {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    const cleanPaymentIntentId = paymentIntentId.trim();
    const cleanOrderNumber = orderNumber.trim();
    const authHeader = request.headers.get('authorization');

    // Forward to backend server (store-api.loka.media) which has the allowlisted IP in Stripe
    const backendRes = await axios.post(
      `${BACKEND_URL}/api/unified-checkout/stripe/confirm-payment`,
      {
        paymentIntentId: cleanPaymentIntentId,
        orderNumber: cleanOrderNumber,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': ALLOWED_ORIGIN,
          'Referer': `${ALLOWED_ORIGIN}/`,
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
      }
    );

    // Also synchronize local PostgreSQL database order record if it exists
    try {
      await processOrderPaymentConfirmation(cleanOrderNumber, {
        paymentIntentId: cleanPaymentIntentId,
        amount: backendRes.data?.paymentIntent?.amount || backendRes.data?.amount,
        currency: backendRes.data?.paymentIntent?.currency || 'usd',
        status: backendRes.data?.status || backendRes.data?.paymentIntent?.status || 'succeeded',
        metadata: backendRes.data?.paymentIntent?.metadata,
      });
    } catch (localDbErr) {
      console.warn('[Confirm Payment] Local DB sync note:', localDbErr);
    }

    return NextResponse.json(backendRes.data);
  } catch (error: any) {
    console.error('❌ [Stripe Confirm Payment Proxy] Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to confirm payment';
    return NextResponse.json({ error: msg }, { status });
  }
}
