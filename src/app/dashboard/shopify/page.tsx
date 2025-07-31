"use client";

import React from "react";
import { ShoppingBag, Store, Users, Plus, Search, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ShopifyDashboard() {

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopify Product Hub</h1>
            <p className="mt-2 text-sm text-gray-600">
              Access 40K+ products from our shared Shopify store and publish them to your marketplace
            </p>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <ShoppingBag className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">40K+ Products</h3>
          <p className="text-sm text-gray-600">
            Browse our extensive catalog of high-quality products ready for your marketplace
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Shared Store Model</h3>
          <p className="text-sm text-gray-600">
            All creators access the same product catalog - no individual store setup required
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Plus className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">One-Click Publishing</h3>
          <p className="text-sm text-gray-600">
            Select products and instantly publish them to your marketplace with full ownership
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Browse Products</h3>
              <p className="text-sm text-gray-600">
                Search and filter through 40K+ products from our shared Shopify store
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              2
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Select & Publish</h3>
              <p className="text-sm text-gray-600">
                Choose products you want and publish them to your marketplace instantly
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              3
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Own & Earn</h3>
              <p className="text-sm text-gray-600">
                Published products appear in your name and are visible to all marketplace users
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action */}
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Search className="w-8 h-8 text-green-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Browse Products?</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Explore our extensive product catalog and start building your marketplace. 
          All products are sourced from our centralized Shopify store and ready for immediate publishing.
        </p>
        
        <Link
          href="/dashboard/shopify/products"
          className="inline-flex items-center px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors space-x-2"
        >
          <span>Browse Product Catalog</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Admin Notice */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 text-sm font-bold">!</span>
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Admin Setup Required</h3>
            <p className="mt-1 text-sm text-yellow-700">
              If you don&apos;t see products available, please contact your administrator to set up the shared Shopify connection.
              Only administrators can configure the central store that all creators share.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}