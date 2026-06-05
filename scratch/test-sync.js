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
  console.log('PRINTIFY_API_KEY:', PRINTIFY_API_KEY ? 'Present' : 'Missing');
  console.log('PRINTIFY_SHOP_ID:', PRINTIFY_SHOP_ID);

  if (!PRINTIFY_API_KEY || !PRINTIFY_SHOP_ID) {
    console.error('Missing key or shop ID');
    return;
  }

  try {
    const res = await fetch(`https://api.printify.com/v1/shops/${PRINTIFY_SHOP_ID}/products.json`, {
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error('Error fetching from Printify:', res.status, res.statusText, await res.text());
      return;
    }

    const data = await res.json();
    console.log(`Printify response has ${data.data?.length} products`);
    if (data.data && data.data.length > 0) {
      for (const prod of data.data) {
        console.log('Product:', {
          id: prod.id,
          title: prod.title,
          visible: prod.visible
        });
      }
    }
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

test();
