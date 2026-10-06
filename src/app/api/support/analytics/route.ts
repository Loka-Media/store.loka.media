import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/services/support/support-analytics';

export async function GET() {
  const summary = getAnalyticsSummary();
  return NextResponse.json({
    success: true,
    data: summary
  });
}
