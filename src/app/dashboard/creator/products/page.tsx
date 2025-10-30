'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { productAPI, formatPrice } from '@/lib/api';
import { createProductSlug } from '@/lib/utils';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Grid,
  List
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Product {
  id: number;
  creator_id: number;
  name: string;
  description: string;
  base_price: number;
  markup_percentage: number;
  category: string;
  tags: string[];
  thumbnail_url: string;
  images: string[];
  is_active: boolean;
  creator_name: string;
  creator_username: string;
  variant_count: number;
  min_price: number;
  max_price: number;
  created_at: string;
}

export default function CreatorProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasNext: false
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await productAPI.getCreatorProducts({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      setProducts(response.products || []);
      setPagination(response.pagination || { total: 0, limit: 20, offset: 0, hasNext: false });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load your products');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit, pagination.offset]);

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      return;
    }
    
    fetchProducts();
  }, [user, filters, fetchProducts]);

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productAPI.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };


  const filteredProducts = products.filter(product => {
    const matchesSearch = !filters.search || 
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = !filters.category || product.category === filters.category;
    const matchesStatus = !filters.status;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-6">
              <Link 
                href="/dashboard/creator"
                className="inline-flex items-center text-gray-400 hover:text-orange-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight">My Products</h1>
                  <p className="mt-1 text-base text-gray-400">
                    Manage your product catalog
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Controls */}
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl p-6 mb-8 border border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors backdrop-blur-sm"
                  placeholder="Search products..."
                />
                <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors backdrop-blur-sm"
              >
                <option value="">All Categories</option>
                <option value="T-Shirts">T-Shirts</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Mugs">Mugs</option>
                <option value="Posters">Posters</option>
              </select>

            

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                }}
                className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-xl text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors backdrop-blur-sm"
              >
                <option value="created_at-DESC">Newest First</option>
                <option value="created_at-ASC">Oldest First</option>
                <option value="name-ASC">Name: A to Z</option>
                <option value="name-DESC">Name: Z to A</option>
                <option value="base_price-ASC">Price: Low to High</option>
                <option value="base_price-DESC">Price: High to Low</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              {/* View Mode */}
              <div className="flex border border-gray-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-3 transition-all duration-200 ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                      : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-3 transition-all duration-200 ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg' 
                      : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 text-sm font-medium text-gray-300">
            <span className="text-orange-400">{filteredProducts.length}</span> products found
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400 text-lg">Loading your products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No products found</h3>
            <p className="text-gray-400 text-lg mb-8">
              {filters.search || filters.category || filters.status 
                ? 'Try adjusting your filters'
                : 'Get started by creating your first product'
              }
            </p>
            {!filters.search && !filters.category && !filters.status && (
              <div className="mt-6">
                <Link
                  href="/dashboard/creator/products/create"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-700 shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Product
                </Link>
              </div>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductGridCard 
                key={product.id} 
                product={product} 
                onDelete={handleDeleteProduct}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl overflow-hidden border border-gray-800">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-800">
                <thead className="bg-gray-900/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Variants
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-900/20 divide-y divide-gray-800">
                  {filteredProducts.map((product) => (
                    <ProductListRow
                      key={product.id}
                      product={product}
                      onDelete={handleDeleteProduct}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductGridCard({ 
  product, 
  onDelete 
}: { 
  product: Product;
  onDelete: (id: number) => void;
}) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(product.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // Don't preventDefault - let the Link navigate
  };

  return (
    <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl overflow-hidden border-2 border-gray-800 hover:border-orange-500/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer group">
        <div className="w-full relative" style={{ aspectRatio: '1/1' }}>
          <Image
            src={product.thumbnail_url || '/placeholder-product.png'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${
              product.is_active 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
                : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200'
            }`}>
              {product.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          
          {/* Overlay for card interactions */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Action buttons overlay */}
          <div className="absolute bottom-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link
              href={`/dashboard/creator/products/${product.id}/edit`}
              className="p-2 bg-gray-900/80 text-gray-300 hover:text-blue-400 hover:bg-blue-900/50 rounded-lg transition-colors backdrop-blur-sm"
              title="Edit product"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 bg-gray-900/80 text-gray-300 hover:text-red-400 hover:bg-red-900/50 rounded-lg transition-colors backdrop-blur-sm"
              title="Delete product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="font-bold text-white text-lg mb-2 truncate group-hover:text-orange-300 transition-colors">
            {product.name}
          </h3>
          
          <p className="text-sm text-gray-300 mb-4">
            <span className="text-orange-400 font-semibold">Category:</span> {product.category || 'Uncategorized'}
          </p>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xl font-bold text-white">
                {formatPrice(product.min_price)}
              </span>
              {product.max_price > product.min_price && (
                <span className="text-sm text-gray-400">
                  -{formatPrice(product.max_price)}
                </span>
              )}
            </div>
            <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-lg">
              {product.variant_count} variants
            </span>
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-800/30 px-3 py-2 rounded-lg">
            Click to view full product details
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProductListRow({ 
  product, 
  onDelete 
}: { 
  product: Product;
  onDelete: (id: number) => void;
}) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(product.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // Don't preventDefault - let the Link navigate
  };

  return (
    <tr 
      className="hover:bg-gray-800/30 transition-colors cursor-pointer group"
      onClick={() => window.open(`/products/${createProductSlug(product.name, product.id)}`, '_blank')}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-12 w-12">
            <div className="h-12 w-12 relative rounded-xl overflow-hidden border border-gray-700 group-hover:border-orange-500/50 transition-colors" style={{ aspectRatio: '1/1' }}>
              <Image
                src={product.thumbnail_url || '/placeholder-product.png'}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-semibold text-white group-hover:text-orange-300 transition-colors">{product.name}</div>
            <div className="text-sm text-gray-400 truncate max-w-xs">
              {product.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {product.category || 'Uncategorized'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
        {formatPrice(product.min_price)}
        {product.max_price > product.min_price && (
          <span className="text-gray-400"> - {formatPrice(product.max_price)}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
          product.is_active 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white' 
            : 'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-200'
        }`}>
          {product.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {product.variant_count}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
        {formatDate(product.created_at)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <Link
            href={`/dashboard/creator/products/${product.id}/edit`}
            className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800/50 rounded-lg transition-colors"
            title="Edit"
            onClick={handleEdit}
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}