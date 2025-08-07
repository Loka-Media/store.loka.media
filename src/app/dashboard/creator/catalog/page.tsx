/* eslint-disable @typescript-eslint/no-explicit-any */
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
import Navigation from '@/components/Navigation';

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

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const fetchCatalog = useCallback(async (categoryId: number) => {
    try {
      setLoading(true);
      const response = await printfulAPI.getCatalog({ ...filters, category: categoryId.toString() });
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
    
    fetchCategories();
  }, [user]);

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

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
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
  );
}

function CategorySelection({ categories, onSelectCategory } : any) {
  return (
    <div>
      <h2 className="text-3xl font-bold text-center text-white mb-4">
        Choose a Category
      </h2>
      <p className="text-center text-gray-400 mb-12">
        Select a product category to start creating your designs.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
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
      className="bg-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-lg overflow-hidden group hover:border-orange-500 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
      onClick={() => onSelect(category)}
    >
      <div className="aspect-square relative overflow-hidden">
        <Image
          src={category.image_url || "/placeholder-product.png"}
          alt={category.title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-white text-xl text-center">
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
      <div className="bg-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-lg p-4 sticky top-24 z-30">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <button
            onClick={onBackToCategories}
            className="inline-flex items-center text-gray-300 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Categories
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
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-500"
                placeholder="Search for products..."
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-300">Sort by:</span>
            <div className="flex gap-1 bg-gray-800 rounded-full p-1">
              <button 
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'name', sortOrder: 'ASC' }))}
                className={`px-3 py-1 text-sm rounded-full ${filters.sortBy === 'name' && filters.sortOrder === 'ASC' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Name A-Z
              </button>
              <button 
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'name', sortOrder: 'DESC' }))}
                className={`px-3 py-1 text-sm rounded-full ${filters.sortBy === 'name' && filters.sortOrder === 'DESC' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Name Z-A
              </button>
              <button 
                onClick={() => setFilters((prev: any) => ({ ...prev, sortBy: 'brand', sortOrder: 'ASC' }))}
                className={`px-3 py-1 text-sm rounded-full ${filters.sortBy === 'brand' && filters.sortOrder === 'ASC' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Brand
              </button>
            </div>
          </div>
          
          <button
            onClick={fetchCatalog}
            className="w-full md:w-auto bg-orange-600 text-white font-bold py-2 px-6 rounded-full hover:bg-orange-700 transition-all duration-300 ease-in-out transform hover:scale-105"
          >
            Search
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="text-sm text-gray-400 mb-6">
          {loading ? "Loading..." : `Found ${products.length} products`}
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 border border-orange-500/20 rounded-lg">
            <Package className="mx-auto h-12 w-12 text-orange-500" />
            <h3 className="mt-4 text-lg font-semibold text-white">
              No products found
            </h3>
            <p className="mt-2 text-sm text-gray-400">
              Try adjusting your search or filter criteria.
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
    <div className="relative bg-gray-900/50 backdrop-blur-sm border border-orange-500/20 rounded-xl overflow-hidden group hover:border-orange-500 transition-all duration-300 transform hover:-translate-y-2 flex flex-col shadow-lg hover:shadow-orange-500/30">
      <div className="aspect-square relative overflow-hidden rounded-t-xl">
        <Image
          src={product.image || '/placeholder-product.png'}
          alt={product.title || product.model}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Overlay buttons */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onViewDetails(product)}
            className="p-3 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all duration-300 transform hover:scale-110"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </button>
          <button
            onClick={() => onCreateProduct(product)}
            className="p-3 rounded-full bg-orange-600/80 backdrop-blur-md text-white hover:bg-orange-700/90 transition-all duration-300 transform hover:scale-110"
            title="Create Product"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-white text-xl truncate mb-1">
          {product.title || product.model}
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          {product.brand}
        </p>
        
        <div className="flex items-center justify-between mt-auto">
          <span className="text-xs text-gray-300 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            {product.variant_count} variants
          </span>
          <span className="text-xs bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full font-medium">
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
      <div className="bg-gray-900 border border-orange-500/30 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-orange-500/10">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-white">{product.title || product.model}</h2>
              <p className="text-gray-400 mt-1">by {product.brand}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors rounded-full p-2"
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
              />
            </div>

            <div className="flex flex-col">
              <div className="flex-grow">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-3">Product Details</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex justify-between"><span className="font-medium text-gray-400">Type:</span> <span>{product.type_name || product.type}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-400">Brand:</span> <span>{product.brand}</span></div>
                    <div className="flex justify-between"><span className="font-medium text-gray-400">Variants:</span> <span>{product.variant_count}</span></div>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-4">Available Variants</h3>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                    {product.variants?.slice(0, 12).map((variant) => (
                      <div key={variant.id} className="flex items-center space-x-2 text-xs p-2 bg-gray-800/70 rounded-md border border-gray-700">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-gray-600 shadow-inner"
                          style={{ backgroundColor: variant.color_code || '#ccc' }}
                        ></div>
                        <span className="text-gray-300 truncate">{variant.size} - {variant.color}</span>
                      </div>
                    ))}
                    {product.variants && product.variants.length > 12 && (
                      <div className="text-xs text-gray-500 col-span-3 mt-2">
                        +{product.variants.length - 12} more variants
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onCreateProduct(product)}
                className="w-full flex items-center justify-center px-6 py-4 border border-transparent text-base font-bold rounded-md text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/20"
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