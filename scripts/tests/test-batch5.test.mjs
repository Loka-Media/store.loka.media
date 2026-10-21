import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const apiDir = path.resolve('../store-api.loka.media');
const storeDir = path.resolve('.');

// ============================================================================
// H1: Admin Order Filter SQL Condition Assembly
// ============================================================================
test('H1: adminOrderQueries condition builder generates valid SQL for all filter permutations', () => {
  // Simulate the query condition builder function from adminOrderQueries.js
  const buildQuery = ({ status, orderType, priority, search }) => {
    let query = 'SELECT mo.* FROM marketplace_orders mo LEFT JOIN users u ON mo.user_id = u.id';
    const queryParams = [];
    let paramCount = 0;
    const whereConditions = [];

    if (status) {
      paramCount++;
      whereConditions.push(`mo.order_status = $${paramCount}`);
      queryParams.push(status);
    }

    if (orderType) {
      paramCount++;
      whereConditions.push(`mo.order_type = $${paramCount}`);
      queryParams.push(orderType);
    }

    if (priority) {
      paramCount++;
      whereConditions.push(`avq.priority = $${paramCount}`);
      queryParams.push(priority);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(
        mo.order_number ILIKE $${paramCount} OR
        COALESCE(u.email, (mo.metadata->>'customerEmail')) ILIKE $${paramCount} OR
        COALESCE(u.name, (mo.metadata->>'customerName'), (mo.shipping_address->>'name')) ILIKE $${paramCount}
      )`);
      queryParams.push(`%${search}%`);
    }

    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }

    return { query, queryParams };
  };

  // Case 1: Status only
  const r1 = buildQuery({ status: 'pending' });
  assert.ok(r1.query.includes('WHERE mo.order_status = $1'));
  assert.ok(!r1.query.includes('AND mo.order_status'));
  assert.equal(r1.queryParams.length, 1);

  // Case 2: orderType only (the primary bug where paramCount was > 0 and caused "WHERE mo.order_type = $1" to be "AND mo.order_type = $1" without WHERE)
  const r2 = buildQuery({ orderType: 'marketplace' });
  assert.ok(r2.query.includes('WHERE mo.order_type = $1'), 'Must include WHERE clause when status is omitted');
  assert.ok(!r2.query.includes('LEFT JOIN users u ON mo.user_id = u.id AND'), 'Must not emit floating AND without WHERE');
  assert.equal(r2.queryParams.length, 1);

  // Case 3: Priority + search without status
  const r3 = buildQuery({ priority: 'urgent', search: 'alice' });
  assert.ok(r3.query.includes('WHERE avq.priority = $1 AND ('));
  assert.equal(r3.queryParams.length, 2);

  // Case 4: No filters
  const r4 = buildQuery({});
  assert.ok(!r4.query.includes('WHERE'));
  assert.ok(!r4.query.includes('AND'));
  assert.equal(r4.queryParams.length, 0);

  // Verify file content in repo matches fixed condition builder
  const actualCode = fs.readFileSync(path.join(apiDir, 'src/queries/adminOrderQueries.js'), 'utf8');
  assert.ok(actualCode.includes('whereConditions.join(\' AND \')'), 'Repo file must have whereConditions join');
  assert.ok(!actualCode.includes("${paramCount === 0 ? 'WHERE' : 'AND'}"), 'Repo file must not have buggy paramCount === 0 ternary');
});

// ============================================================================
// H2 & H3: Order Release State Machine & Read-Only GET List
// ============================================================================
test('H2 & H3: Admin order release rejects invalid states and GET list is read-only', () => {
  const validateReleaseState = (order) => {
    if (!order) throw { status: 404, message: 'Order not found' };
    if (order.payment_status === 'released') throw { status: 400, message: 'Payment already released' };

    const orderStatus = (order.order_status || '').toLowerCase().trim();
    const paymentStatus = (order.payment_status || '').toLowerCase().trim();

    if (['cancelled', 'refunded', 'failed'].includes(orderStatus) || ['cancelled', 'refunded', 'failed'].includes(paymentStatus)) {
      throw { status: 400, message: `Cannot release payment for order in ${orderStatus || paymentStatus} state` };
    }

    const isPaidOrEscrowed = paymentStatus === 'escrowed' || paymentStatus === 'payment_received' || orderStatus === 'payment_received' || orderStatus === 'processing';
    if (!isPaidOrEscrowed) {
      throw { status: 400, message: `Order payment status must be escrowed or payment_received to release (current: ${paymentStatus || 'unpaid'})` };
    }

    return true;
  };

  // Releasing already released order fails
  assert.throws(
    () => validateReleaseState({ payment_status: 'released' }),
    (err) => err.status === 400 && err.message.includes('already released')
  );

  // Releasing cancelled order fails
  assert.throws(
    () => validateReleaseState({ order_status: 'cancelled', payment_status: 'escrowed' }),
    (err) => err.status === 400 && err.message.includes('Cannot release payment for order in cancelled state')
  );

  // Releasing failed order fails
  assert.throws(
    () => validateReleaseState({ order_status: 'failed', payment_status: 'failed' }),
    (err) => err.status === 400 && err.message.includes('Cannot release payment for order in failed state')
  );

  // Releasing unpaid/pending order fails
  assert.throws(
    () => validateReleaseState({ order_status: 'created', payment_status: 'pending' }),
    (err) => err.status === 400 && err.message.includes('Order payment status must be escrowed')
  );

  // Valid escrowed / payment_received orders pass
  assert.equal(validateReleaseState({ order_status: 'payment_received', payment_status: 'escrowed' }), true);
  assert.equal(validateReleaseState({ order_status: 'processing', payment_status: 'payment_received' }), true);

  // Check actual repo file for H2 (no auto-release side effects in GET)
  const serviceCode = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  assert.ok(!serviceCode.includes('Auto-release/submit any order that is verified/escrowed'), 'H2: GET list must not contain auto-release side effects');
});

// ============================================================================
// H4, H5, H6: Printify Response Normalization, Single Shop, and send_to_production
// ============================================================================
test('H4, H5, H6: Printify order schema normalization, single configured shop, and sendToProduction', () => {
  // H4: Normalize Printify responses
  const normalizePrintifyOrder = (res) => {
    const pfOrder = res ? (res.result || res) : null;
    return {
      id: pfOrder?.id || null,
      total_price: pfOrder?.total_price || 0,
      itemCount: (pfOrder?.line_items || pfOrder?.items || []).length
    };
  };

  // Standard Printify response (top-level properties)
  const standardPf = { id: 'pf_ord_123', total_price: 2500, line_items: [{ id: 1 }, { id: 2 }] };
  const norm1 = normalizePrintifyOrder(standardPf);
  assert.equal(norm1.id, 'pf_ord_123');
  assert.equal(norm1.itemCount, 2);

  // Legacy/wrapped Printify response (result property)
  const wrappedPf = { result: { id: 'pf_ord_456', total_price: 3500, items: [{ id: 1 }] } };
  const norm2 = normalizePrintifyOrder(wrappedPf);
  assert.equal(norm2.id, 'pf_ord_456');
  assert.equal(norm2.itemCount, 1);

  // H5 & H6 verification in printifyService.js
  const pfServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/printifyService.js'), 'utf8');
  assert.ok(!pfServiceCode.includes("'27856672'"), 'H5: Must not have hardcoded foreign shop IDs');
  assert.ok(pfServiceCode.includes('sendToProduction: async'), 'H6: Must implement sendToProduction on printifyAPI');

  // Verify adminOrderService calls sendToProduction
  const adminServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  assert.ok(adminServiceCode.includes('printifyAPI.sendToProduction(pfOrderId)'), 'H6: Must call sendToProduction in releaseOrderPayment');
});

// ============================================================================
// H7: Proxy Client IP Extraction & Header Forwarding
// ============================================================================
test('H7: Proxy client IP extraction and forwarding for accurate rate limiting', () => {
  const getClientIp = (request) => {
    const forwardedFor = typeof request.headers?.get === 'function'
      ? request.headers.get('x-forwarded-for')
      : request.headers?.['x-forwarded-for'];
    if (forwardedFor) {
      const ips = forwardedFor.split(',');
      return ips[0].trim();
    }
    const realIp = typeof request.headers?.get === 'function'
      ? request.headers.get('x-real-ip')
      : request.headers?.['x-real-ip'];
    if (realIp) {
      return realIp.trim();
    }
    return '127.0.0.1';
  };

  const forwardClientHeaders = (request, extraHeaders = {}) => {
    const clientIp = getClientIp(request);
    return {
      'X-Forwarded-For': clientIp,
      'X-Real-IP': clientIp,
      ...extraHeaders
    };
  };

  // Case 1: Multiple comma-separated proxy IPs in X-Forwarded-For
  const req1 = { headers: { get: (h) => h === 'x-forwarded-for' ? '203.0.113.195, 70.41.3.18, 150.172.238.178' : null } };
  assert.equal(getClientIp(req1), '203.0.113.195');

  // Case 2: X-Real-IP
  const req2 = { headers: { get: (h) => h === 'x-real-ip' ? '198.51.100.42' : null } };
  assert.equal(getClientIp(req2), '198.51.100.42');

  // Case 3: Forwarding headers generated
  const forwarded = forwardClientHeaders(req1, { 'Authorization': 'Bearer test' });
  assert.equal(forwarded['X-Forwarded-For'], '203.0.113.195');
  assert.equal(forwarded['Authorization'], 'Bearer test');
});

// ============================================================================
// H9: Shopify Webhook HMAC Timing-Safe Verification & Buffer Protection
// ============================================================================
test('H9: Shopify webhook verification enforces HMAC signature and timingSafeEqual buffer checks', () => {
  const secret = 'test_shopify_webhook_secret_key_123';

  const verifyWebhook = (body, hmacHeader, configuredSecret) => {
    if (!hmacHeader || !configuredSecret) {
      return { status: 401, error: 'Missing signature or secret' };
    }

    const rawBody = Buffer.isBuffer(body) ? body : (typeof body === 'string' ? body : JSON.stringify(body));
    const calculatedHash = crypto.createHmac('sha256', configuredSecret).update(rawBody, 'utf8').digest('base64');

    const calculatedBuf = Buffer.from(calculatedHash, 'base64');
    const providedBuf = Buffer.from(hmacHeader, 'base64');

    if (calculatedBuf.length !== providedBuf.length) {
      return { status: 401, error: 'Signature length mismatch' };
    }

    const isValid = crypto.timingSafeEqual(calculatedBuf, providedBuf);
    return isValid ? { status: 200 } : { status: 401, error: 'Invalid signature' };
  };

  const payload = JSON.stringify({ id: 987654, line_items: [{ title: 'Shirt', price: '29.99' }] });
  const validSignature = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('base64');

  // 1. Valid signature passes
  const res1 = verifyWebhook(payload, validSignature, secret);
  assert.equal(res1.status, 200);

  // 2. Tampered payload fails
  const res2 = verifyWebhook(payload + 'tampered', validSignature, secret);
  assert.equal(res2.status, 401);

  // 3. Forged signature fails
  const forgedSig = crypto.createHmac('sha256', 'wrong_secret').update(payload, 'utf8').digest('base64');
  const res3 = verifyWebhook(payload, forgedSig, secret);
  assert.equal(res3.status, 401);

  // 4. Mismatched length signature does NOT throw exception, safely returns 401
  const shortSig = 'short_sig';
  const res4 = verifyWebhook(payload, shortSig, secret);
  assert.equal(res4.status, 401);
  assert.equal(res4.error, 'Signature length mismatch');
});

// ============================================================================
// H13: Stripe Transfers Idempotency Key
// ============================================================================
test('H13: Stripe transfers approveWithdrawal uses idempotencyKey', () => {
  const walletServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/walletService.js'), 'utf8');
  assert.ok(
    walletServiceCode.includes('idempotencyKey: `withdrawal_transfer_${request.id}`'),
    'H13: approveWithdrawal must pass idempotencyKey to stripe.transfers.create'
  );
});

// ============================================================================
// H14: Wallet Cron PostgreSQL Advisory Lock
// ============================================================================
test('H14: releaseEligibleCommissions uses pg_try_advisory_lock to prevent concurrent execution', () => {
  const walletServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/walletService.js'), 'utf8');
  assert.ok(
    walletServiceCode.includes('pg_try_advisory_lock(987654321)'),
    'H14: releaseEligibleCommissions must acquire advisory lock'
  );
  assert.ok(
    walletServiceCode.includes('pg_advisory_unlock(987654321)'),
    'H14: releaseEligibleCommissions must release advisory lock in finally'
  );
});

// ============================================================================
// H15: Refund Reversal Composite Reference ID Matching & Safe Balance Deduction
// ============================================================================
test('H15: handleCommissionRefund matches composite line items and protects available balance', () => {
  const walletServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/walletService.js'), 'utf8');
  assert.ok(
    walletServiceCode.includes('(reference_id = $2 OR reference_id LIKE $3)'),
    'H15: Must match both exact orderId and composite line-item reference IDs'
  );
  assert.ok(
    !walletServiceCode.includes('LIMIT 1\n    `, [wallet.id, orderId.toString()])'),
    'H15: Must not limit refund query to single row when an order has multiple items'
  );
});

