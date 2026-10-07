import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { queryDb } from '@/lib/db';

const BANK_DETAILS_FILE = path.join(process.cwd(), 'src/config/creator_bank_details_cache.json');

function loadBankDetailsStore(): Record<string, any> {
  try {
    if (fs.existsSync(BANK_DETAILS_FILE)) {
      const data = fs.readFileSync(BANK_DETAILS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      // Clean up legacy shared 'default' key if present
      if (parsed && parsed['default']) {
        delete parsed['default'];
        saveBankDetailsStore(parsed);
      }
      return parsed || {};
    }
  } catch (e) {
    console.error('Error reading bank details store:', e);
  }
  return {};
}

function saveBankDetailsStore(store: Record<string, any>) {
  try {
    const dir = path.dirname(BANK_DETAILS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BANK_DETAILS_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving bank details store:', e);
  }
}

function extractUserFromRequest(request: NextRequest, body?: any): { userId: number | null; userEmail: string | null; userKey: string | null } {
  let userId: number | null = null;
  let userEmail: string | null = null;

  // 1. Authorization header (Bearer JWT)
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        if (payload.id || payload.userId) userId = Number(payload.id || payload.userId);
        if (payload.email) userEmail = String(payload.email).toLowerCase().trim();
      }
    } catch {}
  }

  // 2. Cookies
  if (!userId && !userEmail) {
    const cookieToken = request.cookies.get('accessToken')?.value || request.cookies.get('token')?.value;
    if (cookieToken) {
      try {
        const parts = cookieToken.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload.id || payload.userId) userId = Number(payload.id || payload.userId);
          if (payload.email) userEmail = String(payload.email).toLowerCase().trim();
        }
      } catch {}
    }
  }

  // 3. Search query params
  if (!userId || !userEmail) {
    try {
      const { searchParams } = new URL(request.url);
      const qId = searchParams.get('userId') || searchParams.get('creatorId');
      if (qId && !userId) userId = Number(qId);
      const qEmail = searchParams.get('email');
      if (qEmail && !userEmail) userEmail = qEmail.toLowerCase().trim();
    } catch {}
  }

  // 4. Custom headers
  if (!userId) {
    const hId = request.headers.get('x-user-id');
    if (hId) userId = Number(hId);
  }
  if (!userEmail) {
    const hEmail = request.headers.get('x-user-email');
    if (hEmail) userEmail = hEmail.toLowerCase().trim();
  }

  // 5. Body parameters (for POST)
  if (body) {
    if ((body.user_id || body.userId) && !userId) {
      userId = Number(body.user_id || body.userId);
    }
    if ((body.user_email || body.account_holder_email) && !userEmail) {
      userEmail = String(body.user_email || body.account_holder_email).toLowerCase().trim();
    }
  }

  let userKey: string | null = null;
  if (userId) {
    userKey = `user_${userId}`;
  } else if (userEmail) {
    userKey = `email_${userEmail}`;
  }

  return { userId, userEmail, userKey };
}

// GET /api/creator/payout/bank-details
export async function GET(request: NextRequest) {
  try {
    const { userId, userEmail, userKey } = extractUserFromRequest(request);

    if (!userKey && !userId && !userEmail) {
      return NextResponse.json({ error: 'No authenticated user session found' }, { status: 404 });
    }

    // 1. Try DB lookup first
    try {
      let rows: any[] = [];
      if (userId) {
        rows = await queryDb<any>(
          'SELECT bank_details FROM creator_bank_details WHERE user_id = $1 LIMIT 1',
          [userId]
        );
      }
      if ((!rows || rows.length === 0) && userEmail) {
        rows = await queryDb<any>(
          'SELECT bank_details FROM creator_bank_details WHERE LOWER(user_email) = LOWER($1) LIMIT 1',
          [userEmail]
        );
      }
      if (rows && rows.length > 0 && rows[0]?.bank_details) {
        return NextResponse.json({
          success: true,
          data: rows[0].bank_details,
        });
      }
    } catch {
      // Table may not exist yet; will fall back to cache
    }

    // 2. Try User-Scoped File Cache
    const store = loadBankDetailsStore();
    const userData =
      (userId ? store[`user_${userId}`] : null) ||
      (userEmail ? store[`email_${userEmail}`] : null) ||
      (userKey ? store[userKey] : null);

    if (userData) {
      return NextResponse.json({
        success: true,
        data: userData,
      });
    }

    // User has not filled bank details yet -> Return 404 so UI remains clean
    return NextResponse.json({ error: 'No bank details found for this user' }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bank details' },
      { status: 500 }
    );
  }
}

// POST /api/creator/payout/bank-details
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, userKey } = extractUserFromRequest(request, body);

    if (!userKey && !userId && !userEmail) {
      return NextResponse.json({ error: 'User must be authenticated to save bank details' }, { status: 401 });
    }

    const bankDetails = {
      ...body,
      id: Date.now(),
      user_id: userId || body.user_id || undefined,
      user_email: userEmail || body.user_email || body.account_holder_email,
      created_at: body.created_at || new Date().toISOString(),
      verified_at: new Date().toISOString(),
    };

    // 1. Try saving to Database
    try {
      await queryDb(`
        CREATE TABLE IF NOT EXISTS creator_bank_details (
          id SERIAL PRIMARY KEY,
          user_id INT UNIQUE,
          user_email VARCHAR(255),
          bank_details JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      if (userId) {
        await queryDb(
          `INSERT INTO creator_bank_details (user_id, user_email, bank_details, updated_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id)
           DO UPDATE SET bank_details = $3, user_email = $2, updated_at = NOW()`,
          [userId, userEmail, JSON.stringify(bankDetails)]
        );
      } else if (userEmail) {
        await queryDb(
          `INSERT INTO creator_bank_details (user_email, bank_details, updated_at)
           VALUES ($1, $2, NOW())`,
          [userEmail, JSON.stringify(bankDetails)]
        );
      }
    } catch (dbErr) {
      console.warn('DB bank details save fallback to file cache:', dbErr);
    }

    // 2. Save to User-Scoped File Cache
    const store = loadBankDetailsStore();
    if (userId) store[`user_${userId}`] = bankDetails;
    if (userEmail) store[`email_${userEmail}`] = bankDetails;
    if (userKey) store[userKey] = bankDetails;
    delete store['default'];
    saveBankDetailsStore(store);

    return NextResponse.json({
      success: true,
      message: 'Bank details saved successfully',
      data: bankDetails,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save bank details' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/payout/bank-details
export async function DELETE(request: NextRequest) {
  try {
    const { userId, userEmail, userKey } = extractUserFromRequest(request);

    if (!userKey && !userId && !userEmail) {
      return NextResponse.json({ error: 'User must be authenticated to remove bank details' }, { status: 401 });
    }

    // 1. Try deleting from DB
    try {
      if (userId) {
        await queryDb('DELETE FROM creator_bank_details WHERE user_id = $1', [userId]);
      }
      if (userEmail) {
        await queryDb('DELETE FROM creator_bank_details WHERE LOWER(user_email) = LOWER($1)', [userEmail]);
      }
    } catch (dbErr) {
      console.warn('DB bank delete fallback to file cache:', dbErr);
    }

    // 2. Remove from User-Scoped File Cache
    const store = loadBankDetailsStore();
    if (userId) delete store[`user_${userId}`];
    if (userEmail) delete store[`email_${userEmail}`];
    if (userKey) delete store[userKey];
    delete store['default'];
    saveBankDetailsStore(store);

    return NextResponse.json({
      success: true,
      message: 'Bank details removed successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove bank details' },
      { status: 500 }
    );
  }
}
