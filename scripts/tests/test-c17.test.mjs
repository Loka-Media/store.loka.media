import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/isolated_test_db';
process.env.NODE_ENV = 'test';
process.env.SHOPIFY_API_KEY = 'mock_shopify_api_key';
process.env.SHOPIFY_API_SECRET = 'mock_shopify_api_secret';
process.env.SHOPIFY_STORE_DOMAIN = 'mock-store.myshopify.com';
process.env.SHOPIFY_APP_URL = 'https://mock-app.example.com';

const require = createRequire(import.meta.url);
const unifiedCheckoutService = require('../../../store-api.loka.media/src/services/unifiedCheckoutService.js');
const unifiedCheckoutQueries = require('../../../store-api.loka.media/src/queries/unifiedCheckoutQueries.js');

test('C17: extractOrderCustomerEmail extracts email across all possible schemas', () => {
  const { extractOrderCustomerEmail } = unifiedCheckoutService;
  
  // From metadata
  assert.equal(
    extractOrderCustomerEmail({ metadata: { customerEmail: 'Customer@example.com' } }),
    'customer@example.com'
  );
  assert.equal(
    extractOrderCustomerEmail({ metadata: JSON.stringify({ email: 'Meta@example.com' }) }),
    'meta@example.com'
  );

  // From shipping address
  assert.equal(
    extractOrderCustomerEmail({ shipping_address: { email: 'ship@Example.com' } }),
    'ship@example.com'
  );
  assert.equal(
    extractOrderCustomerEmail({ shipping_address: JSON.stringify({ email: 'ship_json@example.com' }) }),
    'ship_json@example.com'
  );

  // From billing address
  assert.equal(
    extractOrderCustomerEmail({ billing_address: { email: 'bill@example.com' } }),
    'bill@example.com'
  );

  // When missing
  assert.equal(extractOrderCustomerEmail({}), null);
  assert.equal(extractOrderCustomerEmail(null), null);
});

test('C17: getOrderStatus rejects guest requests without email', async () => {
  const { getOrderStatus } = unifiedCheckoutService;

  await assert.rejects(
    async () => {
      await getOrderStatus('ORD-123', null, '');
    },
    { message: 'Authentication required' }
  );

  await assert.rejects(
    async () => {
      await getOrderStatus('ORD-123', null, null);
    },
    { message: 'Authentication required' }
  );
});

test('C17: getOrderStatus rejects guest request with mismatched email (prevents PII probe)', async () => {
  const { getOrderStatus } = unifiedCheckoutService;

  // Mock queries
  const originalFindOrder = unifiedCheckoutQueries.findOrderByNumber;
  const originalFindFulfillment = unifiedCheckoutQueries.findOrderFulfillment;

  try {
    unifiedCheckoutQueries.findOrderByNumber = async (orderNumber, userId) => {
      return {
        id: 99,
        order_number: 'ORD-99',
        user_id: null,
        metadata: { customerEmail: 'legitimate_customer@domain.com' },
        shipping_address: { name: 'John Doe', address: '123 Secret St' }
      };
    };

    // Attacker tries to read order with wrong email
    await assert.rejects(
      async () => {
        await getOrderStatus('ORD-99', null, 'attacker@evil.com');
      },
      { message: 'Order not found' }
    );

    // Legitimate customer with matching email (case insensitive, trimmed)
    unifiedCheckoutQueries.findOrderFulfillment = async () => [{ status: 'fulfilled' }];

    const result = await getOrderStatus('ORD-99', null, '  LEGITIMATE_CUSTOMER@domain.com ');
    assert.equal(result.order.id, 99);
    assert.equal(result.order.order_number, 'ORD-99');
    assert.equal(result.fulfillment.length, 1);

  } finally {
    unifiedCheckoutQueries.findOrderByNumber = originalFindOrder;
    unifiedCheckoutQueries.findOrderFulfillment = originalFindFulfillment;
  }
});
