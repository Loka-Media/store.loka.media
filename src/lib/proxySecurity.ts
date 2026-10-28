/**
 * Security controls for URL proxies (Image Proxy and Download Routes)
 * Prevents SSRF (Server-Side Request Forgery), private network probing,
 * and same-origin content-type injection / XSS.
 */

const TRUSTED_DOMAINS = new Set([
  'files.cdn.printful.com',
  'printful-upload.s3-accelerate.amazonaws.com',
  'images.pexels.com',
  'images.unsplash.com',
  'via.placeholder.com',
  'picsum.photos',
  'cdn.pixabay.com',
  'source.unsplash.com',
  'img.freepik.com',
  'images.stockvault.net',
  'burst.shopifycdn.com',
  'cdn.shopify.com',
  'images.printify.com',
  'images-api.printify.com',
  'mockup-api.printify.com',
  'pf-images-production.s3.amazonaws.com',
  'pfy-prod-image-storage.s3.us-east-2.amazonaws.com',
  // Cloudflare R2 public bucket (exact host only: anyone can create *.r2.dev buckets)
  'pub-774054799d404a649de54be9ae81a7bd.r2.dev',
]);

const TRUSTED_DOMAIN_SUFFIXES = [
  '.digitaloceanspaces.com',
  '.amazonaws.com',
  '.shopifycdn.com',
  '.shopify.com',
  '.printify.com',
  '.loka.media',
];

export function isPrivateOrLocalAddress(hostname: string): boolean {
  const lower = hostname.toLowerCase().trim();
  if (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '0.0.0.0' ||
    lower === '::1' ||
    lower === '169.254.169.254' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.localhost')
  ) {
    return true;
  }

  // IPv4 private & link-local ranges
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = lower.match(ipv4Regex);
  if (match) {
    const o1 = Number(match[1]);
    const o2 = Number(match[2]);
    if (o1 === 10) return true;
    if (o1 === 127) return true;
    if (o1 === 169 && o2 === 254) return true;
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true;
    if (o1 === 192 && o2 === 168) return true;
    if (o1 === 0) return true;
  }

  return false;
}

export function validateProxyUrl(rawUrl: string | null): {
  valid: boolean;
  error?: string;
  parsedUrl?: URL;
} {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, error: 'Missing or invalid URL parameter.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { valid: false, error: 'Malformed URL provided.' };
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Only HTTPS URLs are permitted.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  if (isPrivateOrLocalAddress(hostname)) {
    return { valid: false, error: 'Access to local or private network destinations is forbidden.' };
  }

  const isExplicitlyAllowed = TRUSTED_DOMAINS.has(hostname);
  const matchesSuffix = TRUSTED_DOMAIN_SUFFIXES.some(suffix => hostname.endsWith(suffix));

  if (!isExplicitlyAllowed && !matchesSuffix) {
    return { valid: false, error: `Domain '${hostname}' is not authorized for proxying.` };
  }

  return { valid: true, parsedUrl: parsed };
}

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
  'image/x-icon',
]);

export function isAllowedImageContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  const mime = contentType.split(';')[0].trim().toLowerCase();
  return ALLOWED_IMAGE_TYPES.has(mime);
}

/**
 * Extract client IP from incoming request headers (X-Forwarded-For, X-Real-IP, etc.)
 */
export function getClientIp(request: Request | any): string {
  const forwardedFor = typeof request.headers?.get === 'function'
    ? request.headers.get('x-forwarded-for')
    : request.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.split(',');
    return ips[0].trim();
  }
  const realIp = typeof request.headers?.get === 'function'
    ? request.headers.get('x-real-ip')
    : request.headers?.['x-real-ip'];
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Returns forwarding headers including X-Forwarded-For to preserve client IP for rate limiting
 */
export function forwardClientHeaders(request: Request | any, extraHeaders: Record<string, string> = {}): Record<string, string> {
  const clientIp = getClientIp(request);
  const headers: Record<string, string> = {
    'X-Forwarded-For': clientIp,
    'X-Real-IP': clientIp,
    ...extraHeaders
  };
  return headers;
}

