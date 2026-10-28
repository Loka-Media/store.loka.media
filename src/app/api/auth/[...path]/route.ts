import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { sendOtpEmail } from '@/lib/email';

const BACKEND_URL = (process.env.BACKEND_URL || 'https://catalog.loka.media').replace(/\/$/, '');
const ALLOWED_ORIGIN = 'https://store-loka-ui-v2-glksz.ondigitalocean.app';

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const targetPath = path ? path.join('/') : '';
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api/auth/${targetPath}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    'Origin': ALLOWED_ORIGIN,
    'Referer': `${ALLOWED_ORIGIN}/`,
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const authorization = request.headers.get('authorization');
  if (authorization) {
    headers['Authorization'] = authorization;
  }
  const cookie = request.headers.get('cookie');
  if (cookie) {
    headers['Cookie'] = cookie;
  }

  let body: BodyInit | null = null;
  let parsedPayload: any = null;
  let incomingCreatorUrl: string | null | undefined = undefined;

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const text = await request.text();
    if (text) {
      body = text;
      try {
        parsedPayload = JSON.parse(text);
      } catch {}

      // If updating profile via PUT /api/auth/me, inspect and extract creatorUrl
      if (targetPath === 'me' && request.method === 'PUT' && parsedPayload) {
        if (parsedPayload.creatorUrl !== undefined || parsedPayload.creator_url !== undefined) {
          incomingCreatorUrl = parsedPayload.creatorUrl !== undefined ? parsedPayload.creatorUrl : parsedPayload.creator_url;
        }
      }
    }
  }

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
    });

    const data = await response.text();
    const responseHeaders = new Headers();
    const resContentType = response.headers.get('content-type');
    if (resContentType) {
      responseHeaders.set('content-type', resContentType);
    }
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      responseHeaders.set('set-cookie', setCookie);
    }

    // Process GET /api/auth/me or POST /api/auth/login or PUT /api/auth/me to enrich and persist creator_url
    if (response.ok && (targetPath === 'me' || targetPath === 'login')) {
      try {
        const json = JSON.parse(data);
        if (json && json.user) {
          const userId = json.user.id;
          const userEmail = json.user.email;

          // If PUT /api/auth/me with creator_url, persist to database
          if (targetPath === 'me' && request.method === 'PUT' && incomingCreatorUrl !== undefined) {
            const cleanUrl = incomingCreatorUrl ? String(incomingCreatorUrl).trim() : null;
            try {
              if (userId || userEmail) {
                await queryDb(
                  `UPDATE users SET creator_url = $1, updated_at = NOW() WHERE id = $2 OR email = $3`,
                  [cleanUrl, userId || 0, userEmail || '']
                );
                await queryDb(
                  `UPDATE creator_requests SET creator_url = $1, updated_at = NOW() WHERE user_id = $2 OR email = $3`,
                  [cleanUrl, userId || 0, userEmail || '']
                );
              }
            } catch (updateErr) {
              console.error('[Auth Proxy] Error updating creator_url in DB:', updateErr);
            }
            json.user.creator_url = cleanUrl;
            json.user.creatorUrl = cleanUrl;
          } else {
            // For GET /api/auth/me or login, load creator_url from DB if not already present
            let creatorUrl = json.user.creator_url || json.user.creatorUrl;
            if (!creatorUrl && (userId || userEmail)) {
              try {
                if (userId) {
                  const userRows = await queryDb<any>(
                    `SELECT creator_url FROM users WHERE id = $1 LIMIT 1`,
                    [userId]
                  );
                  creatorUrl = userRows[0]?.creator_url;
                }
                if (!creatorUrl && (userId || userEmail)) {
                  const crRows = await queryDb<any>(
                    `SELECT creator_url FROM creator_requests WHERE (user_id = $1 OR email = $2) AND creator_url IS NOT NULL AND creator_url != '' ORDER BY id DESC LIMIT 1`,
                    [userId || 0, userEmail || '']
                  );
                  creatorUrl = crRows[0]?.creator_url;
                }
              } catch (dbErr) {
                console.error('[Auth Proxy] Error fetching creator_url from DB:', dbErr);
              }
            }
            if (creatorUrl) {
              json.user.creator_url = creatorUrl;
              json.user.creatorUrl = creatorUrl;
            }
          }

          return NextResponse.json(json, {
            status: response.status,
            headers: responseHeaders,
          });
        }
      } catch {
        // Fall back to raw text response if JSON parse fails
      }
    }

    // Process OTP dispatch for forgot-password, resend-otp, and register
    if (request.method === 'POST') {
      if (targetPath === 'forgot-password') {
        const userEmail = parsedPayload?.email ? String(parsedPayload.email).trim().toLowerCase() : '';
        if (userEmail) {
          try {
            // Check if user exists in database
            const userRows = await queryDb<any>(
              `SELECT name FROM users WHERE LOWER(email) = $1 LIMIT 1`,
              [userEmail]
            );

            // Fetch the latest active OTP from database (created by backend)
            let otpRows = await queryDb<any>(
              `SELECT otp FROM otps WHERE LOWER(email) = $1 AND is_used = false AND expires_at > NOW() ORDER BY id DESC LIMIT 1`,
              [userEmail]
            );

            let otp = otpRows[0]?.otp;
            // Fallback: If backend didn't generate one, generate and insert it
            if (!otp && userRows.length > 0) {
              otp = Math.floor(100000 + Math.random() * 900000).toString();
              await queryDb(
                `INSERT INTO otps (email, otp, expires_at, is_used, created_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes', false, NOW())`,
                [userEmail, otp]
              );
            }

            if (otp) {
              const recipientName = userRows[0]?.name;
              await sendOtpEmail({
                to: userEmail,
                name: recipientName,
                otp,
                type: 'password_reset',
              });
            }

            // Always ensure client gets success response if we have handled/generated OTP
            if (!response.ok && userRows.length > 0) {
              return NextResponse.json(
                { message: 'Password reset OTP sent to your email', email: userEmail },
                { status: 200, headers: responseHeaders }
              );
            }
          } catch (otpErr) {
            console.error('[Auth Proxy] Error handling forgot-password OTP email:', otpErr);
          }
        }
      } else if (targetPath === 'resend-otp') {
        const userEmail = parsedPayload?.email ? String(parsedPayload.email).trim().toLowerCase() : '';
        if (userEmail) {
          try {
            let otpRows = await queryDb<any>(
              `SELECT otp FROM otps WHERE LOWER(email) = $1 AND is_used = false AND expires_at > NOW() ORDER BY id DESC LIMIT 1`,
              [userEmail]
            );

            let otp = otpRows[0]?.otp;
            if (!otp) {
              otp = Math.floor(100000 + Math.random() * 900000).toString();
              await queryDb(
                `INSERT INTO otps (email, otp, expires_at, is_used, created_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes', false, NOW())`,
                [userEmail, otp]
              );
            }

            const userRows = await queryDb<any>(
              `SELECT name FROM users WHERE LOWER(email) = $1 LIMIT 1`,
              [userEmail]
            );
            const recipientName = userRows[0]?.name;

            await sendOtpEmail({
              to: userEmail,
              name: recipientName,
              otp,
              type: 'email_verification',
            });
          } catch (otpErr) {
            console.error('[Auth Proxy] Error handling resend-otp email:', otpErr);
          }
        }
      } else if (targetPath === 'register' && response.ok) {
        const userEmail = parsedPayload?.email ? String(parsedPayload.email).trim().toLowerCase() : '';
        const userName = parsedPayload?.name || '';
        if (userEmail) {
          try {
            let otpRows = await queryDb<any>(
              `SELECT otp FROM otps WHERE LOWER(email) = $1 AND is_used = false AND expires_at > NOW() ORDER BY id DESC LIMIT 1`,
              [userEmail]
            );

            let otp = otpRows[0]?.otp;
            if (!otp) {
              otp = Math.floor(100000 + Math.random() * 900000).toString();
              await queryDb(
                `INSERT INTO otps (email, otp, expires_at, is_used, created_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes', false, NOW())`,
                [userEmail, otp]
              );
            }

            await sendOtpEmail({
              to: userEmail,
              name: userName,
              otp,
              type: 'email_verification',
            });
          } catch (otpErr) {
            console.error('[Auth Proxy] Error handling register OTP email:', otpErr);
          }
        }
      }
    }

    return new NextResponse(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error('Auth proxy error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = async () => {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
