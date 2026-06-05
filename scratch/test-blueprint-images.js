const fs = require('fs');
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
  const blueprintId = 5; // Let's test with blueprint 5 or 706
  try {
    const response = await fetch(`${PRINTIFY_BASE_URL}/catalog/blueprints/${blueprintId}.json`, {
      headers: { 'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}` }
    });
    const bp = await response.json();
    console.log('Blueprint keys:', Object.keys(bp));
    console.log('Blueprint images:', bp.images);
  } catch (err) {
    console.error(err);
  }
}

run();
