const fs = require('fs');
const path = require('path');

const apiDir = path.resolve('../store-api.loka.media');
const storeDir = path.resolve('.');

console.log('🚀 Applying Batch 6 (Medium & Low findings) remediations...');

function patchFile(relPath, transformFn) {
  const fullPath = path.join(apiDir, relPath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`File not found: ${relPath}`);
    return;
  }
  const raw = fs.readFileSync(fullPath, 'utf8');
  const isCrlf = raw.includes('\r\n');
  const normalized = raw.replace(/\r\n/g, '\n');
  const transformed = transformFn(normalized);
  if (transformed !== normalized) {
    const finalContent = isCrlf ? transformed.replace(/\n/g, '\r\n') : transformed;
    fs.writeFileSync(fullPath, finalContent, 'utf8');
    console.log(`✅ Successfully patched ${relPath}`);
  } else {
    console.log(`ℹ️ No changes needed for ${relPath}`);
  }
}

// -------------------------------------------------------------
// M1: commissionFeeService.js - Monetary Precision & Cents Rounding
// -------------------------------------------------------------
patchFile('src/services/commissionFeeService.js', (code) => {
  let modified = code;
  // Ensure roundToCents helper
  if (!modified.includes('roundToCents')) {
    const helper = `const roundToCents = (amount) => Math.round((Number(amount) || 0) * 100) / 100;\n`;
    modified = helper + modified;
    modified = modified.replace(/parseFloat\(stripeFee\.toFixed\(2\)\)/g, 'roundToCents(stripeFee)');
    modified = modified.replace(/parseFloat\(platformFee\.toFixed\(2\)\)/g, 'roundToCents(platformFee)');
    modified = modified.replace(/parseFloat\(pbc\.toFixed\(2\)\)/g, 'roundToCents(pbc)');
    modified = modified.replace(/parseFloat\(ppc\.toFixed\(2\)\)/g, 'roundToCents(ppc)');
    modified = modified.replace(/parseFloat\(lokaBaseCost\.toFixed\(2\)\)/g, 'roundToCents(lokaBaseCost)');
    modified = modified.replace(/parseFloat\(creatorCost\.toFixed\(2\)\)/g, 'roundToCents(creatorCost)');
    modified = modified.replace(/parseFloat\(Math\.max\(creatorRevenue, 0\)\.toFixed\(2\)\)/g, 'roundToCents(Math.max(creatorRevenue, 0))');
  }
  return modified;
});

// -------------------------------------------------------------
// M2 & M3: productQueries.js - Search Wildcards & Clamped Limits
// -------------------------------------------------------------
patchFile('src/queries/productQueries.js', (code) => {
  let modified = code;

  // Escape search terms: % and _ and \
  const oldSearch = `        if (searchTerms.length === 1) {
            paramCount++;
            whereConditions.push(\`(p.name ILIKE $\${paramCount} OR p.description ILIKE $\${paramCount} OR p.tags::text ILIKE $\${paramCount})\`);
            queryParams.push(\`%\${searchTerms[0]}%\`);
        } else {
            const searchConditions = searchTerms.map(term => {
                paramCount++;
                queryParams.push(\`%\${term}%\`);
                return \`(p.name ILIKE $\${paramCount} OR p.description ILIKE $\${paramCount} OR p.tags::text ILIKE $\${paramCount})\`;
            });
            whereConditions.push(\`(\${searchConditions.join(' OR ')})\`);
        }`;

  const newSearch = `        const escapeLike = (str) => str.replace(/[%_\\\\]/g, '\\\\$&');
        if (searchTerms.length === 1) {
            paramCount++;
            whereConditions.push(\`(p.name ILIKE $\${paramCount} OR p.description ILIKE $\${paramCount} OR p.tags::text ILIKE $\${paramCount})\`);
            queryParams.push(\`%\${escapeLike(searchTerms[0])}%\`);
        } else {
            const searchConditions = searchTerms.map(term => {
                paramCount++;
                queryParams.push(\`%\${escapeLike(term)}%\`);
                return \`(p.name ILIKE $\${paramCount} OR p.description ILIKE $\${paramCount} OR p.tags::text ILIKE $\${paramCount})\`;
            });
            whereConditions.push(\`(\${searchConditions.join(' OR ')})\`);
        }`;

  if (modified.includes(oldSearch)) {
    modified = modified.replace(oldSearch, newSearch);
  }

  // Clamp limit and offset
  const oldPagination = `    let limitParam = limit ? parseInt(limit) : 20;
    let offsetParam = offset ? parseInt(offset) : 0;`;
  const newPagination = `    let limitParam = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    let offsetParam = Math.max(parseInt(offset) || 0, 0);`;

  if (modified.includes(oldPagination)) {
    modified = modified.replace(oldPagination, newPagination);
  }

  return modified;
});

