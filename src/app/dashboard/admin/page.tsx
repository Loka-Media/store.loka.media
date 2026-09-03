'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Package, ShoppingCart, Settings, DollarSign, Wallet, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { api } from '@/lib/auth';

interface StatsData {
  activeCreators: number;
  publishedProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData>({
    activeCreators: 0,
    publishedProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      setLoading(true);

      // 1. Try local stats API route
      let statsData: StatsData | null = null;
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : '';
        const res = await fetch('/api/admin/stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.stats) {
            statsData = json.stats;
          }
        }
      } catch (e) {
        console.warn('Local admin stats fetch warning:', e);
      }

      // 2. Fallback to direct API endpoints if needed
      if (!statsData) {
        const [creatorsRes, overviewRes, catalogRes] = await Promise.all([
          api.get('/api/admin/creators/earnings').catch(() => null),
          api.get('/api/admin/commissions/overview').catch(() => null),
          fetch('/api/printify/catalog').then(r => r.json()).catch(() => null),
        ]);

        const creatorsList = creatorsRes?.data?.data?.creators || creatorsRes?.data?.data || [];
        const overview = overviewRes?.data?.data || {};
        const catalogList = catalogRes?.result || catalogRes?.data || [];

        statsData = {
          activeCreators: Array.isArray(creatorsList) ? creatorsList.length : 0,
          publishedProducts: Array.isArray(catalogList) ? catalogList.length : 0,
          totalOrders: overview.totalCommissionsTracked || overview.totalPayouts || 0,
          totalRevenue: overview.totalCommissionsAmount || overview.totalPayoutAmount || 0,
        };
      }

      setStats(statsData);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const adminFeatures = [
    {
      title: 'Creator Requests',
      description: 'Review and approve creator account applications',
      icon: Users,
      href: '/dashboard/admin/creator-requests',
      color: 'bg-blue-500',
      stats: 'Pending approvals'
    },
    {
      title: 'Order Management',
      description: 'Track and manage customer orders and fulfillment',
      icon: ShoppingCart,
      href: '/dashboard/admin/orders',
      color: 'bg-purple-500',
      stats: 'Recent orders'
    },
    {
      title: 'Product Pricing',
      description: 'Configure platform-wide markup settings for all products',
      icon: Settings,
      href: '/dashboard/admin/settings/pricing',
      color: 'bg-orange-500',
      stats: 'Pricing & Markup'
    },
    {
      title: 'Creator Earnings & Revenue',
      description: 'Monitor individual creator sales, revenue breakdown, and Stripe Connect status',
      icon: DollarSign,
      href: '/dashboard/admin/earnings',
      color: 'bg-green-600',
      stats: 'Creator earnings list'
    },
    {
      title: 'Payouts & Withdrawals',
      description: 'Review and approve creator withdrawal requests and settle payments',
      icon: Wallet,
      href: '/dashboard/admin/payouts',
      color: 'bg-amber-500',
      stats: 'Withdrawal requests'
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="max-w-7xl mt-16 mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="mt-2 text-gray-400">
              Manage your marketplace, sync products, and oversee all platform operations
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <Link
            href="/dashboard/admin/earnings"
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/50 hover:border-blue-500/50 hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-lg group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:bg-blue-900/50 transition-colors">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400 group-hover:text-blue-300 transition-colors">Active Creators</p>
                {loading ? (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{stats.activeCreators}</p>
                )}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/products"
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/50 hover:border-purple-500/50 hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-lg group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:bg-purple-900/50 transition-colors">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400 group-hover:text-purple-300 transition-colors">Published Products</p>
                {loading ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{stats.publishedProducts}</p>
                )}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/orders"
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/50 hover:border-orange-500/50 hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-lg group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-900/30 rounded-lg flex items-center justify-center group-hover:bg-orange-900/50 transition-colors">
                <ShoppingCart className="w-6 h-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400 group-hover:text-orange-300 transition-colors">Total Orders</p>
                {loading ? (
                  <Loader2 className="w-5 h-5 text-orange-400 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
                )}
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/admin/payouts"
            className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl border border-gray-700/50 hover:border-green-500/50 hover:scale-[1.02] cursor-pointer transition-all duration-300 shadow-lg group"
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center group-hover:bg-green-900/50 transition-colors">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400 group-hover:text-green-300 transition-colors">Platform Revenue</p>
                {loading ? (
                  <Loader2 className="w-5 h-5 text-green-400 animate-spin mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</p>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Admin Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {adminFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700/50 hover:border-orange-500/30 transition-colors group"
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-white group-hover:text-orange-400">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-gray-400">{feature.stats}</p>
                  </div>
                </div>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">Automated Product Sync</h3>
              <p className="text-white/90 text-sm sm:text-base">
                Products are automatically synced from Shopify every 6 hours. No manual intervention required.
              </p>
            </div>
            <div className="text-white text-sm flex-shrink-0">
              <p className="font-semibold">Next sync in: 6h 00m</p>
              <p className="text-white/90">Automated sync active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}