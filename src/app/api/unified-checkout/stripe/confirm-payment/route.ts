import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/lib/getApiUrl';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, orderNumber } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    const authHeader = request.headers.get('authorization');

    // 1. Verify payment status directly with Stripe in test mode
    const stripeRes = await axios.get(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      }
    );

    const paymentIntent = stripeRes.data;

    // 2. Safely attempt notifying backend
    try {
      const backendUrl = `${getApiUrl()}/api/unified-checkout/stripe/confirm-payment`;
      await axios.post(
        backendUrl,
        { paymentIntentId, orderNumber },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { 'Authorization': authHeader } : {}),
          },
        }
      );
    } catch (backendError: any) {
      console.warn('⚠️ Backend confirmation notify note:', backendError.response?.data?.details || backendError.message);
    }

    return NextResponse.json({
      success: true,
      status: paymentIntent.status,
      paymentIntent,
      orderNumber,
    });
  } catch (error: any) {
    console.error('❌ [Local Stripe Confirm Payment] Error:', error.response?.data || error.message);
    const msg = error.response?.data?.error?.message || error.message || 'Failed to confirm payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


