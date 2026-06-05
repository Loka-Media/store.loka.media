async function checkEndpoint(path) {
  const url = `https://catalog.loka.media${path}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    console.log(`Endpoint: ${path} -> Status: ${res.status} ${res.statusText}`);
  } catch (err) {
    console.log(`Endpoint: ${path} -> Error: ${err.message}`);
  }
}

async function run() {
  await checkEndpoint('/api/printful/mockups/store-permanently');
  await checkEndpoint('/api/printify/sync/bulk');
  await checkEndpoint('/api/printify/sync/product');
}

run();
