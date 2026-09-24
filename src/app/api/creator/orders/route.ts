import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { getApiUrl } from '@/lib/getApiUrl';
import { calculateSellingPrice } from '@/lib/pricing';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    let userId: number | null = null;
    let role = '';

    if (token) {
      try {
        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        userId = payload.id || payload.userId || null;
        role = payload.role || '';
      } catch {
        // Token parse failed
      }
    }

    const { searchParams } = new URL(request.url);
    const creatorIdParam = searchParams.get('creatorId');
    const targetCreatorId = role === 'admin' && creatorIdParam && creatorIdParam !== 'all'
      ? parseInt(creatorIdParam, 10)
      : (role === 'creator' ? userId : null);

    // 1. Direct query to marketplace_orders
    try {
      let ordersQuery = `
        SELECT 
          m.id,
          m.order_number,
          m.order_type,
          m.order_status,
          m.payment_status,
          m.customer_payment_amount,
          m.shipping_address,
          m.order_items,
          m.metadata,
          m.printify_order_id,
          m.created_at,
          m.updated_at
        FROM marketplace_orders m
      `;

      const params: any[] = [];
      if (targetCreatorId) {
        ordersQuery += ` WHERE m.order_items::text LIKE $1 OR m.id IN (SELECT order_id FROM creator_commission_tracking WHERE creator_id = $2)`;
        params.push(`%"creator_id": ${targetCreatorId}%`, targetCreatorId);
      }

      ordersQuery += ` ORDER BY m.created_at DESC LIMIT 1000;`;

      const orders = await queryDb<any>(ordersQuery, params);

      // Fetch all commission tracking for these orders
      const orderIds = orders.map((o: any) => o.id);
      let commissionsByOrder: Record<number, any[]> = {};
      if (orderIds.length > 0) {
        const comms = await queryDb<any>(
          `SELECT order_id, product_id, creator_id, creator_revenue, loka_base_cost, creator_cost, status, paid_at, created_at 
           FROM creator_commission_tracking 
           WHERE order_id = ANY($1)`,
          [orderIds]
        );
        comms.forEach((c: any) => {
          if (!commissionsByOrder[c.order_id]) commissionsByOrder[c.order_id] = [];
          commissionsByOrder[c.order_id].push(c);
        });
      }

      const formattedOrders = orders.map((order: any) => {
        let metadata: any = {};
        if (typeof order.metadata === 'string') {
          try { metadata = JSON.parse(order.metadata); } catch { metadata = {}; }
        } else if (order.metadata) {
          metadata = order.metadata;
        }

        let items: any[] = [];
        if (typeof order.order_items === 'string') {
          try { items = JSON.parse(order.order_items); } catch { items = []; }
        } else if (Array.isArray(order.order_items)) {
          items = order.order_items;
        }

        const orderComms = commissionsByOrder[order.id] || [];

        // Filter items if specific creator
        const relevantItems = targetCreatorId
          ? items.filter((item: any) => (item.creator_id || item.user_id) === targetCreatorId)
          : items;

        const displayItems = relevantItems.length > 0 ? relevantItems : items;

        let totalCommission = 0;
        const commissionStatuses: string[] = [];

        const products = displayItems.map((item: any) => {
          const matchingComm = orderComms.find((c: any) => c.product_id === item.product_id);
          const quantity = parseInt(item.quantity || '1', 10);
          const unitPrice = parseFloat(item.price || item.unit_price || item.base_price || '0');
          const totalItemPrice = (unitPrice * quantity).toFixed(2);

          let commAmt = 0;
          if (matchingComm && parseFloat(matchingComm.creator_revenue || '0') > 0) {
            commAmt = parseFloat(matchingComm.creator_revenue);
          } else if (parseFloat(item.creator_revenue || '0') > 0) {
            commAmt = parseFloat(item.creator_revenue);
          } else if (parseFloat(item.commission_amount || '0') > 0) {
            commAmt = parseFloat(item.commission_amount);
          } else {
            const wholesaleCost = parseFloat(item.pbc || item.base_cost || '0');
            if (wholesaleCost > 0 && unitPrice > 0) {
              const lokaBaseCost = calculateSellingPrice(wholesaleCost, item.category);
              commAmt = Math.max(0, unitPrice - lokaBaseCost) * quantity;
            }
          }

          totalCommission += commAmt;

          const commStatus = matchingComm?.status || 'processing';
          commissionStatuses.push(commStatus);

          return {
            product_id: item.product_id,
            product_name: item.product_name || item.name || 'Unnamed Product',
            order_amount: totalItemPrice,
            commission_amount: commAmt.toFixed(2),
            status: commStatus,
            tracked_at: matchingComm?.created_at || order.created_at,
            paid_at: matchingComm?.paid_at || null,
            images: item.product_images || item.images || (item.thumbnail_url ? [item.thumbnail_url] : []),
          };
        });

        // If total commission was 0 but matching comms exist
        if (totalCommission === 0 && orderComms.length > 0) {
          totalCommission = orderComms.reduce((sum: number, c: any) => sum + parseFloat(c.creator_revenue || '0'), 0);
        }

        let shippingAddress = order.shipping_address;
        if (typeof shippingAddress === 'string') {
          try { shippingAddress = JSON.parse(shippingAddress); } catch {}
        }

        const printifyCust = metadata?.printify_customer || {};
        const printifyAddressTo = printifyCust.address_to || {};
        const customerName = 
          printifyCust.name ||
          [printifyAddressTo.first_name, printifyAddressTo.last_name].filter(Boolean).join(' ').trim() ||
          shippingAddress?.name ||
          [shippingAddress?.first_name, shippingAddress?.last_name].filter(Boolean).join(' ').trim() ||
          metadata?.customerName ||
          metadata?.customerInfo?.name ||
          'Guest';
        const customerEmail =
          printifyCust.email ||
          printifyAddressTo.email ||
          shippingAddress?.email ||
          metadata?.customerEmail ||
          metadata?.customerInfo?.email ||
          '';
        const customerPhone =
          printifyCust.phone ||
          printifyAddressTo.phone ||
          shippingAddress?.phone ||
          metadata?.customerPhone ||
          metadata?.customerInfo?.phone ||
          '';

        const meta = metadata || {};
        const stripeAmountCents = meta.paymentDetails?.amount_received || meta.paymentDetails?.amount || meta.amount || 0;
        const stripeTotal = stripeAmountCents > 0 ? (stripeAmountCents / 100).toFixed(2) : null;
        const metaStripeCharged = meta.stripeChargedTotal ? parseFloat(meta.stripeChargedTotal).toFixed(2) : null;
        const dbCustomerPaymentAmount = order.customer_payment_amount ? parseFloat(order.customer_payment_amount).toFixed(2) : '0.00';
        const finalCustomerPaymentAmount = stripeTotal || metaStripeCharged || dbCustomerPaymentAmount;

        return {
          id: order.id,
          order_number: order.order_number,
          order_type: order.order_type || 'printify',
          order_status: order.order_status,
          payment_status: order.payment_status,
          customer_payment_amount: finalCustomerPaymentAmount,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          created_at: order.created_at,
          updated_at: order.updated_at,
          printful_order_id: null,
          printful_draft_order_key: null,
          printify_order_id: order.printify_order_id,
          total_commission: totalCommission.toFixed(2),
          products_count: products.length,
          commission_statuses: commissionStatuses.length > 0 ? commissionStatuses : ['processing'],
          products,
          shipping_address: shippingAddress,
          metadata,
          tracking: metadata?.tracking || null,
          shipments: metadata?.shipments || [],
        };
      });

      return NextResponse.json({
        success: true,
        data: formattedOrders,
        pagination: {
          page: 1,
          limit: 1000,
          total: formattedOrders.length,
          pages: 1,
        },
      });
    } catch (dbErr: any) {
      console.warn('Direct DB creator orders query note:', dbErr.message);
    }

    // Fallback to backend API
    const backendUrl = `${getApiUrl()}/api/creator/orders${request.nextUrl.search}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authHeader) headers['Authorization'] = authHeader;

    const backendRes = await fetch(backendUrl, { headers });
    const data = await backendRes.json();
    return NextResponse.json(data, { status: backendRes.status });
  } catch (error: any) {
    console.error('Creator orders route error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch creator orders' },
      { status: 500 }
    );
  }
}
