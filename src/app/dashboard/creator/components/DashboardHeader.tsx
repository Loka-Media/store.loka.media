'use client';

import { ExternalLink, Package } from 'lucide-react';
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
    <div className="bg-gray-900/50 backdrop-blur-sm border-b border-orange-500/20">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Creator Dashboard</h1>
            <p className="mt-1 text-base text-gray-400">
              Manage your products, integrations, and sales performance.
            </p>
          </div>
          
          {connection?.connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/creator/products"
                className="inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 hover:border-orange-500 transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                My Products
              </Link>
            </div>
          ) : (
            <button
              onClick={onConnectPrintful}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Connect Printful Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}