import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// Set safe mock test environment variables before requiring any modules
process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/isolated_test_db';
process.env.NODE_ENV = 'test';

const require = createRequire(import.meta.url);
const { sanitizeProductSort, ALLOWED_SORT_COLUMNS } = require('../../../store-api.loka.media/src/queries/productQueries.js');

test('C16: sanitizeProductSort defaults safely when given undefined or empty values', () => {
  const result = sanitizeProductSort();
  assert.equal(result.sortColumn, 'p.created_at');
  assert.equal(result.sortOrder, 'DESC');
});

test('C16: sanitizeProductSort accepts valid allowlisted columns and directions', () => {
  const res1 = sanitizeProductSort('name', 'ASC');
  assert.equal(res1.sortColumn, 'p.name');
  assert.equal(res1.sortOrder, 'ASC');

  const res2 = sanitizeProductSort('base_price', 'asc');
  assert.equal(res2.sortColumn, 'p.base_price');
  assert.equal(res2.sortOrder, 'ASC');

  const res3 = sanitizeProductSort('price', 'DESC');
  assert.equal(res3.sortColumn, 'p.base_price');
  assert.equal(res3.sortOrder, 'DESC');

  const res4 = sanitizeProductSort('id', 'asc');
  assert.equal(res4.sortColumn, 'p.id');
  assert.equal(res4.sortOrder, 'ASC');
});

test('C16: sanitizeProductSort neutralizes SQL injection attempts', () => {
  const injections = [
    'id; DROP TABLE users; --',
    'id UNION SELECT * FROM users',
    'created_at; SLEEP(5);',
    "' OR 1=1 --",
    '1; SELECT pg_sleep(10);',
    'p.created_at', // Should not allow prefix injection
    'invalid_column_name'
  ];

  for (const malicious of injections) {
    const result = sanitizeProductSort(malicious, 'DESC');
    assert.equal(result.sortColumn, 'p.created_at', `Expected fallback to p.created_at for: ${malicious}`);
    assert.equal(result.sortOrder, 'DESC');
  }

  // Direction injection
  const maliciousDirections = [
    'DESC; DROP TABLE products; --',
    'ASC, p.id DESC',
    'invalid_dir'
  ];

  for (const badDir of maliciousDirections) {
    const result = sanitizeProductSort('name', badDir);
    assert.equal(result.sortColumn, 'p.name');
    assert.equal(result.sortOrder, 'DESC', `Expected fallback to DESC for: ${badDir}`);
  }
});
