const fs = require('fs');
const path = require('path');

const apiDir = path.resolve('../store-api.loka.media');

console.log('🚀 Applying Batch 5 High-severity remediations (with CRLF normalization)...');

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
    console.log(`ℹ️ No changes needed or already applied for ${relPath}`);
  }
}

// -------------------------------------------------------------
// H1: adminOrderQueries.js - Fix SQL condition assembly
// -------------------------------------------------------------
patchFile('src/queries/adminOrderQueries.js', (code) => {
  const target = `    const queryParams = [];
    let paramCount = 0;

    if (status) {
        paramCount++;
        query += \` WHERE mo.order_status = $\${paramCount}\`;
        queryParams.push(status);
    }

    if (orderType) {
        paramCount++;
        query += \` \${paramCount === 0 ? 'WHERE' : 'AND'} mo.order_type = $\${paramCount}\`;
        queryParams.push(orderType);
    }

    if (priority) {
        paramCount++;
        query += \` \${paramCount === 0 ? 'WHERE' : 'AND'} avq.priority = $\${paramCount}\`;
        queryParams.push(priority);
    }

    if (search) {
        paramCount++;
        query += \` \${paramCount === 0 ? 'WHERE' : 'AND'} (
      mo.order_number ILIKE $\${paramCount} OR
      COALESCE(u.email, (mo.metadata->>'customerEmail')) ILIKE $\${paramCount} OR
      COALESCE(u.name, (mo.metadata->>'customerName'), (mo.shipping_address->>'name')) ILIKE $\${paramCount}
    )\`;
        queryParams.push(\`%\${search}%\`);
    }`;

  const replacement = `    const queryParams = [];
    let paramCount = 0;
    const whereConditions = [];

    if (status) {
        paramCount++;
        whereConditions.push(\`mo.order_status = $\${paramCount}\`);
        queryParams.push(status);
    }

    if (orderType) {
        paramCount++;
        whereConditions.push(\`mo.order_type = $\${paramCount}\`);
        queryParams.push(orderType);
    }

    if (priority) {
        paramCount++;
        whereConditions.push(\`avq.priority = $\${paramCount}\`);
        queryParams.push(priority);
    }

    if (search) {
        paramCount++;
        whereConditions.push(\`(
      mo.order_number ILIKE $\${paramCount} OR
      COALESCE(u.email, (mo.metadata->>'customerEmail')) ILIKE $\${paramCount} OR
      COALESCE(u.name, (mo.metadata->>'customerName'), (mo.shipping_address->>'name')) ILIKE $\${paramCount}
    )\`);
        queryParams.push(\`%\${search}%\`);
    }

    if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
    }`;

  return code.includes(target) ? code.replace(target, replacement) : code;
});

