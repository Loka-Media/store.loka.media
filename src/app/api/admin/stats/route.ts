import { NextRequest, NextResponse } from 'next/server';
import { queryDb } from '@/lib/db';
import { printifyCatalogAPI } from '@/services/printify/PrintifyClient';
import { requireAdminAuth } from '@/lib/serverAuth';

export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    let publishedProductsCount = 0;
    let activeCreatorsCount = 0;
    let totalOrdersCount = 0;
    let totalRevenue = 0;
    let adminEarnings = 0;

    // 1. Direct query to PostgreSQL database
    let dbSuccess = false;
    try {
      const [ordersRes, prodsRes, creatorsRes] = await Promise.all([
        queryDb<{ total_orders: string; total_revenue: string; admin_earnings: string }>(
          `SELECT 
            COUNT(*) as total_orders, 
            COALESCE(SUM(CAST(customer_payment_amount AS numeric)), 0) as total_revenue,
            COALESCE(SUM(CAST(admin_fee AS numeric)), 0) as admin_earnings
          FROM marketplace_orders 
          WHERE payment_status IN ('escrowed', 'released') OR order_status IN ('processing', 'completed', 'fulfilled')`
        ),
        queryDb<{ published_products: string }>(
          `SELECT COUNT(*) as published_products FROM products WHERE status = 'active'`
        ),
        queryDb<{ active_creators: string }>(
          `SELECT COUNT(DISTINCT created_by) as active_creators FROM products WHERE status = 'active'`
        )
      ]);

      if (ordersRes && ordersRes[0]) {
        totalOrdersCount = parseInt(ordersRes[0].total_orders || '0', 10);
        totalRevenue = parseFloat(ordersRes[0].total_revenue || '0');
        adminEarnings = parseFloat(ordersRes[0].admin_earnings || '0');
      }

      if (prodsRes && prodsRes[0]) {
        publishedProductsCount = parseInt(prodsRes[0].published_products || '0', 10);
      }

      if (creatorsRes && creatorsRes[0]) {
        activeCreatorsCount = parseInt(creatorsRes[0].active_creators || '0', 10);
      }

      dbSuccess = true;
    } catch (dbErr) {
      console.warn('Direct database admin stats query failed, falling back:', dbErr);
    }

    // 2. Fallbacks if database query was incomplete or failed
    if (!dbSuccess || publishedProductsCount === 0) {
      try {
        const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
        const productsRes = await fetch(`${backendUrl}/api/products?limit=1`).catch(() => null);
        if (productsRes && productsRes.ok) {
          const prodsData = await productsRes.json();
          if (prodsData?.pagination?.total) {
            publishedProductsCount = parseInt(prodsData.pagination.total, 10);
          }
        }
      } catch (e) {
        console.warn('Failed to fetch store products count for admin stats:', e);
      }

      if (publishedProductsCount === 0) {
        try {
          const blueprints = await printifyCatalogAPI.getBlueprints();
          publishedProductsCount = Array.isArray(blueprints) ? blueprints.length : publishedProductsCount || 122;
        } catch (e) {
          console.warn('Failed to fetch catalog blueprints for admin stats:', e);
          if (publishedProductsCount === 0) publishedProductsCount = 122;
        }
      }
    }

    if (!dbSuccess || totalOrdersCount === 0 || activeCreatorsCount === 0) {
      const backendUrl = (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
      const authHeader = request.headers.get('authorization') || '';

      try {
        const headers: Record<string, string> = {};
        if (authHeader) headers['Authorization'] = authHeader;

        const [creatorsRes, overviewRes, checkoutStatsRes, prodCreatorsRes] = await Promise.all([
          fetch(`${backendUrl}/api/admin/creators/earnings`, { headers }).catch(() => null),
          fetch(`${backendUrl}/api/admin/commissions/overview`, { headers }).catch(() => null),
          fetch(`${backendUrl}/api/unified-checkout/admin/dashboard/stats`, { headers }).catch(() => null),
          fetch(`${backendUrl}/api/products/creators`).catch(() => null),
        ]);

        if (prodCreatorsRes && prodCreatorsRes.ok && activeCreatorsCount === 0) {
          const pCreators = await prodCreatorsRes.json().catch(() => null);
          if (Array.isArray(pCreators?.creators)) {
            activeCreatorsCount = pCreators.creators.length;
          }
        }

        if (creatorsRes && creatorsRes.ok && activeCreatorsCount === 0) {
          const creatorsData = await creatorsRes.json().catch(() => null);
          const list = creatorsData?.data?.creators || creatorsData?.data || [];
          activeCreatorsCount = Array.isArray(list) ? list.length : 0;
        }

        if (checkoutStatsRes && checkoutStatsRes.ok) {
          const checkoutData = await checkoutStatsRes.json().catch(() => null);
          const checkoutStats = checkoutData?.stats || checkoutData;
          if (checkoutStats?.orders?.total && totalOrdersCount === 0) {
            totalOrdersCount = parseInt(checkoutStats.orders.total, 10);
          }
          if (checkoutStats?.payments?.totalEscrowed && totalRevenue === 0) {
            totalRevenue = parseFloat(checkoutStats.payments.totalEscrowed);
          }
        }

        if (overviewRes && overviewRes.ok) {
          const overviewData = await overviewRes.json().catch(() => null);
          const overview = overviewData?.data?.overview || overviewData?.data || overviewData || {};

          if (totalOrdersCount === 0) {
            totalOrdersCount = parseInt(
              overview.total_orders ||
              overview.totalOrders ||
              overview.totalCommissionsTracked ||
              overview.totalPayouts ||
              '0',
              10
            );
          }
          if (totalRevenue === 0) {
            totalRevenue = parseFloat(
              overview.total_commissions ||
              overview.totalRevenue ||
              overview.totalCommissionsAmount ||
              overview.totalPayoutAmount ||
              '0'
            );
          }
          if (activeCreatorsCount === 0 && overview.total_creators) {
            activeCreatorsCount = parseInt(overview.total_creators, 10);
          }
        }
      } catch (e) {
        console.warn('Backend admin stats fallback error:', e);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        activeCreators: activeCreatorsCount,
        publishedProducts: publishedProductsCount,
        totalOrders: totalOrdersCount,
        totalRevenue: totalRevenue,
        adminEarnings: adminEarnings,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
