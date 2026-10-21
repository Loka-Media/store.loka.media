/**
 * Printify Webhooks API Routes
 * GET    /api/printify/webhooks          → list webhooks
 * POST   /api/printify/webhooks          → register webhook
 * DELETE /api/printify/webhooks/:id      → delete webhook
 * POST   /api/printify/webhooks/receive  → receive incoming webhook events
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { printifyWebhooksAPI } from '@/services/printify/PrintifyClient';
import { syncPrintifyOrder } from '@/services/printify/orderSync';
import { requireAdminAuth } from '@/lib/serverAuth';
import type { PrintifyWebhookPayload } from '@/types/printify';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  // Security (C6): Only admins can list registered webhooks
  const auth = await requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const webhooks = await printifyWebhooksAPI.getWebhooks();
    return NextResponse.json({ success: true, data: webhooks });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhooks GET failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];

    // POST /api/printify/webhooks/receive → handle incoming Printify event
    if (segments[0] === 'receive') {
      const rawBody = await request.text();
      const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET?.trim();

      // Security (C11): Verify HMAC signature if secret is configured
      if (webhookSecret) {
        const signature = request.headers.get('x-pf-signature');
        if (!signature) {
          return NextResponse.json({ error: 'Missing Printify webhook signature header' }, { status: 401 });
        }
        const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
        const cleanSig = signature.replace(/^sha256=/i, '').trim();

        if (
          expectedSig.length !== cleanSig.length ||
          !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(cleanSig))
        ) {
          return NextResponse.json({ error: 'Invalid Printify webhook signature' }, { status: 401 });
        }
      }

      let payload: PrintifyWebhookPayload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
      }

      console.log('[Printify Webhook Received]', payload.type, payload.resource?.id);

      // 1. Direct PostgreSQL sync using Printify order ID or shop order ID
      const printifyOrderId = payload.resource?.id;
      if (printifyOrderId) {
        try {
          const syncResult = await syncPrintifyOrder(printifyOrderId);
          console.log('[Printify Webhook DB Sync]', syncResult);
        } catch (dbSyncErr) {
          console.error('[Printify Webhook DB Sync Error]', dbSyncErr);
        }
      }

      // 2. Forward to backend for compatibility
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
      try {
        const response = await fetch(`${backendUrl}/api/printify/webhooks/receive`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(request.headers.get('x-pf-signature') ? { 'x-pf-signature': request.headers.get('x-pf-signature')! } : {}),
          },
          body: rawBody,
        });
        if (!response.ok) {
          console.error(`[Printify Webhook] Backend returned status ${response.status}`);
        }
      } catch (forwardError) {
        console.warn('[Printify Webhook] Backend forward note:', forwardError);
      }

      return NextResponse.json({ received: true, synced: true });
    }

    // POST /api/printify/webhooks → register a new webhook (Admin only)
    const auth = await requireAdminAuth(request);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await request.json().catch(() => ({}));
    const { topic, url } = body;

    if (!topic || !url) {
      return NextResponse.json({ error: 'topic and url are required' }, { status: 400 });
    }

    const webhook = await printifyWebhooksAPI.createWebhook(topic, url);
    return NextResponse.json({ success: true, data: webhook }, { status: 201 });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhooks POST failed';
    console.error('[Printify Webhooks POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  // Security (C6): Only admins can delete webhooks
  const auth = await requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { path } = await params;
    const segments = path || [];

    if (segments.length === 0) {
      return NextResponse.json({ error: 'Webhook ID required' }, { status: 400 });
    }

    await printifyWebhooksAPI.deleteWebhook(segments[0]);
    return NextResponse.json({ success: true, message: 'Webhook deleted' });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Webhooks DELETE failed';
    console.error('[Printify Webhooks DELETE]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
