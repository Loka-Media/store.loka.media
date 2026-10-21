import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { requireAuth } from '@/lib/serverAuth';

let tableChecked = false;
async function ensureArtworkTable() {
  if (tableChecked) return;
  try {
    await queryDb(`
      CREATE TABLE IF NOT EXISTS user_artwork_library (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        printify_file_id VARCHAR(255),
        file_url TEXT NOT NULL,
        thumbnail_url TEXT,
        preview_url TEXT,
        filename VARCHAR(500) NOT NULL,
        width INTEGER,
        height INTEGER,
        size BIGINT,
        mime_type VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_user_artwork_user_id ON user_artwork_library(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_artwork_printify_file_id ON user_artwork_library(printify_file_id);
    `);
    tableChecked = true;
  } catch (err) {
    console.warn('[user_artwork_library] Table initialization warning:', err);
  }
}

/**
 * GET /api/creator/artworks
 * Returns all uploaded design files belonging to the authenticated user.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  await ensureArtworkTable();

  try {
    const userId = auth.user.id;
    const rows = await queryDb<any>(
      `SELECT 
        id,
        user_id,
        printify_file_id,
        file_url,
        thumbnail_url,
        preview_url,
        filename,
        width,
        height,
        size,
        mime_type,
        created_at
      FROM user_artwork_library
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    const formatted = rows.map((row) => ({
      id: row.printify_file_id || String(row.id),
      db_id: row.id,
      printify_file_id: row.printify_file_id,
      file_id: row.printify_file_id || String(row.id),
      filename: row.filename,
      file_name: row.filename,
      file_url: row.file_url,
      preview_url: row.preview_url || row.file_url,
      thumbnail_url: row.thumbnail_url || row.file_url,
      width: row.width,
      height: row.height,
      size: row.size ? Number(row.size) : 0,
      file_size: row.size ? Number(row.size) : 0,
      type: 'image',
      status: 'ok',
      mime_type: row.mime_type || 'image/png',
      created: Math.floor(new Date(row.created_at).getTime() / 1000),
      createdAt: row.created_at,
      userId: row.user_id,
    }));

    return NextResponse.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('[GET /api/creator/artworks] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch artworks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/creator/artworks
 * Persists an uploaded artwork to the database scoped to the authenticated user.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  await ensureArtworkTable();

  try {
    const userId = auth.user.id;
    const body = await request.json();
    const {
      printify_file_id,
      id,
      file_url,
      thumbnail_url,
      preview_url,
      filename,
      file_name,
      width,
      height,
      size,
      mime_type,
    } = body;

    const effectiveFileId = String(printify_file_id || id || '').trim() || null;
    const effectiveUrl = String(file_url || preview_url || thumbnail_url || '').trim();
    const effectiveFilename = String(filename || file_name || 'Artwork').trim();

    if (!effectiveUrl) {
      return NextResponse.json(
        { success: false, error: 'Artwork URL is required' },
        { status: 400 }
      );
    }

    // Check if artwork already saved for this user
    let existing: any[] = [];
    if (effectiveFileId) {
      existing = await queryDb<any>(
        `SELECT id, printify_file_id, file_url, filename, thumbnail_url, preview_url, width, height, size, mime_type, created_at 
         FROM user_artwork_library 
         WHERE user_id = $1 AND printify_file_id = $2 
         LIMIT 1`,
        [userId, effectiveFileId]
      );
    } else {
      existing = await queryDb<any>(
        `SELECT id, printify_file_id, file_url, filename, thumbnail_url, preview_url, width, height, size, mime_type, created_at 
         FROM user_artwork_library 
         WHERE user_id = $1 AND file_url = $2 
         LIMIT 1`,
        [userId, effectiveUrl]
      );
    }

    if (existing.length > 0) {
      // Touch updated_at
      await queryDb(
        `UPDATE user_artwork_library SET updated_at = NOW() WHERE id = $1`,
        [existing[0].id]
      );
      const row = existing[0];
      return NextResponse.json({
        success: true,
        data: {
          id: row.printify_file_id || String(row.id),
          db_id: row.id,
          printify_file_id: row.printify_file_id,
          filename: row.filename,
          file_name: row.filename,
          file_url: row.file_url,
          preview_url: row.preview_url || row.file_url,
          thumbnail_url: row.thumbnail_url || row.file_url,
          width: row.width,
          height: row.height,
          size: row.size ? Number(row.size) : 0,
          created: Math.floor(new Date(row.created_at).getTime() / 1000),
          userId,
        },
      });
    }

    // Insert new record for authenticated user
    const inserted = await queryDb<any>(
      `INSERT INTO user_artwork_library (
        user_id,
        printify_file_id,
        file_url,
        thumbnail_url,
        preview_url,
        filename,
        width,
        height,
        size,
        mime_type,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *`,
      [
        userId,
        effectiveFileId,
        effectiveUrl,
        thumbnail_url || effectiveUrl,
        preview_url || effectiveUrl,
        effectiveFilename,
        width ? parseInt(String(width), 10) : null,
        height ? parseInt(String(height), 10) : null,
        size ? parseInt(String(size), 10) : null,
        mime_type || 'image/png',
      ]
    );

    const row = inserted[0];
    return NextResponse.json(
      {
        success: true,
        data: {
          id: row.printify_file_id || String(row.id),
          db_id: row.id,
          printify_file_id: row.printify_file_id,
          filename: row.filename,
          file_name: row.filename,
          file_url: row.file_url,
          preview_url: row.preview_url || row.file_url,
          thumbnail_url: row.thumbnail_url || row.file_url,
          width: row.width,
          height: row.height,
          size: row.size ? Number(row.size) : 0,
          created: Math.floor(new Date(row.created_at).getTime() / 1000),
          userId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[POST /api/creator/artworks] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save artwork' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creator/artworks?id=<id>
 * Deletes an artwork from the database. Strictly scoped to the authenticated user.
 */
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.authorized) {
    return auth.response;
  }

  await ensureArtworkTable();

  try {
    const userId = auth.user.id;
    const { searchParams } = new URL(request.url);
    let targetId = searchParams.get('id') || searchParams.get('fileId') || '';

    if (!targetId) {
      try {
        const body = await request.json();
        targetId = String(body.id || body.fileId || body.printify_file_id || '').trim();
      } catch {}
    }

    if (!targetId) {
      return NextResponse.json(
        { success: false, error: 'Artwork ID is required for deletion' },
        { status: 400 }
      );
    }

    const deleted = await queryDb<any>(
      `DELETE FROM user_artwork_library
       WHERE user_id = $1 AND (
         printify_file_id = $2 OR
         CAST(id AS TEXT) = $2
       )
       RETURNING id, printify_file_id`,
      [userId, String(targetId)]
    );

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Artwork not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Artwork deleted successfully',
      deletedId: targetId,
    });
  } catch (error: any) {
    console.error('[DELETE /api/creator/artworks] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete artwork' },
      { status: 500 }
    );
  }
}
