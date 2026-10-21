import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}

process.env.JWT_SECRET = 'mock_super_secret_jwt_key_for_unit_tests_only';
process.env.ADMIN_JWT_SECRET = 'mock_super_secret_admin_jwt_key_for_unit_tests_only';
process.env.NODE_ENV = 'test';

import { GET, POST, DELETE } from '../../src/app/api/creator/artworks/route.ts';

function createMockToken(payload, secret = process.env.JWT_SECRET) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

test('Creator Artworks API: Unauthenticated requests are rejected', async () => {
  const req = new Request('https://store.loka.media/api/creator/artworks');
  const res = await GET(req);
  assert.equal(res.status, 401);
});

test('Creator Artworks API: Saves, retrieves, and enforces strict user isolation in DB', async () => {
  const user1Token = createMockToken({ id: 991, email: 'user991@example.com', role: 'creator', exp: Math.floor(Date.now() / 1000) + 3600 });
  const user2Token = createMockToken({ id: 992, email: 'user992@example.com', role: 'creator', exp: Math.floor(Date.now() / 1000) + 3600 });

  const testFileId = `test_file_${Date.now()}`;

  // 1. User 1 uploads artwork
  const postReq = new Request('https://store.loka.media/api/creator/artworks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${user1Token}`,
    },
    body: JSON.stringify({
      printify_file_id: testFileId,
      file_url: 'https://images.example.com/user1_artwork.png',
      thumbnail_url: 'https://images.example.com/user1_artwork_thumb.png',
      filename: 'my_special_design.png',
      width: 3000,
      height: 3000,
    }),
  });

  const postRes = await POST(postReq);
  assert.equal(postRes.status, 201);
  const postJson = await postRes.json();
  assert.equal(postJson.success, true);
  assert.equal(postJson.data.printify_file_id, testFileId);
  assert.equal(postJson.data.userId, 991);

  // 2. User 1 gets artworks -> MUST contain the uploaded artwork
  const getReq1 = new Request('https://store.loka.media/api/creator/artworks', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const getRes1 = await GET(getReq1);
  assert.equal(getRes1.status, 200);
  const getJson1 = await getRes1.json();
  assert.equal(getJson1.success, true);
  const foundUser1 = getJson1.data.some((f) => f.printify_file_id === testFileId);
  assert.equal(foundUser1, true);

  // 3. User 2 gets artworks -> MUST NOT contain User 1's artwork! (STRICT PRIVACY)
  const getReq2 = new Request('https://store.loka.media/api/creator/artworks', {
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  const getRes2 = await GET(getReq2);
  assert.equal(getRes2.status, 200);
  const getJson2 = await getRes2.json();
  assert.equal(getJson2.success, true);
  const foundInUser2 = getJson2.data.some((f) => f.printify_file_id === testFileId);
  assert.equal(foundInUser2, false, 'User 2 should NOT see User 1 artwork');

  // 4. User 2 tries to delete User 1's artwork -> MUST FAIL (404/unauthorized)
  const deleteReqUser2 = new Request(`https://store.loka.media/api/creator/artworks?id=${testFileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${user2Token}` },
  });
  const deleteResUser2 = await DELETE(deleteReqUser2);
  assert.equal(deleteResUser2.status, 404);

  // 5. User 1 manually deletes their own artwork -> MUST SUCCEED
  const deleteReqUser1 = new Request(`https://store.loka.media/api/creator/artworks?id=${testFileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const deleteResUser1 = await DELETE(deleteReqUser1);
  assert.equal(deleteResUser1.status, 200);

  // 6. Artwork should now be gone from User 1's library
  const getReqAfterDelete = new Request('https://store.loka.media/api/creator/artworks', {
    headers: { Authorization: `Bearer ${user1Token}` },
  });
  const getResAfterDelete = await GET(getReqAfterDelete);
  const getJsonAfterDelete = await getResAfterDelete.json();
  const stillExists = getJsonAfterDelete.data.some((f) => f.printify_file_id === testFileId);
  assert.equal(stillExists, false, 'Artwork should be deleted');
});
