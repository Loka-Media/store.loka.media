import { queryDb } from '@/lib/db';
import { printifyOrdersAPI } from './PrintifyClient';

export interface PrintifySyncResult {
  success: boolean;
  orderId?: number;
  orderNumber?: string;
  printifyOrderId?: string;
  previousStatus?: string;
  newStatus?: string;
  tracking?: {
    carrier?: string;
    number?: string;
    url?: string;
    shipped_at?: string;
    delivered_at?: string | null;
  };
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  shippingAddress?: any;
  error?: string;
}

/**
 * Maps Printify's internal status & shipments to Loka Media order status
 */
export function mapPrintifyStatusToLoka(printifyStatus?: string, shipments?: any[]): string {
  if (!printifyStatus) return 'processing';

  const status = printifyStatus.toLowerCase().trim();

  // If shipments exist and has tracking, or status is fulfilled
  if (status === 'fulfilled' || (shipments && shipments.length > 0)) {
    const isDelivered = shipments?.some(s => s.delivered_at);
    if (isDelivered) return 'delivered';
    return 'shipped';
  }

  switch (status) {
    case 'delivered':
      return 'delivered';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'on-hold':
    case 'on_hold':
      return 'on_hold';
    case 'sent_to_production':
    case 'inprocess':
    case 'processing':
    case 'produced':
      return 'processing';
    case 'pending':
      return 'pending';
    default:
      return 'processing';
  }
}

/**
 * Syncs a single order's live status and tracking from Printify into PostgreSQL
 */
