import { queryDb } from './db';
import { calculateSellingPrice } from './pricing';

export interface StripePaymentVerificationData {
  paymentIntentId: string;
  amount: number; // in cents
  currency: string;
  status: string;
  metadata?: Record<string, string>;
}

export interface OrderConfirmationResult {
  success: boolean;
  alreadyProcessed?: boolean;
  error?: string;
  order?: any;
}

/**
 * Securely and idempotently confirms an order payment after verifying Stripe status, amount, and order binding.
 */
export async function processOrderPaymentConfirmation(
  orderNumber: string,
  paymentIntent: StripePaymentVerificationData
): Promise<OrderConfirmationResult> {
  if (!orderNumber || !paymentIntent || !paymentIntent.paymentIntentId) {
    return { success: false, error: 'Order number and payment intent are required' };
  }

  // 1. Fetch order from database
  const orders = await queryDb<any>(
    `SELECT id, order_number, order_items, customer_payment_amount, currency, payment_status, order_status, metadata, customer_payment_id 
     FROM marketplace_orders 
     WHERE order_number = $1 OR customer_payment_id = $2 OR (metadata->>'paymentIntentId' = $2)
     LIMIT 1`,
    [orderNumber, paymentIntent.paymentIntentId]
  );

  if (!orders || orders.length === 0) {
    return { success: false, error: `Order ${orderNumber} not found` };
  }

  const order = orders[0];

  // 2. Idempotency Guard: if already confirmed/released, exit safely without duplicating actions
  if (order.payment_status === 'released' || order.payment_status === 'escrowed') {
    return {
      success: true,
      alreadyProcessed: true,
      order,
    };
  }

  // 3. Security Check: Payment status must be 'succeeded'
  if (paymentIntent.status !== 'succeeded') {
    return {
      success: false,
      error: `Payment status is '${paymentIntent.status}', not 'succeeded'`,
    };
  }

  // 4. Security Check: Payment Intent metadata orderNumber binding (if set in metadata)
  const piOrderNumber = paymentIntent.metadata?.orderNumber;
  if (piOrderNumber && piOrderNumber !== order.order_number) {
    return {
      success: false,
      error: `Payment intent metadata orderNumber (${piOrderNumber}) does not match order (${order.order_number})`,
    };
  }

  // 5. Security Check: Amount verification (prevent paying $0.01 for a $100 order)
  const expectedCents = Math.round(parseFloat(order.customer_payment_amount || '0') * 100);
  if (Math.abs(paymentIntent.amount - expectedCents) > 1) {
    return {
      success: false,
      error: `Payment amount mismatch: Stripe charged ${paymentIntent.amount} cents, but order total is ${expectedCents} cents`,
    };
  }

  // 6. Security Check: Currency verification
  const expectedCurrency = String(order.currency || 'usd').toLowerCase();
  if (String(paymentIntent.currency).toLowerCase() !== expectedCurrency) {
    return {
      success: false,
      error: `Currency mismatch: Stripe charged in ${paymentIntent.currency}, but order currency is ${expectedCurrency}`,
    };
  }

  // 7. Atomic update of order to prevent concurrent race conditions
  const updateResult = await queryDb<any>(
    `UPDATE marketplace_orders 
     SET payment_status = 'released', 
         order_status = 'processing', 
         customer_payment_id = $1,
         customer_payment_method = 'stripe',
         metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, 
         updated_at = NOW() 
     WHERE id = $3 AND payment_status = 'pending'
     RETURNING id`,
    [
      paymentIntent.paymentIntentId,
      JSON.stringify({
        paymentIntentId: paymentIntent.paymentIntentId,
        paymentStatus: paymentIntent.status,
        confirmedAt: new Date().toISOString(),
      }),
      order.id,
    ]
  );

  // If 0 rows updated, another concurrent process already transitioned it
  if (!updateResult || updateResult.length === 0) {
    return { success: true, alreadyProcessed: true, order };
  }

  // 8. Sync creator commissions & wallet balances with unique item references (Fixes C15)
  try {
    let items: any[] = [];
    if (typeof order.order_items === 'string') {
      try {
        items = JSON.parse(order.order_items);
      } catch {
        items = [];
      }
    } else if (Array.isArray(order.order_items)) {
      items = order.order_items;
    }

    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const creatorId = item.creator_id || item.user_id;
      const productId = item.product_id;
      const quantity = parseInt(item.quantity || '1', 10);
      const sellingPrice = parseFloat(item.price || item.unit_price || item.base_price || '0');

      if (!creatorId || !productId) continue;

      // Unique reference ID per item to prevent colliding multiple items from same creator (C15)
      const itemVariantId = item.variant_id || item.printify_variant_id || idx;
      const uniqueReferenceId = `${order.id}:${productId}:${itemVariantId}`;

      // Fetch base wholesale cost
      let wholesaleBaseCost = parseFloat(item.pbc || item.base_cost || '0');
      let category = item.category;

      if (wholesaleBaseCost <= 0) {
        const productRows = await queryDb<any>(
          `SELECT id, category, base_price FROM products WHERE id = $1`,
          [productId]
        ).catch(() => []);
        if (productRows && productRows[0]) {
          category = category || productRows[0].category;
          wholesaleBaseCost = parseFloat(productRows[0].base_price || '0');
        }
      }

      if (item.variant_id) {
        const variantRows = await queryDb<any>(
          `SELECT base_cost FROM product_variants WHERE id = $1`,
          [item.variant_id]
        ).catch(() => []);
        if (variantRows && variantRows[0]?.base_cost) {
          wholesaleBaseCost = parseFloat(variantRows[0].base_cost);
        }
      }

      // Calculate Loka Base Cost and Creator Revenue
      const lokaBaseCost = wholesaleBaseCost > 0
        ? calculateSellingPrice(wholesaleBaseCost, category)
        : Math.max(0, sellingPrice - 3.00);

      const creatorRevenuePerItem = Math.max(0, sellingPrice - lokaBaseCost);
      const totalCreatorRevenue = creatorRevenuePerItem * quantity;

      // Sync creator_commission_tracking
      const existingComm = await queryDb<any>(
        `SELECT id FROM creator_commission_tracking WHERE order_id = $1 AND product_id = $2 LIMIT 1`,
        [order.id, productId]
      ).catch(() => []);

      if (existingComm && existingComm.length > 0) {
        await queryDb(
          `UPDATE creator_commission_tracking 
           SET creator_revenue = $1, loka_base_cost = $2, creator_cost = $3, status = 'processing', updated_at = NOW() 
           WHERE id = $4`,
          [totalCreatorRevenue.toFixed(2), lokaBaseCost.toFixed(2), sellingPrice.toFixed(2), existingComm[0].id]
        ).catch(() => null);
      } else {
        await queryDb(
          `INSERT INTO creator_commission_tracking 
           (creator_id, order_id, product_id, creator_cost, creator_revenue, loka_base_cost, status, created_at, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, 'processing', NOW(), NOW())`,
          [creatorId, order.id, productId, sellingPrice.toFixed(2), totalCreatorRevenue.toFixed(2), lokaBaseCost.toFixed(2)]
        ).catch(() => null);
      }

      // Ensure creator wallet exists
      const walletRows = await queryDb<any>(
        `SELECT id FROM wallets WHERE creator_id = $1 LIMIT 1`,
        [creatorId]
      ).catch(() => []);

      let walletId: number;
      if (!walletRows || walletRows.length === 0) {
        const newWallet = await queryDb<any>(
          `INSERT INTO wallets (creator_id, available_balance, pending_balance, total_withdrawn, created_at, updated_at) 
           VALUES ($1, '0.00', '0.00', '0.00', NOW(), NOW()) RETURNING id`,
          [creatorId]
        ).catch(() => []);
        walletId = newWallet && newWallet[0] ? newWallet[0].id : 0;
      } else {
        walletId = walletRows[0].id;
      }

      if (walletId > 0) {
        // C15: Check uniqueness using uniqueReferenceId instead of just order.id
        const existingTx = await queryDb<any>(
          `SELECT id FROM wallet_transactions WHERE wallet_id = $1 AND reference_id = $2 LIMIT 1`,
          [walletId, uniqueReferenceId]
        ).catch(() => []);

        if (existingTx && existingTx.length > 0) {
          await queryDb(
            `UPDATE wallet_transactions 
             SET amount = $1, status = 'pending' 
             WHERE id = $2`,
            [totalCreatorRevenue.toFixed(2), existingTx[0].id]
          ).catch(() => null);
        } else {
          await queryDb(
            `INSERT INTO wallet_transactions 
             (wallet_id, type, amount, source, reference_id, status, description, created_at) 
             VALUES ($1, 'credit', $2, 'order_earning', $3, 'pending', $4, NOW())`,
            [walletId, totalCreatorRevenue.toFixed(2), uniqueReferenceId, `Commission earning for order #${order.id} item ${productId}`]
          ).catch(() => null);
        }

        // Recalculate pending balance
        await queryDb(
          `UPDATE wallets 
           SET pending_balance = (
             SELECT COALESCE(SUM(CAST(amount AS numeric)), 0) 
             FROM wallet_transactions 
             WHERE wallet_id = $1 AND type = 'credit' AND status = 'pending'
           ), updated_at = NOW() 
           WHERE id = $1`,
          [walletId]
        ).catch(() => null);
      }
    }
  } catch (commErr) {
    console.warn('[OrderPaymentConfirmation] Commission calculation warning:', commErr);
  }

  return { success: true, order };
}
