/**
 * Printify Webhooks API Routes
 * GET    /api/printify/webhooks          → list webhooks
 * POST   /api/printify/webhooks          → register webhook
 * DELETE /api/printify/webhooks/:id      → delete webhook
 * POST   /api/printify/webhooks/receive  → receive incoming webhook events
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyWebhooksAPI } from '@/services/printify/PrintifyClient';
import { syncPrintifyOrder } from '@/services/printify/orderSync';
import { syncPrintifyProduct, handleProductDeleted, ensurePrintifyWebhooksRegistered } from '@/services/printify/productSync';
import type { PrintifyWebhookPayload } from '@/types/printify';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const segments = path || [];

    // GET /api/printify/webhooks/setup → One-click verify and auto-register all Printify webhooks
    if (segments[0] === 'setup') {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = `${proto}://${host}`;
      const setupResult = await ensurePrintifyWebhooksRegistered(baseUrl);
      return NextResponse.json({ success: true, ...setupResult });
    }

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

    // POST /api/printify/webhooks/setup → auto-register webhooks with custom or inferred domain
    if (segments[0] === 'setup') {
      const body = await request.json().catch(() => ({}));
      const host = body?.baseUrl || request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = body?.baseUrl || `${proto}://${host}`;
      const setupResult = await ensurePrintifyWebhooksRegistered(baseUrl);
      return NextResponse.json({ success: true, ...setupResult });
    }

    // POST /api/printify/webhooks/receive → handle incoming Printify event
    if (segments[0] === 'receive') {
      const payload: PrintifyWebhookPayload = await request.json();
      const eventType = String(payload.type || '').toLowerCase();
      const resourceId = String(payload.resource?.id || '');

      console.log(`[Printify Webhook Received] Type: "${eventType}" | Resource ID: "${resourceId}"`);

      let productSyncResult = null;
      let orderSyncResult = null;

      // 1. Product Updated or Created
      if (
        eventType.includes('product:updated') ||
        eventType.includes('product:created') ||
        eventType.includes('product:publish')
      ) {
        if (resourceId) {
          productSyncResult = await syncPrintifyProduct(resourceId, payload.resource?.data);
          console.log('[Printify Webhook Product Sync Result]:', productSyncResult);
        }
      } 
      // 2. Product Deleted
      else if (eventType.includes('product:deleted')) {
        if (resourceId) {
          productSyncResult = await handleProductDeleted(resourceId);
          console.log('[Printify Webhook Product Deleted Result]:', productSyncResult);
        }
      } 
      // 3. Order Events
      else if (eventType.includes('order')) {
        if (resourceId) {
          orderSyncResult = await syncPrintifyOrder(resourceId);
          console.log('[Printify Webhook Order Sync Result]:', orderSyncResult);
        }
      } 
      // 4. Fallback: Check if resourceId matches a product or order
      else if (resourceId) {
        productSyncResult = await syncPrintifyProduct(resourceId, payload.resource?.data);
        if (!productSyncResult?.success) {
          orderSyncResult = await syncPrintifyOrder(resourceId).catch(() => null);
        }
      }

      // Forward to backend for external catalog compatibility if configured
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
      try {
        await fetch(`${backendUrl}/api/printify/webhooks/receive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => null);
      } catch (_) {}

      return NextResponse.json({
        received: true,
        synced: true,
        eventType,
        resourceId,
        productSync: productSyncResult,
        orderSync: orderSyncResult,
      });
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