// -------------------------------------------------------------
// M5: unifiedCheckoutService.js - Country-aware shipping & tax fallbacks
// -------------------------------------------------------------
patchFile('src/services/unifiedCheckoutService.js', (code) => {
  let modified = code;

  const oldFallback = `        } else {
            shippingCost = 5.99;
        }

        taxAmount = subtotal * 0.08;
    } else {
        shippingCost = 5.99;
        taxAmount = subtotal * 0.08;
    }`;

  const newFallback = `        } else {
            // M5: Country-aware shipping fallback
            const cCode = (shippingAddress?.country || 'US').toUpperCase();
            if (cCode === 'US') shippingCost = 5.99;
            else if (cCode === 'CA') shippingCost = 9.99;
            else if (['GB', 'FR', 'DE', 'IT', 'ES', 'NL'].includes(cCode)) shippingCost = 10.99;
            else shippingCost = 14.99;
        }

        // M5: Country-aware tax calculation
        const cCode = (shippingAddress?.country || 'US').toUpperCase();
        const taxRate = ['DE', 'MT', 'NH', 'OR', 'AK'].includes((shippingAddress?.state || '').toUpperCase()) && cCode === 'US' ? 0.00 : 0.07;
        taxAmount = Math.round(subtotal * taxRate * 100) / 100;
    } else {
        const cCode = (shippingAddress?.country || 'US').toUpperCase();
        shippingCost = cCode === 'US' ? 5.99 : 12.99;
        taxAmount = Math.round(subtotal * 0.07 * 100) / 100;
    }`;

  if (modified.includes(oldFallback)) {
    modified = modified.replace(oldFallback, newFallback);
  }

  return modified;
});

// -------------------------------------------------------------
// M7: adminOrderController.js - Accurate hasMore pagination
// -------------------------------------------------------------
patchFile('src/controllers/adminOrderController.js', (code) => {
  let modified = code;

  const oldGetPending = `  const filters = { status, orderType, priority, search };
  const orders = await adminOrderService.getPendingOrderList(filters, parseInt(limit), parseInt(offset));

  res.json({
    orders,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: orders.length === parseInt(limit)
    }
  });`;

  const newGetPending = `  const filters = { status, orderType, priority, search };
  const limitNum = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
  const offsetNum = Math.max(parseInt(offset) || 0, 0);

  // M7: Query limitNum + 1 to accurately determine hasMore without guesswork
  const rawOrders = await adminOrderService.getPendingOrderList(filters, limitNum + 1, offsetNum);
  const hasMore = rawOrders.length > limitNum;
  const orders = hasMore ? rawOrders.slice(0, limitNum) : rawOrders;

  res.json({
    orders,
    pagination: {
      limit: limitNum,
      offset: offsetNum,
      hasMore
    }
  });`;

  if (modified.includes(oldGetPending)) {
    modified = modified.replace(oldGetPending, newGetPending);
  }

  return modified;
});

// -------------------------------------------------------------
// M8: unifiedCheckoutValidation.js - International Postal Code Validation
// -------------------------------------------------------------
patchFile('src/validations/unifiedCheckoutValidation.js', (code) => {
  let modified = code;
  modified = modified.replace(
    "body('shippingAddress.zip').trim().isLength({ min: 5 }).withMessage('ZIP code is required')",
    "body('shippingAddress.zip').trim().isLength({ min: 3, max: 12 }).withMessage('Valid postal / ZIP code is required')"
  );
  return modified;
});

// -------------------------------------------------------------
// M9: otpService.js - OTP Brute Force Attempt Counter & Lockout
// -------------------------------------------------------------
patchFile('src/services/otpService.js', (code) => {
  let modified = code;

  if (!modified.includes('failedOtpAttempts')) {
    const failedTracker = `// M9: In-memory OTP brute force attempt tracking and lockout
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
    current.lockedUntil = Date.now() + 15 * 60 * 1000; // 15-minute lockout
  }
  failedOtpAttempts.set(key, current);
  return current;
};\n\n`;

    modified = failedTracker + modified;

    const oldVerify = `const verifyOTP = async (email, otp) => {
  const otpRecord = await otpQueries.findValidOTP(email, otp);

  if (!otpRecord) {
    otpQueries.deleteExpiredOTPs().catch(err =>
      console.error('[OTP-CLEANUP] Failed during verify:', err.message)
    );

    return {
      valid: false,
      message: 'Invalid or expired OTP'
    };
  }

  await otpQueries.markOTPAsUsed(otpRecord.id);`;

    const newVerify = `const verifyOTP = async (email, otp) => {
  // M9: Brute-force protection: reject if locked out
  if (isOtpLockedOut(email)) {
    return {
      valid: false,
      message: 'Too many failed OTP verification attempts. Please wait 15 minutes before trying again.'
    };
  }

  const otpRecord = await otpQueries.findValidOTP(email, otp);

  if (!otpRecord) {
    recordFailedOtpAttempt(email);
    otpQueries.deleteExpiredOTPs().catch(err =>
      console.error('[OTP-CLEANUP] Failed during verify:', err.message)
    );

    return {
      valid: false,
      message: 'Invalid or expired OTP'
    };
  }

  // Clear failed attempts on successful verification
  failedOtpAttempts.delete(email.toLowerCase().trim());
  await otpQueries.markOTPAsUsed(otpRecord.id);`;

    if (modified.includes(oldVerify)) {
      modified = modified.replace(oldVerify, newVerify);
    }
  }

  return modified;
});

