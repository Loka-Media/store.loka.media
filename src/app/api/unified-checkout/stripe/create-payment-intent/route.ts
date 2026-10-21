import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import querystring from 'querystring';
import { queryDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderNumber, customerEmail } = body;

    // Security (C2): Validate orderNumber is present
    if (!orderNumber || typeof orderNumber !== 'string' || orderNumber.trim().length === 0) {
      return NextResponse.json({ error: 'Order number is required to create a payment intent' }, { status: 400 });
    }

    const cleanOrderNumber = orderNumber.trim();

    // 1. Check if the order already exists in marketplace_orders (Server-side ground truth)
    let finalCents: number;
    let currency = 'usd';
    let dbOrderId: number | null = null;

    try {
      const orders = await queryDb<any>(
        `SELECT id, order_number, customer_payment_amount, currency, payment_status, customer_email 
         FROM marketplace_orders 
         WHERE order_number = $1 
         LIMIT 1`,
        [cleanOrderNumber]
      );

      if (orders && orders.length > 0) {
        const order = orders[0];

        // Reject if already paid
        if (order.payment_status === 'released' || order.payment_status === 'escrowed') {
          return NextResponse.json(
            { error: 'Order has already been paid and processed' },
            { status: 400 }
          );
        }

        const trustedDbAmount = parseFloat(order.customer_payment_amount || '0');
        if (isNaN(trustedDbAmount) || trustedDbAmount <= 0) {
          return NextResponse.json({ error: 'Invalid order amount on server' }, { status: 400 });
        }

        // Verify client amount against server DB amount (prevent client tampering)
        if (amount !== undefined && amount !== null) {
          const clientAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
          if (!isNaN(clientAmount) && Math.abs(clientAmount - trustedDbAmount) > 0.05) {
            return NextResponse.json({
              error: 'Client payment amount does not match server order total',
              serverAmount: trustedDbAmount,
              clientAmount,
            }, { status: 400 });
          }
        }

        finalCents = Math.round(trustedDbAmount * 100);
        currency = String(order.currency || 'usd').toLowerCase();
        dbOrderId = order.id;
      } else {
        // Order not inserted yet (client creates payment intent before or during order insertion)
        const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }
        finalCents = Math.round(parsedAmount * 100);
      }
    } catch (dbErr) {
      console.warn('[CreatePaymentIntent] DB lookup fallback:', dbErr);
      const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      }
      finalCents = Math.round(parsedAmount * 100);
    }

    const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!secretKey) {
      console.error('[CreatePaymentIntent] Fatal: STRIPE_SECRET_KEY is missing');
      return NextResponse.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }

    const metadata: Record<string, string> = {
      orderNumber: cleanOrderNumber,
    };
    if (dbOrderId) {
      metadata.orderId = dbOrderId.toString();
    }

    const payload: Record<string, string> = {
      amount: finalCents.toString(),
      currency,
      'automatic_payment_methods[enabled]': 'true',
      description: `Order ${cleanOrderNumber}`,
      'metadata[orderNumber]': cleanOrderNumber,
    };

    if (customerEmail && typeof customerEmail === 'string' && customerEmail.includes('@')) {
      payload.receipt_email = customerEmail.trim();
    }
    if (dbOrderId) {
      payload['metadata[orderId]'] = dbOrderId.toString();
    }

    const res = await axios.post(
      'https://api.stripe.com/v1/payment_intents',
      querystring.stringify(payload),
      {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return NextResponse.json({
      success: true,
      clientSecret: res.data.client_secret,
      paymentIntentId: res.data.id,
      amount: finalCents,
      currency: res.data.currency,
    });
  } catch (error: any) {
    console.error('❌ [Stripe Payment Intent] Error:', error.response?.data || error.message);
    const msg = error.response?.data?.error?.message || error.message || 'Failed to create payment intent';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