export async function syncPrintifyOrder(
  identifier: string | number
): Promise<PrintifySyncResult> {
  try {
    // 1. Locate order in database
    const orders = await queryDb<any>(
      `SELECT id, order_number, printify_order_id, order_status, payment_status, metadata, shipping_address 
       FROM marketplace_orders 
       WHERE id::text = $1 OR order_number = $1 OR printify_order_id = $1 
       LIMIT 1`,
      [identifier.toString()]
    );

    if (!orders || orders.length === 0) {
      return { success: false, error: `Order not found in database for identifier: ${identifier}` };
    }

    const order = orders[0];
    const printifyOrderId = order.printify_order_id;

    if (!printifyOrderId) {
      return { success: false, error: `Order #${order.order_number} has no Printify Order ID` };
    }

    // 2. Fetch live order details from Printify
    let printifyData: any;
    try {
      printifyData = await printifyOrdersAPI.getOrder(printifyOrderId);
    } catch (apiErr: any) {
      return {
        success: false,
        orderId: order.id,
        orderNumber: order.order_number,
        printifyOrderId,
        error: `Printify API getOrder error: ${apiErr.message || apiErr}`,
      };
    }

    if (!printifyData) {
      return { success: false, error: 'Empty response from Printify' };
    }

    // 3. Extract tracking, status, shipments, and customer details
    const shipments = printifyData.shipments || [];
    const latestShipment = shipments.length > 0 ? shipments[0] : null;
    const mappedStatus = mapPrintifyStatusToLoka(printifyData.status, shipments);

    // Extract customer and shipping from Printify address_to
    const addressTo = printifyData.address_to || {};
    const printifyCustomerName = [addressTo.first_name, addressTo.last_name].filter(Boolean).join(' ').trim();
    const printifyCustomerEmail = addressTo.email || '';
    const printifyCustomerPhone = addressTo.phone || '';

    let existingShippingAddress: any = {};
    if (typeof order.shipping_address === 'string') {
      try { existingShippingAddress = JSON.parse(order.shipping_address); } catch { existingShippingAddress = {}; }
    } else if (order.shipping_address && typeof order.shipping_address === 'object') {
      existingShippingAddress = { ...order.shipping_address };
    }

    const updatedShippingAddress = {
      ...existingShippingAddress,
      name: printifyCustomerName || existingShippingAddress.name,
      first_name: addressTo.first_name || existingShippingAddress.first_name,
      last_name: addressTo.last_name || existingShippingAddress.last_name,
      email: printifyCustomerEmail || existingShippingAddress.email,
      phone: printifyCustomerPhone || existingShippingAddress.phone,
      address1: addressTo.address1 || existingShippingAddress.address1,
      address2: addressTo.address2 !== undefined ? addressTo.address2 : existingShippingAddress.address2,
      city: addressTo.city || existingShippingAddress.city,
      state: addressTo.region || existingShippingAddress.state,
      country: addressTo.country || existingShippingAddress.country,
      zip: addressTo.zip || existingShippingAddress.zip,
    };

    let metadata: any = {};
    if (typeof order.metadata === 'string') {
      try {
        metadata = JSON.parse(order.metadata);
      } catch {
        metadata = {};
      }
    } else if (order.metadata && typeof order.metadata === 'object') {
      metadata = { ...order.metadata };
    }

    const updatedMetadata = {
      ...metadata,
      customerName: printifyCustomerName || metadata?.customerName,
      customerEmail: printifyCustomerEmail || metadata?.customerEmail,
      customerPhone: printifyCustomerPhone || metadata?.customerPhone,
      customerInfo: {
        ...(metadata?.customerInfo || {}),
        name: printifyCustomerName || metadata?.customerInfo?.name,
        email: printifyCustomerEmail || metadata?.customerInfo?.email,
        phone: printifyCustomerPhone || metadata?.customerInfo?.phone,
      },
      printify_customer: {
        name: printifyCustomerName,
        first_name: addressTo.first_name,
        last_name: addressTo.last_name,
        email: printifyCustomerEmail,
        phone: printifyCustomerPhone,
        address_to: addressTo,
      },
      printify_order_id: printifyOrderId,
      printify_status: printifyData.status,
      shipments: shipments,
      tracking: latestShipment ? {
        carrier: latestShipment.carrier,
        number: latestShipment.number,
        url: latestShipment.url,
        shipped_at: latestShipment.shipped_at,
        delivered_at: latestShipment.delivered_at,
      } : null,
      sent_to_production_at: printifyData.sent_to_production_at,
      fulfilled_at: printifyData.fulfilled_at,
      last_synced_with_printify_at: new Date().toISOString(),
    };

    // 4. Update marketplace_orders in PostgreSQL (metadata, shipping_address, customer_payment_amount)
    const stripeAmountCents = updatedMetadata.paymentDetails?.amount_received || updatedMetadata.paymentDetails?.amount || updatedMetadata.amount || 0;
    const stripeTotal = stripeAmountCents > 0 ? (stripeAmountCents / 100).toFixed(2) : null;
    const metaStripeCharged = updatedMetadata.stripeChargedTotal ? parseFloat(updatedMetadata.stripeChargedTotal).toFixed(2) : null;
    const resolvedCustomerPaymentAmount = stripeTotal || metaStripeCharged || order.customer_payment_amount;

    await queryDb(
      `UPDATE marketplace_orders 
       SET order_status = $1, metadata = $2, shipping_address = $3, customer_payment_amount = $4, updated_at = NOW() 
       WHERE id = $5`,
      [mappedStatus, JSON.stringify(updatedMetadata), JSON.stringify(updatedShippingAddress), resolvedCustomerPaymentAmount, order.id]
    );

    // 5. Update or insert into order_fulfillment table
    try {
      const existingFulfillment = await queryDb<any>(
        `SELECT id FROM order_fulfillment WHERE order_id = $1 LIMIT 1`,
        [order.id]
      );

      // Allowed statuses in order_fulfillment: 'pending', 'submitted', 'fulfilled', 'failed', 'cancelled'
      const validFulfillmentStatus = (mappedStatus === 'shipped' || mappedStatus === 'delivered')
        ? 'fulfilled'
        : (['pending', 'submitted', 'fulfilled', 'failed', 'cancelled'].includes(mappedStatus) ? mappedStatus : 'submitted');

      const fulfillmentData = {
        shipments: shipments,
        carrier: latestShipment?.carrier,
        tracking_number: latestShipment?.number,
        tracking_url: latestShipment?.url,
        status: printifyData.status,
        shipped_at: latestShipment?.shipped_at,
        delivered_at: latestShipment?.delivered_at,
      };

      if (existingFulfillment && existingFulfillment.length > 0) {
        await queryDb(
          `UPDATE order_fulfillment 
           SET status = $1, vendor_order_id = $2, fulfillment_data = $3, updated_at = NOW() 
           WHERE id = $4`,
          [validFulfillmentStatus, printifyOrderId, JSON.stringify(fulfillmentData), existingFulfillment[0].id]
        );
      } else {
        await queryDb(
          `INSERT INTO order_fulfillment 
           (order_id, fulfillment_type, status, vendor_order_id, fulfillment_data, created_at, updated_at) 
           VALUES ($1, 'printify', $2, $3, $4, NOW(), NOW())`,
          [order.id, validFulfillmentStatus, printifyOrderId, JSON.stringify(fulfillmentData)]
        );
      }
    } catch (fulfillErr) {
      console.warn('⚠️ Non-fatal order_fulfillment update error:', fulfillErr);
    }

    return {
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      printifyOrderId,
      previousStatus: order.order_status,
      newStatus: mappedStatus,
      tracking: latestShipment ? {
        carrier: latestShipment.carrier,
        number: latestShipment.number,
        url: latestShipment.url,
        shipped_at: latestShipment.shipped_at,
        delivered_at: latestShipment.delivered_at,
      } : undefined,
      customer: {
        name: printifyCustomerName,
        email: printifyCustomerEmail,
        phone: printifyCustomerPhone,
      },
      shippingAddress: updatedShippingAddress,
    };
  } catch (error: any) {
    console.error('❌ syncPrintifyOrder error:', error);
    return { success: false, error: error.message || 'Failed to sync Printify order' };
  }
}

/**
 * Batch sync all recent non-delivered orders that have a printify_order_id
 */
export async function syncAllActivePrintifyOrders(limit = 25): Promise<PrintifySyncResult[]> {
  try {
    const orders = await queryDb<any>(
      `SELECT id, order_number, printify_order_id 
       FROM marketplace_orders 
       WHERE printify_order_id IS NOT NULL 
         AND order_status NOT IN ('delivered', 'cancelled') 
       ORDER BY id DESC 
       LIMIT $1`,
      [limit]
    );

    const results: PrintifySyncResult[] = [];
    for (const order of orders) {
      const res = await syncPrintifyOrder(order.id);
      results.push(res);
    }

    return results;
  } catch (error: any) {
    console.error('❌ syncAllActivePrintifyOrders error:', error);
    return [];
  }
}
