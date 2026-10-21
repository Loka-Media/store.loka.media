const fs = require('fs');
const path = require('path');
const apiDir = path.resolve('../store-api.loka.media');

function patchFile(relPath, transformFn) {
  const fullPath = path.join(apiDir, relPath);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const isCrlf = raw.includes('\r\n');
  const normalized = raw.replace(/\r\n/g, '\n');
  const transformed = transformFn(normalized);
  if (transformed !== normalized) {
    const finalContent = isCrlf ? transformed.replace(/\n/g, '\r\n') : transformed;
    fs.writeFileSync(fullPath, finalContent, 'utf8');
    console.log('✅ Patched', relPath);
  } else {
    console.log('ℹ️ Unchanged', relPath);
  }
}

// 1. webhookController.js:
patchFile('src/controllers/webhookController.js', (code) => {
  const target = `    const hash_equals = crypto.timingSafeEqual(
      Buffer.from(generated_hash, 'base64'),
      Buffer.from(hmac, 'base64')
    );`;

  const replacement = `    const calculatedBuf = Buffer.from(generated_hash, 'base64');
    const providedBuf = Buffer.from(hmac, 'base64');

    if (calculatedBuf.length !== providedBuf.length) {
      return res.status(401).json({ error: 'Webhook verification failed: Signature length mismatch' });
    }

    const hash_equals = crypto.timingSafeEqual(calculatedBuf, providedBuf);`;

  return code.includes(target) ? code.replace(target, replacement) : code;
});

// 2. database.js: ON DELETE CASCADE on financial ledger tables
patchFile('src/config/database.js', (code) => {
  let modified = code;
  modified = modified.replace(
    'wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,',
    'wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,'
  );
  modified = modified.replace(
    'wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,',
    'wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE RESTRICT,'
  );
  modified = modified.replace(
    'creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,',
    'creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,'
  );
  return modified;
});