// -------------------------------------------------------------
// H2, H3, H4, H6, H12: adminOrderService.js
// -------------------------------------------------------------
patchFile('src/services/adminOrderService.js', (code) => {
  // H2: getPendingOrderList side effects removal & short TTL
  const targetGetPending = `const getPendingOrderList = async (filters, limit, offset) => {
    const cacheKey = createCacheKey('admin:pending:orders', { filters, limit, offset });

    return await staleWhileRevalidate(cacheKey, async () => {
        const orders = await queries.getPendingOrdersQuery(filters, limit, offset);
        
        // Auto-release/submit any order that is verified/escrowed but not yet sent to Printful/Shopify
        for (const order of orders) {
            if (order.payment_status === 'escrowed' && order.order_status === 'payment_received') {
                try {
                    console.log(\`⚡ Found escrowed order \${order.id} in list. Auto-submitting in background...\`);
                    releaseOrderPayment(1, order.id, {
                        vendorEmail: 'vendor@loka.media',
                        notes: 'Auto-released escrowed order in background'
                    }).then(res => {
                        console.log(\`✅ Background auto-release success for order \${order.id}:\`, res.message);
                        invalidateCache('admin:dashboard:stats');
                        invalidateCache('admin:pending:orders');
                    }).catch(err => {
                        console.error(\`❌ Background auto-release fail for order \${order.id}:\`, err.message || err);
                    });
                } catch (e) {
                    console.error('Error triggering auto-release background process:', e);
                }
            }
        }

        return orders.map(order => ({
            ...order,
            order_items: typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items,
            shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
            metadata: typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata
        }));
    }, { ttl: 86400 });
};`;

  const replacementGetPending = `const getPendingOrderList = async (filters, limit, offset) => {
    const cacheKey = createCacheKey('admin:pending:orders', { filters, limit, offset });

    // H2: Read-only GET query with short TTL (30s). Removed side effects (auto-release order mutations).
    return await staleWhileRevalidate(cacheKey, async () => {
        const orders = await queries.getPendingOrdersQuery(filters, limit, offset);

        return orders.map(order => ({
            ...order,
            order_items: typeof order.order_items === 'string' ? JSON.parse(order.order_items) : order.order_items,
            shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
            metadata: typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata
        }));
    }, { ttl: 30 });
};`;

  if (code.includes(targetGetPending)) {
    code = code.replace(targetGetPending, replacementGetPending);
  }

  // Dashboard stats TTL: change 86400 to 60
  code = code.replace(
    `            recentOrders\n        };\n    }, { ttl: 86400 });`,
    `            recentOrders\n        };\n    }, { ttl: 60 });`
  );

  // H3: State machine validation in releaseOrderPayment
  const targetState = `        const order = await queries.findOrderForUpdate(orderId, client);
        if (!order) throw { status: 404, message: 'Order not found' };
        if (order.payment_status === 'released') throw { status: 400, message: 'Payment already released' };`;

  const replacementState = `        const order = await queries.findOrderForUpdate(orderId, client);
        if (!order) throw { status: 404, message: 'Order not found' };
        if (order.payment_status === 'released') throw { status: 400, message: 'Payment already released' };

        // H3: State machine validation: order must be in a paid/escrowed state and cannot be cancelled/refunded/failed
        const orderStatus = (order.order_status || '').toLowerCase().trim();
        const paymentStatus = (order.payment_status || '').toLowerCase().trim();

        if (['cancelled', 'refunded', 'failed'].includes(orderStatus) || ['cancelled', 'refunded', 'failed'].includes(paymentStatus)) {
            throw { status: 400, message: \`Cannot release payment for order in \${orderStatus || paymentStatus} state\` };
        }

        const isPaidOrEscrowed = paymentStatus === 'escrowed' || paymentStatus === 'payment_received' || orderStatus === 'payment_received' || orderStatus === 'processing';
        if (!isPaidOrEscrowed) {
            throw { status: 400, message: \`Order payment status must be escrowed or payment_received to release (current: \${paymentStatus || 'unpaid'})\` };
        }`;

  if (code.includes(targetState)) {
    code = code.replace(targetState, replacementState);
  }

  // H4 & H6: Printify schema response handling & send_to_production
  const targetPrintifyBlock = `                if (printifyOrder && printifyOrder.id) {
                    const actualCost = parseFloat(printifyOrder.total_price || 0) / 100;
                    if (actualCost > 0) {
                        await queries.updateVendorPaymentAmount(orderId, actualCost, client);
                        order.vendor_payment_amount = actualCost;
                    }
                }`;

  const replacementPrintifyBlock = `                // H4: Normalize Printify order response (Printify returns top-level order object)
                const pfOrder = printifyOrder ? (printifyOrder.result || printifyOrder) : null;
                const pfOrderId = pfOrder?.id || printifyOrder?.id;

                if (pfOrderId) {
                    const actualCost = parseFloat(pfOrder.total_price || 0) / 100;
                    if (actualCost > 0) {
                        await queries.updateVendorPaymentAmount(orderId, actualCost, client);
                        order.vendor_payment_amount = actualCost;
                    }

                    // H6: Send Printify order to production so fulfillers can print
                    try {
                        console.log(\`🚀 Sending Printify order \${pfOrderId} to production...\`);
                        await printifyAPI.sendToProduction(pfOrderId);
                        console.log(\`✅ Printify order \${pfOrderId} successfully sent to production\`);
                    } catch (prodErr) {
                        console.warn(\`⚠️ [Printify send_to_production Note]: \${prodErr.message}\`);
                    }
                }`;

  if (code.includes(targetPrintifyBlock)) {
    code = code.replace(targetPrintifyBlock, replacementPrintifyBlock);
  }

  // Normalize .result checks
  code = code.replace(
    `printify: printifyOrder ? printifyOrder.result : null,`,
    `printify: printifyOrder ? (printifyOrder.result || printifyOrder) : null,`
  );
  code = code.replace(
    `printifyItems: printifyOrder?.result?.items?.length || 0,`,
    `printifyItems: (printifyOrder?.result?.items || printifyOrder?.line_items || printifyOrder?.items)?.length || 0,`
  );
  code = code.replace(
    `if (!printifyOrder || !printifyOrder.result) throw new Error('Invalid response from Printify');\n\n        const pfOrder = printifyOrder.result;`,
    `if (!printifyOrder || (!printifyOrder.result && !printifyOrder.id)) throw new Error('Invalid response from Printify');\n\n        const pfOrder = printifyOrder.result || printifyOrder;`
  );

  // H12: Do not swallow commission tracking errors silently
  const targetCommission = `        const commissionResult = await trackMultiCreatorCommissions(client, order);
        if (!commissionResult.success) {
            console.warn(\`⚠️ [ORDER] Commission tracking failed: \${commissionResult.message || commissionResult.error || 'Unknown error'}. Order will still be released.\`);
        }`;

  const replacementCommission = `        const commissionResult = await trackMultiCreatorCommissions(client, order);
        if (!commissionResult.success) {
            console.error(\`❌ [ORDER] Commission tracking failed for order \${orderId}: \${commissionResult.message || commissionResult.error || 'Unknown error'}\`);
            try {
                await queries.updateVerificationQueueStatus(orderId, 'commission_failed', client);
            } catch (qErr) {}
        }`;

  if (code.includes(targetCommission)) {
    code = code.replace(targetCommission, replacementCommission);
  }

  return code;
});

