async function run() {
  const url = 'https://catalog.loka.media/api/products/141';
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
run();
