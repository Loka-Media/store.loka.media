import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import querystring from 'querystring';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, orderNumber, customerEmail } = body;

    const parsedAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const cents = Math.round(parsedAmount * 100);
    const secretKey = process.env.STRIPE_SECRET_KEY;

    const res = await axios.post(
      'https://api.stripe.com/v1/payment_intents',
      querystring.stringify({
        amount: cents,
        currency: 'usd',
        'automatic_payment_methods[enabled]': 'true',
        description: `Order ${orderNumber || ''}`,
        receipt_email: customerEmail || undefined,
        'metadata[orderNumber]': orderNumber || '',
      }),
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    return NextResponse.json({
      success: true,
      clientSecret: res.data.client_secret,
      paymentIntentId: res.data.id,
      amount: cents,
      currency: res.data.currency,
    });
  } catch (error: any) {
    console.error('❌ [Local Stripe Payment Intent] Error:', error.response?.data || error.message);
    const msg = error.response?.data?.error?.message || error.message || 'Failed to create payment intent';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


