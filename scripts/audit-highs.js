const fs = require('fs');
const path = require('path');
const apiDir = path.resolve('../store-api.loka.media');
const storeDir = path.resolve('.');

const checkReport = {};

// H1: SQL assembly in adminOrderQueries.js
checkReport['H1'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/queries/adminOrderQueries.js'), 'utf8');
  return { hasBug: code.includes('paramCount === 0 ? \'WHERE\' : \'AND\'') };
})();

// H2 & H3: adminOrderService.js
checkReport['H2'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  return {
    autoReleaseInGet: code.includes('Auto-release/submit any order that is verified/escrowed'),
    ttl86400: code.includes('ttl: 86400')
  };
})();

checkReport['H3'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  return {
    onlyChecksReleased: code.includes("order.payment_status === 'released'")
  };
})();

// H4: Printful vs Printify schema in adminOrderService.js
checkReport['H4'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  const lines = code.split('\n').filter(l => l.toLowerCase().includes('printful') || l.includes('printifyOrder'));
  return lines.slice(0, 5).map(l => l.trim());
})();

// H5: Multi-shop retries in printifyService.js
checkReport['H5'] = (() => {
  const p = path.join(apiDir, 'src/services/printifyService.js');
  if (!fs.existsSync(p)) return 'Not found';
  const code = fs.readFileSync(p, 'utf8');
  const lines = code.split('\n').filter(l => l.includes('for (const shop of') || l.includes('getShops') || l.includes('createPrintifyOrder'));
  return lines.slice(0, 5).map(l => l.trim());
})();

// H6: send_to_production in adminOrderService / printifyService
checkReport['H6'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  return { callsSendToProduction: code.includes('send_to_production') || code.includes('sendToProduction') };
})();

// H7: Proxy client IP forwarding
checkReport['H7'] = (() => {
  const p = path.join(storeDir, 'src/lib/proxySecurity.ts');
  const code = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
  return { hasXForwardedFor: code.includes('x-forwarded-for') || code.includes('X-Forwarded-For') };
})();

// H9: Shopify webhook HMAC
checkReport['H9'] = (() => {
  const pCtrl = path.join(apiDir, 'src/controllers/webhookController.js');
  const pRoute = path.join(apiDir, 'src/routes/shopify.js');
  const ctrlCode = fs.existsSync(pCtrl) ? fs.readFileSync(pCtrl, 'utf8') : '';
  const routeCode = fs.existsSync(pRoute) ? fs.readFileSync(pRoute, 'utf8') : '';
  return {
    ctrlHasTimingSafeEqual: ctrlCode.includes('timingSafeEqual'),
    ctrlChecksBufferLength: ctrlCode.includes('digest.length ===') || ctrlCode.includes('buffer.length'),
    routeHasVerifyWebhook: routeCode.includes('verifyShopifyWebhook')
  };
})();

// H10: Markup formula create vs edit in productService.js
checkReport['H10'] = (() => {
  const p = path.join(apiDir, 'src/services/productService.js');
  const code = fs.readFileSync(p, 'utf8');
  const matches = code.split('\n').filter(l => l.includes('markup') || l.includes('margin') || l.includes('profit'));
  return matches.slice(0, 5).map(l => l.trim());
})();

// H11: Commission formulas web vs API
checkReport['H11'] = (() => {
  const p1 = path.join(apiDir, 'src/utils/multiCreatorCommissions.js');
  const p2 = path.join(storeDir, 'src/lib/orderPaymentConfirmation.ts');
  return {
    apiHasCommissionUtil: fs.existsSync(p1),
    storeHasConfirmation: fs.existsSync(p2)
  };
})();

// H12: Printify API call inside DB transaction
checkReport['H12'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/adminOrderService.js'), 'utf8');
  const withTxIdx = code.indexOf('withTransaction(async (client) => {');
  const printifyCallIdx = code.indexOf('createPrintifyOrder', withTxIdx);
  return { printifyInTx: printifyCallIdx > withTxIdx };
})();

