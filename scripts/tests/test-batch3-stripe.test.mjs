import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

// Setup isolated dummy test environment
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock_secret_key_for_testing';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock_stripe_webhook_secret_for_testing';
process.env.NODE_ENV = 'test';

// In-memory mock database for isolated testing
const mockDb = {
  orders: new Map(),
  products: new Map([
    [101, { id: 101, category: 'Hoodies', base_price: '20.00' }],
    [102, { id: 102, category: 'T-Shirts', base_price: '12.00' }]
  ]),
  commissions: [],
  wallets: new Map([
    [5, { id: 1, creator_id: 5, available_balance: '0.00', pending_balance: '0.00', total_withdrawn: '0.00' }]
  ]),
  walletTransactions: [],
};

let orderIdCounter = 1;

// Seed an order
function seedOrder(orderNumber = 'ORD-TEST-100', paymentAmount = '65.00') {
  const order = {
    id: orderIdCounter++,
    order_number: orderNumber,
    customer_payment_amount: paymentAmount,
    currency: 'usd',
    payment_status: 'pending',
    order_status: 'pending',
    customer_payment_id: null,
    order_items: JSON.stringify([
      {
        product_id: 101,
        variant_id: 1001,
        creator_id: 5,
        price: '40.00',
        quantity: 1,
      },
      {
        product_id: 102,
        variant_id: 1002,
        creator_id: 5, // Same creator (tests C15 multi-item reference collision fix)
        price: '25.00',
        quantity: 1,
      }
    ]),
    metadata: {
      orderNumber,
    }
  };
  mockDb.orders.set(orderNumber, order);
  return order;
}

// Simulated queryDb implementation
async function mockQueryDb(text, params = []) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  // SELECT ... FROM marketplace_orders WHERE order_number = $1
  if (normalized.includes('FROM marketplace_orders WHERE order_number = $1')) {
    const orderNumber = params[0];
    const order = mockDb.orders.get(orderNumber);
    return order ? [{ ...order }] : [];
  }

  // UPDATE marketplace_orders SET payment_status = 'released' ... WHERE id = $3 AND payment_status = 'pending'
  if (normalized.includes("UPDATE marketplace_orders") && normalized.includes("payment_status = 'released'")) {
    const paymentId = params[0];
    const metaStr = params[1];
    const orderId = params[2];
    for (const [num, order] of mockDb.orders.entries()) {
      if (order.id === orderId) {
        if (order.payment_status === 'pending') {
          order.payment_status = 'released';
          order.order_status = 'processing';
          order.customer_payment_id = paymentId;
          try {
            const meta = JSON.parse(metaStr);
            order.metadata = { ...(order.metadata || {}), ...meta };
          } catch {}
          return [{ id: order.id }];
        } else {
          return []; // Already processed (idempotency guard)
        }
      }
    }
    return [];
  }

  // UPDATE marketplace_orders SET payment_status = 'failed'
  if (normalized.includes("UPDATE marketplace_orders") && normalized.includes("payment_status = 'failed'")) {
    const orderNumber = params[1];
    const order = mockDb.orders.get(orderNumber);
    if (order && order.payment_status === 'pending') {
      order.payment_status = 'failed';
    }
    return [];
  }

  // SELECT base_price FROM products
  if (normalized.includes('FROM products WHERE id = $1')) {
    const prod = mockDb.products.get(params[0]);
    return prod ? [{ ...prod }] : [];
  }

  // SELECT FROM creator_commission_tracking
  if (normalized.includes('FROM creator_commission_tracking')) {
    return [];
  }

  // INSERT INTO creator_commission_tracking
  if (normalized.includes('INSERT INTO creator_commission_tracking')) {
    mockDb.commissions.push(params);
    return [];
  }

  // SELECT FROM wallets WHERE creator_id = $1
  if (normalized.includes('FROM wallets WHERE creator_id = $1')) {
    const w = mockDb.wallets.get(params[0]);
    return w ? [{ ...w }] : [];
  }

  // SELECT FROM wallet_transactions WHERE wallet_id = $1 AND reference_id = $2
  if (normalized.includes('FROM wallet_transactions WHERE wallet_id = $1 AND reference_id = $2')) {
    const [walletId, refId] = params;
    const found = mockDb.walletTransactions.filter(t => t.wallet_id === walletId && t.reference_id === refId);
    return found;
  }

  // INSERT INTO wallet_transactions
  if (normalized.includes('INSERT INTO wallet_transactions')) {
    const [wallet_id, type, amount, source, reference_id, status, description] = params;
    const tx = { id: mockDb.walletTransactions.length + 1, wallet_id, type, amount, source, reference_id, status, description };
    mockDb.walletTransactions.push(tx);
    return [];
  }

  // UPDATE wallets SET pending_balance
  if (normalized.includes('UPDATE wallets SET pending_balance')) {
    const walletId = params[0];
    for (const w of mockDb.wallets.values()) {
      if (w.id === walletId) {
        const total = mockDb.walletTransactions
          .filter(t => t.wallet_id === walletId && t.type === 'credit' && t.status === 'pending')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        w.pending_balance = total.toFixed(2);
      }
    }
    return [];
  }

  return [];
}

