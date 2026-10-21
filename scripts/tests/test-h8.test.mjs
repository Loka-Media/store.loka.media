import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateProxyUrl, isAllowedImageContentType, isPrivateOrLocalAddress } from '../../src/lib/proxySecurity.ts';

test('H8: isPrivateOrLocalAddress correctly flags private and loopback destinations', () => {
  assert.equal(isPrivateOrLocalAddress('localhost'), true);
  assert.equal(isPrivateOrLocalAddress('127.0.0.1'), true);
  assert.equal(isPrivateOrLocalAddress('169.254.169.254'), true);
  assert.equal(isPrivateOrLocalAddress('10.0.1.5'), true);
  assert.equal(isPrivateOrLocalAddress('172.20.0.1'), true);
  assert.equal(isPrivateOrLocalAddress('192.168.1.100'), true);
  assert.equal(isPrivateOrLocalAddress('0.0.0.0'), true);
  assert.equal(isPrivateOrLocalAddress('server.internal'), true);
  assert.equal(isPrivateOrLocalAddress('images.printify.com'), false);
  assert.equal(isPrivateOrLocalAddress('cdn.shopify.com'), false);
});

test('H8: validateProxyUrl blocks non-HTTPS and SSRF targets', () => {
  // Missing or malformed
  assert.equal(validateProxyUrl('').valid, false);
  assert.equal(validateProxyUrl('not a url').valid, false);

  // Non-HTTPS
  assert.equal(validateProxyUrl('http://images.printify.com/test.jpg').valid, false);
  assert.equal(validateProxyUrl('ftp://images.printify.com/test.jpg').valid, false);

  // SSRF attempts
  assert.equal(validateProxyUrl('https://localhost:3000/api/secret').valid, false);
  assert.equal(validateProxyUrl('https://127.0.0.1:8080/admin').valid, false);
  assert.equal(validateProxyUrl('https://169.254.169.254/latest/meta-data').valid, false);
  assert.equal(validateProxyUrl('https://10.0.0.5/internal').valid, false);
  assert.equal(validateProxyUrl('https://192.168.1.1/router').valid, false);

  // Unapproved third-party domains
  assert.equal(validateProxyUrl('https://evil-hacker.com/malware.exe').valid, false);
  assert.equal(validateProxyUrl('https://pastebin.com/raw/123').valid, false);
});

test('H8: validateProxyUrl accepts authorized media domains', () => {
  const allowed = [
    'https://images.printify.com/mockup.png',
    'https://files.cdn.printful.com/upload.png',
    'https://cdn.shopify.com/s/files/1.jpg',
    'https://allbuckets-1754371568222.nyc3.digitaloceanspaces.com/creator/file.png',
    'https://pf-images-production.s3.amazonaws.com/image.jpg',
    'https://images.unsplash.com/photo-123'
  ];

  for (const url of allowed) {
    const result = validateProxyUrl(url);
    assert.equal(result.valid, true, `Expected valid for: ${url}`);
  }
});

test('H8: isAllowedImageContentType allows image media and blocks HTML/scripts', () => {
  assert.equal(isAllowedImageContentType('image/png'), true);
  assert.equal(isAllowedImageContentType('image/jpeg'), true);
  assert.equal(isAllowedImageContentType('image/webp; charset=binary'), true);
  assert.equal(isAllowedImageContentType('image/svg+xml'), true);

  // Dangerous / non-image types
  assert.equal(isAllowedImageContentType('text/html'), false);
  assert.equal(isAllowedImageContentType('application/javascript'), false);
  assert.equal(isAllowedImageContentType('text/javascript'), false);
  assert.equal(isAllowedImageContentType('application/octet-stream'), false);
  assert.equal(isAllowedImageContentType(null), false);
});
