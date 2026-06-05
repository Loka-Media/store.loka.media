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
    console.log('Providers length:', providers.length);
    if (providers.length > 0) {
      console.log('Keys of first provider:', Object.keys(providers[0]));
      console.log('First provider details:', JSON.stringify(providers[0], null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

run();