// H13: Stripe transfers lack idempotency
checkReport['H13'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/walletService.js'), 'utf8');
  return {
    hasStripeTransfer: code.includes('stripe.transfers.create'),
    hasIdempotencyKey: code.includes('idempotencyKey')
  };
})();

// H14: Wallet cron concurrency / lack of advisory lock
checkReport['H14'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/walletService.js'), 'utf8');
  return {
    hasReleaseEligible: code.includes('releaseEligibleCommissions'),
    hasAdvisoryLock: code.includes('pg_try_advisory_lock')
  };
})();

// H15: Refund reversal reverses wrong wallet credit
checkReport['H15'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/services/walletService.js'), 'utf8');
  const lines = code.split('\n').filter(l => l.includes('handleCommissionRefund') || (l.includes('reference_id') && l.includes('refund')));
  return lines.slice(0, 5).map(l => l.trim());
})();

// H16: User deletion cascades into financial history
checkReport['H16'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/config/database.js'), 'utf8');
  const lines = code.split('\n').filter(l => l.includes('ON DELETE CASCADE') && (l.includes('wallets') || l.includes('transactions') || l.includes('withdrawal')));
  return lines.slice(0, 5).map(l => l.trim());
})();

// H17: Fresh DB schema duplicate column / type mismatch
checkReport['H17'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/config/database.js'), 'utf8');
  return { length: code.length };
})();

// H18: Stripe key modes mismatch
checkReport['H18'] = (() => {
  const envApi = fs.existsSync(path.join(apiDir, '.env')) ? fs.readFileSync(path.join(apiDir, '.env'), 'utf8') : '';
  const envStore = fs.existsSync(path.join(storeDir, '.env')) ? fs.readFileSync(path.join(storeDir, '.env'), 'utf8') : '';
  return {
    apiKeys: envApi.split('\n').filter(l => l.startsWith('STRIPE_')).map(l => l.split('=')[0]),
    storeKeys: envStore.split('\n').filter(l => l.startsWith('STRIPE_')).map(l => l.split('=')[0])
  };
})();

// H19: Error handler exposes stack trace and sensitive bodies
checkReport['H19'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/app.js'), 'utf8');
  const lines = code.split('\n').filter(l => l.includes('stack') || l.includes('req.body'));
  return lines.slice(0, 5).map(l => l.trim());
})();

// H20: Checkout password login rate limit
checkReport['H20'] = (() => {
  const code = fs.readFileSync(path.join(apiDir, 'src/routes/unifiedCheckout.js'), 'utf8');
  return { hasAuthLimiterOnProcess: code.includes('authLimiter') && code.includes('/process') };
})();

// H21: Admin/email/knowledge routes lack auth middleware
checkReport['H21'] = (() => {
  const storeKnowledge = path.join(storeDir, 'src/app/api/admin/knowledge/route.ts');
  const storeStats = path.join(storeDir, 'src/app/api/admin/stats/route.ts');
  const apiUnified = path.join(apiDir, 'src/routes/unifiedCheckout.js');
  return {
    storeKnowledgeAuth: fs.existsSync(storeKnowledge) && fs.readFileSync(storeKnowledge, 'utf8').includes('requireAdminAuth'),
    storeStatsAuth: fs.existsSync(storeStats) && fs.readFileSync(storeStats, 'utf8').includes('requireAdminAuth'),
    apiDashboardStatsAuth: fs.readFileSync(apiUnified, 'utf8').includes('requireRole')
  };
})();

// H22: Email templates lack HTML escaping
checkReport['H22'] = (() => {
  const p = path.join(apiDir, 'src/services/emailService.js');
  const code = fs.readFileSync(p, 'utf8');
  return { hasEscapeHtml: code.includes('escapeHtml') || code.includes('escape(') || code.includes('sanitize') };
})();

console.log(JSON.stringify(checkReport, null, 2));