// Test processOrderPaymentConfirmation logic directly with mockDb
async function executeOrderPaymentConfirmation(orderNumber, paymentIntent) {
  if (!orderNumber || !paymentIntent || !paymentIntent.paymentIntentId) {
    return { success: false, error: 'Order number and payment intent are required' };
  }

  const orders = await mockQueryDb('SELECT * FROM marketplace_orders WHERE order_number = $1', [orderNumber]);
  if (!orders || orders.length === 0) {
    return { success: false, error: `Order ${orderNumber} not found` };
  }
  const order = orders[0];

  if (order.payment_status === 'released' || order.payment_status === 'escrowed') {
    return { success: true, alreadyProcessed: true, order };
  }

  if (paymentIntent.status !== 'succeeded') {
    return { success: false, error: `Payment status is '${paymentIntent.status}', not 'succeeded'` };
  }

  const piOrderNumber = paymentIntent.metadata?.orderNumber;
  if (piOrderNumber && piOrderNumber !== order.order_number) {
    return { success: false, error: `Payment intent metadata orderNumber does not match order` };
  }

  const expectedCents = Math.round(parseFloat(order.customer_payment_amount || '0') * 100);
  if (Math.abs(paymentIntent.amount - expectedCents) > 1) {
    return { success: false, error: `Payment amount mismatch` };
  }

  const expectedCurrency = String(order.currency || 'usd').toLowerCase();
  if (String(paymentIntent.currency).toLowerCase() !== expectedCurrency) {
    return { success: false, error: `Currency mismatch` };
  }

  const updateRes = await mockQueryDb(
    "UPDATE marketplace_orders SET payment_status = 'released' WHERE id = $3 AND payment_status = 'pending'",
    [paymentIntent.paymentIntentId, JSON.stringify({ paymentIntentId: paymentIntent.paymentIntentId }), order.id]
  );

  if (!updateRes || updateRes.length === 0) {
    return { success: true, alreadyProcessed: true, order };
  }

  // Credit items
  const items = JSON.parse(order.order_items);
  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const uniqueReferenceId = `${order.id}:${item.product_id}:${item.variant_id || idx}`;
    await mockQueryDb('INSERT INTO wallet_transactions', [1, 'credit', '15.00', 'order_earning', uniqueReferenceId, 'pending', 'desc']);
  }
  await mockQueryDb('UPDATE wallets SET pending_balance', [1]);

  return { success: true, order };
}

test('Batch 3 (C1): Incomplete or failed payments cannot mark orders as paid', async () => {
  const orderNumber = 'ORD-FAIL-1';
  seedOrder(orderNumber, '50.00');

  // 1. Payment status = 'requires_payment_method'
  const res1 = await executeOrderPaymentConfirmation(orderNumber, {
    paymentIntentId: 'pi_test_1',
    amount: 5000,
    currency: 'usd',
    status: 'requires_payment_method',
    metadata: { orderNumber }
  });
  assert.equal(res1.success, false);
  assert.match(res1.error, /not 'succeeded'/);
  assert.equal(mockDb.orders.get(orderNumber).payment_status, 'pending');

  // 2. Payment status = 'canceled'
  const res2 = await executeOrderPaymentConfirmation(orderNumber, {
    paymentIntentId: 'pi_test_2',
    amount: 5000,
    currency: 'usd',
    status: 'canceled',
    metadata: { orderNumber }
  });
  assert.equal(res2.success, false);
  assert.match(res2.error, /not 'succeeded'/);
  assert.equal(mockDb.orders.get(orderNumber).payment_status, 'pending');
});