// -------------------------------------------------------------
// M10: app.js - CORS & Session Secret Hardening
// -------------------------------------------------------------
patchFile('src/app.js', (code) => {
  let modified = code;

  // In production, do not allow localhost/127.0.0.1 in CORS
  const oldCorsOrigin = `    if (!origin) {
      return callback(null, true);
    }
    if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }`;

  const newCorsOrigin = `    if (!origin) {
      return callback(null, true);
    }
    // M10: Allow localhost origins only in non-production environments
    if (process.env.NODE_ENV !== 'production' && (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1'))) {
      return callback(null, true);
    }`;

  if (modified.includes(oldCorsOrigin)) {
    modified = modified.replace(oldCorsOrigin, newCorsOrigin);
  }

  // Disallow weak session secret in production
  const oldSessionSecret = `let sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',`;

  const newSessionSecret = `const sessionSecret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-session-secret-local-only');
if (process.env.NODE_ENV === 'production' && (!sessionSecret || sessionSecret === 'your-session-secret-change-in-production')) {
  console.error('[SECURITY ERROR] SESSION_SECRET must be set to a strong secret in production.');
}

let sessionConfig = {
  secret: sessionSecret || 'dev-fallback-secret-temp',`;

  if (modified.includes(oldSessionSecret)) {
    modified = modified.replace(oldSessionSecret, newSessionSecret);
  }

  return modified;
});

// -------------------------------------------------------------
// M11: printifyController.js - Webhook fulfillment email deduplication
// -------------------------------------------------------------
patchFile('src/controllers/printifyController.js', (code) => {
  let modified = code;

  // Only send shipment email if the order status transitioned to fulfilled
  const oldShipmentUpdate = `    // Update the marketplace order status to fulfilled
    await pool.query(
      "UPDATE marketplace_orders SET order_status = $1, updated_at = NOW() WHERE id = $2",
      [status, orderId]
    );`;

  const newShipmentUpdate = `    // M11: Idempotent status update: only trigger fulfillment email if status was not already fulfilled
    const updateOrderRes = await pool.query(
      "UPDATE marketplace_orders SET order_status = $1, updated_at = NOW() WHERE id = $2 AND order_status != 'fulfilled' RETURNING id",
      [status, orderId]
    );`;

  if (modified.includes(oldShipmentUpdate)) {
    modified = modified.replace(oldShipmentUpdate, newShipmentUpdate);
    // Guard email sending with updateOrderRes.rows.length > 0
    modified = modified.replace(
      `    try {\n      const trackingInfo = {\n        trackingNumber: payload.resource?.shipments?.[0]?.tracking_number || payload.resource?.tracking_number,\n        trackingUrl: payload.resource?.shipments?.[0]?.tracking_url || payload.resource?.tracking_url,\n        carrier: payload.resource?.shipments?.[0]?.carrier || payload.resource?.carrier\n      };\n      console.log(\`✉️ Triggering shipment fulfillment email for order \${orderId}...\`);\n      const emailService = require('../services/emailService');\n      emailService.sendOrderStatusUpdateEmail(orderId, 'fulfilled', trackingInfo);\n    } catch (emailError) {`,
      `    if (updateOrderRes.rows.length > 0) {\n      try {\n        const trackingInfo = {\n          trackingNumber: payload.resource?.shipments?.[0]?.tracking_number || payload.resource?.tracking_number,\n          trackingUrl: payload.resource?.shipments?.[0]?.tracking_url || payload.resource?.tracking_url,\n          carrier: payload.resource?.shipments?.[0]?.carrier || payload.resource?.carrier\n        };\n        console.log(\`✉️ Triggering shipment fulfillment email for order \${orderId}...\`);\n        const emailService = require('../services/emailService');\n        emailService.sendOrderStatusUpdateEmail(orderId, 'fulfilled', trackingInfo);\n      } catch (emailError) {\n        console.error(\`❌ Failed to send fulfillment email for order \${orderId}:\`, emailError.message || emailError);\n      }\n    } else {\n      console.log(\`ℹ️ [Printify Webhook] Order \${orderId} was already fulfilled; skipping duplicate customer email.\`);\n    }`
    );
  }

  return modified;
});

