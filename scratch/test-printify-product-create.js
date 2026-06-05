const fetch = require('node-fetch');

async function test() {
  const apiKey = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!apiKey || !shopId) {
    console.error('Missing env vars');
    return;
  }

  const payload = {
    title: 'Test API Mockup Image Return',
    description: 'Test',
    blueprint_id: 6, // unisex heavy cotton tee
    print_provider_id: 29, // some provider
    variants: [
      { id: 17351, price: 1500, is_enabled: true }
    ],
    print_areas: [
      {
        variant_ids: [17351],
        placeholders: [{ position: 'front', images: [] }]
      }
    ]
  };

  const response = await fetch(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  console.log('Created ID:', data.id);
  console.log('Images length:', data.images?.length);
  if (data.images?.length > 0) {
    console.log('Images:', data.images);
  }
}

test();