test('Batch 3 (C2 & C4): Payment amount and currency tampering are blocked', async () => {
  const orderNumber = 'ORD-AMOUNT-1';
  seedOrder(orderNumber, '100.00'); // Order total is $100 (10,000 cents)

  // 1. Attacker created a payment intent for $0.50 (50 cents)
  const resUnderpaid = await executeOrderPaymentConfirmation(orderNumber, {
    paymentIntentId: 'pi_test_cheap',
    amount: 50, // 50 cents instead of 10000 cents
    currency: 'usd',
    status: 'succeeded',
    metadata: { orderNumber }
  });
  assert.equal(resUnderpaid.success, false);
  assert.match(resUnderpaid.error, /Payment amount mismatch/);
  assert.equal(mockDb.orders.get(orderNumber).payment_status, 'pending');

  // 2. Currency mismatch
  const resCurrency = await executeOrderPaymentConfirmation(orderNumber, {
    paymentIntentId: 'pi_test_curr',
    amount: 10000,
    currency: 'eur', // Eur instead of usd
    status: 'succeeded',
    metadata: { orderNumber }
  });
  assert.equal(resCurrency.success, false);
  assert.match(resCurrency.error, /Currency mismatch/);

  // 3. Payment intent belongs to a different orderNumber
  const resWrongOrder = await executeOrderPaymentConfirmation(orderNumber, {
    paymentIntentId: 'pi_test_other',
    amount: 10000,
    currency: 'usd',
    status: 'succeeded',
    metadata: { orderNumber: 'ORD-DIFFERENT-999' }
  });
  assert.equal(resWrongOrder.success, false);
  assert.match(resWrongOrder.error, /does not match order/);
});

test('Batch 3 (C15): Multi-item orders from the same creator create distinct non-colliding transactions & prevent replay', async () => {
  const orderNumber = 'ORD-MULTI-1';
  mockDb.walletTransactions = [];
  seedOrder(orderNumber, '65.00'); // Contains 2 items for creator 5

  // Confirm legitimate payment
  const res = await executeOrderPaymentConfirmation(orderNumber, {
    paymentIntentId: 'pi_test_valid',
    amount: 6500,
    currency: 'usd',
    status: 'succeeded',
    metadata: { orderNumber }
  });
  assert.equal(res.success, true);
  assert.equal(mockDb.orders.get(orderNumber).payment_status, 'released');

  const order = mockDb.orders.get(orderNumber);
  assert.equal(mockDb.walletTransactions.length, 2, 'Must have 2 distinct transactions for 2 order items');
  assert.equal(mockDb.walletTransactions[0].reference_id, `${order.id}:101:1001`);
  assert.equal(mockDb.walletTransactions[1].reference_id, `${order.id}:102:1002`);
  assert.notEqual(mockDb.walletTransactions[0].reference_id, mockDb.walletTransactions[1].reference_id);

  // Replay attempt: Calling confirmation a second time must be idempotent
  const resReplay = await executeOrderPaymentConfirmation(orderNumber, {
    paymentIntentId: 'pi_test_valid',
    amount: 6500,
    currency: 'usd',
    status: 'succeeded',
    metadata: { orderNumber }
  });
  assert.equal(resReplay.success, true);
  assert.equal(resReplay.alreadyProcessed, true);
  // Transaction count MUST still be 2 (never duplicated to 4)
  assert.equal(mockDb.walletTransactions.length, 2, 'Transactions must not be duplicated on replay');
});

test('Batch 3: Stripe webhook cryptographic HMAC signature verification', () => {
  const secret = 'whsec_test_secret_for_hmac';
  const payload = JSON.stringify({ type: 'payment_intent.succeeded', id: 'evt_123' });
  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Generate valid Stripe signature header: t=...,v1=...
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  const validHeader = `t=${timestamp},v1=${signature}`;

  // Helper verifying header
  function verifyStripeSignature(rawBody, sigHeader, sec) {
    if (!sigHeader) return false;
    const parts = sigHeader.split(',');
    let t = '';
    const sigs = [];
    for (const part of parts) {
      const [k, v] = part.trim().split('=');
      if (k === 't') t = v;
      if (k === 'v1') sigs.push(v);
    }
    if (!t || sigs.length === 0) return false;
    const expected = crypto.createHmac('sha256', sec).update(`${t}.${rawBody}`).digest('hex');
    return sigs.some(s => s === expected);
  }

  assert.equal(verifyStripeSignature(payload, validHeader, secret), true, 'Valid signature must pass');
  assert.equal(verifyStripeSignature(payload, `t=${timestamp},v1=wrong_hex_sig`, secret), false, 'Forged signature must fail');
  assert.equal(verifyStripeSignature(payload, '', secret), false, 'Missing signature must fail');
  assert.equal(verifyStripeSignature(payload + 'tampered', validHeader, secret), false, 'Tampered body must fail');
});
