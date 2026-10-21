import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
const ALLOWED_ORIGIN = 'https://store-loka-ui-v2-glksz.ondigitalocean.app';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderNumber, customerEmail } = body;

    // Security (C2): Validate orderNumber is present
    if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.trim().length === 0) {
      return NextResponse.json({ error: 'Order number is required to create a payment intent' }, { status: 400 });
    }

    const cleanOrderNumber = orderNumber.trim();
    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');

    // Forward to backend server (store-api.loka.media) which has the key and allowed IP in Stripe
    const backendRes = await axios.post(
      `${BACKEND_URL}/api/unified-checkout/stripe/create-payment-intent`,
      {
        amount: parsedAmount,
        orderNumber: cleanOrderNumber,
        customerEmail: customerEmail && typeof customerEmail === 'string' ? customerEmail.trim() : undefined,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Origin': ALLOWED_ORIGIN,
          'Referer': `${ALLOWED_ORIGIN}/`,
          ...(authHeader ? { 'Authorization': authHeader } : {}),
        },
      }
    );

    return NextResponse.json(backendRes.data);
  } catch (error: any) {
    console.error('❌ [Stripe Payment Intent Proxy] Error:', error.response?.data || error.message);
    const status = error.response?.status || 500;
    const msg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create payment intent';
    return NextResponse.json({ error: msg }, { status });
  }
}

