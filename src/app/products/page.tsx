'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productAPI, Product, formatPrice } from '@/lib/api';
import { Search, Grid, List, Heart, Star, ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ category: string; product_count: number }[]>([]);
  const [creators, setCreators] = useState<{ id: number; name: string; username: string; product_count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filters, setFilters] = useState({
    category: '',
    search: '',
    creator: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasNext: false
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchProducts = async (customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const params = customFilters || filters;
      const response = await productAPI.getProducts({
        ...params,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Initialize from URL params and fetch initial data
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const creator = searchParams.get('creator') || '';
    
    setFilters(prev => ({ ...prev, category, search, creator }));
    fetchCategories();
    fetchCreators();
    
    // Fetch products immediately with URL params
    fetchProducts({ 
      category, 
      search, 
      creator,
      minPrice: '', 
      maxPrice: '', 
      sortBy: 'created_at', 
      sortOrder: 'DESC' 
    });
  }, [searchParams]);

  // Fetch products when filters change (after initial load)
  useEffect(() => {
    fetchProducts();
  }, [filters.category, filters.search, filters.creator, filters.minPrice, filters.maxPrice, filters.sortBy, filters.sortOrder]);

  // Fetch products when pagination changes
  useEffect(() => {
    fetchProducts();
  }, [pagination.limit, pagination.offset]);

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchCreators = async () => {
    try {
      const response = await productAPI.getCreators();
      setCreators(response.creators);
    } catch (error) {
      console.error('Failed to fetch creators:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL
    const params = new URLSearchParams();
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.creator) params.set('creator', newFilters.creator);
    
    router.push(`/products?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const imageUrl = product.thumbnail_url || product.images?.[0] || '/placeholder-product.svg';
    
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <Link href={`/products/${product.id}`}>
          <div className="aspect-square relative group">
            {/* Try Next.js Image first, fallback to regular img */}
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized={true}
              onError={(e) => {
                console.log('Next.js Image failed to load:', imageUrl, 'for product:', product.name);
                // Hide the Next.js image and show fallback
                e.currentTarget.style.display = 'none';
                const fallbackImg = e.currentTarget.parentElement?.querySelector('.fallback-img') as HTMLImageElement;
                if (fallbackImg) {
                  fallbackImg.style.display = 'block';
                }
              }}
            />
            {/* Fallback regular img tag */}
            <img
              src={imageUrl}
              alt={product.name}
              className="fallback-img absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              style={{ display: 'none' }}
              onError={(e) => {
                console.log('Fallback image also failed:', imageUrl);
                e.currentTarget.src = '/placeholder-product.svg';
              }}
            />
          <div className="absolute top-3 right-3">
            <button
              className="p-2 bg-white bg-opacity-90 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-all shadow-sm"
              title="Add to wishlist"
              onClick={(e) => {
                e.preventDefault();
                toast.success('Added to wishlist!');
              }}
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Link>
      
      <div className="p-5">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors text-lg leading-tight">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center mt-2 space-x-2">
          <div className="flex items-center bg-gray-100 rounded-full px-2 py-1">
            <User className="w-3 h-3 text-gray-500 mr-1" />
            <span className="text-xs text-gray-600 font-medium">
              {product.creator_name}
            </span>
          </div>
          <div className="flex items-center">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs text-gray-500 ml-1">4.8</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(product.min_price)}
            </span>
            {product.max_price > product.min_price && (
              <span className="text-sm text-gray-500">
                - {formatPrice(product.max_price)}
              </span>
            )}
          </div>
          
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1"
            onClick={() => toast.success('Added to cart!')}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <span className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
            {product.category || 'Uncategorized'}
          </span>
          <span className="text-xs text-gray-500">
            {product.variant_count} options
          </span>
        </div>
      </div>
    </div>
  );
};

  const ProductListItem = ({ product }: { product: Product }) => {
    const imageUrl = product.thumbnail_url || product.images?.[0] || '/placeholder-product.svg';
    
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="flex">
          <Link href={`/products/${product.id}`} className="flex-shrink-0">
            <div className="w-48 h-48 relative">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                unoptimized={true}
                onError={(e) => {
                  console.log('List Next.js Image failed to load:', imageUrl, 'for product:', product.name);
                  e.currentTarget.style.display = 'none';
                  const fallbackImg = e.currentTarget.parentElement?.querySelector('.fallback-img') as HTMLImageElement;
                  if (fallbackImg) {
                    fallbackImg.style.display = 'block';
                  }
                }}
              />
              <img
                src={imageUrl}
                alt={product.name}
                className="fallback-img absolute inset-0 w-full h-full object-cover"
                style={{ display: 'none' }}
                onError={(e) => {
                  console.log('List fallback image also failed:', imageUrl);
                  e.currentTarget.src = '/placeholder-product.svg';
                }}
              />
          </div>
        </Link>
        
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Link href={`/products/${product.id}`}>
                <h3 className="text-xl font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              <p className="text-gray-600 mt-1">
                by {product.creator_name}
              </p>
              
              <p className="text-gray-700 mt-3 line-clamp-3">
                {product.description}
              </p>
              
              <div className="flex items-center space-x-4 mt-4">
                <span className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded">
                  {product.category || 'Uncategorized'}
                </span>
                <span className="text-sm text-gray-500">
                  {product.variant_count} variants
                </span>
              </div>
            </div>
            
            <div className="text-right ml-6">
              <div className="text-2xl font-bold text-gray-900">
                {formatPrice(product.min_price)}
                {product.max_price > product.min_price && (
                  <span className="text-lg text-gray-500 block">
                    - {formatPrice(product.max_price)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 mt-3">
                <button
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  title="Add to wishlist"
                >
                  <Heart className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              Marketplace
            </h1>
            <p className="mt-4 text-xl text-indigo-100 max-w-3xl mx-auto">
              Discover unique, custom-designed products from talented creators around the world
            </p>
            <div className="mt-8 flex justify-center">
              <div className="bg-white rounded-lg p-1 flex items-center space-x-2 shadow-lg">
                <Search className="w-5 h-5 text-gray-400 ml-3" />
                <input
                  type="text"
                  placeholder="Search for products, creators, or categories..."
                  className="flex-1 px-4 py-3 border-0 rounded-lg focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500"
                  style={{ minWidth: '400px' }}
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  onKeyPress={(e) => e.key === 'Enter' && fetchProducts()}
                />
                <button
                  onClick={() => fetchProducts()}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Creators Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Creators</h2>
              <p className="text-gray-600 mt-1">Discover amazing creators and their unique designs</p>
            </div>
            <Link 
              href="/creators" 
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
            >
              View All Creators →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Show real creators from API */}
            {creators.length > 0 ? creators.slice(0, 4).map((creator, index) => (
              <div 
                key={creator.id} 
                className="text-center p-4 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => handleFilterChange('creator', creator.name)}
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {creator.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{creator.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{creator.product_count} products</p>
                <div className="flex items-center justify-center mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600 ml-1">4.8</span>
                </div>
              </div>
            )) : [
              { name: 'Featured Creator', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', products: 0, rating: '4.8' },
              { name: 'Design Studio', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b743?w=100', products: 0, rating: '4.9' },
              { name: 'Creative Mind', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', products: 0, rating: '4.7' },
              { name: 'Art Collective', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', products: 0, rating: '4.8' }
            ].map((creator, index) => (
              <div key={index} className="text-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden">
                  <Image
                    src={creator.avatar}
                    alt={creator.name}
                    width={64}
                    height={64}
                    className="object-cover"
                  />
                </div>
                <h3 className="font-medium text-gray-900 text-sm">{creator.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{creator.products} products</p>
                <div className="flex items-center justify-center mt-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-600 ml-1">{creator.rating}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Categories */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>
                      {cat.category} ({cat.product_count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Creators */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creator
                </label>
                <select
                  value={filters.creator}
                  onChange={(e) => handleFilterChange('creator', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Creators</option>
                  {creators.map((creator) => (
                    <option key={creator.id} value={creator.name}>
                      {creator.name} ({creator.product_count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-900"
                    placeholder="Max"
                  />
                </div>
              </div>

              <button
                onClick={() => fetchProducts()}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Products */}
          <div className="flex-1">
            {/* Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                {loading ? 'Loading...' : `${pagination.total} products found`}
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Sort */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
                  }}
                  className="p-2 border border-gray-300 rounded-md text-gray-900"
                >
                  <option value="created_at-DESC">Newest First</option>
                  <option value="created_at-ASC">Oldest First</option>
                  <option value="base_price-ASC">Price: Low to High</option>
                  <option value="base_price-DESC">Price: High to Low</option>
                  <option value="name-ASC">Name: A to Z</option>
                  <option value="name-DESC">Name: Z to A</option>
                </select>

                {/* View Mode */}
                <div className="flex border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found</p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {products.map((product) => (
                      <ProductListItem key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.hasNext && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => {
                        setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
                        fetchProducts();
                      }}
                      className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}