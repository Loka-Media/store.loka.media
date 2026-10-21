import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

process.env.JWT_SECRET = 'mock_super_secret_jwt_key_for_unit_tests_only';
process.env.ADMIN_JWT_SECRET = 'mock_super_secret_admin_jwt_key_for_unit_tests_only';
process.env.NODE_ENV = 'test';

import { verifyJwtToken, requireAdminAuth, requireAuth } from '../../src/lib/serverAuth.ts';

function createMockToken(payload, secret = process.env.JWT_SECRET) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

test('Batch 2: verifyJwtToken verifies valid signature and catches forged tokens', () => {
  const validToken = createMockToken({ id: 10, email: 'creator@example.com', role: 'creator', exp: Math.floor(Date.now() / 1000) + 3600 });
  const verified = verifyJwtToken(validToken);
  assert.equal(verified.valid, true);
  assert.equal(verified.payload.id, 10);
  assert.equal(verified.payload.role, 'creator');

  // Forged token signed with wrong secret
  const forgedToken = createMockToken({ id: 10, email: 'creator@example.com', role: 'creator' }, 'wrong_secret');
  assert.equal(verifyJwtToken(forgedToken).valid, false);

  // Expired token
  const expiredToken = createMockToken({ id: 10, exp: Math.floor(Date.now() / 1000) - 100 });
  assert.equal(verifyJwtToken(expiredToken).valid, false);
});

test('Batch 2: requireAdminAuth blocks unauthenticated and non-admin users', async () => {
  // 1. Missing token
  const reqNoAuth = new Request('https://store.loka.media/api/printify/orders');
  const resNoAuth = await requireAdminAuth(reqNoAuth);
  assert.equal(resNoAuth.authorized, false);
  assert.equal(resNoAuth.response.status, 401);

  // 2. Creator attempting admin route
  const creatorToken = createMockToken({ id: 5, email: 'creator@test.com', role: 'creator', exp: Math.floor(Date.now() / 1000) + 3600 });
  const reqCreator = new Request('https://store.loka.media/api/printify/orders', {
    headers: { Authorization: `Bearer ${creatorToken}` }
  });
  const resCreator = await requireAdminAuth(reqCreator);
  assert.equal(resCreator.authorized, false);
  assert.equal(resCreator.response.status, 403);

  // 3. Admin user
  const adminToken = createMockToken({ id: 1, email: 'admin@test.com', role: 'admin', exp: Math.floor(Date.now() / 1000) + 3600 });
  const reqAdmin = new Request('https://store.loka.media/api/printify/orders', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const resAdmin = await requireAdminAuth(reqAdmin);
  assert.equal(resAdmin.authorized, true);
  assert.equal(resAdmin.user.role, 'admin');
});

test('Batch 2: requireAuth extracts verified user identity without trusting query/headers', async () => {
  const userToken = createMockToken({ id: 42, email: 'user42@test.com', role: 'creator', exp: Math.floor(Date.now() / 1000) + 3600 });
  
  // Attacker sends token for user 42 but tries to spoof user 1 via header/query
  const spoofReq = new Request('https://store.loka.media/api/creator/payout/bank-details?userId=1', {
    headers: {
      Authorization: `Bearer ${userToken}`,
      'x-user-id': '1',
      'x-user-email': 'admin@test.com'
    }
  });

  const authResult = await requireAuth(spoofReq);
  assert.equal(authResult.authorized, true);
  // Verified user MUST remain 42 from the cryptographic token
  assert.equal(authResult.user.id, 42);
  assert.equal(authResult.user.email, 'user42@test.com');
});
