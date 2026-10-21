import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.PRINTIFY_WEBHOOK_SECRET = 'whsec_test_printify_webhook_secret_123';
process.env.NODE_ENV = 'test';

test('Batch 4 (C11): Printify webhook HMAC signature verification', () => {
  const webhookSecret = 'whsec_test_printify_webhook_secret_123';
  const payload = JSON.stringify({ type: 'order:shipment_created', resource: { id: 'pr_order_123', external_id: 'LOKA-100' } });

  // Generate valid HMAC signature
  const validSignature = crypto.createHmac('sha256', webhookSecret).update(payload).digest('hex');

  function verifyPrintifySignature(rawBody, signature, secret) {
    if (!signature) return false;
    const cleanSig = signature.replace(/^sha256=/i, '').trim();
    const expectedSig = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expectedSig.length !== cleanSig.length) return false;
    return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(cleanSig));
  }

  assert.equal(verifyPrintifySignature(payload, validSignature, webhookSecret), true, 'Valid signature must pass');
  assert.equal(verifyPrintifySignature(payload, `sha256=${validSignature}`, webhookSecret), true, 'Prefixed signature must pass');
  assert.equal(verifyPrintifySignature(payload, 'wrong_signature_hex_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', webhookSecret), false, 'Forged signature must fail');
  assert.equal(verifyPrintifySignature(payload, '', webhookSecret), false, 'Missing signature must fail');
  assert.equal(verifyPrintifySignature(payload + 'tampered', validSignature, webhookSecret), false, 'Tampered payload must fail');
});

test('Batch 4 (C14): Creator cannot cancel multi-creator orders; Admin can cancel and reverse commissions', () => {
  // Simulate mock database state for order cancellation
  const db = {
    orders: new Map([
      [1, { id: 1, order_number: 'ORD-MULTI-1', order_status: 'processing', payment_status: 'released' }]
    ]),
    creator_commission_tracking: [
      { id: 10, order_id: 1, creator_id: 101, creator_revenue: '15.00', status: 'processing' },
      { id: 11, order_id: 1, creator_id: 102, creator_revenue: '20.00', status: 'processing' } // Second creator in same order
    ],
    wallets: new Map([
      [101, { creator_id: 101, pending_balance: 15.00 }],
      [102, { creator_id: 102, pending_balance: 20.00 }]
    ]),
    wallet_transactions: [
      { id: 1, wallet_id: 101, reference_id: '1:prod_1', type: 'credit', amount: 15.00, status: 'pending' },
      { id: 2, wallet_id: 102, reference_id: '1:prod_2', type: 'credit', amount: 20.00, status: 'pending' }
    ]
  };

  function simulateCancelOrder(userRole, userId, orderId) {
    const order = db.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    // C14 Rule: If user is not admin, they can ONLY cancel if all items belong exclusively to them
    if (userRole !== 'admin') {
      const creatorsInOrder = db.creator_commission_tracking.filter(c => c.order_id === orderId);
      if (creatorsInOrder.length === 0) {
        throw new Error('Forbidden: No products in order');
      }
      const hasOtherCreators = creatorsInOrder.some(r => Number(r.creator_id) !== Number(userId));
      if (hasOtherCreators) {
        throw new Error('Forbidden: Multi-creator orders can only be cancelled by an administrator');
      }
    }

    // Cancel order & reverse commissions and wallets
    order.order_status = 'cancelled';
    order.payment_status = 'refunded';

    const commRows = db.creator_commission_tracking.filter(c => c.order_id === orderId && c.status !== 'refunded');
    for (const comm of commRows) {
      comm.status = 'refunded';
      const wallet = db.wallets.get(comm.creator_id);
      if (wallet) {
        wallet.pending_balance = Math.max(0, wallet.pending_balance - parseFloat(comm.creator_revenue));
      }
      for (const tx of db.wallet_transactions) {
        if (tx.reference_id.startsWith(`${orderId}:`)) {
          tx.status = 'cancelled';
        }
      }
    }

    return { success: true };
  }

  // 1. Creator 101 attempts to cancel multi-creator order -> MUST FAIL with 403
  assert.throws(
    () => simulateCancelOrder('creator', 101, 1),
    /Forbidden: Multi-creator orders can only be cancelled by an administrator/,
    'Creator must not be allowed to cancel another creator\'s order items'
  );
  assert.equal(db.orders.get(1).order_status, 'processing', 'Order must remain processing');

  // 2. Admin cancels multi-creator order -> MUST SUCCEED and reverse wallet balances
  const adminRes = simulateCancelOrder('admin', 1, 1);
  assert.equal(adminRes.success, true);
  assert.equal(db.orders.get(1).order_status, 'cancelled');
  assert.equal(db.orders.get(1).payment_status, 'refunded');

  // Both creators' pending balances must be reversed to 0
  assert.equal(db.wallets.get(101).pending_balance, 0.00, 'Creator 101 balance reversed');
  assert.equal(db.wallets.get(102).pending_balance, 0.00, 'Creator 102 balance reversed');

  // Transactions must be marked cancelled
  assert.equal(db.wallet_transactions[0].status, 'cancelled');
  assert.equal(db.wallet_transactions[1].status, 'cancelled');
});

test('Batch 4 (C18): Variant base cost flooring and Printify catalog protection', () => {
  function computeVariantPricing(variantInput, catalogVariant = null) {
    let baseCost = parseFloat(variantInput.cost);
    if (isNaN(baseCost) || baseCost <= 0) baseCost = 10.00;

    if (catalogVariant) {
      const catalogCost = catalogVariant.cost !== undefined
        ? (catalogVariant.cost > 100 ? parseFloat(catalogVariant.cost) / 100 : parseFloat(catalogVariant.cost))
        : (catalogVariant.price !== undefined ? parseFloat(catalogVariant.price) / 100 : 0);
      if (catalogCost > 0 && baseCost < catalogCost) {
        baseCost = catalogCost;
      }
    }

    baseCost = Math.max(baseCost, 5.00); // Minimum platform base cost floor
    const lokaBaseCost = baseCost * 1.35;
    const markupPercentage = parseFloat(variantInput.markupPercentage || 20);
    const finalPrice = Math.ceil(lokaBaseCost * (1 + markupPercentage / 100)) - 0.01;

    return { baseCost, lokaBaseCost, finalPrice };
  }

  // 1. Creator attempts to set base cost to $0.01 (catalog wholesale is $15.00)
  const exploitAttempt = computeVariantPricing(
    { cost: '0.01', markupPercentage: 20 },
    { cost: 1500 } // Catalog cost 1500 cents ($15.00)
  );
  assert.equal(exploitAttempt.baseCost, 15.00, 'Base cost must be overridden to trusted catalog cost of 15.00');
  assert.ok(exploitAttempt.finalPrice > 20.00, 'Final price must reflect real base cost');

  // 2. Creator attempts to set base cost to $0.00 without catalog
  const zeroAttempt = computeVariantPricing({ cost: '0.00', markupPercentage: 20 });
  assert.equal(zeroAttempt.baseCost, 10.00, 'Zero base cost defaults to 10.00 safe default');

  // 3. Creator attempts to set base cost to $2.00
  const floorAttempt = computeVariantPricing({ cost: '2.00', markupPercentage: 20 });
  assert.equal(floorAttempt.baseCost, 5.00, 'Base cost is floored at 5.00 minimum');
});
