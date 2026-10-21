const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../store-api.loka.media/src/queries/productQueries.js');
let code = fs.readFileSync(targetFile, 'utf8');

const targetSnippet = "    const orderClause = `ORDER BY p.${sortBy} ${sortOrder}`;";

const replacementSnippet = `    const { sortColumn, sortOrder: validatedSortOrder } = sanitizeProductSort(sortBy, sortOrder);
    const orderClause = \`ORDER BY \${sortColumn} \${validatedSortOrder}\`;`;

if (!code.includes('function sanitizeProductSort') && !code.includes('const sanitizeProductSort')) {
  const helperCode = `const ALLOWED_SORT_COLUMNS = {
    created_at: 'p.created_at',
    base_price: 'p.base_price',
    price: 'p.base_price',
    name: 'p.name',
    id: 'p.id',
    updated_at: 'p.updated_at'
};

const sanitizeProductSort = (sortBy, sortOrder) => {
    const cleanSortBy = (sortBy || 'created_at').toString().toLowerCase().trim();
    const sortColumn = ALLOWED_SORT_COLUMNS[cleanSortBy] || 'p.created_at';
    const cleanSortOrder = (sortOrder || 'DESC').toString().toUpperCase().trim();
    const validatedSortOrder = cleanSortOrder === 'ASC' ? 'ASC' : 'DESC';
    return { sortColumn, sortOrder: validatedSortOrder };
};
`;

  // Insert helper after line 1: const { pool } = require('../config/database');
  code = code.replace("const { pool } = require('../config/database');", `const { pool } = require('../config/database');\n\n${helperCode}`);
}

if (code.includes(targetSnippet)) {
  code = code.replace(targetSnippet, replacementSnippet);
} else {
  console.error('Target snippet not found in productQueries.js');
  process.exit(1);
}

// Also export sanitizeProductSort in module.exports
if (code.includes('module.exports = {') && !code.includes('sanitizeProductSort,')) {
  code = code.replace('module.exports = {', 'module.exports = {\n  sanitizeProductSort,\n  ALLOWED_SORT_COLUMNS,');
}

fs.writeFileSync(targetFile, code, 'utf8');
console.log('Successfully patched productQueries.js with C16 fix');
