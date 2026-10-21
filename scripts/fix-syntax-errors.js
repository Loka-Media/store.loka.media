import fs from 'node:fs';
import path from 'node:path';

// 1. Fix printifyController.js
const printifyPath = path.resolve('../store-api.loka.media/src/controllers/printifyController.js');
let printifyContent = fs.readFileSync(printifyPath, 'utf8');

const badPrintifySnippet = `    } else {
      console.log(\`ℹ️ [Printify Webhook] Order \${orderId} was already fulfilled; skipping duplicate customer email.\`);
    }
      console.error(\`❌ Failed to send fulfillment email for order \${orderId}:\`, emailError.message || emailError);
    }`;

const goodPrintifySnippet = `    } else {
      console.log(\`ℹ️ [Printify Webhook] Order \${orderId} was already fulfilled; skipping duplicate customer email.\`);
    }`;

if (printifyContent.includes(badPrintifySnippet)) {
    printifyContent = printifyContent.replace(badPrintifySnippet, goodPrintifySnippet);
    fs.writeFileSync(printifyPath, printifyContent, 'utf8');
    console.log('Fixed printifyController.js');
} else {
    // Try regex / CRLF normalized
    const regex = /\}\s*else\s*\{\s*console\.log\(`ℹ️ \[Printify Webhook\] Order \$\{orderId\} was already fulfilled; skipping duplicate customer email\.`\);\s*\}\s*console\.error\(`❌ Failed to send fulfillment email for order \$\{orderId\}:`, emailError\.message \|\| emailError\);\s*\}/;
    if (regex.test(printifyContent)) {
        printifyContent = printifyContent.replace(regex, `} else {\n      console.log(\`ℹ️ [Printify Webhook] Order \${orderId} was already fulfilled; skipping duplicate customer email.\`);\n    }`);
        fs.writeFileSync(printifyPath, printifyContent, 'utf8');
        console.log('Fixed printifyController.js via regex');
    } else {
        console.error('Could not find badPrintifySnippet in printifyController.js');
    }
}

// 2. Fix shopify.js
const shopifyPath = path.resolve('../store-api.loka.media/src/routes/shopify.js');
let shopifyContent = fs.readFileSync(shopifyPath, 'utf8');

const badShopifySnippet = `const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const shopifyController = require('../controllers/shopifyController');
const { verifyShopifyWebhook } = require('../controllers/webhookController');
const { authenticateToken } = require('../middleware/auth');
const shopifyController = require('../controllers/shopifyController');`;

const goodShopifySnippet = `const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const shopifyController = require('../controllers/shopifyController');
const { verifyShopifyWebhook } = require('../controllers/webhookController');`;

shopifyContent = shopifyContent.replace(/\r\n/g, '\n');
if (shopifyContent.includes(badShopifySnippet)) {
    shopifyContent = shopifyContent.replace(badShopifySnippet, goodShopifySnippet);
    fs.writeFileSync(shopifyPath, shopifyContent, 'utf8');
    console.log('Fixed routes/shopify.js');
} else {
    console.error('Could not find badShopifySnippet in routes/shopify.js');
}

// 3. Fix productService.js
const productPath = path.resolve('../store-api.loka.media/src/services/productService.js');
let productContent = fs.readFileSync(productPath, 'utf8');
productContent = productContent.replace(/\r\n/g, '\n');

// Line 190 re-declares catalogVariant
const badProductSnippet = `            const title = \`\${variant.size || 'Default'} - \${variant.color || 'Default'}\`;
            const catalogVariant = catalogVariantsMap[variant.printifyVariantId];
            let availabilityRegions = null;`;

const goodProductSnippet = `            const title = \`\${variant.size || 'Default'} - \${variant.color || 'Default'}\`;
            let availabilityRegions = null;`;

if (productContent.includes(badProductSnippet)) {
    productContent = productContent.replace(badProductSnippet, goodProductSnippet);
    fs.writeFileSync(productPath, productContent, 'utf8');
    console.log('Fixed productService.js');
} else {
    console.error('Could not find badProductSnippet in productService.js');
}
