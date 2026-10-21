const fs = require('fs');
const path = require('path');

// 2. Patch unifiedCheckoutService.js
const serviceFile = path.resolve(__dirname, '../../store-api.loka.media/src/services/unifiedCheckoutService.js');
let serviceCode = fs.readFileSync(serviceFile, 'utf8');

const replacementServiceSnippet = `const extractOrderCustomerEmail = (order) => {
    if (!order) return null;
    if (order.metadata) {
        try {
            const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : order.metadata;
            if (meta.customerEmail) return meta.customerEmail.trim().toLowerCase();
            if (meta.email) return meta.email.trim().toLowerCase();
        } catch {}
    }
    if (order.shipping_address) {
        try {
            const ship = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address;
            if (ship.email) return ship.email.trim().toLowerCase();
        } catch {}
    }
    if (order.billing_address) {
        try {
            const bill = typeof order.billing_address === 'string' ? JSON.parse(order.billing_address) : order.billing_address;
            if (bill.email) return bill.email.trim().toLowerCase();
        } catch {}
    }
    return null;
};

const getOrderStatus = async (orderNumber, user, email) => {
    let order;

    if (!user) {
        if (!email || typeof email !== 'string' || !email.trim()) {
            throw new Error('Authentication required');
        }

        order = await unifiedCheckoutQueries.findOrderByNumber(orderNumber, null);

        if (!order) {
            throw new Error('Order not found');
        }

        const cleanRequestedEmail = email.trim().toLowerCase();
        const orderEmail = extractOrderCustomerEmail(order);

        // Security (C17): Prevent PII exposure by ensuring provided email matches the order record
        if (!orderEmail || orderEmail !== cleanRequestedEmail) {
            throw new Error('Order not found');
        }
    } else if (user.role === 'admin') {
        order = await unifiedCheckoutQueries.findOrderByNumberAdmin(orderNumber);
    } else {
        order = await unifiedCheckoutQueries.findOrderByNumber(orderNumber, user.id);
    }

    if (!order) {
        throw new Error('Order not found');
    }

    const fulfillment = await unifiedCheckoutQueries.findOrderFulfillment(order.id);

    return { order, fulfillment };
};`;

// Use regex matching across CRLF / LF
const regex = /const getOrderStatus = async \(orderNumber, user, email\) => \{[\s\S]*?return \{ order, fulfillment \};\r?\n\};/;

if (regex.test(serviceCode)) {
  serviceCode = serviceCode.replace(regex, replacementServiceSnippet);
  // Also export extractOrderCustomerEmail for unit testing
  if (serviceCode.includes('module.exports = {') && !serviceCode.includes('extractOrderCustomerEmail,')) {
    serviceCode = serviceCode.replace('module.exports = {', 'module.exports = {\n    extractOrderCustomerEmail,');
  }
  fs.writeFileSync(serviceFile, serviceCode, 'utf8');
  console.log('✅ Successfully replaced getOrderStatus in unifiedCheckoutService.js');
} else {
  console.error('❌ Could not match getOrderStatus regex in unifiedCheckoutService.js');
}
