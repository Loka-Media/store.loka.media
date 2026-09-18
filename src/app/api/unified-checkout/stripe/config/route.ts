import { NextResponse } from 'next/server';

export async function GET() {
  const publishableKey = (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51RrcfkGofdJ5lBg3bgODkRSZGgRXPccoOzctQ55xRmNmQU8tqAnu46f2d0x5cfnNtzPx3oGGuhPaStjCqHmBFxtQ00NNdS84s8').trim();
  const environment = publishableKey.startsWith('pk_test_') ? 'test' : 'live';

  return NextResponse.json({
    publishableKey,
    environment,
    supportedCurrencies: ['usd', 'eur', 'gbp', 'cad', 'aud', 'inr'],
    features: { link: true, applePay: true, googlePay: true }
  });
}


