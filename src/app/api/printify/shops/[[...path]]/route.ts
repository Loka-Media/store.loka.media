/**
 * Printify Shops API Routes (Secured - Admin Only)
 * GET /api/printify/shops         → list all shops
 * GET /api/printify/shops/current → get current shop details
 */

import { NextRequest, NextResponse } from 'next/server';
import { printifyShopAPI } from '@/services/printify/PrintifyClient';
import { requireAdminAuth } from '@/lib/serverAuth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  // Security (C6): Require admin authentication
  const auth = await requireAdminAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { path } = await params;
    const segments = path || [];

    // GET /api/printify/shops
    if (segments.length === 0) {
      const shops = await printifyShopAPI.getShops();
      return NextResponse.json({ success: true, data: shops });
    }

    // GET /api/printify/shops/current or specific ID
    if (segments.length === 1) {
      const shop = await printifyShopAPI.getShop();
      return NextResponse.json({ success: true, data: shop });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Shops request failed';
    console.error('[Printify Shops GET]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
