const fs = require('fs');
const path = require('path');

let PRINTIFY_API_KEY = '';
let PRINTIFY_SHOP_ID = '';

try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('PRINTIFY_API_KEY=')) {
      PRINTIFY_API_KEY = line.split('PRINTIFY_API_KEY=')[1].trim();
    }
    if (line.startsWith('PRINTIFY_SHOP_ID=')) {
      PRINTIFY_SHOP_ID = line.split('PRINTIFY_SHOP_ID=')[1].trim();
    }
  }
} catch (err) {
  console.error('Failed to read .env.local:', err.message);
}

// Mock printifyFetch internally to test target endpoints
const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

async function printifyFetch(path, options = {}) {
  const url = `${PRINTIFY_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LokMedia-Store/1.0',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Printify API error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  return response.json();
}

async function testAll() {
  console.log('--- STARTING PRINTIFY API ENDPOINT INTEGRATION VERIFICATION ---');
  console.log('PRINTIFY_API_KEY:', PRINTIFY_API_KEY ? 'Present' : 'Missing');
  console.log('PRINTIFY_SHOP_ID:', PRINTIFY_SHOP_ID);

  if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID) {
    console.error('Missing key or shop ID');
    process.exit(1);
  }

  try {
    // 1. Test Shops Endpoint
    console.log('\n[1/5] Testing GET /shops.json...');
    const shops = await printifyFetch('/shops.json');
    console.log('✓ Success! Number of shops found:', shops.length);
    if (shops.length > 0) {
      console.log('Sample Shop Details:', { id: shops[0].id, title: shops[0].title });
    }

    // 2. Test Get Single Shop
    console.log('\n[2/5] Testing GET single shop by filtering list...');
    const shop = shops.find(s => String(s.id) === String(PRINTIFY_SHOP_ID));
    if (!shop) throw new Error('Shop ' + PRINTIFY_SHOP_ID + ' not found in shops list');
    console.log('✓ Success! Shop Details:', { id: shop.id, title: shop.title });

    // 3. Test Global Print Providers
    console.log('\n[3/5] Testing GET /catalog/print_providers.json...');
    const providers = await printifyFetch('/catalog/print_providers.json');
    console.log('✓ Success! Number of global print providers:', providers.length);
    if (providers.length > 0) {
      console.log('Sample Provider Details:', { id: providers[0].id, title: providers[0].title });
    }

    // 4. Test Blueprint + Provider Shipping profiles
    // Use blueprint ID 6 (Unisex Heavy Cotton Tee) and print provider 41 (SwiftPOD)
    console.log('\n[4/5] Testing GET /catalog/blueprints/6/print_providers/41/shipping.json...');
    const shipping = await printifyFetch('/catalog/blueprints/6/print_providers/41/shipping.json');
    console.log('✓ Success! Shipping profile keys:', Object.keys(shipping));
    if (shipping.handling_time) {
      console.log('Handling Time info:', shipping.handling_time);
    }

    // 5. Test Uploads endpoint
    console.log('\n[5/5] Testing GET /uploads.json...');
    const uploads = await printifyFetch('/uploads.json?limit=2');
    console.log('✓ Success! Uploads response properties:', Object.keys(uploads));
    if (uploads.data) {
      console.log('Number of uploaded files returned:', uploads.data.length);
      if (uploads.data.length > 0) {
        console.log('Sample Upload File:', { id: uploads.data[0].id, file_name: uploads.data[0].file_name });
      }
    }

    console.log('\n=========================================');
    console.log('🎉 ALL PRINTIFY INTEGRATIONS VERIFIED SUCCESSFULLY!');
    console.log('=========================================');

  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    process.exit(1);
  }
}

testAll();
