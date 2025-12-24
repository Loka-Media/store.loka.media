/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { productAPI, ExtendedProduct } from "@/lib/api";

import { ProductsHero } from "@/components/products/ProductsHero";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import type { ViewType } from "@/components/products/ProductViewTabs";
import { ProductsSidebar } from "@/components/products/ProductsSidebar";
import { MobileFiltersDrawer } from "@/components/products/MobileFiltersDrawer";
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
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

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
      <div className="bg-black border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-6">
          {/* Row 1: Search bar (full width on mobile) */}
          <div className="mb-3 sm:mb-4">
            <input
              type="text"
              placeholder="Search Files"
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full px-4 py-2.5 sm:py-3 rounded-lg border border-white/20 bg-gray-800 text-white text-sm placeholder-white/40 hover:border-orange-400/50 focus:outline-none focus:border-orange-400 transition-all"
            />
          </div>

          {/* Row 2: Dropdowns (stacked on mobile, row on larger screens) */}
          <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 mb-3 sm:mb-4">
            {/* All Types Dropdown */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="flex-1 xs:flex-none px-3 sm:px-4 py-2.5 sm:py-3 h-10 sm:h-11 rounded-lg border border-white/30 bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm hover:border-orange-400 hover:shadow-[0_8px_20px_rgba(255,99,71,0.2)] focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all cursor-pointer font-medium appearance-none w-full xs:w-auto"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '28px',
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
              className="flex-1 xs:flex-none px-3 sm:px-4 py-2.5 sm:py-3 h-10 sm:h-11 rounded-lg border border-white/30 bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm hover:border-orange-400 hover:shadow-[0_8px_20px_rgba(255,99,71,0.2)] focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all cursor-pointer font-medium appearance-none w-full xs:w-auto"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                paddingRight: '28px',
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

          {/* Row 3: View tabs and Price Range button (stacked on mobile) */}
          <div className="flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2 sm:gap-3">
            {/* Left side - View Tabs (scrollable on mobile) */}
            <div className="flex gap-2 items-center overflow-x-auto scrollbar-hide pb-1 xs:pb-0">
              <button
                onClick={() => handleViewChange("trending")}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs border transition-all flex items-center gap-1 flex-shrink-0 ${
                  activeView === "trending"
                    ? "bg-orange-500 text-white border-orange-400"
                    : "bg-gray-800 text-white border-white/20 hover:border-orange-400/50"
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="hidden xs:inline">Trending</span>
              </button>
              <button
                onClick={() => handleViewChange("new")}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs border transition-all flex items-center gap-1 flex-shrink-0 ${
                  activeView === "new"
                    ? "bg-orange-500 text-white border-orange-400"
                    : "bg-gray-800 text-white border-white/20 hover:border-orange-400/50"
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden xs:inline">New</span>
              </button>
              <button
                onClick={() => handleViewChange("popular")}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs border transition-all flex items-center gap-1 flex-shrink-0 ${
                  activeView === "popular"
                    ? "bg-orange-500 text-white border-orange-400"
                    : "bg-gray-800 text-white border-white/20 hover:border-orange-400/50"
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="hidden xs:inline">Popular</span>
              </button>
            </div>

            {/* Right side - Price Range Button */}
            <button className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-white/20 bg-gray-800 text-white text-xs sm:text-sm hover:border-orange-400/50 transition-all flex-shrink-0 whitespace-nowrap">
              $ Price Range
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
        {/* Mobile Filter Button - Visible only on mobile */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsMobileFiltersOpen(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 border border-orange-400 rounded-lg px-4 py-3 font-extrabold text-white hover:shadow-[0_12px_30px_rgba(255,99,71,0.3)] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Show Filters
            {(filters.creator || filters.minPrice || filters.maxPrice) && (
              <span className="bg-white text-orange-600 text-xs font-extrabold px-2 py-1 rounded-full">
                {(filters.creator ? 1 : 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

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

      {/* Mobile Filters Drawer */}
      <MobileFiltersDrawer
        isOpen={isMobileFiltersOpen}
        onClose={() => setIsMobileFiltersOpen(false)}
        filters={{
          creator: filters.creator,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
        }}
        creators={creators}
        handleFilterChange={(key, value) => {
          const newFilters = { ...filters, [key]: value };
          setFilters(newFilters);
        }}
        clearFilters={clearFilters}
      />

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