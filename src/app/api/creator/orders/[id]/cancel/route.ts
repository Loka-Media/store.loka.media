import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { queryDb } from '@/lib/db';
import { getApiUrl } from '@/lib/getApiUrl';
import { printifyOrdersAPI } from '@/services/printify/PrintifyClient';
import { sendOrderCancellationEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authHeader = request.headers.get('authorization') || '';

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Locate order in database
    const orders = await queryDb<any>(
      `SELECT id, order_number, order_status, payment_status, printify_order_id, metadata, shipping_address, order_items, customer_payment_amount 
       FROM marketplace_orders 
       WHERE id::text = $1 OR order_number = $1 
       LIMIT 1`,
      [id]
    );

    if (!orders || orders.length === 0) {
      return NextResponse.json({ error: `Order #${id} not found` }, { status: 404 });
    }

    const order = orders[0];

    // 2. Parse metadata & shipping address
    let metadata: any = {};
    if (typeof order.metadata === 'string') {
      try { metadata = JSON.parse(order.metadata); } catch { metadata = {}; }
    } else if (order.metadata && typeof order.metadata === 'object') {
      metadata = { ...order.metadata };
    }

    let shippingAddress: any = {};
    if (typeof order.shipping_address === 'string') {
      try { shippingAddress = JSON.parse(order.shipping_address); } catch { shippingAddress = {}; }
    } else if (order.shipping_address && typeof order.shipping_address === 'object') {
      shippingAddress = { ...order.shipping_address };
    }

    // 3. Cancel on Printify if Printify order ID exists
    let printifyCancelled = false;
    let printifyError: string | null = null;
    const printifyOrderId = order.printify_order_id || metadata?.printify_order_id;

    if (printifyOrderId) {
      try {
        console.log(`[Printify Cancel] Attempting to cancel Printify order ${printifyOrderId} for #${order.order_number}...`);
        const pResult = await printifyOrdersAPI.cancelOrder(printifyOrderId);
        printifyCancelled = true;
        console.log(`[Printify Cancel Success] Status: ${pResult?.status || 'canceled'}`);
      } catch (pErr: any) {
        console.warn(`[Printify Cancel Warning] ${pErr.message || pErr}`);
        printifyError = pErr.message || 'Printify cancel failed';
      }
    }

    // 4. Handle Stripe Payment Refund
    const paymentIntentId =
      metadata?.paymentIntentId ||
      metadata?.paymentDetails?.id ||
      metadata?.paymentResult?.transactionId;

    let isRefunded = false;
    let refundId: string | null = null;
    const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();

    if (secretKey && paymentIntentId && typeof paymentIntentId === 'string' && paymentIntentId.startsWith('pi_')) {
      try {
        const stripeCheck = await axios.get(
          `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
          { headers: { Authorization: `Bearer ${secretKey}` }, timeout: 8000 }
        );

        const charges = stripeCheck.data?.charges?.data || [];
        const latestCharge = charges[0];

        if (latestCharge?.refunded || (stripeCheck.data.amount_refunded && stripeCheck.data.amount_refunded > 0)) {
          isRefunded = true;
          console.log(`[Stripe Refund] Already refunded on Stripe for PI: ${paymentIntentId}`);
        } else if (stripeCheck.data.status === 'succeeded') {
          console.log(`[Stripe Refund] Processing refund on Stripe for PI: ${paymentIntentId}...`);
          const refundRes = await axios.post(
            'https://api.stripe.com/v1/refunds',
            new URLSearchParams({ payment_intent: paymentIntentId }).toString(),
            {
              headers: {
                Authorization: `Bearer ${secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              timeout: 10000,
            }
          );
          if (refundRes.data?.status === 'succeeded' || refundRes.data?.status === 'pending') {
            isRefunded = true;
            refundId = refundRes.data.id;
            console.log(`[Stripe Refund Success] Refund ID: ${refundId}`);
          }
        }
      } catch (stripeErr: any) {
        const errMsg = stripeErr.response?.data?.error?.message || stripeErr.message;
        console.warn('[Stripe Refund Error/Note]:', errMsg);
        if (stripeErr.response?.data?.error?.code === 'charge_already_refunded') {
          isRefunded = true;
        }
      }
    }

    // Determine honest payment status (do NOT mark 'refunded' if refund was not executed!)
    const finalPaymentStatus = isRefunded ? 'refunded' : 'cancelled';

    // 5. Update PostgreSQL Database
    const updatedMetadata = {
      ...metadata,
      cancelled_at: new Date().toISOString(),
      cancelled_by: 'creator',
      printify_status: printifyCancelled ? 'canceled' : (metadata?.printify_status || null),
      printify_cancelled: printifyCancelled,
      ...(printifyError ? { printify_cancel_error: printifyError } : {}),
      ...(refundId ? { refund_id: refundId } : {}),
      refunded: isRefunded,
    };

    try {
      await queryDb(
        `UPDATE marketplace_orders 
         SET order_status = 'cancelled', 
             payment_status = $1, 
             metadata = $2, 
             updated_at = NOW() 
         WHERE id = $3`,
        [finalPaymentStatus, JSON.stringify(updatedMetadata), order.id]
      );
    } catch (dbErr: any) {
      if (dbErr.message?.includes('marketplace_orders_payment_status_check')) {
        // Fallback to original payment status if constraint blocks 'cancelled'
        const fallbackPaymentStatus = isRefunded ? 'refunded' : (order.payment_status || 'pending');
        await queryDb(
          `UPDATE marketplace_orders 
           SET order_status = 'cancelled', 
               payment_status = $1, 
               metadata = $2, 
               updated_at = NOW() 
           WHERE id = $3`,
          [fallbackPaymentStatus, JSON.stringify(updatedMetadata), order.id]
        );
      } else {
        throw dbErr;
      }
    }

    // Cancel creator commission tracking (status: 'cancelled', NOT 'refunded')
    try {
      await queryDb(
        `UPDATE creator_commission_tracking 
         SET status = 'cancelled', updated_at = NOW() 
         WHERE order_id = $1`,
        [order.id]
      );
    } catch (commErr: any) {
      if (commErr.message?.includes('creator_commission_tracking_status_check')) {
        await queryDb(
          `UPDATE creator_commission_tracking 
           SET status = 'refunded', updated_at = NOW() 
           WHERE order_id = $1`,
          [order.id]
        );
      } else {
        throw commErr;
      }
    }

    // 6. Notify external catalog backend (non-blocking)
    try {
      const backendUrl = `${getApiUrl()}/api/creator/orders/${order.id}/cancel`;
      await axios.post(backendUrl, {}, {
        headers: authHeader ? { Authorization: authHeader } : {},
        timeout: 4000,
      });
    } catch (e: any) {
      console.warn('[Backend Cancel Sync Note]:', e.message);
    }

    // 7. Send Cancellation Email to Customer
    const customerEmail =
      metadata?.customerEmail ||
      metadata?.customerInfo?.email ||
      metadata?.printify_customer?.email ||
      metadata?.printify_customer?.address_to?.email ||
      shippingAddress?.email;

    const customerName =
      metadata?.customerName ||
      metadata?.customerInfo?.name ||
      metadata?.printify_customer?.name ||
      [metadata?.printify_customer?.address_to?.first_name, metadata?.printify_customer?.address_to?.last_name].filter(Boolean).join(' ').trim() ||
      shippingAddress?.name ||
      'Valued Customer';

    let emailSent = false;
    let emailError: string | null = null;

    if (customerEmail) {
      try {
        let items: any[] = [];
        if (typeof order.order_items === 'string') {
          try { items = JSON.parse(order.order_items); } catch {}
        } else if (Array.isArray(order.order_items)) {
          items = order.order_items;
        }

        // Fetch DB products if items have missing names or images
        const productIds = items.map((it: any) => it.product_id).filter(Boolean);
        let dbProductsMap: Record<number, any> = {};
        if (productIds.length > 0) {
          try {
            const dbProds = await queryDb<any>(
              `SELECT id, name, images, thumbnail_url FROM products WHERE id = ANY($1)`,
              [productIds]
            );
            dbProds.forEach((dp: any) => { dbProductsMap[dp.id] = dp; });
          } catch (e: any) {
            console.warn('[DB Products lookup note for email]:', e.message);
          }
        }

        const productsForEmail = items.map((it: any) => {
          const dbProd = it.product_id ? dbProductsMap[it.product_id] : null;
          const name = it.product_name || it.name || it.title || dbProd?.name || 'Custom Product';

          let image: string | null = null;
          if (Array.isArray(it.product_images) && it.product_images.length > 0 && typeof it.product_images[0] === 'string') {
            image = it.product_images[0];
          } else if (Array.isArray(it.product_snapshot?.images) && it.product_snapshot.images.length > 0) {
            image = it.product_snapshot.images[0];
          } else if (Array.isArray(it.images) && it.images.length > 0) {
            image = it.images[0];
          } else if (it.image_url && typeof it.image_url === 'string') {
            image = it.image_url;
          } else if (it.thumbnail_url && typeof it.thumbnail_url === 'string') {
            image = it.thumbnail_url;
          } else if (dbProd) {
            if (Array.isArray(dbProd.images) && dbProd.images.length > 0) image = dbProd.images[0];
            else if (dbProd.thumbnail_url) image = dbProd.thumbnail_url;
          }

          const variantParts = [it.color, it.size].filter(Boolean);
          const variant = variantParts.length > 0 ? variantParts.join(' / ') : null;

          return {
            name,
            quantity: parseInt(it.quantity || '1', 10),
            price: it.price || it.unit_price || it.base_price,
            image,
            variant,
          };
        });

        const emailRes = await sendOrderCancellationEmail({
          to: customerEmail,
          customerName,
          orderNumber: order.order_number,
          products: productsForEmail,
          totalAmount: order.customer_payment_amount,
          isRefunded,
        });

        emailSent = emailRes.success;
        if (!emailRes.success) {
          emailError = typeof emailRes.error === 'string' ? emailRes.error : JSON.stringify(emailRes.error);
        }
      } catch (mErr: any) {
        console.error('[Customer Cancellation Email Error]:', mErr.message);
        emailError = mErr.message;
      }
    } else {
      console.warn(`[Customer Cancellation Email] No customer email found for order #${order.order_number}`);
    }

    return NextResponse.json({
      success: true,
      message: `Order #${order.order_number} cancelled successfully`,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        orderStatus: 'cancelled',
        paymentStatus: finalPaymentStatus,
        printifyCancelled,
        isRefunded,
        emailSent,
        customerEmail: customerEmail || null,
      },
    });

  } catch (error: any) {
    console.error('Creator order cancel error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
