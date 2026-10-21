import { NextResponse } from 'next/server';

export async function GET() {
  const publishableKey = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
  if (!publishableKey) {
    return NextResponse.json(
      { error: 'Stripe publishable key is not configured' },
      { status: 500 }
    );
  }
  const environment = publishableKey.startsWith('pk_test_') ? 'test' : 'live';

  return NextResponse.json({
    publishableKey,
    environment,
    supportedCurrencies: ['usd', 'eur', 'gbp', 'cad', 'aud', 'inr'],
    features: { link: true, applePay: true, googlePay: true }
  });
}


