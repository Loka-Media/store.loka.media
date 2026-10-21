import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { requireAuth } from '@/lib/serverAuth';

let tableChecked = false;
async function ensureCanvasMockupsTable() {
  if (tableChecked) return;
  try {
    await queryDb(`
      CREATE TABLE IF NOT EXISTS creator_canvas_mockups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        blueprint_id VARCHAR(100),
        product_id VARCHAR(100),
        mockups JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_canvas_mockups_user ON creator_canvas_mockups(user_id);
      CREATE INDEX IF NOT EXISTS idx_canvas_mockups_user_blueprint ON creator_canvas_mockups(user_id, blueprint_id);
      CREATE INDEX IF NOT EXISTS idx_canvas_mockups_user_product ON creator_canvas_mockups(user_id, product_id);
    `);
    tableChecked = true;
  } catch (err) {
    console.warn('[creator_canvas_mockups] Table initialization warning:', err);
  }
}

/**
 * GET /api/creator/canvas-mockups?blueprintId=...&productId=...
 * Fetches the user's saved canvas mockups and custom image order.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  await ensureCanvasMockupsTable();

  try {
    const userId = auth.user.id;
    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('blueprintId')?.trim() || null;
    const productId = searchParams.get('productId')?.trim() || null;

    if (!blueprintId && !productId) {
      return NextResponse.json({ success: true, mockups: [] });
    }

    const rows = await queryDb<any>(
      `SELECT id, user_id, blueprint_id, product_id, mockups, updated_at
       FROM creator_canvas_mockups
       WHERE user_id = $1
         AND (
           ($2::varchar IS NOT NULL AND blueprint_id = $2)
           OR ($3::varchar IS NOT NULL AND product_id = $3)
         )
       ORDER BY updated_at DESC
       LIMIT 1`,
      [userId, blueprintId, productId]
    );

    if (rows && rows.length > 0 && Array.isArray(rows[0].mockups)) {
      return NextResponse.json({
        success: true,
        mockups: rows[0].mockups,
        updatedAt: rows[0].updated_at,
      });
    }

    return NextResponse.json({ success: true, mockups: [] });
  } catch (error: any) {
    console.error('[GET /api/creator/canvas-mockups] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch canvas mockups' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/creator/canvas-mockups
 * Persists the user's canvas mockups, custom image uploads, and exact order.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  await ensureCanvasMockupsTable();

  try {
    const userId = auth.user.id;
    const body = await request.json();
    const { blueprintId, productId, mockups } = body;

    const bId = blueprintId ? String(blueprintId).trim() : null;
    const pId = productId ? String(productId).trim() : null;

    if (!bId && !pId) {
      return NextResponse.json(
        { success: false, error: 'blueprintId or productId is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(mockups)) {
      return NextResponse.json(
        { success: false, error: 'mockups must be an array' },
        { status: 400 }
      );
    }

    // Check for existing record
    const existing = await queryDb<any>(
      `SELECT id FROM creator_canvas_mockups
       WHERE user_id = $1
         AND (
           ($2::varchar IS NOT NULL AND blueprint_id = $2)
           OR ($3::varchar IS NOT NULL AND product_id = $3)
         )
       LIMIT 1`,
      [userId, bId, pId]
    );

    if (existing && existing.length > 0) {
      await queryDb(
        `UPDATE creator_canvas_mockups
         SET mockups = $1, blueprint_id = COALESCE($2, blueprint_id), product_id = COALESCE($3, product_id), updated_at = NOW()
         WHERE id = $4`,
        [JSON.stringify(mockups), bId, pId, existing[0].id]
      );
    } else {
      await queryDb(
        `INSERT INTO creator_canvas_mockups (user_id, blueprint_id, product_id, mockups)
         VALUES ($1, $2, $3, $4)`,
        [userId, bId, pId, JSON.stringify(mockups)]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Canvas mockups saved successfully',
      mockupsCount: mockups.length,
    });
  } catch (error: any) {
    console.error('[POST /api/creator/canvas-mockups] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save canvas mockups' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creator/canvas-mockups
 * Clears saved mockups for this user & blueprint/product (e.g. after successful publish).
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  await ensureCanvasMockupsTable();

  try {
    const userId = auth.user.id;
    const { searchParams } = new URL(request.url);
    const blueprintId = searchParams.get('blueprintId')?.trim() || null;
    const productId = searchParams.get('productId')?.trim() || null;

    if (!blueprintId && !productId) {
      return NextResponse.json(
        { success: false, error: 'blueprintId or productId required' },
        { status: 400 }
      );
    }

    await queryDb(
      `DELETE FROM creator_canvas_mockups
       WHERE user_id = $1
         AND (
           ($2::varchar IS NOT NULL AND blueprint_id = $2)
           OR ($3::varchar IS NOT NULL AND product_id = $3)
         )`,
      [userId, blueprintId, productId]
    );

    return NextResponse.json({ success: true, message: 'Canvas mockups cleared' });
  } catch (error: any) {
    console.error('[DELETE /api/creator/canvas-mockups] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete canvas mockups' },
      { status: 500 }
    );
  }
}
