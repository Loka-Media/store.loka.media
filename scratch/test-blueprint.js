const fs = require('fs');
const path = require('path');

let PRINTIFY_API_KEY = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    if (line.startsWith('PRINTIFY_API_KEY=')) {
      PRINTIFY_API_KEY = line.split('PRINTIFY_API_KEY=')[1].trim();
    }
  }
} catch (err) {
  console.error('Failed to read .env.local:', err.message);
}

async function run() {
  if (!PRINTIFY_API_KEY) {
    console.error('Missing key');
    return;
  }

  try {
    const res = await fetch(`https://api.printify.com/v1/catalog/blueprints/6.json`, {
      headers: {
        'Authorization': `Bearer ${PRINTIFY_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error('Error fetching blueprint:', res.status, res.statusText, await res.text());
      return;
    }

    const data = await res.json();
    console.log('Blueprint 6 keys:', Object.keys(data));
    console.log('id:', data.id);
    console.log('title:', data.title);
    console.log('description length:', data.description?.length);
    console.log('variants count:', data.variants?.length);
  } catch (err) {
    console.error('Fetch failed:', err);
  }
}

run();
