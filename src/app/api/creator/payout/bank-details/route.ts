import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { requireAuth } from '@/lib/serverAuth';

// GET /api/creator/payout/bank-details
export async function GET(request: NextRequest) {
  // Security (C10): Require verified JWT
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { user } = auth;
    let targetUserId = user.id;

    // Only admins can inspect another creator's bank details
    const searchParams = request.nextUrl.searchParams;
    const requestedCreatorId = searchParams.get('creatorId') || searchParams.get('userId');

    if (requestedCreatorId) {
      const parsedId = Number(requestedCreatorId);
      if (user.role === 'admin' && !isNaN(parsedId)) {
        targetUserId = parsedId;
      } else if (parsedId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You cannot inspect another creator\'s bank details' },
          { status: 403 }
        );
      }
    }

    const rows = await queryDb<any>(
      'SELECT bank_details FROM creator_bank_details WHERE user_id = $1 LIMIT 1',
      [targetUserId]
    );

    if (rows && rows.length > 0 && rows[0]?.bank_details) {
      return NextResponse.json({
        success: true,
        data: rows[0].bank_details,
      });
    }

    return NextResponse.json(
      { error: 'No bank details found for this user' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('[Bank Details GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch bank details' },
      { status: 500 }
    );
  }
}

// POST /api/creator/payout/bank-details
export async function POST(request: NextRequest) {
  // Security (C10): Require verified JWT
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { user } = auth;
    let targetUserId = user.id;
    let targetEmail = user.email;

    const body = await request.json().catch(() => ({}));

    // Only admins can update another user's bank details
    if (body.creatorId || body.userId) {
      const requestedId = Number(body.creatorId || body.userId);
      if (user.role === 'admin' && !isNaN(requestedId)) {
        targetUserId = requestedId;
        if (body.userEmail || body.email) {
          targetEmail = String(body.userEmail || body.email).toLowerCase().trim();
        }
      } else if (requestedId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You cannot modify another creator\'s bank details' },
          { status: 403 }
        );
      }
    }

    // Sanitize bank details payload: remove any caller injection of unverified user identifiers
    const bankDetails = {
      ...body,
      id: Date.now(),
      user_id: targetUserId,
      user_email: targetEmail,
      updated_at: new Date().toISOString(),
    };

    // Remove file cache; store strictly in the database with user binding
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

    await queryDb(
      `INSERT INTO creator_bank_details (user_id, user_email, bank_details, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET bank_details = $3, user_email = $2, updated_at = NOW()`,
      [targetUserId, targetEmail, JSON.stringify(bankDetails)]
    );

    return NextResponse.json({
      success: true,
      message: 'Bank details saved successfully',
      data: bankDetails,
    });
  } catch (error: any) {
    console.error('[Bank Details POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save bank details' },
      { status: 500 }
    );
  }
}

// DELETE /api/creator/payout/bank-details
export async function DELETE(request: NextRequest) {
  // Security (C10): Require verified JWT
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  try {
    const { user } = auth;
    let targetUserId = user.id;

    const searchParams = request.nextUrl.searchParams;
    const requestedCreatorId = searchParams.get('creatorId') || searchParams.get('userId');

    if (requestedCreatorId) {
      const parsedId = Number(requestedCreatorId);
      if (user.role === 'admin' && !isNaN(parsedId)) {
        targetUserId = parsedId;
      } else if (parsedId !== user.id) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You cannot delete another creator\'s bank details' },
          { status: 403 }
        );
      }
    }

    await queryDb('DELETE FROM creator_bank_details WHERE user_id = $1', [targetUserId]);

    return NextResponse.json({
      success: true,
      message: 'Bank details removed successfully',
    });
  } catch (error: any) {
    console.error('[Bank Details DELETE] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove bank details' },
      { status: 500 }
    );
  }
}
