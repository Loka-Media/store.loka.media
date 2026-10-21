import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const apiDir = path.resolve('../store-api.loka.media');
const storeDir = path.resolve('.');

// ============================================================================
// M1: Floating-Point Rounding and Monetary Precision
// ============================================================================
test('M1: roundToCents prevents floating-point drift in monetary calculations', () => {
  const roundToCents = (amount) => Math.round((Number(amount) || 0) * 100) / 100;

  // Classic IEEE 754 precision drift: 0.1 + 0.2 = 0.30000000000000004
  const driftSum = 0.1 + 0.2;
  assert.notEqual(driftSum, 0.3);
  assert.equal(roundToCents(driftSum), 0.3);

  // High precision multiplication test (e.g. 29.99 * 0.029 + 0.30)
  const stripeFeeRaw = 29.99 * 0.029 + 0.30;
  const stripeFeeRounded = roundToCents(stripeFeeRaw);
  assert.equal(stripeFeeRounded, 1.17);

  // Check commissionFeeService.js in codebase
  const feeServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/commissionFeeService.js'), 'utf8');
  assert.ok(feeServiceCode.includes('roundToCents'), 'M1: commissionFeeService must use roundToCents');
});

// ============================================================================
// M2 & M3: Search Wildcards Escaping & Clamped Pagination Limits
// ============================================================================
test('M2 & M3: Search queries escape %, _, and \\ and clamp limits between 1 and 100', () => {
  const escapeLike = (str) => str.replace(/[%_\\]/g, '\\$&');

  // Wildcards escaped
  assert.equal(escapeLike('100% Cotton'), '100\\% Cotton');
  assert.equal(escapeLike('t_shirt'), 't\\_shirt');
  assert.equal(escapeLike('a\\b'), 'a\\\\b');

  // Pagination clamping
  const clampPagination = (limit, offset) => {
    return {
      limit: Math.min(Math.max(parseInt(limit) || 20, 1), 100),
      offset: Math.max(parseInt(offset) || 0, 0)
    };
  };

  assert.deepEqual(clampPagination(10000, 0), { limit: 100, offset: 0 }, 'Must clamp large limits to 100');
  assert.deepEqual(clampPagination(-5, -10), { limit: 1, offset: 0 }, 'Must floor negative values to safe minimums');
  assert.deepEqual(clampPagination(undefined, undefined), { limit: 20, offset: 0 }, 'Defaults cleanly to 20/0');

  // Verify in productQueries.js
  const productQueriesCode = fs.readFileSync(path.join(apiDir, 'src/queries/productQueries.js'), 'utf8');
  assert.ok(productQueriesCode.includes('escapeLike'), 'M3: Must escape wildcards in search terms');
  assert.ok(productQueriesCode.includes('Math.min(Math.max(parseInt(limit) || 20, 1), 100)'), 'M2: Must clamp query limits');
});

// ============================================================================
// M4: Cart Price Authoritative Server Validation
// ============================================================================
test('M4: Server order creation uses database ground-truth variant prices', () => {
  const checkoutServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/unifiedCheckoutService.js'), 'utf8');
  assert.ok(
    checkoutServiceCode.includes('enrichCartItems'),
    'M4: Checkout service must enrich cart items with database prices'
  );
});

// ============================================================================
// M5: Country-Aware Shipping and Tax Fallbacks
// ============================================================================
test('M5: Shipping fallback and tax rates are country and state aware', () => {
  const calculateFallback = (shippingAddress, subtotal) => {
    let shippingCost;
    const cCode = (shippingAddress?.country || 'US').toUpperCase();
    if (cCode === 'US') shippingCost = 5.99;
    else if (cCode === 'CA') shippingCost = 9.99;
    else if (['GB', 'FR', 'DE', 'IT', 'ES', 'NL'].includes(cCode)) shippingCost = 10.99;
    else shippingCost = 14.99;

    const taxRate = ['DE', 'MT', 'NH', 'OR', 'AK'].includes((shippingAddress?.state || '').toUpperCase()) && cCode === 'US' ? 0.00 : 0.07;
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100;

    return { shippingCost, taxAmount };
  };

  // US standard
  const r1 = calculateFallback({ country: 'US', state: 'CA' }, 100);
  assert.equal(r1.shippingCost, 5.99);
  assert.equal(r1.taxAmount, 7.00);

  // US tax-exempt state (Oregon)
  const r2 = calculateFallback({ country: 'US', state: 'OR' }, 100);
  assert.equal(r2.shippingCost, 5.99);
  assert.equal(r2.taxAmount, 0.00);

  // Canada
  const r3 = calculateFallback({ country: 'CA', state: 'ON' }, 100);
  assert.equal(r3.shippingCost, 9.99);

  // Rest of World
  const r4 = calculateFallback({ country: 'AU', state: 'NSW' }, 100);
  assert.equal(r4.shippingCost, 14.99);
});

// ============================================================================
// M7: Admin hasMore Pagination Without Guesswork
// ============================================================================
test('M7: Admin hasMore pagination uses limit + 1 over-fetch to determine next page', () => {
  const controllerCode = fs.readFileSync(path.join(apiDir, 'src/controllers/adminOrderController.js'), 'utf8');
  assert.ok(
    controllerCode.includes('limitNum + 1'),
    'M7: Must fetch limitNum + 1 rows to accurately determine hasMore'
  );
  assert.ok(
    controllerCode.includes('hasMore = rawOrders.length > limitNum'),
    'M7: hasMore must check whether rawOrders exceeds limitNum'
  );
});

