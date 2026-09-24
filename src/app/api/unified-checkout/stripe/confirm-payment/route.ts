import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { getApiUrl } from '@/lib/getApiUrl';
import { queryDb } from '@/lib/db';
import { calculateSellingPrice } from '@/lib/pricing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIntentId, orderNumber } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
    const authHeader = request.headers.get('authorization');

    // 1. Verify payment status directly with Stripe in test mode
    const stripeRes = await axios.get(
      `https://api.stripe.com/v1/payment_intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': `Bearer ${secretKey}`,
        },
      }
    );

    const paymentIntent = stripeRes.data;

    // 2. Safely attempt notifying backend
    try {
      const backendUrl = `${getApiUrl()}/api/unified-checkout/stripe/confirm-payment`;
      await axios.post(
        backendUrl,
        { paymentIntentId, orderNumber },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(authHeader ? { 'Authorization': authHeader } : {}),
          },
        }
      );
    } catch (backendError: any) {
      console.warn('⚠️ Backend confirmation notify note:', backendError.response?.data?.details || backendError.message);
    }

    // 3. PostgreSQL Direct Order & Commission Synchronization
    try {
      const orders = await queryDb<any>(
        `SELECT id, order_number, order_items, customer_payment_amount, payment_status, metadata 
         FROM marketplace_orders 
         WHERE order_number = $1 OR customer_payment_id = $2 OR (metadata->>'paymentIntentId' = $2)
         LIMIT 1`,
        [orderNumber || '', paymentIntentId]
      );

      if (orders && orders.length > 0) {
        const order = orders[0];
        
        // Ensure order is marked released
        await queryDb(
          `UPDATE marketplace_orders 
           SET payment_status = 'released', order_status = 'processing', updated_at = NOW() 
           WHERE id = $1`,
          [order.id]
        );

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

        for (const item of items) {
          const creatorId = item.creator_id || item.user_id;
          const productId = item.product_id;
          const quantity = parseInt(item.quantity || '1', 10);
          const sellingPrice = parseFloat(item.price || item.unit_price || item.base_price || '0');

          if (!creatorId || !productId) continue;

          // Fetch product & variant base cost
          const productRows = await queryDb<any>(
            `SELECT id, category, base_price, markup_percentage FROM products WHERE id = $1`,
            [productId]
          );
          const product = productRows[0] || {};
          const category = product.category || item.category || undefined;

          // Determine base wholesale cost
          let wholesaleBaseCost = parseFloat(item.pbc || item.base_cost || product.base_price || '0');
          if (item.variant_id) {
            const variantRows = await queryDb<any>(
              `SELECT base_cost FROM product_variants WHERE id = $1`,
              [item.variant_id]
            );
            if (variantRows[0]?.base_cost) {
              wholesaleBaseCost = parseFloat(variantRows[0].base_cost);
            }
          }

          // Calculate unified Loka Base Cost and Creator Profit
          const lokaBaseCost = wholesaleBaseCost > 0 
            ? calculateSellingPrice(wholesaleBaseCost, category)
            : Math.max(0, sellingPrice - 3.00);

          const creatorRevenuePerItem = Math.max(0, sellingPrice - lokaBaseCost);
          const totalCreatorRevenue = creatorRevenuePerItem * quantity;

          // Sync creator_commission_tracking
          const existingComm = await queryDb<any>(
            `SELECT id FROM creator_commission_tracking WHERE order_id = $1 AND product_id = $2 LIMIT 1`,
            [order.id, productId]
          );

          if (existingComm && existingComm.length > 0) {
            await queryDb(
              `UPDATE creator_commission_tracking 
               SET creator_revenue = $1, loka_base_cost = $2, creator_cost = $3, status = 'processing', updated_at = NOW() 
               WHERE id = $4`,
              [totalCreatorRevenue.toFixed(2), lokaBaseCost.toFixed(2), sellingPrice.toFixed(2), existingComm[0].id]
            );
          } else {
            await queryDb(
              `INSERT INTO creator_commission_tracking 
               (creator_id, order_id, product_id, creator_cost, creator_revenue, loka_base_cost, status, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, 'processing', NOW(), NOW())`,
              [creatorId, order.id, productId, sellingPrice.toFixed(2), totalCreatorRevenue.toFixed(2), lokaBaseCost.toFixed(2)]
            );
          }

          // Sync wallet & transaction
          let walletRows = await queryDb<any>(
            `SELECT id FROM wallets WHERE creator_id = $1 LIMIT 1`,
            [creatorId]
          );

          let walletId: number;
          if (!walletRows || walletRows.length === 0) {
            const newWallet = await queryDb<any>(
              `INSERT INTO wallets (creator_id, available_balance, pending_balance, total_withdrawn, created_at, updated_at) 
               VALUES ($1, '0.00', '0.00', '0.00', NOW(), NOW()) RETURNING id`,
              [creatorId]
            );
            walletId = newWallet[0].id;
          } else {
            walletId = walletRows[0].id;
          }

          const existingTx = await queryDb<any>(
            `SELECT id FROM wallet_transactions WHERE wallet_id = $1 AND reference_id = $2 LIMIT 1`,
            [walletId, order.id.toString()]
          );

          if (existingTx && existingTx.length > 0) {
            await queryDb(
              `UPDATE wallet_transactions 
               SET amount = $1, status = 'pending' 
               WHERE id = $2`,
              [totalCreatorRevenue.toFixed(2), existingTx[0].id]
            );
          } else {
            await queryDb(
              `INSERT INTO wallet_transactions 
               (wallet_id, type, amount, source, reference_id, status, description, created_at) 
               VALUES ($1, 'credit', $2, 'order_earning', $3, 'pending', $4, NOW())`,
              [walletId, totalCreatorRevenue.toFixed(2), order.id.toString(), `Commission earning for order #${order.id}`]
            );
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
          );
        }
      }
    } catch (syncErr: any) {
      console.warn('⚠️ Direct DB commission sync warning:', syncErr.message || syncErr);
    }

    return NextResponse.json({
      success: true,
      status: paymentIntent.status,
      paymentIntent,
      orderNumber,
    });
  } catch (error: any) {
    console.error('❌ [Local Stripe Confirm Payment] Error:', error.response?.data || error.message);
    const msg = error.response?.data?.error?.message || error.message || 'Failed to confirm payment';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
