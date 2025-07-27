"use client";

import {
  ExternalLink,
  Package,
  Upload,
  ShoppingCart,
  Palette,
} from "lucide-react";

export default function ConnectPrintfulCard({
  onConnect,
  isExpired,
}: {
  onConnect: () => void;
  isExpired?: boolean;
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-center">
          <Package className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            {isExpired ? "Reconnect to Printful" : "Connect to Printful"}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {isExpired
              ? "Your Printful connection has expired. Please reconnect to continue using Printful services."
              : "Connect your Printful account to access print-on-demand services including product catalog, file uploads, and order management."}
          </p>

          {/* Features list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <ShoppingCart className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Product Catalog</p>
                <p className="text-sm text-gray-500">
                  Browse and access Printful&apos;s product catalog
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Upload className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">File Upload</p>
                <p className="text-sm text-gray-500">
                  Upload design files to Printful
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Sync Products</p>
                <p className="text-sm text-gray-500">
                  Create and manage sync products
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Palette className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Design Canvas</p>
                <p className="text-sm text-gray-500">
                  Access Printful&apos;s design tools
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onConnect}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {isExpired
              ? "Reconnect Printful Account"
              : "Connect Printful Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
