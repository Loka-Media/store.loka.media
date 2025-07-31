'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingBag, Store, Check, ExternalLink } from 'lucide-react';
import { shopifyAPI } from '@/lib/api';
import { ShopifyProduct } from '@/lib/api';

interface ProductWithStatus extends ShopifyProduct {
  isPublishedByCreator: boolean;
}

export default function ShopifyProductsPage() {
  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [publishing, setPublishing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchProducts = async (page = 1, search = '') => {
    try {
      setLoading(true);
      const response = await shopifyAPI.getAvailableProducts({
        page,
        limit: 20,
        search
      });
      
      if (page === 1) {
        setProducts(response.products || []);
      } else {
        setProducts(prev => [...prev, ...(response.products || [])]);
      }
      
      setHasMore(response.hasMore || false);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(1, searchTerm);
  }, [searchTerm]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const toggleProductSelection = (productId: number) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handlePublishSelected = async () => {
    if (selectedProducts.size === 0) return;
    
    try {
      setPublishing(true);
      const productIds = Array.from(selectedProducts);
      const response = await shopifyAPI.publishProductsToMarketplace(productIds);
      
      // Update products to show they're now published
      setProducts(prev => prev.map(product => 
        selectedProducts.has(product.id) 
          ? { ...product, isPublishedByCreator: true }
          : product
      ));
      
      setSelectedProducts(new Set());
      
      alert(`Successfully published ${response.totalPublished} products to marketplace!`);
    } catch (error) {
      console.error('Failed to publish products:', error);
      alert('Failed to publish products. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchProducts(currentPage + 1, searchTerm);
    }
  };

  const availableProducts = products.filter(p => !p.isPublishedByCreator);
  const selectedCount = selectedProducts.size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Shopify Product Catalog</h1>
                <p className="text-sm text-gray-500">
                  Choose from 40K+ products to add to your marketplace
                </p>
              </div>
            </div>
            
            {selectedCount > 0 && (
              <button
                onClick={handlePublishSelected}
                disabled={publishing}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>
                  {publishing ? 'Publishing...' : `Publish ${selectedCount} Product${selectedCount > 1 ? 's' : ''}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Available</p>
                <p className="text-2xl font-bold text-gray-900">{availableProducts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Already Published</p>
                <p className="text-2xl font-bold text-gray-900">{products.filter(p => p.isPublishedByCreator).length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-gray-900">{selectedCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading && currentPage === 1 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                    product.isPublishedByCreator ? 'opacity-60' : ''
                  }`}
                >
                  <div className="relative">
                    {product.images && product.images.length > 0 && (
                      <img
                        src={product.images[0].src}
                        alt={product.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    )}
                    
                    {product.isPublishedByCreator ? (
                      <div className="absolute top-3 right-3 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Published</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 ${
                          selectedProducts.has(product.id)
                            ? 'bg-green-500 border-green-500'
                            : 'bg-white border-gray-300'
                        } flex items-center justify-center`}
                      >
                        {selectedProducts.has(product.id) && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                      {product.title}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>{product.vendor}</span>
                      <span className="font-medium">
                        ${product.variants?.[0]?.price || '0.00'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {product.variants?.length || 0} variant{product.variants?.length !== 1 ? 's' : ''}
                      </span>
                      
                      <button
                        onClick={() => window.open(`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/products/${product.handle}`, '_blank')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && !loading && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50"
                >
                  Load More Products
                </button>
              </div>
            )}

            {loading && currentPage > 1 && (
              <div className="flex justify-center mt-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}