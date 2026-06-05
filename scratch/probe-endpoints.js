const https = require('https');

const BASE_URL = 'https://catalog.loka.media';

const endpoints = [
  { method: 'GET', path: '/api/printify/products' },
  { method: 'GET', path: '/api/printify/catalog' },
  { method: 'POST', path: '/api/printify/uploads' },
  { method: 'POST', path: '/api/printify/orders' },
  { method: 'POST', path: '/api/printify/shipping' },
  { method: 'POST', path: '/api/printify/mockups' },
  { method: 'GET', path: '/api/printify/sync' },
  { method: 'POST', path: '/api/printify/sync' },
  { method: 'POST', path: '/api/printify/sync/bulk' },
];

function request(method, path) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          method,
          path,
          status: res.statusCode,
          body: data.substring(0, 200)
        });
      });
    });
    req.on('error', (err) => {
      resolve({
        method,
        path,
        error: err.message
      });
    });
    if (method === 'POST') {
      req.write(JSON.stringify({}));
    }
    req.end();
  });
}

async function run() {
  console.log(`Probing backend: ${BASE_URL}...`);
  for (const ep of endpoints) {
    const res = await request(ep.method, ep.path);
    console.log(`[${res.method}] ${res.path} => Status: ${res.status} | Body: ${res.body}`);
  }
}

run();
