/**
 * Printify Webhooks API Routes
 * GET    /api/printify/webhooks          → list webhooks
 * POST   /api/printify/webhooks          → register webhook
 * DELETE /api/printify/webhooks/:id      → delete webhook
 * POST   /api/printify/webhooks/receive  → receive incoming webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyWebhooksAPI } from '@/services/printify/PrintifyClient';
import type { PrintifyWebhookPayload } from '@/types/printify';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
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
      const payload: PrintifyWebhookPayload = await request.json();
      console.log('[Printify Webhook Received]', payload.type, payload.resource?.id);

      // Forward to backend for order/fulfillment status updates
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        await fetch(`${backendUrl}/api/printify/webhooks/receive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (forwardError) {
        console.error('[Printify Webhook] Failed to forward to backend:', forwardError);
        // Don't fail the webhook response even if forwarding fails
      }

      return NextResponse.json({ received: true });
    }

    // POST /api/printify/webhooks → register a new webhook
    const body = await request.json();
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
