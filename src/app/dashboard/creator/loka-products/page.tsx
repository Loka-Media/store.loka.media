'use client';

import React, { useState, useEffect } from 'react';
import { Store, Search, Plus, Check, Loader } from 'lucide-react';
import { shopifyAPI } from '@/lib/api';

interface ShopifyProduct {
  id: number;
  shopify_product_id: string;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  thumbnail_url: string;
  images: string[];
  is_published_by_creator: boolean;
}

export default function LokaProductsPage() {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchProducts = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await shopifyAPI.getAvailableProducts({
        page,
        limit: 20,
        search
      });
      
      setProducts(response.products);
      setCurrentPage(response.pagination.page);
      setTotalPages(response.pagination.totalPages);
    } catch (error: unknown) {
      console.error('Failed to fetch products:', error);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts(1, searchTerm);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handlePublishSelected = async () => {
    if (selectedProducts.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one product to publish' });
      return;
    }

    try {
      setPublishing(selectedProducts);
      setMessage(null);

      const response = await shopifyAPI.publishProductsToMarketplace(selectedProducts);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully published ${response.totalPublished} products to marketplace!` 
      });
      
      // Refresh the products list to update published status
      await fetchProducts(currentPage, searchTerm);
      setSelectedProducts([]);
    } catch (error: unknown) {
      console.error('Failed to publish products:', error);
      setMessage({ 
        type: 'error', 
        text: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish products' 
      });
    } finally {
      setPublishing([]);
    }
  };

  const handlePublishSingle = async (productId: string) => {
    try {
      setPublishing([productId]);
      setMessage(null);

      const response = await shopifyAPI.publishProductsToMarketplace([productId]);
      
      setMessage({ 
        type: 'success', 
        text: `Successfully published "${response.publishedProducts[0]?.title}" to marketplace!` 
      });
      
      // Refresh the products list
      await fetchProducts(currentPage, searchTerm);
    } catch (error: unknown) {
      console.error('Failed to publish product:', error);
      setMessage({ 
        type: 'error', 
        text: (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to publish product' 
      });
    } finally {
      setPublishing([]);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
            <span className="ml-2 text-gray-400">Loading Loka products...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Loka Products</h1>
              <p className="mt-2 text-base text-gray-400">
                Browse and publish curated products to your marketplace
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-900/20 border-green-500/30 backdrop-blur-sm' 
              : 'bg-red-900/20 border-red-500/30 backdrop-blur-sm'
          }`}>
            <div className="flex">
              {message.type === 'success' ? (
                <Check className="h-5 w-5 text-green-400" />
              ) : (
                <div className="h-5 w-5 text-red-400">⚠</div>
              )}
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  message.type === 'success' ? 'text-green-300' : 'text-red-300'
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors backdrop-blur-sm"
              />
            </div>
          </form>

          {selectedProducts.length > 0 && (
            <button
              onClick={handlePublishSelected}
              disabled={publishing.length > 0}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed space-x-2 shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {publishing.length > 0 ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>Publish Selected ({selectedProducts.length})</span>
            </button>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.shopify_product_id}
              className={`bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl overflow-hidden border-2 transition-all duration-300 transform hover:-translate-y-1 ${
                selectedProducts.includes(product.shopify_product_id)
                  ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-orange-500/20'
                  : 'border-gray-800 hover:border-gray-700 hover:shadow-2xl'
              }`}
            >
              {/* Product Image */}
              <div className="relative h-48 bg-gray-800/50">
                {product.thumbnail_url || product.images?.[0] ? (
                  <img
                    src={product.thumbnail_url || product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-600" />
                  </div>
                )}
                
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.shopify_product_id)}
                    onChange={() => handleProductSelect(product.shopify_product_id)}
                    className="w-5 h-5 text-orange-500 bg-gray-900 border-2 border-gray-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                </div>

                {/* Published Badge */}
                {product.is_published_by_creator && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                    Published
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="font-bold text-white mb-3 line-clamp-2 text-lg">
                  {product.title}
                </h3>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePublishSingle(product.shopify_product_id)}
                    disabled={product.is_published_by_creator || publishing.includes(product.shopify_product_id)}
                    className={`flex-1 inline-flex items-center justify-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 ${
                      product.is_published_by_creator
                        ? 'bg-gray-800/50 text-gray-400 cursor-not-allowed border border-gray-700'
                        : publishing.includes(product.shopify_product_id)
                        ? 'bg-orange-900/30 text-orange-300 cursor-not-allowed border border-orange-500/30'
                        : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 shadow-lg transform hover:-translate-y-0.5'
                    }`}
                  >
                    {publishing.includes(product.shopify_product_id) ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Publishing...
                      </>
                    ) : product.is_published_by_creator ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Published
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center space-x-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 text-sm font-semibold text-gray-300 bg-gray-900/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
            >
              Previous
            </button>
            
            <span className="px-6 py-3 text-sm font-medium text-white bg-gray-800/50 rounded-xl border border-gray-700 backdrop-blur-sm">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 text-sm font-semibold text-gray-300 bg-gray-900/50 border border-gray-700 rounded-xl hover:bg-gray-800 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Store className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-gray-400 text-lg">
              {searchTerm ? 'Try adjusting your search terms.' : 'No Loka products are available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}