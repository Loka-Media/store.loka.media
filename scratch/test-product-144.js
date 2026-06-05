const https = require('https');

https.get('https://catalog.loka.media/api/products/144', (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const product = JSON.parse(data);
      console.log('Product ID:', product.id);
      console.log('Variants count:', product.variants?.length);
      if (product.variants?.length > 0) {
        console.log('Variant 1 image_url:', product.variants[0].image_url);
        console.log('Variant 1 printify_variant_id:', product.variants[0].printify_variant_id);
      }
      console.log('Source:', product.source);
      console.log('Printify Product ID (maybe stored somewhere?):', product.printify_product_id);
    } catch (err) {
      console.error('Error parsing response:', err.message);
    }
  });

}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
