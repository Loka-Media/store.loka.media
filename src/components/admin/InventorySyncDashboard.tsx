'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Package, ShoppingBag, TrendingUp, AlertCircle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { inventoryAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface SyncStats {
  sync_type: string;
  sync_status: string;
  count: number;
  last_sync: string;
}

const InventorySyncDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [syncStats, setSyncStats] = useState<SyncStats[]>([]);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  useEffect(() => {
    fetchSyncStats();
  }, []);

  const fetchSyncStats = async () => {
    try {
      const result = await inventoryAPI.getSyncStats();
      if (result.success) {
        setSyncStats(result.stats);
      }
    } catch (error) {
      console.error('Failed to fetch sync stats:', error);
    }
  };

  const handleSyncAll = async () => {
    setIsLoading(true);
    try {
      toast.loading('Syncing all inventory...', { id: 'sync-all' });
      const result = await inventoryAPI.syncAllInventory();
      
      if (result.success) {
        setLastSyncResult(result);
        toast.success(`Inventory sync completed! ${result.stats.total_synced}/${result.stats.total_products} products synced`, { id: 'sync-all' });
        await fetchSyncStats();
      } else {
        toast.error('Inventory sync failed', { id: 'sync-all' });
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`Sync failed: ${error.message}`, { id: 'sync-all' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncPrintful = async () => {
    setIsLoading(true);
    try {
      toast.loading('Syncing Printful inventory...', { id: 'sync-printful' });
      const result = await inventoryAPI.syncPrintfulInventory();
      
      if (result.success) {
        toast.success(`Printful sync completed! ${result.stats.synced}/${result.stats.total} products synced`, { id: 'sync-printful' });
        await fetchSyncStats();
      } else {
        toast.error('Printful sync failed', { id: 'sync-printful' });
      }
    } catch (error: any) {
      console.error('Printful sync error:', error);
      toast.error(`Printful sync failed: ${error.message}`, { id: 'sync-printful' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncShopify = async () => {
    setIsLoading(true);
    try {
      toast.loading('Syncing Shopify inventory...', { id: 'sync-shopify' });
      const result = await inventoryAPI.syncShopifyInventory();
      
      if (result.success) {
        toast.success(`Shopify sync completed! ${result.stats.synced}/${result.stats.total} products synced`, { id: 'sync-shopify' });
        await fetchSyncStats();
      } else {
        toast.error('Shopify sync failed', { id: 'sync-shopify' });
      }
    } catch (error: any) {
      console.error('Shopify sync error:', error);
      toast.error(`Shopify sync failed: ${error.message}`, { id: 'sync-shopify' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatsByType = (type: string) => {
    return syncStats.filter(stat => stat.sync_type === type);
  };

  const getTotalSyncCount = () => {
    return syncStats.reduce((total, stat) => total + parseInt(stat.count.toString()), 0);
  };

  const getLastSyncTime = () => {
    if (syncStats.length === 0) return null;
    return syncStats.reduce((latest, stat) => {
      return !latest || stat.last_sync > latest ? stat.last_sync : latest;
    }, null as string | null);
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return 'Never';
    return new Date(timeString).toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Sync and monitor inventory across Printful and Shopify</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSyncStats}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
          <button
            onClick={handleSyncAll}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 inline animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2 inline" />
            )}
            Sync All Inventory
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Syncs (24h)</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalSyncCount()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Printful Syncs</p>
              <p className="text-2xl font-bold text-gray-900">
                {getStatsByType('printful').reduce((sum, stat) => sum + parseInt(stat.count.toString()), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <ShoppingBag className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Shopify Syncs</p>
              <p className="text-2xl font-bold text-gray-900">
                {getStatsByType('shopify').reduce((sum, stat) => sum + parseInt(stat.count.toString()), 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Last Sync</p>
              <p className="text-sm font-bold text-gray-900">{formatTime(getLastSyncTime())}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <Package className="w-6 h-6 text-green-600" />
            <h3 className="ml-2 text-lg font-semibold text-gray-900">Printful Inventory</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Sync print-on-demand inventory status from Printful. Shows in-stock/out-of-stock status.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Last sync: {formatTime(getStatsByType('printful')[0]?.last_sync)}
              </p>
            </div>
            <button
              onClick={handleSyncPrintful}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 inline animate-spin" />
              ) : (
                <Package className="w-4 h-4 mr-2 inline" />
              )}
              Sync Printful
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center mb-4">
            <ShoppingBag className="w-6 h-6 text-purple-600" />
            <h3 className="ml-2 text-lg font-semibold text-gray-900">Shopify Inventory</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Sync dropship inventory quantities from Shopify. Shows actual quantities from Trendsi.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Last sync: {formatTime(getStatsByType('shopify')[0]?.last_sync)}
              </p>
            </div>
            <button
              onClick={handleSyncShopify}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 inline animate-spin" />
              ) : (
                <ShoppingBag className="w-4 h-4 mr-2 inline" />
              )}
              Sync Shopify
            </button>
          </div>
        </div>
      </div>

      {/* Last Sync Result */}
      {lastSyncResult && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Last Sync Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-green-800">Total Synced</p>
                <p className="text-lg font-bold text-green-900">{lastSyncResult.stats.total_synced}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-red-800">Errors</p>
                <p className="text-lg font-bold text-red-900">{lastSyncResult.stats.total_errors}</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <Package className="w-5 h-5 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-800">Total Products</p>
                <p className="text-lg font-bold text-blue-900">{lastSyncResult.stats.total_products}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sync History */}
      {syncStats.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sync Activity</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-gray-900">Source</th>
                  <th className="text-left py-2 font-medium text-gray-900">Status</th>
                  <th className="text-left py-2 font-medium text-gray-900">Count</th>
                  <th className="text-left py-2 font-medium text-gray-900">Last Sync</th>
                </tr>
              </thead>
              <tbody>
                {syncStats.map((stat, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">
                      <div className="flex items-center">
                        {stat.sync_type === 'printful' ? (
                          <Package className="w-4 h-4 text-green-500 mr-2" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 text-purple-500 mr-2" />
                        )}
                        <span className="capitalize font-medium">{stat.sync_type}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        stat.sync_status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {stat.sync_status}
                      </span>
                    </td>
                    <td className="py-2 font-medium">{stat.count}</td>
                    <td className="py-2 text-gray-600">{formatTime(stat.last_sync)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySyncDashboard;