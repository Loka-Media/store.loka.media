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

async function test() {
  const apiKey = PRINTIFY_API_KEY;
  const shopId = PRINTIFY_SHOP_ID;

  if (!apiKey || !shopId) {
    console.error('Missing env vars');
    return;
  }

  // Let's inspect blueprint 5 (Unisex Cotton Crew Tee), print provider 42
  // Let's get actual variants for blueprint 5 and provider 42 to make sure the variant ID is correct.
  console.log('Fetching variants for blueprint 5 + provider 42...');
  const varRes = await fetch(`https://api.printify.com/v1/catalog/blueprints/5/print_providers/42/variants.json`, {
    headers: { 'Authorization': `Bearer ${apiKey}` }
  });
  const varData = await varRes.json();
  const sampleVariant = varData.variants?.[0];
  console.log('Sample variant from catalog:', sampleVariant ? { id: sampleVariant.id, title: sampleVariant.title } : 'None');

  const variantId = sampleVariant ? sampleVariant.id : 17351; // fallback

  const payload = {
    title: "Test Validation Failed",
    description: "test",
    blueprint_id: 5,
    print_provider_id: 42,
    variants: [
      { id: variantId, price: 1500, is_enabled: true }
    ],
    print_areas: [
      {
        variant_ids: [variantId],
        placeholders: [{
          position: "front",
          images: [
            {
              id: "6a217fdc9d1fc5f3d17c953b", // test design image ID from earlier upload
              x: 0.5,
              y: 0.5,
              scale: 1,
              angle: 0
            }
          ]
        }]
      }
    ]
  };

  console.log('Sending product create payload to Printify...');

  const response = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const status = response.status;
  const body = await response.text();
  console.log('Status:', status);
  console.log('Response body:', body);
}

test();

