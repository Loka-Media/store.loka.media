import { NextRequest, NextResponse } from 'next/server';
import { retrieveKnowledge } from '@/services/support/knowledge-retriever';

/**
 * POST /api/admin/knowledge/test-search
 * Interactive testing endpoint for admins to evaluate RAG retrieval and confidence
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { success: false, error: 'Query string is required' },
        { status: 400 }
      );
    }

    const start = Date.now();
    const result = retrieveKnowledge(query);
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      success: true,
      query: query.trim(),
      latencyMs,
      intent: result.intent,
      confidence: result.confidence,
      directAnswer: result.directAnswer || null,
      matchedItemsCount: result.items.length,
      matchedItems: result.items.map(item => ({
        id: item.id,
        title: item.title,
        category: item.category,
        source: item.source,
        tags: item.tags,
        contentSnippet: item.content.slice(0, 240) + (item.content.length > 240 ? '...' : '')
      }))
    });
  } catch (error: any) {
    console.error('[Admin Knowledge API] Test search error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute test search' },
      { status: 500 }
    );
  }
}
