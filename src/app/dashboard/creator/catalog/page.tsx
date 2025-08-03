/* disable-eslint */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { printfulAPI } from '@/lib/api';
import { Search, Package, Plus, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  title: string;
  parent_id: number;
  image_url?: string;
  catalog_position?: number;
  size?: string;
}

interface PrintfulProduct {
  id: number;
  type: string;
  type_name: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  title: string;
  description?: string;
  main_category_id: number;
  is_discontinued: boolean;
  avg_fulfillment_time?: number;
  techniques?: Array<{
    key: string;
    display_name: string;
    is_default: boolean;
  }>;
  files?: Array<{
    id: string;
    type: string;
    title: string;
    additional_price: string | null;
    options: unknown[];
  }>;
  options?: unknown[];
  dimensions?: unknown;
  origin_country?: string;
  variants?: Array<{
    id: number;
    product_id: number;
    name: string;
    size: string;
    color: string;
    color_code: string;
    color_code2?: string;
    image: string;
    price: string;
    in_stock: boolean;
    availability_regions: Record<string, string>;
    availability_status: Array<{
      region: string;
      status: string;
    }>;
  }>;
}

export default function CreatorCatalogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<PrintfulProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PrintfulProduct | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    sortBy: 'name',
    sortOrder: 'ASC'
  });

  const fetchCatalog = useCallback(async () => {
    try {
      setLoading(true);
      const response = await printfulAPI.getCatalog(filters);
      setProducts(response.result || []);
    } catch (error) {
      console.error('Failed to fetch catalog:', error);
      toast.error('Failed to load Printful catalog');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      return;
    }
    
    fetchCatalog();
    fetchCategories();
  }, [user, fetchCatalog]);

  const fetchCategories = async () => {
    try {
      const response = await printfulAPI.getCategories();
      setCategories(response.result?.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleCreateProduct = (printfulProduct: PrintfulProduct) => {
    // Store selected product in localStorage and navigate to design workflow
    console.log('Storing product and navigating:', printfulProduct);
    localStorage.setItem('selectedPrintfulProduct', JSON.stringify(printfulProduct));
    
    // Navigate to design canvas workflow with 4 steps
    router.push(`/dashboard/creator/canvas?productId=${printfulProduct.id}`);
  };

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/creator"
                className="inline-flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Printful Catalog</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Browse products to create your custom designs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Search */}
              <form onSubmit={handleSearch} className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Products
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="Search products..."
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  type="submit"
                  className="w-full mt-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
                >
                  Search
                </button>
              </form>

              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                >
                  <option value="name-ASC">Name: A to Z</option>
                  <option value="name-DESC">Name: Z to A</option>
                  <option value="brand-ASC">Brand: A to Z</option>
                  <option value="brand-DESC">Brand: Z to A</option>
                </select>
              </div>

              <button
                onClick={fetchCatalog}
                className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${products.length} products found`}
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading Printful catalog...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your search or filter criteria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <PrintfulProductCard 
                    key={product.id} 
                    product={product} 
                    onCreateProduct={handleCreateProduct}
                    onViewDetails={setSelectedProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductDetailsModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)}
          onCreateProduct={handleCreateProduct}
        />
      )}
    </div>
  );
}

function PrintfulProductCard({ 
  product, 
  onCreateProduct, 
  onViewDetails 
}: { 
  product: PrintfulProduct;
  onCreateProduct: (product: PrintfulProduct) => void;
  onViewDetails: (product: PrintfulProduct) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <Image
          src={product.image || '/placeholder-product.png'}
          alt={product.title || product.model}
          fill
          className="object-cover"
        />
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm">
          {product.title || product.model}
        </h3>
        <p className="text-xs text-gray-600 mt-1">
          {product.brand}
        </p>
        
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-500">
            {product.variant_count} variants
          </span>
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
            {product.type_name || product.type}
          </span>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <button
            onClick={() => onViewDetails(product)}
            className="flex-1 flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </button>
          <button
            onClick={() => onCreateProduct(product)}
            className="flex-1 flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductDetailsModal({ 
  product, 
  onClose, 
  onCreateProduct 
}: { 
  product: PrintfulProduct;
  onClose: () => void;
  onCreateProduct: (product: PrintfulProduct) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{product.title || product.model}</h2>
              <p className="text-gray-600">{product.brand}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={product.image || '/placeholder-product.png'}
                  alt={product.title || product.model}
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Details</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Type:</span> {product.type_name || product.type}</div>
                  <div><span className="font-medium">Brand:</span> {product.brand}</div>
                  <div><span className="font-medium">Variants:</span> {product.variant_count}</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Available Variants</h3>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {product.variants?.slice(0, 8).map((variant) => (
                    <div key={variant.id} className="flex items-center space-x-2 text-xs">
                      <div 
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: variant.color_code || '#ccc' }}
                      ></div>
                      <span>{variant.size} - {variant.color}</span>
                    </div>
                  ))}
                  {product.variants && product.variants.length > 8 && (
                    <div className="text-xs text-gray-500 col-span-2">
                      +{product.variants.length - 8} more variants
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => onCreateProduct(product)}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Product with This Design
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}