const fs = require('fs');
const path = require('path');

const images12 = [
  'https://images.printify.com/66d81b70295ea4f038065152',
  'https://images.printify.com/688c5bdea91db6d1610f6ca2',
  'https://images.printify.com/66d81b76953258e42905f422',
  'https://images.printify.com/66d81b7a0482d2ef57061f32',
  'https://images.printify.com/66d81b7f295ea4f038065153'
];

const images6 = [
  'https://images.printify.com/66d81786ae1f0775ec0aef82',
  'https://images.printify.com/688c5938e95f9e0cdf09c1b2',
  'https://images.printify.com/68f726b037c7b1aa670b6042',
  'https://images.printify.com/68fb541f75b5c5b373082372',
  'https://images.printify.com/66d817a1ae1f0775ec0aef83'
];

const artifactDir = "C:\\Users\\harsh vaishnani\\.gemini\\antigravity-ide\\brain\\917967e3-0c43-44e3-97e4-566b5d2f8d06";

async function download(url, filename) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to download: ' + url);
  const buffer = await res.arrayBuffer();
  const filePath = path.join(artifactDir, filename);
  fs.writeFileSync(filePath, Buffer.from(buffer));
  console.log(`Saved ${filename}`);
}

async function run() {
  for (let i = 0; i < images12.length; i++) {
    await download(images12[i], `bp12_img${i}.jpg`);
  }
  for (let i = 0; i < images6.length; i++) {
    await download(images6[i], `bp6_img${i}.jpg`);
  }
}

run().catch(console.error);
