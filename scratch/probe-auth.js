const https = require('https');

const BASE_URL = 'https://catalog.loka.media';

const loginPaths = [
  { path: '/api/auth/local', body: { identifier: 'vaishnaniharsh8@gmail.com', password: 'OnzrmbwVpJGzuA4' } },
  { path: '/api/auth/login', body: { email: 'vaishnaniharsh8@gmail.com', password: 'OnzrmbwVpJGzuA4' } },
];

function post(path, body) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${path}`;
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          path,
          status: res.statusCode,
          body: data
        });
      });
    });
    req.on('error', (err) => {
      resolve({
        path,
        error: err.message
      });
    });
    req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  for (const lp of loginPaths) {
    const res = await post(lp.path, lp.body);
    console.log(`[POST] ${lp.path} => Status: ${res.status} | Body: ${res.body}`);
  }
}

run();
