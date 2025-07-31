'use client';

import React from 'react';
import Link from 'next/link';
import { Store, Settings, Users, Package, BarChart3, ShoppingCart } from 'lucide-react';

export default function AdminDashboard() {
  const adminFeatures = [
    {
      title: 'Shopify Product Sync',
      description: 'Sync products from Shopify store and manage marketplace inventory',
      icon: Store,
      href: '/dashboard/admin/shopify-sync',
      color: 'bg-green-500',
      stats: 'Sync 40K+ products'
    },
    {
      title: 'User Management',
      description: 'Manage creators, customers, and user permissions',
      icon: Users,
      href: '/dashboard/admin/users',
      color: 'bg-blue-500',
      stats: 'Active users'
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
      title: 'Product Analytics',
      description: 'View sales analytics, popular products, and performance metrics',
      icon: BarChart3,
      href: '/dashboard/admin/analytics',
      color: 'bg-orange-500',
      stats: 'Revenue tracking'
    },
    {
      title: 'Marketplace Products',
      description: 'Manage all published products across creators',
      icon: Package,
      href: '/dashboard/admin/products',
      color: 'bg-indigo-500',
      stats: 'Published products'
    },
    {
      title: 'System Settings',
      description: 'Configure platform settings, integrations, and preferences',
      icon: Settings,
      href: '/dashboard/admin/settings',
      color: 'bg-gray-500',
      stats: 'Configuration'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Manage your marketplace, sync products, and oversee all platform operations
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Shopify Products</p>
              <p className="text-2xl font-bold text-gray-900">40K+</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Creators</p>
              <p className="text-2xl font-bold text-gray-900">125</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published Products</p>
              <p className="text-2xl font-bold text-gray-900">2.8K</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">1.2K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminFeatures.map((feature) => {
          const IconComponent = feature.icon;
          return (
            <Link
              key={feature.href}
              href={feature.href}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500">{feature.stats}</p>
                </div>
              </div>
              <p className="text-gray-600 group-hover:text-gray-700">
                {feature.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready to sync products?</h3>
            <p className="text-green-100">
              Connect to your Shopify store and sync thousands of products for creators to choose from.
            </p>
          </div>
          <Link
            href="/dashboard/admin/shopify-sync"
            className="inline-flex items-center px-6 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Store className="w-5 h-5 mr-2" />
            Start Shopify Sync
          </Link>
        </div>
      </div>
    </div>
  );
}