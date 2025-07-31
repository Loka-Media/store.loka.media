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

export default function ShopifyProductsPage() {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader className="w-8 h-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-500">Loading Shopify products...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopify Products</h1>
            <p className="mt-2 text-sm text-gray-600">
              Browse and publish products from our Shopify store to your marketplace
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
              <Check className="h-5 w-5 text-green-400" />
            ) : (
              <div className="h-5 w-5 text-red-400">⚠</div>
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

      {/* Search and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </form>

        {selectedProducts.length > 0 && (
          <button
            onClick={handlePublishSelected}
            disabled={publishing.length > 0}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
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
            className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all ${
              selectedProducts.includes(product.shopify_product_id)
                ? 'border-green-500 ring-2 ring-green-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Product Image */}
            <div className="relative h-48 bg-gray-100">
              {product.thumbnail_url || product.images?.[0] ? (
                <img
                  src={product.thumbnail_url || product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Store className="w-12 h-12 text-gray-400" />
                </div>
              )}
              
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.shopify_product_id)}
                  onChange={() => handleProductSelect(product.shopify_product_id)}
                  className="w-5 h-5 text-green-600 border-2 border-white rounded focus:ring-green-500"
                />
              </div>

              {/* Published Badge */}
              {product.is_published_by_creator && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Published
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {product.title}
              </h3>
              
              <div className="space-y-1 text-sm text-gray-600 mb-4">
                {product.vendor && (
                  <p><span className="font-medium">Brand:</span> {product.vendor}</p>
                )}
                {product.product_type && (
                  <p><span className="font-medium">Type:</span> {product.product_type}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handlePublishSingle(product.shopify_product_id)}
                  disabled={product.is_published_by_creator || publishing.includes(product.shopify_product_id)}
                  className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-lg ${
                    product.is_published_by_creator
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : publishing.includes(product.shopify_product_id)
                      ? 'bg-green-100 text-green-700 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {publishing.includes(product.shopify_product_id) ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin mr-1" />
                      Publishing...
                    </>
                  ) : product.is_published_by_creator ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Published
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1" />
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
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <span className="px-3 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="text-center py-12">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search terms.' : 'No Shopify products are available yet.'}
          </p>
        </div>
      )}
    </div>
  );
}