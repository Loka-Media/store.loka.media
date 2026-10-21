const fs = require('fs');
const path = require('path');
const apiDir = path.resolve('../store-api.loka.media');
const storeDir = path.resolve('.');

const audit = {};

function grep(filePath, regex) {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  return lines.filter(l => regex.test(l)).map(l => l.trim()).slice(0, 5);
}

// M1: Money floats
audit['M1'] = grep(path.join(apiDir, 'src/services/commissionFeeService.js'), /parseFloat|Math\.round|toFixed/);

// M2: Product filter limit 1000
audit['M2'] = grep(path.join(apiDir, 'src/queries/productQueries.js'), /1000|LIMIT/);

// M3: Search wildcards / limit / offset
audit['M3'] = grep(path.join(apiDir, 'src/queries/productQueries.js'), /ILIKE|search/);

// M4: Cart price at checkout
audit['M4'] = grep(path.join(apiDir, 'src/services/unifiedCheckoutService.js'), /cart|price|item_price/);

// M5: Shipping fallback and tax
audit['M5'] = grep(path.join(apiDir, 'src/services/unifiedCheckoutService.js'), /shipping|tax/);

// M6: Timezones
audit['M6'] = grep(path.join(apiDir, 'src/services/walletService.js'), /INTERVAL|NOW\(\)/);

// M7: Admin hasMore pagination
audit['M7'] = grep(path.join(apiDir, 'src/controllers/adminOrderController.js'), /hasMore/);

// M8: Stripe postal code validation
audit['M8'] = grep(path.join(apiDir, 'src/validations/unifiedCheckoutValidation.js'), /postal|postcode|zip/i);

// M9: OTP brute-force
audit['M9'] = grep(path.join(apiDir, 'src/routes/auth.js'), /otp|verify/i);

// M10: Session secret and CORS
audit['M10'] = grep(path.join(apiDir, 'src/app.js'), /session|secret|cors/i);

// M11: Printify duplicate webhooks
audit['M11'] = grep(path.join(apiDir, 'src/controllers/printifyController.js'), /webhook|email|send/i);

// M12: Creator request probing
audit['M12'] = grep(path.join(apiDir, 'src/routes/auth.js'), /creator/i);

// M13: Zero/unknown base cost
audit['M13'] = grep(path.join(apiDir, 'src/services/orderCommissionService.js'), /base_cost|printifyCost/i);

// Low findings
audit['L1'] = grep(path.join(apiDir, 'src/services/adminOrderService.js'), /vendor@|adminId/i);
audit['L2'] = grep(path.join(apiDir, 'src/services/adminOrderService.js'), /JSON\.stringify\(printifyPayload/i);
audit['L3'] = grep(path.join(apiDir, 'src/routes/unifiedCheckout.js'), /\/stripe\/test/i);

console.log(JSON.stringify(audit, null, 2));
