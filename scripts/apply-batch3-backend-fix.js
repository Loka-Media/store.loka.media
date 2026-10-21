const fs = require('fs');
const path = require('path');

const serviceFile = path.resolve(__dirname, '../../store-api.loka.media/src/services/unifiedCheckoutService.js');
let serviceCode = fs.readFileSync(serviceFile, 'utf8');

const isCrlf = serviceCode.includes('\r\n');
const eol = isCrlf ? '\r\n' : '\n';

const targetSnippet = [
  "    if (!paymentResult.success) {",
  "        throw new Error(paymentResult.error || 'Failed to retrieve Stripe payment');",
  "    }",
  "",
  "    const order = await withTransaction(async (client) => {",
  "        const updatedOrder = await unifiedCheckoutQueries.updateOrderPaymentStatus(orderNumber, {"
].join(eol);

const replacementSnippet = [
  "    if (!paymentResult.success) {",
  "        throw new Error(paymentResult.error || 'Failed to retrieve Stripe payment');",
  "    }",
  "",
  "    // Security (C1): Ensure payment status is 'succeeded'",
  "    if (paymentResult.status !== 'succeeded') {",
  "        throw new Error(`Payment verification failed: payment status is '${paymentResult.status}', expected 'succeeded'`);",
  "    }",
  "",
  "    const order = await withTransaction(async (client) => {",
  "        // Security (C4): Validate amount and currency against database order",
  "        const existingOrderRes = await client.query(",
  "            'SELECT customer_payment_amount, currency FROM marketplace_orders WHERE order_number = $1',",
  "            [orderNumber]",
  "        );",
  "",
  "        if (existingOrderRes.rows.length === 0) {",
  "            throw new Error(`Order ${orderNumber} not found`);",
  "        }",
  "",
  "        const expectedCents = Math.round(parseFloat(existingOrderRes.rows[0].customer_payment_amount || '0') * 100);",
  "        if (Math.abs(paymentResult.amount - expectedCents) > 1) {",
  "            throw new Error(`Payment amount mismatch: Stripe charged ${paymentResult.amount} cents, expected ${expectedCents} cents`);",
  "        }",
  "",
  "        const expectedCurrency = String(existingOrderRes.rows[0].currency || 'usd').toLowerCase();",
  "        if (String(paymentResult.currency).toLowerCase() !== expectedCurrency) {",
  "            throw new Error(`Currency mismatch: Stripe charged ${paymentResult.currency}, expected ${expectedCurrency}`);",
  "        }",
  "",
  "        const updatedOrder = await unifiedCheckoutQueries.updateOrderPaymentStatus(orderNumber, {"
].join(eol);

if (serviceCode.includes(targetSnippet)) {
  serviceCode = serviceCode.replace(targetSnippet, replacementSnippet);
  fs.writeFileSync(serviceFile, serviceCode, 'utf8');
  console.log('✅ Successfully updated confirmStripePayment in store-api.loka.media/src/services/unifiedCheckoutService.js');
} else {
  console.error('❌ Could not find exact target snippet in unifiedCheckoutService.js');
  process.exit(1);
}
