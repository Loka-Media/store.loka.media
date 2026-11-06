import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/serverAuth';
import { reindexKnowledgeBase } from '@/services/support/knowledge-manager';

/**
 * POST /api/admin/knowledge/reindex
 * Forces a complete refresh of the knowledge base search index
 */
export async function POST(req: NextRequest) {
  // requireAccessGuard: verified JWT + live DB role
  const accessGuard = await requireAdminAuth(req);
  if (!accessGuard.authorized) return accessGuard.response;

  try {
    const stats = reindexKnowledgeBase();

    return NextResponse.json({
      success: true,
      message: 'Knowledge base successfully reindexed and synchronized.',
      stats
    });
  } catch (error: any) {
    console.error('[Admin Knowledge API] Reindex error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reindex knowledge base' },
      { status: 500 }
    );
  }
}
