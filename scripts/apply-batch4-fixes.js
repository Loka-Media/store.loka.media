const fs = require('fs');
const path = require('path');

// 1. Patch store-api.loka.media/src/routes/printify.js
const printifyRouteFile = path.resolve(__dirname, '../../store-api.loka.media/src/routes/printify.js');
let printifyRouteCode = fs.readFileSync(printifyRouteFile, 'utf8');

if (printifyRouteCode.includes("router.post('/orders', apiLimiter, createOrder);")) {
  printifyRouteCode = printifyRouteCode.replace(
    "router.post('/orders', apiLimiter, createOrder);",
    "router.post('/orders', requireRole(['admin']), apiLimiter, createOrder);"
  );
  fs.writeFileSync(printifyRouteFile, printifyRouteCode, 'utf8');
  console.log('✅ Applied C7/C8 fix to store-api.loka.media/src/routes/printify.js');
}

// 2. Patch store-api.loka.media/src/controllers/printifyController.js
const printifyControllerFile = path.resolve(__dirname, '../../store-api.loka.media/src/controllers/printifyController.js');
let printifyControllerCode = fs.readFileSync(printifyControllerFile, 'utf8');

const isCrlf = printifyControllerCode.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

if (!printifyControllerCode.includes("const crypto = require('crypto');")) {
  printifyControllerCode = "const crypto = require('crypto');" + eol + printifyControllerCode;
}

const targetWebhookSnippet = [
  "const handlePrintifyWebhook = asyncHandler(async (req, res) => {",
  "  const payload = req.body;",
  "  console.log('[Printify Webhook Backend] Received event:', payload.type, payload.resource?.id);"
].join(eol);

const replacementWebhookSnippet = [
  "const handlePrintifyWebhook = asyncHandler(async (req, res) => {",
  "  const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET ? process.env.PRINTIFY_WEBHOOK_SECRET.trim() : null;",
  "  if (webhookSecret) {",
  "    const signature = req.headers['x-pf-signature'];",
  "    if (!signature) {",
  "      return res.status(401).json({ error: 'Missing Printify webhook signature' });",
  "    }",
  "    const rawBody = typeof req.rawBody === 'string' ? req.rawBody : (Buffer.isBuffer(req.rawBody) ? req.rawBody.toString('utf8') : JSON.stringify(req.body));",
  "    const expectedSig = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');",
  "    const cleanSig = signature.replace(/^sha256=/i, '').trim();",
  "    if (expectedSig.length !== cleanSig.length || !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(cleanSig))) {",
  "      return res.status(401).json({ error: 'Invalid Printify webhook signature' });",
  "    }",
  "  }",
  "",
  "  const payload = req.body;",
  "  console.log('[Printify Webhook Backend] Received event:', payload.type, payload.resource?.id);"
].join(eol);

if (printifyControllerCode.includes(targetWebhookSnippet)) {
  printifyControllerCode = printifyControllerCode.replace(targetWebhookSnippet, replacementWebhookSnippet);
  fs.writeFileSync(printifyControllerFile, printifyControllerCode, 'utf8');
  console.log('✅ Applied C11 HMAC verification to store-api.loka.media/src/controllers/printifyController.js');
}

// 3. Patch cancelOrder in store-api.loka.media/src/controllers/creatorCommissionController.js
const commissionControllerFile = path.resolve(__dirname, '../../store-api.loka.media/src/controllers/creatorCommissionController.js');
let commissionControllerCode = fs.readFileSync(commissionControllerFile, 'utf8');

const isCrlfComm = commissionControllerCode.includes('\r\n');
const eolComm = isCrlfComm ? '\r\n' : '\n';

const targetCancelSnippet = [
  "    // Check permissions: Admin can cancel any order; Creator can cancel orders containing their products",
  "    if (userRole !== 'admin') {",
  "      const creatorCheck = await client.query(",
  "        `SELECT * FROM creator_commission_tracking WHERE order_id = $1 AND creator_id = $2`,",
  "        [order.id, userId]",
  "      );",
  "      if (creatorCheck.rows.length === 0) {",
  "        await client.query('ROLLBACK');",
  "        return res.status(403).json({ error: 'You do not have permission to cancel this order' });",
  "      }",
  "    }"
].join(eolComm);

