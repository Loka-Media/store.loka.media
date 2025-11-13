'use client';

import { ExternalLink, Package, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface ConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
}

interface DashboardHeaderProps {
  connection: ConnectionStatus | null;
  onConnectPrintful: () => void;
}

export function EnhancedDashboardHeader({ connection, onConnectPrintful }: DashboardHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-yellow-100 via-pink-100 to-purple-100 border-b-4 border-black">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center">
          <div className="mb-6 sm:mb-0">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-4 bg-gradient-to-br from-purple-400 to-pink-400 border-4 border-black rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight">
                  Creator Dashboard
                </h1>
                <p className="mt-2 text-lg font-bold text-gray-800">
                  Manage your products, integrations, and sales performance
                </p>
              </div>
            </div>
          </div>

          {connection?.connected ? (
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/dashboard/creator/products"
                className="inline-flex items-center px-6 py-3 bg-white border-4 border-black rounded-xl font-extrabold text-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg"
              >
                <Package className="w-5 h-5 mr-2" />
                My Products
              </Link>
            </div>
          ) : (
            <button
              onClick={onConnectPrintful}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-400 to-red-400 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg"
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              Connect Printful Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
