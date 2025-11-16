/* eslint-disable @typescript-eslint/no-explicit-any */
/* disable-eslint */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { printfulAPI } from '@/lib/api';
import { Search, Package, Plus, Eye, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';

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
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
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
        <h2 className="text-4xl md:text-5xl font-extrabold text-black mb-4">
          Choose a Category
        </h2>
        <p className="text-lg font-bold text-gray-800">
          Select a product category to start creating your designs
        </p>
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
      className="bg-white border-4 border-black rounded-2xl overflow-hidden group hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300 cursor-pointer shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      <div className="p-4 bg-gradient-to-r from-yellow-100 to-pink-100">
        <h3 className="font-extrabold text-black text-xl text-center group-hover:text-purple-600 transition-colors">
          {category.title}
        </h3>
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
  setSelectedProduct,
  onBackToCategories,
}: any) {
  const handleSearch = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    fetchCatalog();
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Filters Section */}
      <div className="bg-white border-4 border-black rounded-2xl p-6 sticky top-24 z-30 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <button
            onClick={onBackToCategories}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-300 to-pink-300 border-4 border-black rounded-xl font-extrabold text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
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
                className="w-full pl-10 pr-4 py-3 bg-yellow-50 border-4 border-black rounded-xl focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(0,0,0,1)] text-black placeholder-gray-600 font-bold"
                placeholder="Search for products..."
              />
              <Search className="absolute left-3 top-3.5 h-5 w-5 text-black" />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-black">Sort:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'name', sortOrder: 'ASC' }))}
                className={`px-3 py-2 text-sm font-extrabold rounded-xl border-2 border-black transition-all ${filters.sortBy === 'name' && filters.sortOrder === 'ASC' ? 'bg-purple-300 text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-yellow-100'}`}
              >
                A-Z
              </button>
              <button
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'name', sortOrder: 'DESC' }))}
                className={`px-3 py-2 text-sm font-extrabold rounded-xl border-2 border-black transition-all ${filters.sortBy === 'name' && filters.sortOrder === 'DESC' ? 'bg-purple-300 text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-yellow-100'}`}
              >
                Z-A
              </button>
              <button
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'brand', sortOrder: 'ASC' }))}
                className={`px-3 py-2 text-sm font-extrabold rounded-xl border-2 border-black transition-all ${filters.sortBy === 'brand' && filters.sortOrder === 'ASC' ? 'bg-purple-300 text-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-yellow-100'}`}
              >
                Brand
              </button>
            </div>
          </div>

          <button
            onClick={fetchCatalog}
            className="w-full md:w-auto bg-gradient-to-r from-orange-400 to-pink-400 text-white font-extrabold py-3 px-6 rounded-xl border-4 border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          >
            Search
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="bg-gradient-to-r from-purple-200 to-pink-200 border-4 border-black rounded-xl px-4 py-3 mb-6 inline-block shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <span className="text-sm font-extrabold text-black">
            {loading ? "Loading..." : `Found ${products.length} products`}
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="bg-gradient-to-r from-orange-400 to-pink-400 border-4 border-black rounded-full p-4 inline-block mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-white"></div>
            </div>
            <p className="mt-4 text-black font-extrabold text-lg">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
            <div className="bg-gradient-to-br from-yellow-300 to-orange-400 border-4 border-black rounded-2xl p-6 inline-block mb-6">
              <Package className="mx-auto h-16 w-16 text-black" />
            </div>
            <h3 className="text-2xl font-extrabold text-black mb-2">
              No products found
            </h3>
            <p className="text-lg font-bold text-gray-700">
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
                onViewDetails={setSelectedProduct}
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
  onViewDetails,
}: {
  product: PrintfulProduct;
  onCreateProduct: (product: PrintfulProduct) => void;
  onViewDetails: (product: PrintfulProduct) => void;
}) {
  return (
    <div className="relative bg-white border-4 border-black rounded-2xl overflow-hidden group hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300 flex flex-col shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={product.image || '/placeholder-product.png'}
          alt={product.title || product.model}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Overlay buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onViewDetails(product)}
            className="p-3 rounded-xl bg-white border-2 border-black text-black hover:bg-yellow-200 transition-all duration-300 transform hover:scale-110 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onCreateProduct(product)}
            className="p-3 rounded-xl bg-gradient-to-r from-orange-400 to-pink-400 border-2 border-black text-white hover:from-orange-500 hover:to-pink-500 transition-all duration-300 transform hover:scale-110 shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            title="Create Product"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow bg-gradient-to-br from-yellow-50 to-pink-50">
        <h3 className="font-extrabold text-black text-lg truncate mb-1 group-hover:text-purple-600 transition-colors">
          {product.title || product.model}
        </h3>
        <p className="text-sm font-bold text-gray-700 mb-3">
          {product.brand}
        </p>

        <div className="flex items-center justify-between mt-auto gap-2">
          <span className="text-xs font-extrabold bg-purple-200 border-2 border-black text-black px-3 py-1 rounded-full">
            {product.variant_count} variants
          </span>
          <span className="text-xs font-extrabold bg-orange-200 border-2 border-black text-black px-3 py-1 rounded-full">
            {product.type_name || product.type}
          </span>
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border-4 border-black rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
        <div className="p-8 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-extrabold text-black">{product.title || product.model}</h2>
              <p className="text-gray-700 font-bold mt-1">by {product.brand}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white border-2 border-black text-black hover:bg-red-200 transition-colors rounded-xl p-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square relative bg-white rounded-2xl overflow-hidden border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
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
                <div className="mb-6 bg-white border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <h3 className="text-xl font-extrabold text-black mb-3">Product Details</h3>
                  <div className="space-y-3 text-sm font-bold">
                    <div className="flex justify-between"><span className="text-gray-700">Type:</span> <span className="text-black">{product.type_name || product.type}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700">Brand:</span> <span className="text-black">{product.brand}</span></div>
                    <div className="flex justify-between"><span className="text-gray-700">Variants:</span> <span className="text-black">{product.variant_count}</span></div>
                  </div>
                </div>

                <div className="mb-6 bg-white border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <h3 className="text-xl font-extrabold text-black mb-4">Available Variants</h3>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                    {product.variants?.slice(0, 12).map((variant) => (
                      <div key={variant.id} className="flex items-center space-x-2 text-xs p-2 bg-yellow-100 rounded-lg border-2 border-black">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-black shadow-inner"
                          style={{ backgroundColor: variant.color_code || '#ccc' }}
                        ></div>
                        <span className="text-black truncate font-bold">{variant.size} - {variant.color}</span>
                      </div>
                    ))}
                    {product.variants && product.variants.length > 12 && (
                      <div className="text-xs text-gray-700 font-bold col-span-3 mt-2">
                        +{product.variants.length - 12} more variants
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCreateProduct(product)}
                className="w-full flex items-center justify-center px-6 py-4 text-lg font-extrabold rounded-xl text-white bg-gradient-to-r from-orange-400 to-red-500 border-4 border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
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