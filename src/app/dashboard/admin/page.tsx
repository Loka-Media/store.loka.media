'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Users, Package, ShoppingCart } from 'lucide-react';
import Navigation from '@/components/Navigation';

export default function AdminDashboard() {
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
    // {
    //   title: 'Product Analytics',
    //   description: 'View sales analytics, popular products, and performance metrics',
    //   icon: BarChart3,
    //   href: '/dashboard/admin/analytics',
    //   color: 'bg-orange-500',
    //   stats: 'Revenue tracking'
    // },
    // {
    //   title: 'Marketplace Products',
    //   description: 'Manage all published products across creators',
    //   icon: Package,
    //   href: '/dashboard/admin/products',
    //   color: 'bg-indigo-500',
    //   stats: 'Published products'
    // },
    // {
    //   title: 'System Settings',
    //   description: 'Configure platform settings, integrations, and preferences',
    //   icon: Settings,
    //   href: '/dashboard/admin/settings',
    //   color: 'bg-gray-500',
    //   stats: 'Configuration'
    // }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="max-w-7xl mt-16 mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-400">
            Manage your marketplace, sync products, and oversee all platform operations
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Shopify Products</p>
                <p className="text-2xl font-bold text-white">40K+</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Active Creators</p>
                <p className="text-2xl font-bold text-white">125</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Published Products</p>
                <p className="text-2xl font-bold text-white">2.8K</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-lg border border-gray-700/50">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-900/30 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-orange-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Total Orders</p>
                <p className="text-2xl font-bold text-white">1.2K</p>
              </div>
            </div>
          </div>
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
              <p className="font-semibold">Next sync in: {/* TODO: Add countdown timer */}</p>
              <p className="text-white/90">Automated sync active</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}