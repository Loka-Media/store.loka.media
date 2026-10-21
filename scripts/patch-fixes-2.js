const fs = require('fs');
const path = require('path');
const apiDir = path.resolve('../store-api.loka.media');

function patchFile(relPath, transformFn) {
  const fullPath = path.join(apiDir, relPath);
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

// 1. routes/unifiedCheckout.js:
patchFile('src/routes/unifiedCheckout.js', (code) => {
  let modified = code;

  if (!modified.includes('requireRole')) {
    modified = modified.replace(
      "const { authenticateToken } = require('../middleware/auth');",
      "const { authenticateToken, requireRole } = require('../middleware/auth');\nconst { authLimiter } = require('../middleware/rateLimit');"
    );
  }

  // Replace each admin route with requireRole(['admin'])
  modified = modified.replace(
    "router.get('/admin/dashboard/stats', authenticateToken, getDashboardStats);",
    "router.get('/admin/dashboard/stats', authenticateToken, requireRole(['admin']), getDashboardStats);"
  );
  modified = modified.replace(
    "router.get('/admin/orders/pending', authenticateToken, getPendingOrders);",
    "router.get('/admin/orders/pending', authenticateToken, requireRole(['admin']), getPendingOrders);"
  );
  modified = modified.replace(
    "router.get('/admin/orders/:orderId/details', authenticateToken, getOrderDetails);",
    "router.get('/admin/orders/:orderId/details', authenticateToken, requireRole(['admin']), getOrderDetails);"
  );
  modified = modified.replace(
    "router.get('/admin/orders/:orderId/commissions', authenticateToken, getOrderCommissionBreakdown);",
    "router.get('/admin/orders/:orderId/commissions', authenticateToken, requireRole(['admin']), getOrderCommissionBreakdown);"
  );
  modified = modified.replace(
    "router.post('/admin/orders/:orderId/verify', authenticateToken, verifyPaymentValidation, verifyPayment);",
    "router.post('/admin/orders/:orderId/verify', authenticateToken, requireRole(['admin']), verifyPaymentValidation, verifyPayment);"
  );
  modified = modified.replace(
    "router.post('/admin/orders/:orderId/release-payment', authenticateToken, releasePaymentValidation, releasePayment);",
    "router.post('/admin/orders/:orderId/release-payment', authenticateToken, requireRole(['admin']), releasePaymentValidation, releasePayment);"
  );

  return modified;
});

// 2. walletService.js releaseEligibleCommissions finally block:
patchFile('src/services/walletService.js', (code) => {
  const targetFinally = `    } catch (error) {
      console.error('Error releasing eligible commissions:', error);
      throw error;
    } finally {
      client.release();
    }`;

  const replacementFinally = `    } catch (error) {
      console.error('Error releasing eligible commissions:', error);
      throw error;
    } finally {
      if (lockAcquired) {
        try {
          await client.query('SELECT pg_advisory_unlock(987654321)');
        } catch (unlockErr) {
          console.warn('Advisory unlock warning:', unlockErr.message);
        }
      }
      client.release();
    }`;

  return code.includes(targetFinally) ? code.replace(targetFinally, replacementFinally) : code;
});