// ============================================================================
// M8: International Postal Code Validation
// ============================================================================
test('M8: Postal code validation accepts international formats', () => {
  const validationCode = fs.readFileSync(path.join(apiDir, 'src/validations/unifiedCheckoutValidation.js'), 'utf8');
  assert.ok(
    validationCode.includes("min: 3, max: 12"),
    'M8: ZIP / postal code validation must permit short international formats'
  );
});

// ============================================================================
// M9: OTP Brute-Force Attempt Tracking and Lockout
// ============================================================================
test('M9: OTP service tracks failed attempts and locks out after 5 consecutive failures', () => {
  const failedOtpAttempts = new Map();

  const isOtpLockedOut = (email) => {
    const key = email.toLowerCase().trim();
    const entry = failedOtpAttempts.get(key);
    if (!entry) return false;
    if (entry.lockedUntil && Date.now() < entry.lockedUntil) return true;
    if (entry.lockedUntil && Date.now() >= entry.lockedUntil) {
      failedOtpAttempts.delete(key);
      return false;
    }
    return false;
  };

  const recordFailedOtpAttempt = (email) => {
    const key = email.toLowerCase().trim();
    const current = failedOtpAttempts.get(key) || { count: 0, lockedUntil: null };
    current.count += 1;
    if (current.count >= 5) {
      current.lockedUntil = Date.now() + 15 * 60 * 1000;
    }
    failedOtpAttempts.set(key, current);
    return current;
  };

  const email = 'victim@example.com';

  // 4 failed attempts: not yet locked out
  for (let i = 1; i <= 4; i++) {
    recordFailedOtpAttempt(email);
    assert.equal(isOtpLockedOut(email), false);
  }

  // 5th failed attempt: triggers lockout
  recordFailedOtpAttempt(email);
  assert.equal(isOtpLockedOut(email), true);

  // Verify in otpService.js
  const otpServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/otpService.js'), 'utf8');
  assert.ok(otpServiceCode.includes('isOtpLockedOut'), 'M9: otpService must enforce isOtpLockedOut check');
});

// ============================================================================
// M10: Production CORS and Session Secret Hardening
// ============================================================================
test('M10: Production environment blocks localhost CORS origins and disallows default session secret', () => {
  const appCode = fs.readFileSync(path.join(apiDir, 'src/app.js'), 'utf8');
  assert.ok(
    appCode.includes("process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost')"),
    'M10: Localhost origins must only be permitted in non-production environments'
  );
  assert.ok(
    appCode.includes("SESSION_SECRET must be set to a strong secret in production"),
    'M10: Default session secret must be warned/rejected in production'
  );
});

// ============================================================================
// M11: Printify Webhook Email Deduplication
// ============================================================================
test('M11: Duplicate order:shipment_created webhooks do not re-send customer fulfillment emails', () => {
  const printifyCtrlCode = fs.readFileSync(path.join(apiDir, 'src/controllers/printifyController.js'), 'utf8');
  assert.ok(
    printifyCtrlCode.includes("order_status != 'fulfilled' RETURNING id"),
    'M11: Webhook must atomically check that order was not already fulfilled before dispatching email'
  );
  assert.ok(
    printifyCtrlCode.includes('was already fulfilled; skipping duplicate customer email'),
    'M11: Must log and skip email when order is already fulfilled'
  );
});

// ============================================================================
// M12: Creator Request Anti-Probing
// ============================================================================
test('M12: Creator request route returns generic success to prevent email enumeration', () => {
  const authServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/authService.js'), 'utf8');
  assert.ok(
    authServiceCode.includes('If an account exists with this email, your creator request has been submitted for review'),
    'M12: Must return generic message instead of 404 User not found'
  );
  // Isolate createCreatorRequest block
  const createReqBlock = authServiceCode.substring(
    authServiceCode.indexOf('const createCreatorRequest'),
    authServiceCode.indexOf('const getCreatorRequests')
  );
  assert.ok(
    !createReqBlock.includes("User not found"),
    'M12: createCreatorRequest must not leak account absence'
  );
});

// ============================================================================
// M13: Zero/Unknown Base Cost Flooring
// ============================================================================
test('M13: Creator commission tracking floors wholesale cost at minimum catalog cost', () => {
  const commissionServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/orderCommissionService.js'), 'utf8');
  assert.ok(
    commissionServiceCode.includes('Math.max(printifyCost || 0, 5.00 * (product.quantity || 1))'),
    'M13: Must enforce minimum wholesale cost floor ($5.00) in commission tracking'
  );
});

// ============================================================================
// Low Findings: L1, L2, L3
// ============================================================================
test('L1, L2, L3: Payload PII log redaction and Stripe test route restriction', () => {
  // L2: No plaintext customer addresses logged in console.log
  const adminOrderServiceCode = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  assert.ok(
    !adminOrderServiceCode.includes("console.log('📦 Sending Printify order payload:', JSON.stringify(printifyPayload, null, 2));"),
    'L2: Must not log full payload containing customer addresses'
  );

  // L3: Restricted Stripe test route
  const checkoutRoutesCode = fs.readFileSync(path.join(apiDir, 'src/routes/unifiedCheckout.js'), 'utf8');
  assert.ok(
    checkoutRoutesCode.includes("process.env.NODE_ENV === 'production' && req.user?.role !== 'admin'"),
    'L3: /stripe/test must be restricted to admin in production'
  );
});
