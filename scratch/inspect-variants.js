const fs = require('fs');
const path = require('path');

const envPath = 'c:/Users/LG-115/Desktop/Shop.loka.media/.env.local';
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.\-_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    process.env[key] = value;
  }
});

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

async function run() {
  const blueprintId = 5;
  try {
    const provRes = await fetch(`${PRINTIFY_BASE_URL}/catalog/blueprints/${blueprintId}/print_providers.json`, {
      headers: { 'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}` }
    });
    const providers = await provRes.json();
    const providerId = providers[0]?.id;
    console.log('Provider ID:', providerId);

    if (providerId) {
      const varRes = await fetch(`${PRINTIFY_BASE_URL}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`, {
        headers: { 'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}` }
      });
      const varData = await varRes.json();
      console.log('varData keys:', Object.keys(varData));
      console.log('Total variants:', varData.variants?.length);
      const allKeys = new Set();
      if (varData.variants) {
        varData.variants.forEach(v => Object.keys(v).forEach(k => allKeys.add(k)));
      }
      console.log('All variant keys found across all variants:', Array.from(allKeys));
      if (varData.variants && varData.variants.length > 0) {
        console.log('First variant full details:', JSON.stringify(varData.variants[0], null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  }
}

run();
