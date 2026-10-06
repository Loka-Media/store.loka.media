import { NextResponse } from 'next/server';
import { getAllKnowledgeItems } from '@/services/support/knowledge-manager';

export async function GET() {
  const { items, stats } = getAllKnowledgeItems();
  const categories = Array.from(new Set(items.map(k => k.category)));
  return NextResponse.json({
    success: true,
    totalItems: items.length,
    stats,
    categories,
    items: items.map(k => ({
      id: k.id,
      title: k.title,
      category: k.category,
      source: k.source,
      tags: k.tags,
      lastUpdated: k.lastUpdated,
      summary: k.content.slice(0, 150) + (k.content.length > 150 ? '...' : '')
    }))
  });
}
