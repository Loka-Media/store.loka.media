import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: 'STRIPE_SECRET_KEY is missing in environment variables' },
        { status: 500 }
      );
    }

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const baseUrl = `${protocol}://${host}`;

    // 1. Create a Stripe Express Account
    const createAccountRes = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'type': 'express',
        'capabilities[transfers][requested]': 'true',
        'capabilities[card_payments][requested]': 'true',
      }),
    });

    const accountData = await createAccountRes.json();
    if (!createAccountRes.ok) {
      console.error('Stripe Account Creation Error:', accountData);
      const msg = accountData.error?.message || 'Failed to create Stripe account';
      if (msg.includes("signed up for Connect")) {
        return NextResponse.json(
          { error: 'Stripe Connect is not enabled on your Stripe account. Please enable Connect at https://dashboard.stripe.com/connect first.' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: msg },
        { status: 400 }
      );
    }

    const stripeAccountId = accountData.id;

    // 2. Create Stripe Account Link (Express Onboarding URL)
    const createLinkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'account': stripeAccountId,
        'refresh_url': `${baseUrl}/dashboard/creator/earnings`,
        'return_url': `${baseUrl}/dashboard/creator/earnings?stripe_status=success&account_id=${stripeAccountId}`,
        'type': 'account_onboarding',
      }),
    });

    const linkData = await createLinkRes.json();
    if (!createLinkRes.ok) {
      console.error('Stripe Account Link Error:', linkData);
      return NextResponse.json(
        { error: linkData.error?.message || 'Failed to create Stripe onboarding link' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      authUrl: linkData.url,
      stripeAccountId,
    });
  } catch (error: any) {
    console.error('Stripe Auth URL Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
