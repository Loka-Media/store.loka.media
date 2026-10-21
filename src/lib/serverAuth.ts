import { NextRequest, NextResponse } from 'next/server.js';
import crypto from 'crypto';
async function executeUserQuery(text: string, params?: any[]): Promise<any[] | null> {
  try {
    // Dynamically load to support both Next.js bundler and native Node test runners
    const dbMod = await import('@/lib/db').catch(async () => {
      const fallback = './db.ts';
      return await import(fallback);
    }).catch(() => null);
    if (dbMod && typeof dbMod.queryDb === 'function') {
      return await dbMod.queryDb(text, params);
    }
  } catch {
    // Database unreachable or test environment without DB
  }
  return null;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  name?: string;
}

export function verifyJwtToken(token: string): {
  valid: boolean;
  payload?: any;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token structure' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  // Retrieve JWT secrets from environment
  const secrets = [
    process.env.JWT_SECRET,
    process.env.ADMIN_JWT_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim().length > 0));

  if (secrets.length === 0) {
    console.error('[ServerAuth] Fatal: No JWT_SECRET configured on server');
    return { valid: false, error: 'Server authentication misconfiguration' };
  }

  const normalizedProvidedSig = signatureB64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  let signatureValid = false;
  for (const secret of secrets) {
    try {
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url');

      if (
        expectedSig.length === normalizedProvidedSig.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(normalizedProvidedSig))
      ) {
        signatureValid = true;
        break;
      }
    } catch {
      // Continue trying next secret if available
    }
  }

  if (!signatureValid) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { valid: false, error: 'Token has expired' };
    }
    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Invalid token payload' };
  }
}

export function extractTokenFromRequest(request: Request | NextRequest): string | null {
  // 1. Authorization header: "Bearer <token>"
  const authHeader = request.headers.get('authorization');
  if (authHeader && /^Bearer\s+/i.test(authHeader)) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token) return token;
  }

  // 2. Cookie: accessToken or token
  if ('cookies' in request && typeof (request as any).cookies?.get === 'function') {
    const cookieVal =
      (request as NextRequest).cookies.get('accessToken')?.value ||
      (request as NextRequest).cookies.get('token')?.value;
    if (cookieVal) return cookieVal.trim();
  } else {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(/(?:^|;\s*)(?:accessToken|token)=([^;]+)/);
    if (match && match[1]) return decodeURIComponent(match[1].trim());
  }

  return null;
}

// Short-lived in-memory cache for verified tokens (TTL: 60s) to maximize throughput and avoid repeated round-trips
const verifiedTokenCache = new Map<string, { user: AuthenticatedUser; expiresAt: number }>();

function getCachedVerifiedUser(token: string): AuthenticatedUser | null {
  const cached = verifiedTokenCache.get(token);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    verifiedTokenCache.delete(token);
    return null;
  }
  return cached.user;
}

function setCachedVerifiedUser(token: string, user: AuthenticatedUser) {
  if (verifiedTokenCache.size > 1000) {
    const oldestKey = verifiedTokenCache.keys().next().value;
    if (oldestKey) verifiedTokenCache.delete(oldestKey);
  }
  verifiedTokenCache.set(token, { user, expiresAt: Date.now() + 60 * 1000 });
}

export async function resolveAuthenticatedUser(
  request: Request | NextRequest
): Promise<{ user: AuthenticatedUser | null; error?: string }> {
  const token = extractTokenFromRequest(request);
  if (!token) {
    return { user: null, error: 'Authorization token required' };
  }

  // 1. Fast path: check in-memory verified cache
  const cached = getCachedVerifiedUser(token);
  if (cached) {
    return { user: cached };
  }

  // 2. Try local cryptographic verification
  const { valid, payload, error } = verifyJwtToken(token);
  if (valid && payload) {
    const userId = Number(payload.id || payload.userId);
    const payloadRole = payload.role || (payload.isAdmin ? 'admin' : undefined);
    const payloadEmail = payload.email;

    if (userId && !isNaN(userId)) {
      try {
        const rows = await executeUserQuery(
          'SELECT id, email, role, name, is_active FROM users WHERE id = $1 LIMIT 1',
          [userId]
        );

        if (rows && rows.length > 0) {
          const dbUser = rows[0];
          if (dbUser.is_active === false) {
            return { user: null, error: 'Account is deactivated' };
          }
          const userObj: AuthenticatedUser = {
            id: Number(dbUser.id),
            email: String(dbUser.email).toLowerCase().trim(),
            role: String(dbUser.role).toLowerCase().trim(),
            name: dbUser.name,
          };
          setCachedVerifiedUser(token, userObj);
          return { user: userObj };
        }
      } catch (dbErr) {
        console.warn('[ServerAuth] DB user verification fallback to token claims:', dbErr);
      }
    }

    // Fallback to token claims if DB query fails or table is unreachable
    if (userId && payloadEmail && payloadRole) {
      const userObj: AuthenticatedUser = {
        id: userId,
        email: String(payloadEmail).toLowerCase().trim(),
        role: String(payloadRole).toLowerCase().trim(),
        name: payload.name,
      };
      setCachedVerifiedUser(token, userObj);
      return { user: userObj };
    }
  }

  // 3. Upstream Fallback: If local HMAC failed or user not in local database (e.g. backend auth catalog.loka.media)
  // Skip this during unit tests (NODE_ENV === 'test') to keep tests offline and fast
  if (process.env.NODE_ENV !== 'test') {
    try {
      const backendUrl = (process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const meRes = await fetch(`${backendUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Origin': 'https://store-loka-ui-v2-glksz.ondigitalocean.app',
          'Referer': 'https://store-loka-ui-v2-glksz.ondigitalocean.app/',
        },
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData && meData.user) {
          const userObj: AuthenticatedUser = {
            id: Number(meData.user.id),
            email: String(meData.user.email || '').toLowerCase().trim(),
            role: String(meData.user.role || '').toLowerCase().trim(),
            name: meData.user.name,
          };
          setCachedVerifiedUser(token, userObj);
          return { user: userObj };
        }
      }
    } catch (backendErr) {
      console.warn('[ServerAuth] Upstream backend auth verification fallback failed:', backendErr);
    }
  }

  return { user: null, error: error || 'User could not be validated' };
}

export async function requireAuth(
  request: Request | NextRequest
): Promise<
  | { authorized: true; user: AuthenticatedUser }
  | { authorized: false; response: NextResponse }
> {
  const { user, error } = await resolveAuthenticatedUser(request);
  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: error || 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true, user };
}

export async function requireAdminAuth(
  request: Request | NextRequest
): Promise<
  | { authorized: true; user: AuthenticatedUser }
  | { authorized: false; response: NextResponse }
> {
  const authResult = await requireAuth(request);
  if (!authResult.authorized) {
    return authResult;
  }

  if (authResult.user.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}

export async function requireCreatorOrAdminAuth(
  request: Request | NextRequest
): Promise<
  | { authorized: true; user: AuthenticatedUser }
  | { authorized: false; response: NextResponse }
> {
  const authResult = await requireAuth(request);
  if (!authResult.authorized) {
    return authResult;
  }

  if (authResult.user.role !== 'creator' && authResult.user.role !== 'admin') {
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Forbidden: Creator or Admin access required' },
        { status: 403 }
      ),
    };
  }

  return authResult;
}
