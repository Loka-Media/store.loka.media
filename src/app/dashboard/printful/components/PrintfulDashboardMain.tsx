"use client";

import { PrintfulConnection } from "@/lib/printful";
import {
  Package,
  Upload,
  ShoppingCart,
  Palette,
} from "lucide-react";
import QuickActionCard from "./QuickActionCard";



export default function PrintfulDashboardMain({
  connection,
  onDisconnect,
}: {
  connection: PrintfulConnection;
  onDisconnect: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Connection Info Card */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Printful Connection
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>
                  Connected:{" "}
                  {new Date(connection.connectedAt!).toLocaleDateString()}
                </p>
                <p>Scope: {connection.scope}</p>
              </div>
            </div>
            <button
              onClick={onDisconnect}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Browse Catalog"
          description="Explore Printful product catalog"
          icon={<ShoppingCart className="w-8 h-8" />}
          color="bg-blue-500"
        />
        <QuickActionCard
          title="Upload Files"
          description="Upload design files to Printful"
          icon={<Upload className="w-8 h-8" />}
          color="bg-green-500"
        />
        <QuickActionCard
          title="Sync Products"
          description="Manage your sync products"
          icon={<Package className="w-8 h-8" />}
          color="bg-purple-500"
        />
        <QuickActionCard
          title="Design Canvas"
          description="Access Printful design tools"
          icon={<Palette className="w-8 h-8" />}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Activity or Stats could go here */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Getting Started
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                  <span className="text-sm font-medium text-indigo-600">1</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Browse the Catalog
                </p>
                <p className="text-sm text-gray-500">
                  Explore available products and variants
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                  <span className="text-sm font-medium text-indigo-600">2</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Upload Your Designs
                </p>
                <p className="text-sm text-gray-500">
                  Upload artwork and design files
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                  <span className="text-sm font-medium text-indigo-600">3</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Create Sync Products
                </p>
                <p className="text-sm text-gray-500">
                  Combine products with your designs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}