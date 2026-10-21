import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/lib/getApiUrl';
import { processOrderPaymentConfirmation } from '@/lib/orderPaymentConfirmation';

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
    const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    const authHeader = request.headers.get('authorization');

    if (!secretKey) {
      console.error('[Confirm Payment] Fatal: STRIPE_SECRET_KEY is missing');
      return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }

    // 1. Verify payment status directly with Stripe
    const stripeRes = await axios.get(
      `https://api.stripe.com/v1/payment_intents/${cleanPaymentIntentId}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
        },
      }
    );

    const paymentIntent = stripeRes.data;

    // 2. Perform secure, verified, idempotent confirmation (C1, C4, C15)
    const confirmationResult = await processOrderPaymentConfirmation(cleanOrderNumber, {
      paymentIntentId: cleanPaymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      metadata: paymentIntent.metadata,
    });

    if (!confirmationResult.success) {
      console.warn(`[Confirm Payment] Validation rejected for order ${cleanOrderNumber}:`, confirmationResult.error);
      return NextResponse.json(
        { success: false, error: confirmationResult.error },
        { status: 400 }
      );
    }

    // 3. Safely notify backend for compatibility
    try {
      const backendUrl = `${getApiUrl()}/api/unified-checkout/stripe/confirm-payment`;
      await axios.post(
        backendUrl,
        { paymentIntentId: cleanPaymentIntentId, orderNumber: cleanOrderNumber },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
        }
      );
    } catch (backendError: any) {
      console.warn('⚠️ Backend confirmation notify note:', backendError.response?.data?.details || backendError.message);
    }

    return NextResponse.json({
      success: true,
      alreadyProcessed: confirmationResult.alreadyProcessed || false,
      status: paymentIntent.status,
      paymentIntent,
      orderNumber: cleanOrderNumber,
    });
  } catch (error: any) {
    console.error('❌ [Local Stripe Confirm Payment] Error:', error.response?.data || error.message);
    const msg = error.response?.data?.error?.message || error.message || 'Failed to confirm payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
