'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { productAPI, ExtendedProduct } from '@/lib/api';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

import { ProductCard } from '@/components/products/ProductCard';
import { ProductListItem } from '@/components/products/ProductListItem';
import { ProductFilters } from '@/components/products/ProductFilters';
import { ProductHero } from '@/components/products/ProductHero';
import { FeaturedCreators } from '@/components/products/FeaturedCreators';
import { ProductGrid } from '@/components/products/ProductGrid';
import { Pagination } from '@/components/products/Pagination';

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-black">
      <Suspense
        fallback={
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading marketplace...</p>
            </div>
          </div>
        }
      >
        <ProductsContent />
      </Suspense>
    </div>
  );
}

function ProductsContent() {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<
    { category: string; product_count: number }[]
  >([]);
  const [creators, setCreators] = useState<
    { id: number; name: string; username: string; product_count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState(false);

  const { addToCart } = useGuestCart();
  const { addToWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    creator: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "created_at",
    sortOrder: "DESC",
    source: "all" as "printful" | "shopify" | "all",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasNext: false,
  });

  const searchParams = useSearchParams();
  const router = useRouter();

  const fetchProducts = useCallback(
    async (customFilters?: typeof filters) => {
      try {
        setLoading(true);
        const params = customFilters || filters;
        const response = await productAPI.getProducts({
          ...params,
          minPrice: params.minPrice ? Number(params.minPrice) : undefined,
          maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
          limit: pagination.limit,
          offset: pagination.offset,
        });

        setProducts(response.products);
        setPagination(response.pagination);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    },
    [filters, pagination.limit, pagination.offset]
  );

  // Initialize from URL params and fetch initial data
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const creator = searchParams.get("creator") || "";
    const source =
      (searchParams.get("source") as "printful" | "shopify" | "all") || "all";

    setFilters((prev) => ({ ...prev, category, search, creator, source }));
    fetchCategories();
    fetchCreators();

    // Fetch products immediately with URL params
    fetchProducts({
      category,
      search,
      creator,
      source,
      minPrice: "",
      maxPrice: "",
      sortBy: "created_at",
      sortOrder: "DESC",
    });
  }, [searchParams]);

  // Fetch products when filters change (after initial load)
  useEffect(() => {
    fetchProducts();
  }, [
    filters.category,
    filters.search,
    filters.creator,
    filters.source,
    filters.minPrice,
    filters.maxPrice,
    filters.sortBy,
    filters.sortOrder,
    fetchProducts,
  ]);

  // Fetch products when pagination changes
  useEffect(() => {
    fetchProducts();
  }, [pagination.limit, pagination.offset, fetchProducts]);

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories();
      setCategories(response.categories);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchCreators = async () => {
    try {
      const response = await productAPI.getCreators();
      setCreators(response.creators);
    } catch (error) {
      console.error("Failed to fetch creators:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL
    const params = new URLSearchParams();
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.creator) params.set("creator", newFilters.creator);
    if (newFilters.source && newFilters.source !== "all")
      params.set("source", newFilters.source);

    router.push(`/products?${params.toString()}`);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      search: "",
      creator: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "created_at",
      sortOrder: "DESC",
      source: "all",
    });
    router.push("/products");
  };

  const handlePageChange = (newOffset: number) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <ProductHero
        paginationTotal={pagination.total}
        creatorsLength={creators.length}
        categoriesLength={categories.length}
        filtersSearch={filters.search}
        setFiltersSearch={(search) => setFilters((prev) => ({ ...prev, search }))}
        fetchProducts={fetchProducts}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductFilters
          filters={filters}
          categories={categories}
          creators={creators}
          handleFilterChange={handleFilterChange}
          clearFilters={clearFilters}
          pagination={pagination}
          loading={loading}
          viewMode={viewMode}
          setViewMode={setViewMode}
          setShowFilters={setShowFilters}
          showFilters={showFilters}
        />
      </div>

      <FeaturedCreators
        creators={creators}
        handleFilterChange={handleFilterChange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {/* Products Grid/List */}
        {loading && products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <p className="text-xl text-gray-400">
              Discovering amazing products...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This won&apos;t take long
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              No products found
            </h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={clearFilters}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <ProductGrid
              products={products}
              loading={loading}
              viewMode={viewMode}
              totalProducts={pagination.total}
              onViewModeChange={setViewMode}
              ProductCard={ProductCard}
              ProductListItem={ProductListItem}
            />

            {/* Enhanced Pagination */}
            {pagination.hasNext && (
              <Pagination
                pagination={pagination}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}