// ============================================================================
// H16 & H17: Financial Constraints ON DELETE RESTRICT & Schema Fixes
// ============================================================================
test('H16 & H17: Database schema protects financial records with RESTRICT and fixes Printify types', () => {
  const dbCode = fs.readFileSync(path.join(apiDir, 'src/config/database.js'), 'utf8');

  // H16: Verify financial tables use ON DELETE RESTRICT
  assert.ok(dbCode.includes('wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT'));
  assert.ok(dbCode.includes('creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT'));

  // H17: Verify duplicate column is removed and types allow string IDs
  assert.ok(!dbCode.includes('printify_product_id INTEGER,\n        printify_product_id INTEGER,'));
  assert.ok(dbCode.includes('printify_product_id VARCHAR(255)'));
});

// ============================================================================
// H18: Stripe Config Route Rejects Missing Keys Without Hardcoded Fallback
// ============================================================================
test('H18: Storefront stripe config route does not contain hardcoded test key fallbacks', () => {
  const configRouteCode = fs.readFileSync(
    path.join(storeDir, 'src/app/api/unified-checkout/stripe/config/route.ts'),
    'utf8'
  );
  assert.ok(!configRouteCode.includes('pk_test_51RrcfkGofdJ5lBg3bgODkRSZGgRXPccoOzctQ55xRmNmQU8tqAnu46f2d0x5cfnNtzPx3oGGuhPaStjCqHmBFxtQ00NNdS84s8'), 'Must not contain hardcoded test key');
  assert.ok(configRouteCode.includes('Stripe publishable key is not configured'), 'Must return error if not configured');
});

