import { NextRequest, NextResponse } from 'next/server';
import { resetKnowledgeBaseToDefaults } from '@/services/support/knowledge-manager';

/**
 * POST /api/admin/knowledge/reset
 * Resets knowledge base back to initial system defaults
 */
export async function POST(req: NextRequest) {
  try {
    const stats = resetKnowledgeBaseToDefaults();

    return NextResponse.json({
      success: true,
      message: 'Knowledge base restored to default articles and FAQs.',
      stats
    });
  } catch (error: any) {
    console.error('[Admin Knowledge API] Reset error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset knowledge base' },
      { status: 500 }
    );
  }
}
