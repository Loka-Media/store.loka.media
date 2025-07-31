'use client';

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Store, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { shopifyAPI } from '@/lib/api';

export default function ShopifySyncPage() {
  const [syncStatus, setSyncStatus] = useState<{ connected?: boolean; shopDomain?: string; totalProducts?: number; totalPublished?: number; available?: number; status?: string; lastSync?: string; shopInfo?: { shopName: string } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSyncStatus();
    
    // Check for OAuth callback success
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const setup = urlParams.get('setup');
    const error = urlParams.get('error');

    if (connected === 'true' && setup === 'complete') {
      setMessage({ type: 'success', text: 'Shopify integration connected successfully!' });
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh status
      setTimeout(() => {
        fetchSyncStatus();
      }, 1000);
    }

    if (error) {
      setMessage({ type: 'error', text: `OAuth error: ${error}` });
    }
  }, []);

  const fetchSyncStatus = async () => {
    try {
      setLoading(true);
      const status = await shopifyAPI.getSyncStatus();
      setSyncStatus(status);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setConnecting(true);
      setMessage(null);
      
      const response = await shopifyAPI.testShopifyConnection();
      
      if (response.connected) {
        setMessage({ type: 'success', text: `Connected to ${response.shopInfo.shopName}!` });
        setSyncStatus({ ...syncStatus, connected: true, shopInfo: response.shopInfo });
      }
    } catch (error: unknown) {
      console.error('Connection test failed:', error);
      setMessage({ type: 'error', text: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Connection failed' });
      setSyncStatus({ ...syncStatus, connected: false });
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncProducts = async () => {
    try {
      setSyncing(true);
      setMessage(null);
      
      const result = await shopifyAPI.syncAllProducts();
      
      setMessage({ 
        type: 'success', 
        text: `Successfully synced ${result.totalSynced} products from Shopify!` 
      });
      
      // Refresh status
      await fetchSyncStatus();
    } catch (error: unknown) {
      console.error('Sync failed:', error);
      setMessage({ 
        type: 'error', 
        text: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to sync products. Please try again.' 
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading sync status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopify Product Sync</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sync products from {syncStatus?.shopDomain} to the marketplace database
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <div className="ml-3">
              <p className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Store className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus?.totalProducts || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Published by Creators</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus?.totalPublished || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus?.available || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`w-12 h-12 ${
              syncStatus?.status === 'synced' ? 'bg-green-100' : 'bg-yellow-100'
            } rounded-lg flex items-center justify-center`}>
              <RefreshCw className={`w-6 h-6 ${
                syncStatus?.status === 'synced' ? 'text-green-600' : 'text-yellow-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sync Status</p>
              <p className={`text-sm font-semibold ${
                syncStatus?.status === 'synced' ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {syncStatus?.status === 'synced' ? 'Up to Date' : 'Needs Sync'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Information */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Sync Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Store Details</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p><span className="font-medium">Shop Domain:</span> {syncStatus?.shopDomain}</p>
              <p><span className="font-medium">API:</span> Shopify Storefront API</p>
              <p><span className="font-medium">Connection:</span> Direct (No OAuth)</p>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Last Sync</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>
                {syncStatus?.lastSync 
                  ? new Date(syncStatus.lastSync).toLocaleString()
                  : 'Never synced'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Connection / Sync Action */}
      {!syncStatus?.connected ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8 text-blue-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Shopify Connection</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Test the connection to your Shopify private app. This uses the access token 
            from your store admin - no OAuth required.
          </p>
          
          {connecting ? (
            <div className="flex items-center justify-center space-x-3">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-lg font-medium text-gray-700">Testing connection...</span>
            </div>
          ) : (
            <button
              onClick={handleTestConnection}
              className="inline-flex items-center px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors space-x-2"
            >
              <Store className="w-5 h-5" />
              <span>Test Connection</span>
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Download className="w-8 h-8 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Sync Products from Shopify</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            This will fetch all products from your Shopify store and make them available 
            for creators to browse and publish to the marketplace. This process may take a few minutes.
          </p>
          
          {syncing ? (
            <div className="flex items-center justify-center space-x-3">
              <Loader className="w-6 h-6 animate-spin text-green-600" />
              <span className="text-lg font-medium text-gray-700">Syncing products...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleSyncProducts}
                className="inline-flex items-center px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors space-x-2"
              >
                <RefreshCw className="w-5 h-5" />
                <span>
                  {syncStatus?.status === 'synced' ? 'Re-sync Products' : 'Start Product Sync'}
                </span>
              </button>
              
            </div>
          )}
        </div>
      )}

      {/* Environment Setup Notice */}
      <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-green-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">Private App Integration</h3>
            <p className="mt-1 text-sm text-green-700">
              Using private app access token from <code>e9bb88-2.myshopify.com</code> store admin.
              Direct API access - no OAuth complexity required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}