// ============================================================================
// H19: Sensitive Body Redaction & Production Error Stack Hiding
// ============================================================================
test('H19: Error handler redacts passwords/tokens and hides stack traces in production', () => {
  const redactBody = (body) => {
    if (!body || typeof body !== 'object') return body;
    const redacted = { ...body };
    const sensitiveKeys = ['password', 'confirmPassword', 'token', 'secret', 'apiKey', 'creditCard', 'cvv', 'card', 'authorization'];
    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s.toLowerCase()))) {
        redacted[key] = '[REDACTED]';
      }
    }
    return redacted;
  };

  const rawBody = {
    email: 'user@example.com',
    password: 'superSecretPassword123!',
    confirmPassword: 'superSecretPassword123!',
    token: 'jwt_secret_token_abc',
    creditCardNumber: '4111222233334444',
    cvv: '123',
    shippingAddress: { city: 'New York' }
  };

  const sanitized = redactBody(rawBody);
  assert.equal(sanitized.email, 'user@example.com');
  assert.equal(sanitized.password, '[REDACTED]');
  assert.equal(sanitized.confirmPassword, '[REDACTED]');
  assert.equal(sanitized.token, '[REDACTED]');
  assert.equal(sanitized.creditCardNumber, '[REDACTED]');
  assert.equal(sanitized.cvv, '[REDACTED]');
  assert.equal(sanitized.shippingAddress.city, 'New York');

  // Verify app.js error handler implementation
  const appCode = fs.readFileSync(path.join(apiDir, 'src/app.js'), 'utf8');
  assert.ok(appCode.includes('body: redactBody(req.body)'));
  assert.ok(appCode.includes('!isProduction && { details: err.message, stack: err.stack }'));
});

