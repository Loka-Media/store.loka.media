'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Shield, AlertCircle, CheckCircle, Loader, Settings } from 'lucide-react';
import { shopifyAPI } from '@/lib/api';

export default function AdminShopifyPage() {
  const [/* router */] = [useRouter()];
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<{ connected: boolean; shopDomain?: string } | null>(null);
  const [shopDomain, setShopDomain] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setLoading(true);
      const status = await shopifyAPI.getConnectionStatus();
      setConnectionStatus(status);
    } catch (error) {
      console.error('Failed to check connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopDomain.trim()) {
      setMessage({ type: 'error', text: 'Please enter a shop domain' });
      return;
    }

    try {
      setConnecting(true);
      setMessage(null);
      
      const response = await shopifyAPI.initializeAuth(shopDomain.trim());
      
      if (response.needsAuth && response.authUrl) {
        // Redirect to Shopify OAuth
        window.location.href = response.authUrl;
      } else if (response.connected) {
        setMessage({ type: 'success', text: 'Shopify connection is already active!' });
        setConnectionStatus(response);
      }
    } catch (error: unknown) {
      console.error('Connection failed:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message || (error as { message?: string })?.message || 'Connection failed';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect the shared Shopify store? This will affect all creators.')) {
      return;
    }

    try {
      await shopifyAPI.disconnect();
      setMessage({ type: 'success', text: 'Shopify connection disconnected successfully' });
      setConnectionStatus(null);
    } catch (error: unknown) {
      console.error('Disconnect failed:', error);
      setMessage({ type: 'error', text: 'Failed to disconnect Shopify store' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-400">Checking connection status...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin: Shopify Configuration</h1>
              <p className="mt-2 text-sm text-gray-400">
                Configure the shared Shopify store that all creators will access
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-900/30 border border-green-700/50' : 'bg-red-900/30 border border-red-700/50'
          }`}>
            <div className="flex">
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <div className="ml-3">
                <p className={`text-sm ${
                  message.type === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connection Status */}
        {connectionStatus?.connected ? (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow border border-gray-700/50 p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Connected Store</h2>
                  <p className="text-sm text-gray-400">Shared Shopify store is active</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-green-900/30 text-green-300 rounded-full text-sm font-medium border border-green-700/50">
                  Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <p className="text-sm font-medium text-gray-400">Shop Domain</p>
                <p className="text-lg font-semibold text-white">{connectionStatus.shopDomain}</p>
              </div>
              <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
                <p className="text-sm font-medium text-gray-400">Connection Type</p>
                <p className="text-lg font-semibold text-white">Shared Admin Access</p>
              </div>
            </div>

            <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Settings className="h-5 w-5 text-orange-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-300">How It Works</h3>
                  <p className="mt-1 text-sm text-orange-200">
                    This shared connection allows all creators to browse and publish products from your central Shopify store.
                    Each creator can select products and publish them to their marketplace with full ownership.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Disconnect Shared Store
            </button>
          </div>
        ) : (
          /* Setup Form */
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg shadow border border-gray-700/50 p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white mb-2">Set Up Shared Shopify Store</h2>
              <p className="text-sm text-gray-400">
                Connect your Shopify store to make 40K+ products available to all creators on the platform.
              </p>
            </div>

            <form onSubmit={handleConnect} className="space-y-6">
              <div>
                <label htmlFor="shopDomain" className="block text-sm font-medium text-gray-300 mb-2">
                  Shop Domain
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="shopDomain"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    placeholder="mystore"
                    className="flex-1 px-3 py-2 border border-gray-700 rounded-l-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-500"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-800/50 border border-l-0 border-gray-700 rounded-r-lg text-sm text-gray-400">
                    .myshopify.com
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400">
                  Enter your Shopify store domain (without .myshopify.com)
                </p>
              </div>

              <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-orange-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-orange-300">Important</h3>
                    <div className="mt-1 text-sm text-orange-200">
                      <ul className="list-disc list-inside space-y-1">
                        <li>You&apos;ll be redirected to Shopify to authorize the connection</li>
                        <li>This will give all creators access to browse your products</li>
                        <li>Creators can only publish products to the marketplace, not modify your store</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={connecting}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {connecting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <Store className="w-5 h-5" />
                    <span>Connect Shopify Store</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Information */}
        <div className="mt-8 bg-gray-900 rounded-lg border border-gray-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">What This Enables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-2">For Creators:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Browse 40K+ products from your store</li>
                <li>• Search and filter products easily</li>
                <li>• Publish selected products to marketplace</li>
                <li>• Gain ownership of published products</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">For Your Business:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Centralized product management</li>
                <li>• Increased product visibility</li>
                <li>• Creator-driven marketing</li>
                <li>• Maintain full store control</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}