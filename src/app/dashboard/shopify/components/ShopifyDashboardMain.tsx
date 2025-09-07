"use client";

import { ShopifyConnectionStatus } from "@/lib/api";
import {
  Package,
  RefreshCw,
  ShoppingCart,
  Store,
  Webhook,
  Unlink,
} from "lucide-react";
import QuickActionCard from "../../printful/components/QuickActionCard";

export default function ShopifyDashboardMain({
  connection,
  onDisconnect,
  onSyncProducts,
  onSetupWebhooks,
}: {
  connection: ShopifyConnectionStatus;
  onDisconnect: () => void;
  onSyncProducts: () => void;
  onSetupWebhooks: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Connection Info Card */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Shopify Connection
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Connected:{" "}
                  {connection.connectedAt 
                    ? new Date(connection.connectedAt).toLocaleDateString()
                    : 'Recently'
                  }
                </p>
                {connection.shopInfo && (
                  <>
                    <p>Shop: {connection.shopInfo.name}</p>
                    <p>Domain: {connection.shopInfo.domain}</p>
                  </>
                )}
                <p className="text-green-600 text-xs mt-1">
                  ✓ {connection.message}
                </p>
              </div>
            </div>
            <button
              onClick={onDisconnect}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div onClick={onSyncProducts} className="cursor-pointer">
          <QuickActionCard
            title="Sync Products"
            description="Import your Shopify products to marketplace"
            icon={<RefreshCw className="w-8 h-8" />}
            color="bg-blue-500"
          />
        </div>
        
        <QuickActionCard
          title="View Products"
          description="Browse your Shopify store products"
          icon={<ShoppingCart className="w-8 h-8" />}
          color="bg-green-500"
        />
        
        <QuickActionCard
          title="Manage Store"
          description="View shop information and settings"
          icon={<Store className="w-8 h-8" />}
          color="bg-purple-500"
        />
        
        <div onClick={onSetupWebhooks} className="cursor-pointer">
          <QuickActionCard
            title="Setup Webhooks"
            description="Enable real-time product updates"
            icon={<Webhook className="w-8 h-8" />}
            color="bg-orange-500"
          />
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Getting Started with Shopify
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                  <span className="text-sm font-medium text-green-600">1</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Sync Your Products
                </p>
                <p className="text-sm text-gray-500">
                  Import all products from your Shopify store to the marketplace
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                  <span className="text-sm font-medium text-green-600">2</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Set Up Webhooks
                </p>
                <p className="text-sm text-gray-500">
                  Enable automatic updates when you modify products in Shopify
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                  <span className="text-sm font-medium text-green-600">3</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Products Go Live
                </p>
                <p className="text-sm text-gray-500">
                  Your Shopify products will appear in the Loka marketplace
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features & Benefits */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Shopify Integration Benefits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Package className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Automatic Sync
                </p>
                <p className="text-sm text-gray-500">
                  Products sync automatically with real-time updates
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <ShoppingCart className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Inventory Management
                </p>
                <p className="text-sm text-gray-500">
                  Inventory levels stay synchronized across platforms
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Store className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Brand Consistency
                </p>
                <p className="text-sm text-gray-500">
                  Maintain consistent product information across channels
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Easy Management
                </p>
                <p className="text-sm text-gray-500">
                  Manage products from one place, update everywhere
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}