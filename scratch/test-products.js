const https = require('https');

https.get('https://catalog.loka.media/api/products', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('Total products:', response.length);
      const items = response.products || response.data || response;
      if (Array.isArray(items)) {
        items.slice(0, 5).forEach(p => {
          console.log(`\nProduct ID: ${p.id}`);
          console.log(`Name: ${p.name}`);
          console.log(`Thumbnail URL (${typeof p.thumbnail_url}):`, p.thumbnail_url);
          console.log(`Images (${typeof p.images}):`, p.images);
        });
      } else {
        console.log('Unexpected response format:', Object.keys(response));
      }
    } catch (err) {
      console.error('Error parsing response:', err.message);
    }
  });

}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
