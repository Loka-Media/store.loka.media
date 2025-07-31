'use client';

import { ShoppingBag, Plus, Upload, Palette, Store } from 'lucide-react';
import Link from 'next/link';

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
      <Link
        href="/dashboard/creator/catalog"
        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Browse Catalog</h3>
              <p className="text-sm text-gray-500">Explore Printful products</p>
            </div>
          </div>
        </div>
      </Link>

      <Link
        href="/dashboard/creator/products/create"
        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Create Product</h3>
              <p className="text-sm text-gray-500">Add new product</p>
            </div>
          </div>
        </div>
      </Link>

      <Link
        href="/dashboard/creator/files"
        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
              <p className="text-sm text-gray-500">Manage design files</p>
            </div>
          </div>
        </div>
      </Link>

      <Link
        href="/dashboard/creator/canvas"
        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Design Canvas</h3>
              <p className="text-sm text-gray-500">Create designs</p>
            </div>
          </div>
        </div>
      </Link>

      <Link
        href="/dashboard/creator/shopify-products"
        className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
      >
        <div className="p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <Store className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Shopify Products</h3>
              <p className="text-sm text-gray-500">Browse & publish products</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
