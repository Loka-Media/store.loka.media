/* eslint-disable @typescript-eslint/no-explicit-any */
/* disable-eslint */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { printfulAPI } from '@/lib/api';
import { Search, Package, Plus, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';
import GradientTitle from '@/components/ui/GradientTitle';
import { GradientText } from '@/components/ui/GradientText';

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

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCatalog = useCallback(async (categoryId: number) => {
    try {
      setLoading(true);
      console.log(`🔄 Fetching catalog for category ${categoryId} with filters:`, filters);
      
      // Use basic filtering - show all products but filter out deprecated ones
      const response = await printfulAPI.getCatalog({ 
        ...filters, 
        category: categoryId.toString(),
        // Don't use strict_inventory_check by default - let users see all products
        include_unavailable: false, // Still filter out clearly deprecated products
      });
      
      console.log(`📦 API Response:`, response);
      console.log(`📦 Fetched ${response.result?.length || 0} products from category ${categoryId}`);
      
      if (response.filtered_count !== undefined) {
        console.log(`📊 Showing ${response.filtered_count} available out of ${response.original_count} total products`);
      }
      
      if (!response.result || response.result.length === 0) {
        console.warn(`⚠️ No products returned for category ${categoryId}`);
        toast('No products found in this category', { duration: 4000 });
      }
      
      setProducts(response.result || []);
    } catch (error: any) {
      console.error('Failed to fetch catalog:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 401) {
        toast.error('Please log in again to view catalog');
      } else {
        toast.error(`Failed to load catalog: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await printfulAPI.getCategories();
      setCategories(response.result?.categories || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };


  const handleSelectCategory = (category: Category) => {
    setSelectedCategory(category);
    fetchCatalog(category.id);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
  };

  const handleCreateProduct = (printfulProduct: PrintfulProduct) => {
    // Store selected product in localStorage and navigate to design workflow
    console.log('Storing product and navigating:', printfulProduct);
    localStorage.setItem('selectedPrintfulProduct', JSON.stringify(printfulProduct));
    
    // Navigate to design canvas workflow with 4 steps
    router.push(`/dashboard/creator/canvas?productId=${printfulProduct.id}`);
  };

  return (
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-black">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!selectedCategory ? (
            <CategorySelection 
              categories={categories}
              onSelectCategory={handleSelectCategory} 
            />
          ) : (
            <ProductView 
              products={products}
              loading={loading}
              filters={filters}
              setFilters={setFilters}
              fetchCatalog={() => fetchCatalog(selectedCategory.id)}
              handleCreateProduct={handleCreateProduct}
              setSelectedProduct={setSelectedProduct}
              onBackToCategories={handleBackToCategories}
            />
          )}
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
    </CreatorProtectedRoute>
  );
}

function CategorySelection({ categories, onSelectCategory } : any) {
  return (
    <div>
      <div className="text-center mb-12">
        <GradientTitle text="Choose a Category" size="sm" />
        <GradientText
          className="block mt-4 leading-relaxed max-w-3xl mx-auto"
          gradient="linear-gradient(91.77deg, #FFFFFF 0%, #000000 136.03%)"
          style={{
            fontSize: "1.125rem",
            fontWeight: 500,
          }}
        >
          Select a product category to start creating your designs
        </GradientText>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories
          .filter((c: { parent_id: number }) => c.parent_id === 0)
          .map((category: any) => (
            <CategoryCard
              key={category.id}
              category={category}
              onSelect={onSelectCategory}
            />
          ))}
      </div>
    </div>
  );
}

function CategoryCard({ category, onSelect }: any) {
  return (
    <div
      className="gradient-border-white-bottom rounded-lg overflow-hidden group hover:shadow-[0_15px_35px_rgba(255,133,27,0.2)] hover:translate-y-[-4px] transition-all duration-300 cursor-pointer"
      onClick={() => onSelect(category)}
    >
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={category.image_url || "/placeholder-product.png"}
          alt={category.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4">
        <span className="font-bold text-white text-xl text-center group-hover:text-orange-400 transition-colors block">
          {category.title}
        </span>
      </div>
    </div>
  );
}

function ProductView({
  products,
  loading,
  filters,
  setFilters,
  fetchCatalog,
  handleCreateProduct,
  onBackToCategories,
}: any) {
  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    fetchCatalog();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Filters Section */}
      <div className="gradient-border-white-top rounded-lg p-6 sticky top-24 z-30 bg-gray-900">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <button
            onClick={onBackToCategories}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-400 rounded-lg font-bold text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Categories
          </button>

          <div className="flex-grow w-full md:w-auto">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev: any) => ({
                    ...prev,
                    search: e.target.value,
                  }))
                }
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white placeholder-gray-400 font-bold transition-all"
                placeholder="Search for products..."
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-300">Sort:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'name', sortOrder: 'ASC' }))}
                className={`px-3 py-2 text-sm font-bold rounded-lg transition-all ${filters.sortBy === 'name' && filters.sortOrder === 'ASC' ? 'bg-orange-500/20 border border-orange-500 text-orange-400' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600'}`}
              >
                A-Z
              </button>
              <button
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'name', sortOrder: 'DESC' }))}
                className={`px-3 py-2 text-sm font-bold rounded-lg transition-all ${filters.sortBy === 'name' && filters.sortOrder === 'DESC' ? 'bg-orange-500/20 border border-orange-500 text-orange-400' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600'}`}
              >
                Z-A
              </button>
              <button
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'brand', sortOrder: 'ASC' }))}
                className={`px-3 py-2 text-sm font-bold rounded-lg transition-all ${filters.sortBy === 'brand' && filters.sortOrder === 'ASC' ? 'bg-orange-500/20 border border-orange-500 text-orange-400' : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600'}`}
              >
                Brand
              </button>
            </div>
          </div>

          <button
            onClick={fetchCatalog}
            className="w-full md:w-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 px-6 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
          >
            Search
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 mb-6 inline-block">
          <span className="text-sm font-bold text-orange-400">
            {loading ? "Loading..." : `Found ${products.length} products`}
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-full p-4 inline-block mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500/30 border-t-orange-500"></div>
            </div>
            <p className="mt-4 text-gray-300 font-bold text-lg">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 gradient-border-white-top rounded-lg bg-gray-900">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-6 inline-block mb-6">
              <Package className="mx-auto h-16 w-16 text-orange-400" />
            </div>
            <span className="text-2xl font-bold text-white mb-2 block">
              No products found
            </span>
            <p className="text-lg font-bold text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {products.map((product: PrintfulProduct) => (
              <PrintfulProductCard
                key={product.id}
                product={product}
                onCreateProduct={handleCreateProduct}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PrintfulProductCard({
  product,
  onCreateProduct,
}: {
  product: PrintfulProduct;
  onCreateProduct: (product: PrintfulProduct) => void;
}) {
  return (
    <div className="gradient-border-white-bottom rounded-2xl overflow-hidden group hover:shadow-[0_15px_35px_rgba(255,133,27,0.2)] hover:translate-y-[-4px] transition-all duration-300 flex flex-col">
      {/* Image Section with Brand and Buttons */}
      <div className="aspect-square relative overflow-hidden rounded-t-2xl">
        <Image
          src={product.image || '/placeholder-product.png'}
          alt={product.title || product.model}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Brand Badge - Top Right */}
        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5">
          <span className="text-sm font-bold text-black truncate max-w-[120px] block">
            {product.brand}
          </span>
        </div>

        {/* Button - Bottom Left */}
        <button
          onClick={() => onCreateProduct(product)}
          className="absolute bottom-4 left-4 p-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-400 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-110 opacity-0 group-hover:opacity-100"
          title="Create Product"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Info Section - Bottom */}
      <div className="p-4 flex flex-col gap-3 flex-grow text-center">
        {/* Product Type Label */}
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {product.type_name || product.type}
        </span>

        {/* Product Title */}
        <span className="font-bold text-white text-base leading-snug group-hover:text-orange-400 transition-colors block line-clamp-2">
          {product.title || product.model}
        </span>

        {/* Variants Count - Centered */}
        <span className="text-sm font-bold text-cyan-400 mt-auto">
          {product.variant_count} Variants
        </span>
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="gradient-border-white-top rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto bg-gray-900">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <span className="text-3xl font-bold text-white block">{product.title || product.model}</span>
              <p className="text-gray-400 font-bold mt-1">by {product.brand}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors rounded-lg p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <Image
                src={product.image || '/placeholder-product.png'}
                alt={product.title || product.model}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="flex flex-col">
              <div className="flex-grow">
                <div className="mb-6 gradient-border-white-top rounded-lg p-4 bg-gray-800">
                  <span className="text-xl font-bold text-white block mb-3">Product Details</span>
                  <div className="space-y-3 text-sm font-bold">
                    <div className="flex justify-between"><span className="text-gray-400">Type:</span> <span className="text-white">{product.type_name || product.type}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Brand:</span> <span className="text-white">{product.brand}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Variants:</span> <span className="text-white">{product.variant_count}</span></div>
                  </div>
                </div>

                <div className="mb-6 gradient-border-white-top rounded-lg p-4 bg-gray-800">
                  <span className="text-xl font-bold text-white block mb-4">Available Variants</span>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                    {product.variants?.slice(0, 12).map((variant) => (
                      <div key={variant.id} className="flex items-center space-x-2 text-xs p-2 bg-gray-700 rounded-lg border border-gray-600">
                        <div
                          className="w-4 h-4 rounded-full border border-gray-500 shadow-inner"
                          style={{ backgroundColor: variant.color_code || '#ccc' }}
                        ></div>
                        <span className="text-gray-300 truncate font-bold">{variant.size} - {variant.color}</span>
                      </div>
                    ))}
                    {product.variants && product.variants.length > 12 && (
                      <div className="text-xs text-gray-400 font-bold col-span-3 mt-2">
                        +{product.variants.length - 12} more variants
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCreateProduct(product)}
                className="w-full flex items-center justify-center px-6 py-4 text-lg font-bold rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create Product with This Model
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}