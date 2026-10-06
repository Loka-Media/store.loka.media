import { NextRequest, NextResponse } from 'next/server';
import {
  getAllKnowledgeItems,
  getKnowledgeItemById,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  KnowledgeCategory
} from '@/services/support/knowledge-manager';

/**
 * GET /api/admin/knowledge
 * Query params: ?category=faq | products | shipping | returns | policies | all
 *               ?search=keyword
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = getAllKnowledgeItems({ category, search });
    return NextResponse.json({
      success: true,
      items: result.items,
      stats: result.stats
    });
  } catch (error: any) {
    console.error('[Admin Knowledge API] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch knowledge items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/knowledge
 * Body: { title, category, content, source?, tags?, id?, enabled? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, category, content, source, tags, id, enabled } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'Title / Question is required.' },
        { status: 400 }
      );
    }

    if (!category || typeof category !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Category is required.' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Content / Answer is required.' },
        { status: 400 }
      );
    }

    const newItem = createKnowledgeItem({
      title: title.trim(),
      category: category as KnowledgeCategory,
      content: content.trim(),
      source: source || '/help',
      tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()) : [],
      id: id ? id.trim() : undefined,
      enabled: enabled !== false
    });

    return NextResponse.json({
      success: true,
      item: newItem,
      message: 'Knowledge item created and indexed successfully.'
    });
  } catch (error: any) {
    console.error('[Admin Knowledge API] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create knowledge item' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/knowledge
 * Body: { id, title?, category?, content?, source?, tags?, enabled? }
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, category, content, source, tags, enabled } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid item ID is required for update.' },
        { status: 400 }
      );
    }

    const existing = getKnowledgeItemById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: `Item with ID "${id}" not found.` },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title.trim();
    if (category !== undefined) updates.category = category;
    if (content !== undefined) updates.content = content.trim();
    if (source !== undefined) updates.source = source.trim();
    if (enabled !== undefined) updates.enabled = Boolean(enabled);
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t: string) => t.trim())
        : [];
    }

    const updated = updateKnowledgeItem(id, updates);

    return NextResponse.json({
      success: true,
      item: updated,
      message: 'Knowledge item updated and re-indexed successfully.'
    });
  } catch (error: any) {
    console.error('[Admin Knowledge API] PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update knowledge item' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/knowledge
 * Query param ?id=... or JSON body { id }
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body?.id;
    }

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid item ID is required for deletion.' },
        { status: 400 }
      );
    }

    const deleted = deleteKnowledgeItem(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: `Item with ID "${id}" could not be deleted or was not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Knowledge item "${id}" removed and index refreshed.`
    });
  } catch (error: any) {
    console.error('[Admin Knowledge API] DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete knowledge item' },
      { status: 500 }
    );
  }
}