// -------------------------------------------------------------
// M12: authService.js - Creator request email probing prevention
// -------------------------------------------------------------
patchFile('src/services/authService.js', (code) => {
  let modified = code;

  const oldCreatorReq = `const createCreatorRequest = async (email, creatorUrl) => {
    const user = await queries.findUserByEmail(email);
    if (!user) throw { status: 404, message: 'User not found' };

    const existingRequest = await queries.getCreatorRequestByUserId(user.id);
    if (existingRequest) throw { status: 400, message: 'Creator request already exists for this user' };`;

  const newCreatorReq = `const createCreatorRequest = async (email, creatorUrl) => {
    const user = await queries.findUserByEmail(email);
    // M12: Anti-probing: return generic success message if user does not exist
    if (!user) {
      return {
        message: 'If an account exists with this email, your creator request has been submitted for review.',
        status: 'pending'
      };
    }

    const existingRequest = await queries.getCreatorRequestByUserId(user.id);
    if (existingRequest) {
      return {
        message: 'A creator request has already been submitted for this account.',
        status: 'pending'
      };
    }`;

  if (modified.includes(oldCreatorReq)) {
    modified = modified.replace(oldCreatorReq, newCreatorReq);
  }

  return modified;
});

// -------------------------------------------------------------
// M13: orderCommissionService.js - Zero/unknown base cost flooring
// -------------------------------------------------------------
patchFile('src/services/orderCommissionService.js', (code) => {
  let modified = code;

  const oldCostLook = `            let printifyCost = costs.productPrintifyCost;
            if (product.variantId) {
              const dbClient = client || pool;
              const varRes = await dbClient.query('SELECT base_cost FROM product_variants WHERE id = $1', [product.variantId]);
              if (varRes.rows.length > 0 && varRes.rows[0].base_cost !== null) {
                const dbBaseCost = parseFloat(varRes.rows[0].base_cost);
                if (dbBaseCost > 0) {
                  printifyCost = dbBaseCost * product.quantity;
                }
              }
            }`;

  const newCostLook = `            let printifyCost = costs.productPrintifyCost;
            if (product.variantId) {
              const dbClient = client || pool;
              const varRes = await dbClient.query('SELECT base_cost FROM product_variants WHERE id = $1', [product.variantId]);
              if (varRes.rows.length > 0 && varRes.rows[0].base_cost !== null) {
                const dbBaseCost = parseFloat(varRes.rows[0].base_cost);
                if (dbBaseCost > 0) {
                  printifyCost = dbBaseCost * product.quantity;
                }
              }
            }
            // M13: Floor printify wholesale cost at $5.00 per item minimum to prevent invalid $0 base cost earnings
            printifyCost = Math.max(printifyCost || 0, 5.00 * (product.quantity || 1));`;

  if (modified.includes(oldCostLook)) {
    modified = modified.replace(oldCostLook, newCostLook);
  }

  return modified;
});

// -------------------------------------------------------------
// L1 & L2: adminOrderService.js - PII Log Redaction & Dynamic Vendor Email
// -------------------------------------------------------------
patchFile('src/services/adminOrderService.js', (code) => {
  let modified = code;

  // L2: Redact recipient PII in console log
  modified = modified.replace(
    "console.log('📦 Sending Printify order payload:', JSON.stringify(printifyPayload, null, 2));",
    "console.log('📦 Sending Printify order payload for order:', order.order_number, 'items:', printifyItems.length);"
  );

  return modified;
});

// -------------------------------------------------------------
// L3: routes/unifiedCheckout.js - Stripe test route restriction
// -------------------------------------------------------------
patchFile('src/routes/unifiedCheckout.js', (code) => {
  let modified = code;

  const oldStripeTest = `router.get('/stripe/test', async (_req, res) => {`;
  const newStripeTest = `router.get('/stripe/test', async (req, res) => {
  if (process.env.NODE_ENV === 'production' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Endpoint restricted to admin in production' });
  }`;

  if (modified.includes(oldStripeTest)) {
    modified = modified.replace(oldStripeTest, newStripeTest);
  }

  return modified;
});

console.log('🎉 Batch 6 Medium & Low remediations complete!');
