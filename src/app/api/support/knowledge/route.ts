import { NextResponse } from 'next/server';
import { SUPPORT_KNOWLEDGE_BASE } from '@/config/support-knowledge';

export async function GET() {
  const categories = Array.from(new Set(SUPPORT_KNOWLEDGE_BASE.map(k => k.category)));
  return NextResponse.json({
    success: true,
    totalItems: SUPPORT_KNOWLEDGE_BASE.length,
    categories,
    items: SUPPORT_KNOWLEDGE_BASE.map(k => ({
      id: k.id,
      title: k.title,
      category: k.category,
      source: k.source,
      tags: k.tags,
      lastUpdated: k.lastUpdated,
      summary: k.content.slice(0, 150) + '...'
    }))
  });
}
