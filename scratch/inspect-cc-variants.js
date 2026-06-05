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
  const blueprintId = 706;
  const providerId = 99; // SwiftPOD Comfort Colors 1717
  try {
    const varRes = await fetch(`${PRINTIFY_BASE_URL}/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`, {
      headers: { 'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}` }
    });
    const varData = await varRes.json();
    console.log('Total variants for CC 1717:', varData.variants?.length);
    if (varData.variants && varData.variants.length > 0) {
      console.log('Keys of first variant:', Object.keys(varData.variants[0]));
      console.log('First variant details:', JSON.stringify(varData.variants[0], null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

run();
