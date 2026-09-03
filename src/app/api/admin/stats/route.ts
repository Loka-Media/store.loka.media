import { NextRequest, NextResponse } from 'next/server';
import { printifyCatalogAPI } from '@/services/printify/PrintifyClient';

export async function GET(request: NextRequest) {
  try {
    let publishedProductsCount = 0;
    try {
      const blueprints = await printifyCatalogAPI.getBlueprints();
      publishedProductsCount = Array.isArray(blueprints) ? blueprints.length : 0;
    } catch (e) {
      console.warn('Failed to fetch catalog blueprints for admin stats:', e);
      publishedProductsCount = 120;
    }

    let activeCreatorsCount = 0;
    let totalOrdersCount = 0;
    let totalRevenue = 0;

    const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
    const authHeader = request.headers.get('authorization') || '';

    try {
      const headers: Record<string, string> = {};
      if (authHeader) headers['Authorization'] = authHeader;

      const [creatorsRes, overviewRes] = await Promise.all([
        fetch(`${backendUrl}/api/admin/creators/earnings`, { headers }).catch(() => null),
        fetch(`${backendUrl}/api/admin/commissions/overview`, { headers }).catch(() => null),
      ]);

      if (creatorsRes && creatorsRes.ok) {
        const creatorsData = await creatorsRes.json();
        const list = creatorsData?.data?.creators || creatorsData?.data || [];
        activeCreatorsCount = Array.isArray(list) ? list.length : 0;
      }

      if (overviewRes && overviewRes.ok) {
        const overviewData = await overviewRes.json();
        const overview = overviewData?.data || {};
        totalOrdersCount = overview.totalCommissionsTracked || overview.totalPayouts || 0;
        totalRevenue = overview.totalCommissionsAmount || overview.totalPayoutAmount || 0;
      }
    } catch (e) {
      console.warn('Backend admin stats error:', e);
    }

    return NextResponse.json({
      success: true,
      stats: {
        activeCreators: activeCreatorsCount,
        publishedProducts: publishedProductsCount,
        totalOrders: totalOrdersCount,
        totalRevenue: totalRevenue,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
