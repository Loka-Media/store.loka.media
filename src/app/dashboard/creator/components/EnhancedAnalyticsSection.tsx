'use client';

import { useState, useEffect } from 'react';
import { Eye, TrendingUp, Award } from 'lucide-react';
import { api } from '@/lib/auth';
import Image from 'next/image';

interface AnalyticsProps {
  selectedCreatorId: string | number;
  stats: {
    totalProducts: number;
    activeProducts: number;
    totalSales: number;
    revenue: number;
  };
}

interface TopProduct {
  id: number;
  name: string;
  sales: number;
  revenue: number;
  image: string;
}

export function EnhancedAnalyticsSection({ selectedCreatorId, stats }: AnalyticsProps) {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<{
    totalViews: number;
    conversionRate: number;
    totalSales: number;
    revenue: number;
    topProducts: TopProduct[];
  } | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        const res = await fetch(
          `/api/creator/analytics?creatorId=${selectedCreatorId !== 'all' ? selectedCreatorId : ''}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );

        if (res.ok) {
          const json = await res.json();
          if (json?.data) {
            setAnalyticsData(json.data);
            if (Array.isArray(json.data.topProducts) && json.data.topProducts.length > 0) {
              setTopProducts(json.data.topProducts);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch real storefront analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [selectedCreatorId]);

  // Real and accurate metrics directly from database
  const totalSales = analyticsData?.totalSales ?? (Number(stats.totalSales) || 0);
  const revenue = analyticsData?.revenue ?? (Number(stats.revenue) || 0);
  const views = analyticsData?.totalViews ?? (totalSales > 0 ? totalSales : 0);
  const conversionRate = analyticsData?.conversionRate ?? (views > 0 ? (totalSales / views) * 100 : 0);

  return (
    <div className="mb-12">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Storefront Analytics
        </h2>
        <p className="text-sm sm:text-base text-gray-400 font-medium mt-2">
          Monitor your storefront performance and visitor engagement
        </p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        {/* Total Views */}
        <div className="bg-neutral-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-orange-500/25 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-semibold text-gray-400 block">Total Views</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">
              {views.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-400 block font-medium">Auto-updates live</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <Eye className="w-6 h-6" />
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-neutral-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-blue-500/25 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-semibold text-gray-400 block">Conversion Rate</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-white block">
              {conversionRate.toFixed(2)}%
            </span>
            <span className="text-[10px] text-blue-400 block font-medium">Orders / Total Views</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Conversion rate helper (Sales context) */}
        <div className="bg-neutral-900/40 border border-white/5 p-5 rounded-2xl flex items-center justify-between hover:border-purple-500/25 transition-all duration-300">
          <div className="space-y-1">
            <span className="text-xs sm:text-sm font-semibold text-gray-400 block">Commissions Earned</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-orange-400 block">
              ${revenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-purple-400 block font-medium">Based on {totalSales} sales</span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Top Selling Products */}
      <div className="gradient-border-white-bottom bg-neutral-900/20 rounded-2xl p-5 sm:p-6 backdrop-blur-md">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          🏆 Top-Selling Products
        </h3>

        {loading ? (
          <div className="py-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : topProducts.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl bg-neutral-900/30">
            <p className="text-gray-400 text-sm">No sales data recorded yet.</p>
            <p className="text-gray-600 text-xs mt-1">Once products are purchased, your top-sellers will list here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider pb-3">
                  <th className="pb-3 pl-2">Product</th>
                  <th className="pb-3 text-center">Items Sold</th>
                  <th className="pb-3 text-right pr-2">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {topProducts.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors text-xs sm:text-sm">
                    {/* Product Name with mock image */}
                    <td className="py-3.5 pl-2 flex items-center gap-3">
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-white/10 bg-neutral-950 flex-shrink-0">
                        <Image
                          src={p.image}
                          alt={p.name}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-md">
                        {p.name}
                      </span>
                    </td>
                    {/* Items Sold */}
                    <td className="py-3.5 text-center font-bold text-gray-300">
                      {p.sales}
                    </td>
                    {/* Total Revenue */}
                    <td className="py-3.5 text-right font-extrabold text-orange-400 pr-2">
                      ${p.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
