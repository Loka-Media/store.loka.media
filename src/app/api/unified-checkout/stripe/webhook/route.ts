import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { processOrderPaymentConfirmation } from '@/lib/orderPaymentConfirmation';
import { queryDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    // 1. Cryptographic Stripe signature verification (Requirement 4)
    if (webhookSecret) {
      const signatureHeader = request.headers.get('stripe-signature');
      if (!signatureHeader) {
        return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 401 });
      }

      // Parse timestamp and v1 signatures
      const elements = signatureHeader.split(',');
      let timestamp = '';
      const signatures: string[] = [];

      for (const element of elements) {
        const [key, value] = element.trim().split('=');
        if (key === 't') {
          timestamp = value;
        } else if (key === 'v1') {
          signatures.push(value);
        }
      }

      if (!timestamp || signatures.length === 0) {
        return NextResponse.json({ error: 'Invalid stripe-signature header format' }, { status: 401 });
      }

      // Tolerance check (5 minutes)
      const parsedTimestamp = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      if (isNaN(parsedTimestamp) || Math.abs(currentTime - parsedTimestamp) > 300) {
        return NextResponse.json({ error: 'Webhook timestamp outside tolerance zone' }, { status: 401 });
      }

      // Compute expected HMAC-SHA256 signature
      const signedPayload = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');

      let signatureValid = false;
      for (const sig of signatures) {
        if (
          sig.length === expectedSignature.length &&
          crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expectedSignature, 'hex'))
        ) {
          signatureValid = true;
          break;
        }
      }

      if (!signatureValid) {
        return NextResponse.json({ error: 'Invalid Stripe webhook signature' }, { status: 401 });
      }
    }

    // 2. Parse event payload
    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // 3. Handle event types idempotently (Requirements 5 & 6)
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data?.object;
        if (!paymentIntent) break;

        const orderNumber = paymentIntent.metadata?.orderNumber;
        if (!orderNumber) {
          console.warn('[Stripe Webhook] payment_intent.succeeded received without metadata.orderNumber:', paymentIntent.id);
          break;
        }

        const result = await processOrderPaymentConfirmation(orderNumber, {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          metadata: paymentIntent.metadata,
        });

        if (!result.success) {
          console.error(`[Stripe Webhook] Order confirmation failed for ${orderNumber}:`, result.error);
          return NextResponse.json({ error: result.error }, { status: 400 });
        }

        console.log(`✅ [Stripe Webhook] Successfully processed payment_intent.succeeded for ${orderNumber}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data?.object;
        if (!paymentIntent) break;

        const orderNumber = paymentIntent.metadata?.orderNumber;
        if (orderNumber) {
          await queryDb(
            `UPDATE marketplace_orders 
             SET payment_status = 'failed', 
                 metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb, 
                 updated_at = NOW() 
             WHERE order_number = $2 AND payment_status = 'pending'`,
            [
              JSON.stringify({
                lastPaymentError: paymentIntent.last_payment_error || 'Payment failed',
                failedAt: new Date().toISOString(),
              }),
              orderNumber,
            ]
          ).catch((err) => console.warn('[Stripe Webhook] Order failure update error:', err));
        }
        break;
      }

      default:
        // Unhandled events ignored gracefully
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('❌ [Stripe Webhook] Error:', error.message || error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