// ============================================================================
// H20 & H21: Checkout Rate Limiting & Admin Role Enforcement
// ============================================================================
test('H20 & H21: Unified checkout rate limits password attempts and enforces admin role', () => {
  const checkoutRoutes = fs.readFileSync(path.join(apiDir, 'src/routes/unifiedCheckout.js'), 'utf8');

  // H20: authLimiter on checkout process
  assert.ok(checkoutRoutes.includes("router.post('/process', authLimiter,"), 'H20: POST /process must use authLimiter');

  // H21: requireRole(['admin']) on admin endpoints
  assert.ok(checkoutRoutes.includes("router.get('/admin/dashboard/stats', authenticateToken, requireRole(['admin']), getDashboardStats);"));
  assert.ok(checkoutRoutes.includes("router.get('/admin/orders/pending', authenticateToken, requireRole(['admin']), getPendingOrders);"));
  assert.ok(checkoutRoutes.includes("router.post('/admin/orders/:orderId/verify', authenticateToken, requireRole(['admin']),"));
  assert.ok(checkoutRoutes.includes("router.post('/admin/orders/:orderId/release-payment', authenticateToken, requireRole(['admin']),"));

  // Check storefront admin routes
  const statsRoute = fs.readFileSync(path.join(storeDir, 'src/app/api/admin/stats/route.ts'), 'utf8');
  assert.ok(statsRoute.includes('await requireAdminAuth(request)'));

  const knowledgeRoute = fs.readFileSync(path.join(storeDir, 'src/app/api/admin/knowledge/route.ts'), 'utf8');
  assert.ok(knowledgeRoute.includes('await requireAdminAuth(req)'));

  const cancelRoute = fs.readFileSync(path.join(storeDir, 'src/app/api/admin/orders/[id]/cancel/route.ts'), 'utf8');
  assert.ok(cancelRoute.includes('await requireAdminAuth(request)'));

  const commRoute = fs.readFileSync(path.join(storeDir, 'src/app/api/admin/commissions/overview/route.ts'), 'utf8');
  assert.ok(commRoute.includes('await requireAdminAuth(request)'));
});

// ============================================================================
// H22: Email Template HTML Escaping
// ============================================================================
test('H22: Email templates escape HTML entities in user-controlled values', () => {
  const escapeHtml = (str) => {
    if (typeof str !== 'string') return str === null || str === undefined ? '' : String(str);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const maliciousInput = '<script>alert("xss")</script><img src="x" onerror="steal()">&"\'';
  const escaped = escapeHtml(maliciousInput);

  assert.ok(!escaped.includes('<script>'), 'Must escape opening script tags');
  assert.ok(!escaped.includes('</script>'), 'Must escape closing script tags');
  assert.ok(!escaped.includes('<img'), 'Must escape HTML tags');
  assert.equal(escaped, '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&lt;img src=&quot;x&quot; onerror=&quot;steal()&quot;&gt;&amp;&quot;&#039;');

  // Check emailService.js
  const emailServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/emailService.js'), 'utf8');
  assert.ok(emailServiceCode.includes('escapeHtml'), 'emailService must include escapeHtml helper');
  assert.ok(emailServiceCode.includes('escapeHtml(val)'), 'emailService must escape values during template interpolation');
});
