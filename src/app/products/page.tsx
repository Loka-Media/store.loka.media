/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { productAPI, ExtendedProduct } from "@/lib/api";
import { TrendingUp, Zap, Heart } from "lucide-react";

import { ProductsHero } from "@/components/products/ProductsHero";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import type { ViewType } from "@/components/products/ProductViewTabs";
import { ProductsSidebar } from "@/components/products/ProductsSidebar";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { NoProductsFound } from "@/components/products/NoProductsFound";
import { ProductsLoading } from "@/components/products/ProductsLoading";
import CreativeLoader from "@/components/CreativeLoader";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Suspense
        fallback={
          <div className="min-h-screen bg-black text-white">
            <CreativeLoader variant="product" message="Loading marketplace..." />
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("trending");

  const [filters, setFilters] = useState({
    category: "",
    search: "",
    creator: "",
    sortBy: "created_at",
    sortOrder: "DESC",
    source: "all" as "printful" | "shopify" | "all",
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasNext: false,
  });

  const searchParams = useSearchParams();
  // Router removed - using window.history for URL updates

  const fetchProducts = useCallback(
    async (customFilters?: typeof filters, customPagination?: { limit: number; offset: number }, appendMode = false) => {
      try {
        if (appendMode) {
          setLoadingMore(true); // Only show loading on Load More button
        } else {
          setLoading(true); // Show full loading for initial/filter changes
        }
        
        const params = customFilters || filters;
        const paginationParams = customPagination || { limit: pagination.limit, offset: pagination.offset };
        
        const response = await productAPI.getProducts({
          ...params,
          limit: paginationParams.limit,
          offset: paginationParams.offset,
        });

        if (appendMode) {
          // Append new products to existing ones
          setProducts(prev => [...prev, ...response.products]);
        } else {
          // Replace products (for initial load or filter changes)
          setProducts(response.products);
        }
        
        setPagination(prev => ({ ...prev, ...response.pagination }));
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        if (appendMode) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  // Initialize from URL params and fetch initial data
  useEffect(() => {
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const creator = searchParams.get("creator") || "";
    const source =
      (searchParams.get("source") as "printful" | "shopify" | "all") || "all";

    const initialFilters = {
      category,
      search,
      creator,
      source,
      sortBy: "created_at",
      sortOrder: "DESC",
      minPrice: undefined,
      maxPrice: undefined,
    };

    setFilters(initialFilters);
    fetchCategories();
    fetchCreators();

    // Fetch products immediately with URL params and reset pagination
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchProducts(initialFilters, { limit: 20, offset: 0 });
  }, [searchParams, fetchProducts]);

  // Fetch products when filters change (but not on initial load)
  useEffect(() => {
    // Skip if this is the initial load (filters are empty/default)
    const isInitialLoad = !filters.category && !filters.search && !filters.creator && filters.source === "all";
    if (isInitialLoad) return;
    
    // Reset pagination when filters change
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchProducts(filters, { limit: pagination.limit, offset: 0 });
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

  // Fetch products when pagination changes (but not when offset is reset to 0)
  useEffect(() => {
    if (pagination.offset === 0) return; // Skip if offset was just reset
    fetchProducts(filters, { limit: pagination.limit, offset: pagination.offset }, true); // true for append mode
  }, [pagination.offset, fetchProducts]);

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

    // Update URL without triggering navigation
    const params = new URLSearchParams();
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.creator) params.set("creator", newFilters.creator);
    if (newFilters.source && newFilters.source !== "all")
      params.set("source", newFilters.source);

    // Use replace instead of push to avoid triggering searchParams change
    window.history.replaceState({}, '', `/products?${params.toString()}`);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: "",
      search: "",
      creator: "",
      sortBy: "created_at",
      sortOrder: "DESC",
      source: "all" as const,
      minPrice: undefined,
      maxPrice: undefined,
    };
    setFilters(clearedFilters);

    // Update URL and fetch products
    window.history.replaceState({}, '', '/products');
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchProducts(clearedFilters, { limit: pagination.limit, offset: 0 });
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    // Update sort based on view
    const sortConfig = {
      trending: { sortBy: "created_at", sortOrder: "DESC" },
      new: { sortBy: "created_at", sortOrder: "DESC" },
      popular: { sortBy: "base_price", sortOrder: "DESC" },
    };
    const newSort = sortConfig[view];
    setFilters((prev) => ({ ...prev, ...newSort }));
  };

  return (
    <div className="bg-black text-white min-h-screen">
      {/* Hero Section */}
      <ProductsHero
        creators={creators}
        categories={categories}
      />

      {/* Filter Controls Section - Above Featured Products */}
      <div className="bg-black border-b border-white/10 relative z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 overflow-visible">
          {/* Row 1: Search bar (50%), Categories and Creators (50% split) */}
          <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
            {/* Search Input - 50% on desktop */}
            <div className="relative w-full lg:w-1/2">
              <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search Files"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 h-11 sm:h-12 rounded-xl border border-white/20 bg-gradient-to-br from-gray-800 to-gray-900 text-white text-xs sm:text-sm placeholder-white/40 hover:border-orange-400/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
              />
            </div>

            {/* Dropdowns Container - 50% on desktop */}
            <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 w-full lg:w-1/2">
              {/* All Types Dropdown */}
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 h-11 sm:h-12 rounded-xl border border-white/30 bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm hover:border-orange-400 hover:shadow-[0_8px_24px_rgba(255,99,71,0.15)] focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all cursor-pointer font-medium appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                }}
              >
                <option value="">All Types</option>
                {categories.map((cat) => (
                  <option key={cat.category} value={cat.category}>
                    {cat.category} ({cat.product_count})
                  </option>
                ))}
              </select>

              {/* All Creators Dropdown */}
              <select
                value={filters.creator}
                onChange={(e) => handleFilterChange("creator", e.target.value)}
                className="flex-1 px-4 sm:px-5 py-3 sm:py-3.5 h-11 sm:h-12 rounded-xl border border-white/30 bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm hover:border-orange-400 hover:shadow-[0_8px_24px_rgba(255,99,71,0.15)] focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all cursor-pointer font-medium appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  paddingRight: '32px',
                }}
              >
                <option value="">All Creators</option>
                {creators.map((creator) => (
                  <option key={creator.id} value={creator.name}>
                    {creator.name} ({creator.product_count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: View tabs and Price Range button */}
          <div className="flex gap-2 sm:gap-3 items-center overflow-x-auto overflow-y-visible scrollbar-hide pb-2 xs:pb-0 -mx-4 xs:mx-0 px-4 xs:px-0">
            <button
              onClick={() => handleViewChange("trending")}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeView === "trending"
                  ? "bg-gray-800 text-white border-purple-500 shadow-[0_8px_20px_rgba(147,51,234,0.3)]"
                  : "bg-gray-800 text-white border-white/20 hover:border-purple-400/50 hover:bg-gray-700"
              }`}
              title="View trending products"
            >
              <TrendingUp className={`w-4 h-4 sm:w-4 sm:h-4 ${activeView === "trending" ? "text-purple-500" : "text-white/60"}`} />
              <span className="font-normal">Trending</span>
            </button>
            <button
              onClick={() => handleViewChange("new")}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeView === "new"
                  ? "bg-gray-800 text-white border-blue-500 shadow-[0_8px_20px_rgba(59,130,246,0.3)]"
                  : "bg-gray-800 text-white border-white/20 hover:border-blue-400/50 hover:bg-gray-700"
              }`}
              title="View new arrivals"
            >
              <Zap className={`w-4 h-4 sm:w-4 sm:h-4 ${activeView === "new" ? "text-blue-500" : "text-white/60"}`} />
              <span className="font-normal">New</span>
            </button>
            <button
              onClick={() => handleViewChange("popular")}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 flex-shrink-0 ${
                activeView === "popular"
                  ? "bg-gray-800 text-white border-red-500 shadow-[0_8px_20px_rgba(220,38,38,0.3)]"
                  : "bg-gray-800 text-white border-white/20 hover:border-red-400/50 hover:bg-gray-700"
              }`}
              title="View popular products"
            >
              <Heart className={`w-4 h-4 sm:w-4 sm:h-4 ${activeView === "popular" ? "text-red-500" : "text-white/60"}`} />
              <span className="font-normal">Popular</span>
            </button>

          </div>
        </div>
      </div>


      {/* Featured Products Section */}
      {!loading && products.length > 0 && filters.category === "" && (
        <FeaturedProducts products={products} />
      )}

      {/* Main Content - Full Width without Sidebar */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Products Grid or Loading/Empty State */}
        {loading ? (
          <ProductsLoading message="Discovering amazing products..." />
        ) : products.length === 0 ? (
          <NoProductsFound clearFilters={clearFilters} />
        ) : (
          <>
            <ProductsGrid products={products} />

            <ProductsPagination
              hasNext={pagination.hasNext}
              loading={loadingMore}
              onLoadMore={() => {
                setPagination((prev) => ({
                  ...prev,
                  offset: prev.offset + prev.limit,
                }));
              }}
            />
          </>
        )}
      </div>


      {/* Custom Scrollbar Styling for Select Elements */}
      <style jsx global>{`
        select {
          max-height: 300px;
          scrollbar-width: thin;
          scrollbar-color: #ff6347 #1f2937;
        }

        select::-webkit-scrollbar {
          width: 8px;
        }

        select::-webkit-scrollbar-track {
          background: #1f2937;
        }

        select::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #ff6347 0%, #ff7359 100%);
          border-radius: 4px;
        }

        select::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #ff7359 0%, #ff8369 100%);
          box-shadow: 0 0 10px rgba(255, 99, 71, 0.4);
        }

        /* Style option elements for better visibility */
        option {
          background-color: #1f2937;
          color: #ffffff;
          padding: 8px 12px;
        }

        option:hover {
          background-color: #374151;
          color: #fbbf24;
        }

        option:checked {
          background: linear-gradient(#ff6347, #ff6347);
          background-color: #ff6347 !important;
          color: white;
        }
      `}</style>
    </div>
  );
}