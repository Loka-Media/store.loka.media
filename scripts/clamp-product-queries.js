const fs = require('fs');
const path = require('path');
const apiDir = path.resolve('../store-api.loka.media');

const pqPath = path.join(apiDir, 'src/queries/productQueries.js');
let code = fs.readFileSync(pqPath, 'utf8');
const isCrlf = code.includes('\r\n');
const normalized = code.replace(/\r\n/g, '\n');

const target = `    paramCount++;
    const limitParam = \`$\${paramCount}\`;
    mainQueryParams.push(parseInt(limit));

    paramCount++;
    const offsetParam = \`$\${paramCount}\`;
    mainQueryParams.push(parseInt(offset));`;

const replacement = `    paramCount++;
    const limitParam = \`$\${paramCount}\`;
    // M2: Clamp pagination limit between 1 and 100
    mainQueryParams.push(Math.min(Math.max(parseInt(limit) || 20, 1), 100));

    paramCount++;
    const offsetParam = \`$\${paramCount}\`;
    // M3: Validate and floor offset to >= 0
    mainQueryParams.push(Math.max(parseInt(offset) || 0, 0));`;

if (normalized.includes(target)) {
  const replaced = normalized.replace(target, replacement);
  fs.writeFileSync(pqPath, isCrlf ? replaced.replace(/\n/g, '\r\n') : replaced, 'utf8');
  console.log('✅ Clamped limit and offset in productQueries.js');
} else {
  console.log('ℹ️ Target block not found in productQueries.js');
}
