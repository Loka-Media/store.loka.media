'use client';

import { ExternalLink, Package, Plus } from 'lucide-react';
import Link from 'next/link';

interface ConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
}

interface DashboardHeaderProps {
  connection: ConnectionStatus | null;
  onConnectPrintful: () => void;
}

export function DashboardHeader({ connection, onConnectPrintful }: DashboardHeaderProps) {
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your products and Printful integration
            </p>
          </div>
          
          {connection?.connected ? (
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Printful Ready (Admin Account)
              </span>
              <Link
                href="/dashboard/creator/products"
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <Package className="w-4 h-4 mr-2" />
                My Products
              </Link>
              <Link
                href="/dashboard/creator/products/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Product
              </Link>
            </div>
          ) : (
            <button
              onClick={onConnectPrintful}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Setup Printful Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}