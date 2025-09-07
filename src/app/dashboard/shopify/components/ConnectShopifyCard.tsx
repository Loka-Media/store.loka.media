"use client";

import { useState } from "react";
import { Store, ArrowRight, AlertCircle } from "lucide-react";

export default function ConnectShopifyCard({
  onConnect,
  loading = false,
  error,
}: {
  onConnect: (shopDomain: string) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const [shopDomain, setShopDomain] = useState("");
  const [domainError, setDomainError] = useState("");

  const validateAndConnect = () => {
    // Reset errors
    setDomainError("");

    // Validate shop domain
    if (!shopDomain.trim()) {
      setDomainError("Please enter your shop domain");
      return;
    }

    // Clean up domain (remove .myshopify.com if user added it)
    const cleanDomain = shopDomain
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\.myshopify\.com$/, '')
      .replace(/\/$/, '');

    // Basic validation
    if (cleanDomain.length < 3) {
      setDomainError("Shop domain must be at least 3 characters");
      return;
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/.test(cleanDomain)) {
      setDomainError("Invalid shop domain format");
      return;
    }

    onConnect(cleanDomain);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndConnect();
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <Store className="h-6 w-6 text-green-600" />
            </div>
            
            <h3 className="mt-4 text-lg leading-6 font-medium text-gray-900">
              Connect Your Shopify Store
            </h3>
            
            <p className="mt-2 text-sm text-gray-500">
              Connect your Shopify store to sync products to the Loka marketplace.
              One-time setup enables access for all your creators.
            </p>
          </div>

          <div className="mt-6">
            <label htmlFor="shop-domain" className="block text-sm font-medium text-gray-700">
              Shop Domain
            </label>
            <div className="mt-1 relative">
              <input
                id="shop-domain"
                type="text"
                placeholder="your-store-name"
                value={shopDomain}
                onChange={(e) => setShopDomain(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                  domainError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <span className="text-gray-400 text-sm">.myshopify.com</span>
              </div>
            </div>
            
            {domainError && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {domainError}
              </div>
            )}
            
            {error && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle className="w-4 h-4 mr-2" />
                {error}
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={validateAndConnect}
              disabled={loading || !shopDomain.trim()}
              className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin -ml-1 mr-3 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Connecting...
                </>
              ) : (
                <>
                  Connect Store
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              By connecting, you&apos;ll be redirected to Shopify to authorize access.
              This is a secure OAuth process and we never store your Shopify password.
            </p>
          </div>

          {/* Example domains */}
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500 mb-2">Examples of valid shop domains:</p>
            <div className="text-xs text-gray-400 space-y-1">
              <div>• my-awesome-store</div>
              <div>• boutique-shop-2024</div>
              <div>• your-brand-name</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}