// -------------------------------------------------------------
// H5: printifyService.js - Single configured shop
// -------------------------------------------------------------
patchFile('src/services/printifyService.js', (code) => {
  const targetShops = `const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const ALL_SHOP_IDS = [process.env.PRINTIFY_SHOP_ID, '10714085', '27856672'].filter((v, i, a) => v && a.indexOf(v) === i);`;
  const replacementShops = `const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID || '10714085';
const ALL_SHOP_IDS = [PRINTIFY_SHOP_ID];`;

  return code.includes(targetShops) ? code.replace(targetShops, replacementShops) : code;
});

// -------------------------------------------------------------
// H19: app.js - Sensitive body redaction & production stack trace removal
// -------------------------------------------------------------
patchFile('src/app.js', (code) => {
  const targetErr = `    app.use((err, req, res, _next) => {
      // Log all errors to console for debugging
      console.error('[ERROR]', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body,
        status: err.status || 500
      });

      if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON' });
      }

      if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request too large' });
      }

      // Handle custom errors with status codes
      if (err.status) {
        return res.status(err.status).json({
          error: err.message,
          ...(err.details && { details: err.details })
        });
      }

      res.status(500).json({
        error: 'Internal server error',
        details: err.message,
        stack: err.stack
      });
    });`;

  const replacementErr = `    // H19: Helper to redact sensitive credentials from error logs
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

    app.use((err, req, res, _next) => {
      const isProduction = process.env.NODE_ENV === 'production';

      // Log errors with redacted bodies to prevent credential leakage
      console.error('[ERROR]', {
        message: err.message,
        url: req.url,
        method: req.method,
        body: redactBody(req.body),
        status: err.status || 500,
        ...(!isProduction && { stack: err.stack })
      });

      if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON' });
      }

      if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request too large' });
      }

      // Handle custom errors with status codes
      if (err.status) {
        return res.status(err.status).json({
          error: err.message,
          ...(err.details && { details: err.details })
        });
      }

      // Never expose internal stack traces or database errors in production
      res.status(500).json({
        error: 'Internal server error',
        ...(!isProduction && { details: err.message, stack: err.stack })
      });
    });`;

  return code.includes(targetErr) ? code.replace(targetErr, replacementErr) : code;
});

// -------------------------------------------------------------
// H22: emailService.js - HTML escaping
// -------------------------------------------------------------
patchFile('src/services/emailService.js', (code) => {
  const targetLoad = `const loadTemplate = async (templateName, variables = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', \`\${templateName}.html\`);
    let template = await fs.readFile(templatePath, 'utf-8');

    Object.keys(variables).forEach(key => {
      const regex = new RegExp(\`{{\${key}}}\`, 'g');
      template = template.replace(regex, variables[key]);
    });

    return template;
  } catch (error) {
    console.error(\`[EMAIL-TEMPLATE] Failed to load template \${templateName}:\`, error.message);
    throw new Error(\`Email template \${templateName} not found\`);
  }
};`;

  const replacementLoad = `const escapeHtml = (str) => {
  if (typeof str !== 'string') return str === null || str === undefined ? '' : String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const loadTemplate = async (templateName, variables = {}) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', \`\${templateName}.html\`);
    let template = await fs.readFile(templatePath, 'utf-8');

    // H22: Sanitize template values to prevent HTML injection / XSS in emails
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(\`{{\${key}}}\`, 'g');
      const val = variables[key];
      // Allow raw HTML only for explicitly marked keys like 'productsHtml' or 'itemsTable'
      const isRawHtmlKey = key.toLowerCase().endsWith('html') || key.toLowerCase().endsWith('table');
      const sanitizedVal = isRawHtmlKey ? (val || '') : escapeHtml(val);
      template = template.replace(regex, sanitizedVal);
    });

    return template;
  } catch (error) {
    console.error(\`[EMAIL-TEMPLATE] Failed to load template \${templateName}:\`, error.message);
    throw new Error(\`Email template \${templateName} not found\`);
  }
};`;

  return code.includes(targetLoad) ? code.replace(targetLoad, replacementLoad) : code;
});

console.log('🎉 CRLF normalized patching complete!');
