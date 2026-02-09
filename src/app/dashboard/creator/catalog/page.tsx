/* eslint-disable @typescript-eslint/no-explicit-any */
/* disable-eslint */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { printfulAPI } from "@/lib/api";
import { Search, Package, Plus, ArrowLeft } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";
import Navigation from "@/components/Navigation";
import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";
import GradientTitle from "@/components/ui/GradientTitle";
import { GradientText } from "@/components/ui/GradientText";
import { Button } from "@/components/ui/button";
import CreativeLoader from "@/components/CreativeLoader";

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
  const [selectedProduct, setSelectedProduct] =
    useState<PrintfulProduct | null>(null);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    sortBy: "name",
    sortOrder: "ASC",
  });

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );

  const hasFetchedCategoriesRef = useRef(false);

  const fetchCatalog = useCallback(
    async (categoryId: number) => {
      try {
        setLoading(true);
        console.log(
          `🔄 Fetching catalog for category ${categoryId} with filters:`,
          filters
        );

        // Use basic filtering - show all products but filter out deprecated ones
        const response = await printfulAPI.getCatalog({
          ...filters,
          category: categoryId.toString(),
          // Don't use strict_inventory_check by default - let users see all products
          include_unavailable: false, // Still filter out clearly deprecated products
        });

        console.log(`📦 API Response:`, response);
        console.log(
          `📦 Fetched ${
            response.result?.length || 0
          } products from category ${categoryId}`
        );

        if (response.filtered_count !== undefined) {
          console.log(
            `📊 Showing ${response.filtered_count} available out of ${response.original_count} total products`
          );
        }

        if (!response.result || response.result.length === 0) {
          console.warn(`⚠️ No products returned for category ${categoryId}`);
          toast("No products found in this category", { duration: 4000 });
        }

        setProducts(response.result || []);
      } catch (error: any) {
        console.error("Failed to fetch catalog:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });

        if (error.response?.status === 401) {
          toast.error("Please log in again to view catalog");
        } else {
          toast.error(
            `Failed to load catalog: ${error.message || "Unknown error"}`
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    // Scroll to top on component mount
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (hasFetchedCategoriesRef.current) {
      return;
    }
    hasFetchedCategoriesRef.current = true;

    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await printfulAPI.getCategories();
      setCategories(response.result?.categories || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleSelectCategory = (category: Category) => {
    window.scrollTo(0, 0);
    setSelectedCategory(category);
    fetchCatalog(category.id);
  };

  const handleBackToCategories = () => {
    window.scrollTo(0, 0);
    setSelectedCategory(null);
    setProducts([]);
  };

  const handleCreateProduct = (printfulProduct: PrintfulProduct) => {
    // Store selected product in localStorage and navigate to design workflow
    console.log("Storing product and navigating:", printfulProduct);
    localStorage.setItem(
      "selectedPrintfulProduct",
      JSON.stringify(printfulProduct)
    );

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

function CategorySelection({ categories, onSelectCategory }: any) {
  return (
    <div>
      <div className="text-center mb-6 sm:mb-8 md:mb-12">
        <GradientTitle text="Choose a Category" size="sm" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl" />
        <GradientText
          className="block mt-2 sm:mt-3 leading-relaxed max-w-3xl mx-auto"
          gradient="linear-gradient(91.77deg, #FFFFFF 0%, #000000 136.03%)"
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Select a product category to start creating your designs
        </GradientText>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
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
      <div className="p-2 sm:p-3">
        <span className="font-bold text-white text-sm sm:text-lg text-center group-hover:text-orange-400 transition-colors block">
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
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Filters Section */}
      <div className="gradient-border-white-top rounded-lg p-3 sm:p-4 bg-gray-900">
        <div className="flex flex-col gap-3 items-stretch sm:flex-row sm:gap-3 sm:items-center">
          <Button
            onClick={onBackToCategories}
            variant="secondary"
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Back
          </Button>

          <div className="flex-grow w-full">
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => {
                  setFilters((prev: any) => ({
                    ...prev,
                    search: e.target.value,
                  }));
                  fetchCatalog();
                }}
                className="w-full pl-8 pr-3 py-2 sm:py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:border-orange-500 focus:outline-none text-white placeholder-gray-400 font-normal transition-all text-xs sm:text-sm"
                placeholder="Search..."
              />
              <Search className="absolute left-2.5 top-2.5 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="flex-1">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2 mb-4 inline-block">
          <span className="text-xs sm:text-sm font-normal text-orange-400">
            {loading ? "Loading..." : `${products.length} products`}
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <CreativeLoader variant="product" message="Loading products..." />
        ) : products.length === 0 ? (
          <div className="text-center py-8 sm:py-12 gradient-border-white-top rounded-lg bg-gray-900">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-3 sm:p-4 inline-block mb-3 sm:mb-4">
              <Package className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-orange-400" />
            </div>
            <span className="text-lg sm:text-2xl font-bold text-white mb-2 block">
              No products found
            </span>
            <p className="text-sm sm:text-base font-bold text-gray-400">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
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
          src={product.image || "/placeholder-product.png"}
          alt={product.title || product.model}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500 ease-in-out"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Brand Badge - Top Right */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 sm:px-3 py-1">
          <span className="text-xs sm:text-sm font-bold text-black truncate max-w-[100px] sm:max-w-[120px] block">
            {product.brand}
          </span>
        </div>

        {/* Button - Bottom Left */}
        <button
          onClick={() => onCreateProduct(product)}
          className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 p-1.5 sm:p-2.5 rounded-full bg-black border border-orange-400 text-white hover:bg-orange-500 transition-all duration-300 transform hover:scale-110 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          title="Create Product"
        >
          <Plus className="w-3 h-3 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Info Section - Bottom */}
      <div className="p-2 sm:p-3 flex flex-col gap-2 flex-grow text-center">
        {/* Product Type Label */}
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
          {product.type_name || product.type}
        </span>

        {/* Product Title */}
        <span className="font-bold text-white text-sm sm:text-base leading-snug group-hover:text-orange-400 transition-colors block line-clamp-2">
          {product.title || product.model}
        </span>

        {/* Variants Count - Centered */}
        <span className="text-xs sm:text-sm font-bold text-cyan-400 mt-auto">
          {product.variant_count} Variants
        </span>
      </div>
    </div>
  );
}

function ProductDetailsModal({
  product,
  onClose,
  onCreateProduct,
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
              <span className="text-3xl font-bold text-white block">
                {product.title || product.model}
              </span>
              <p className="text-gray-400 font-bold mt-1">by {product.brand}</p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 transition-colors rounded-lg p-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square relative bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <Image
                src={product.image || "/placeholder-product.png"}
                alt={product.title || product.model}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            <div className="flex flex-col">
              <div className="flex-grow">
                <div className="mb-6 gradient-border-white-top rounded-lg p-4 bg-gray-800">
                  <span className="text-xl font-bold text-white block mb-3">
                    Product Details
                  </span>
                  <div className="space-y-3 text-sm font-bold">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>{" "}
                      <span className="text-white">
                        {product.type_name || product.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Brand:</span>{" "}
                      <span className="text-white">{product.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Variants:</span>{" "}
                      <span className="text-white">
                        {product.variant_count}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 gradient-border-white-top rounded-lg p-4 bg-gray-800">
                  <span className="text-xl font-bold text-white block mb-4">
                    Available Variants
                  </span>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-2">
                    {product.variants?.slice(0, 12).map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center space-x-2 text-xs p-2 bg-gray-700 rounded-lg border border-gray-600"
                      >
                        <div
                          className="w-4 h-4 rounded-full border border-gray-500 shadow-inner"
                          style={{
                            backgroundColor: variant.color_code || "#ccc",
                          }}
                        ></div>
                        <span className="text-gray-300 truncate font-bold">
                          {variant.size} - {variant.color}
                        </span>
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
