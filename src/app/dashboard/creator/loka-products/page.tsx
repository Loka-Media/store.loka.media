'use client';

import React, { useState, useEffect } from 'react';
import { Store, Search, Plus, Check, Loader2, ArrowLeft } from 'lucide-react';
import { shopifyAPI } from '@/lib/api';
import Link from 'next/link';
import GradientTitle from '@/components/ui/GradientTitle';
import { Button } from '@/components/ui/button';
import CreativeLoader from '@/components/CreativeLoader';

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
    return <CreativeLoader variant="product" message="Loading Loka products..." />;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 sm:py-8">
            <Link
              href="/dashboard/creator"
              className="inline-flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base font-medium">Back</span>
            </Link>
          </div>
          <div className="pb-6 sm:pb-8">
            <GradientTitle text="Loka Products" size="lg" />
            <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">
              Browse and publish curated products to your marketplace
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-500/10 border-green-500/50'
              : 'bg-red-500/10 border-red-500/50'
          }`}>
            <div className="flex items-start gap-3">
              {message.type === 'success' ? (
                <Check className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <div className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5">⚠</div>
              )}
              <p className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-300' : 'text-red-300'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        )}

        {/* Search and Actions */}
        <div className="gradient-border-white-top p-6 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
                />
              </div>
            </form>

            {selectedProducts.length > 0 && (
              <button
                onClick={handlePublishSelected}
                disabled={publishing.length > 0}
                className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm sm:text-base gap-2"
              >
                {publishing.length > 0 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>Publish ({selectedProducts.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <div
              key={product.shopify_product_id}
              className={`group gradient-border-white-top overflow-hidden transition-all ${
                selectedProducts.includes(product.shopify_product_id)
                  ? 'ring-2 ring-purple-400'
                  : ''
              }`}
            >
              {/* Product Image */}
              <div className="relative bg-black/40 overflow-hidden" style={{ aspectRatio: '1/1' }}>
                {product.thumbnail_url || product.images?.[0] ? (
                  <img
                    src={product.thumbnail_url || product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Store className="w-12 h-12 text-gray-600" />
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.shopify_product_id)}
                    onChange={() => handleProductSelect(product.shopify_product_id)}
                    className="w-5 h-5 accent-purple-400 bg-white/20 border-2 border-white/40 rounded cursor-pointer"
                  />
                </div>

                {/* Published Badge */}
                {product.is_published_by_creator && (
                  <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold border border-green-500/50">
                    ✓ Published
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4 sm:p-6">
                <h3 className="font-bold text-white mb-4 line-clamp-2 text-sm sm:text-base group-hover:text-white/80 transition-colors">
                  {product.title}
                </h3>

                {/* Actions */}
                <Button
                  variant="secondary"
                  onClick={() => handlePublishSingle(product.shopify_product_id)}
                  disabled={product.is_published_by_creator || publishing.includes(product.shopify_product_id)}
                  className={`w-full !px-4 !py-2.5 sm:!py-3 !text-xs sm:!text-sm !rounded-lg ${
                    product.is_published_by_creator
                      ? '!bg-gray-500/20 !text-gray-400 cursor-not-allowed border border-gray-500/50'
                      : publishing.includes(product.shopify_product_id)
                      ? '!bg-purple-500/20 !text-purple-400 cursor-not-allowed border border-purple-500/50'
                      : ''
                  }`}
                >
                  <div className="inline-flex items-center gap-2">
                    {publishing.includes(product.shopify_product_id) ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publishing...
                      </>
                    ) : product.is_published_by_creator ? (
                      <>
                        <Check className="w-4 h-4" />
                        Published
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Publish
                      </>
                    )}
                  </div>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex items-center justify-center gap-3">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            <span className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-300 bg-white/10 rounded-lg border border-white/20">
              <span className="text-white font-bold">{currentPage}</span> of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}

        {/* Empty State */}
        {products.length === 0 && !loading && (
          <div className="gradient-border-white-top p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="text-orange-400 mb-6">
              <Store className="mx-auto w-16 h-16 sm:w-20 sm:h-20" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">No products found</h3>
            <p className="text-sm sm:text-base text-gray-400">
              {searchTerm ? 'Try adjusting your search terms.' : 'No Loka products are available yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}