const replacementCancelSnippet = [
  "    // Check permissions: Admin can cancel any order; Creator can only cancel orders containing exclusively their products (C14)",
  "    if (userRole !== 'admin') {",
  "      const creatorsInOrder = await client.query(",
  "        `SELECT DISTINCT creator_id FROM creator_commission_tracking WHERE order_id = $1`,",
  "        [order.id]",
  "      );",
  "      if (creatorsInOrder.rows.length === 0) {",
  "        await client.query('ROLLBACK');",
  "        return res.status(403).json({ error: 'You do not have permission to cancel this order' });",
  "      }",
  "      const hasOtherCreators = creatorsInOrder.rows.some(r => Number(r.creator_id) !== Number(userId));",
  "      if (hasOtherCreators) {",
  "        await client.query('ROLLBACK');",
  "        return res.status(403).json({",
  "          error: 'This order contains products from multiple creators. Only an administrator can cancel multi-creator orders.'",
  "        });",
  "      }",
  "    }",
  "",
  "    // Reverse creator wallet commission balances (C14)",
  "    const commRows = await client.query(",
  "      `SELECT creator_id, creator_revenue FROM creator_commission_tracking WHERE order_id = $1 AND status != 'refunded'`,",
  "      [order.id]",
  "    );",
  "    for (const comm of commRows.rows) {",
  "      const revAmt = parseFloat(comm.creator_revenue || '0');",
  "      if (revAmt > 0 && comm.creator_id) {",
  "        await client.query(",
  "          `UPDATE wallets SET pending_balance = GREATEST(0, pending_balance - $1), updated_at = NOW() WHERE creator_id = $2`,",
  "          [revAmt, comm.creator_id]",
  "        );",
  "        await client.query(",
  "          `UPDATE wallet_transactions SET status = 'cancelled' WHERE reference_id LIKE $1 AND type = 'credit' AND status = 'pending'`,",
  "          [`${order.id}:%`]",
  "        );",
  "      }",
  "    }"
].join(eolComm);

if (commissionControllerCode.includes(targetCancelSnippet)) {
  commissionControllerCode = commissionControllerCode.replace(targetCancelSnippet, replacementCancelSnippet);
  fs.writeFileSync(commissionControllerFile, commissionControllerCode, 'utf8');
  console.log('✅ Applied C14 multi-creator isolation & wallet reversal to store-api.loka.media/src/controllers/creatorCommissionController.js');
}

// 4. Patch productService.js C18
const productServiceFile = path.resolve(__dirname, '../../store-api.loka.media/src/services/productService.js');
let productServiceCode = fs.readFileSync(productServiceFile, 'utf8');

const isCrlfProd = productServiceCode.includes('\r\n');
const eolProd = isCrlfProd ? '\r\n' : '\n';

const targetCostSnippet = [
  "        const variants = await Promise.all(productData.variants.map(async (variant) => {",
  "            const baseCost = parseFloat(variant.cost);",
  "            const lokaBaseCost = baseCost * 1.35;"
].join(eolProd);

const replacementCostSnippet = [
  "        const variants = await Promise.all(productData.variants.map(async (variant) => {",
  "            let baseCost = parseFloat(variant.cost);",
  "            if (isNaN(baseCost) || baseCost <= 0) baseCost = 10.00;",
  "            const catalogVariant = catalogVariantsMap[variant.printifyVariantId];",
  "            if (catalogVariant) {",
  "              const catalogCost = catalogVariant.cost !== undefined",
  "                ? (catalogVariant.cost > 100 ? parseFloat(catalogVariant.cost) / 100 : parseFloat(catalogVariant.cost))",
  "                : (catalogVariant.price !== undefined ? parseFloat(catalogVariant.price) / 100 : 0);",
  "              if (catalogCost > 0 && baseCost < catalogCost) {",
  "                baseCost = catalogCost;",
  "              }",
  "            }",
  "            baseCost = Math.max(baseCost, 5.00);",
  "            const lokaBaseCost = baseCost * 1.35;"
].join(eolProd);

if (productServiceCode.includes(targetCostSnippet)) {
  productServiceCode = productServiceCode.replace(targetCostSnippet, replacementCostSnippet);
  fs.writeFileSync(productServiceFile, productServiceCode, 'utf8');
  console.log('✅ Applied C18 catalog cost validation to store-api.loka.media/src/services/productService.js');
}
