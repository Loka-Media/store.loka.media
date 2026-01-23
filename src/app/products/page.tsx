/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { productAPI, ExtendedProduct } from "@/lib/api";
import { TrendingUp, Zap, Heart, X } from "lucide-react";

import { ProductsHero } from "@/components/products/ProductsHero";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import type { ViewType } from "@/components/products/ProductViewTabs";
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
  const searchParams = useSearchParams();

  // Refs to track initialization and prevent strict mode double-fetching
  const isStaticDataFetched = useRef(false);
  const lastFetchedFiltersRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const [filters, setFilters] = useState(() => ({
    category: searchParams.get("category") || "",
    search: searchParams.get("search") || "",
    creator: searchParams.get("creator") || "",
    sortBy: "created_at",
    sortOrder: "DESC",
    source: (searchParams.get("source") as "printful" | "shopify" | "all") || "all",
    minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
    maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
  }));

  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasNext: false,
  });

  const fetchProducts = useCallback(
    async (
      customFilters: typeof filters,
      customPagination: { limit: number; offset: number },
      appendMode = false
    ) => {
      const startTime = performance.now();
      try {
        if (appendMode) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        // Clean up filters - only send non-empty values
        const cleanFilters: any = {
          limit: customPagination.limit,
          offset: customPagination.offset,
          sortBy: customFilters.sortBy,
          sortOrder: customFilters.sortOrder,
        };

        // Only add filter params if they have values
        if (customFilters.category) cleanFilters.category = customFilters.category;
        if (customFilters.search) cleanFilters.search = customFilters.search;
        if (customFilters.creator) cleanFilters.creator = customFilters.creator;
        if (customFilters.source && customFilters.source !== "all") cleanFilters.source = customFilters.source;
        if (customFilters.minPrice) cleanFilters.minPrice = customFilters.minPrice;
        if (customFilters.maxPrice) cleanFilters.maxPrice = customFilters.maxPrice;

        const response = await productAPI.getProducts(cleanFilters);

        if (appendMode) {
          setProducts((prev) => [...prev, ...response.products]);
        } else {
          setProducts(response.products);
        }

        setPagination((prev) => ({ ...prev, ...response.pagination }));

        // Minimal console log as requested - only logging the total time
        console.log(`API [Products]: ${(performance.now() - startTime).toFixed(2)}ms`);

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

  const fetchCategories = useCallback(async () => {
    try {
      const start = performance.now();
      const response = await productAPI.getCategories();
      setCategories(response.categories);
      console.log(`API [Categories]: ${(performance.now() - start).toFixed(2)}ms`);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, []);

  const fetchCreators = useCallback(async () => {
    try {
      const start = performance.now();
      const response = await productAPI.getCreators();
      setCreators(response.creators);
      console.log(`API [Creators]: ${(performance.now() - start).toFixed(2)}ms`);
    } catch (error) {
      console.error("Failed to fetch creators:", error);
    }
  }, []);

  // 1. Static Data Fetch - Strictly Once
  useEffect(() => {
    if (isStaticDataFetched.current) return;
    isStaticDataFetched.current = true;

    fetchCategories();
    fetchCreators();
  }, [fetchCategories, fetchCreators]);

  // Search Input Debounce - Only update filters after user stops typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (searchInput !== filters.search) {
        const newFilters = { ...filters, search: searchInput };
        setFilters(newFilters);

        const params = new URLSearchParams();
        if (newFilters.category) params.set("category", newFilters.category);
        if (searchInput) params.set("search", searchInput);
        if (newFilters.creator) params.set("creator", newFilters.creator);
        if (newFilters.source && newFilters.source !== "all")
          params.set("source", newFilters.source);

        window.history.replaceState({}, '', searchInput || newFilters.category || newFilters.creator ? `/products?${params.toString()}` : '/products');
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, filters]);

  // 2. URL Sync
  useEffect(() => {
    const currentCategory = searchParams.get("category") || "";
    const currentSearch = searchParams.get("search") || "";
    const currentCreator = searchParams.get("creator") || "";
    const currentSource = (searchParams.get("source") as "printful" | "shopify" | "all") || "all";
    const currentMinPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const currentMaxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;

    setFilters(prev => {
      if (
        prev.category === currentCategory &&
        prev.search === currentSearch &&
        prev.creator === currentCreator &&
        prev.source === currentSource &&
        prev.minPrice === currentMinPrice &&
        prev.maxPrice === currentMaxPrice
      ) {
        return prev;
      }
      return {
        ...prev,
        category: currentCategory,
        search: currentSearch,
        creator: currentCreator,
        source: currentSource,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice
      };
    });
  }, [searchParams]);

  // 3. Main Data Fetch - De-duped Strict Mode Guard
  useEffect(() => {
    const filtersKey = JSON.stringify(filters);

    // Prevent duplicate fetch on mount in strict mode
    if (lastFetchedFiltersRef.current === filtersKey) {
      return;
    }
    lastFetchedFiltersRef.current = filtersKey;

    setPagination((prev) => ({ ...prev, offset: 0 }));
    fetchProducts(filters, { limit: 20, offset: 0 });
  }, [
    filters,
    fetchProducts
  ]);

  // 4. Pagination Fetch (Load More)
  useEffect(() => {
    if (pagination.offset === 0) return;
    // No guard needed here as offset change is explicit user action usually
    fetchProducts(filters, { limit: pagination.limit, offset: pagination.offset }, true);
  }, [pagination.offset, fetchProducts, filters, pagination.limit]);


  const updateURL = (updatedFilters: typeof filters) => {
    const params = new URLSearchParams();
    if (updatedFilters.category) params.set("category", updatedFilters.category);
    if (updatedFilters.search) params.set("search", updatedFilters.search);
    if (updatedFilters.creator) params.set("creator", updatedFilters.creator);
    if (updatedFilters.source && updatedFilters.source !== "all")
      params.set("source", updatedFilters.source);
    if (updatedFilters.minPrice) params.set("minPrice", updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice) params.set("maxPrice", updatedFilters.maxPrice.toString());

    const newUrl = params.toString() ? `/products?${params.toString()}` : '/products';
    window.history.replaceState({}, '', newUrl);
  };

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is already triggered by filter state change
  };

  const clearFilters = useCallback(async () => {
    // Reset all filters to default state
    const clearedFilters = {
      category: "",
      search: "",
      creator: "",
      sortBy: "created_at",
      sortOrder: "DESC",
      source: "all" as const,
      minPrice: undefined as number | undefined,
      maxPrice: undefined as number | undefined,
    };

    // Clear the deduplication ref to force a fresh fetch
    lastFetchedFiltersRef.current = null;

    // Clear the URL first to avoid sync issues
    window.history.replaceState({}, '', '/products');

    // Reset all state
    setProducts([]);
    setPagination({ total: 0, limit: 20, offset: 0, hasNext: false });
    setFilters(clearedFilters);
    setLoading(true);

    // Force a fresh fetch with cache invalidation
    try {
      const response = await productAPI.getProducts({
        ...clearedFilters,
        limit: 20,
        offset: 0,
        force_refresh: true
      });
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
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
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .filter-section-animate {
          animation: slideDown 0.5s ease-out;
        }
        .products-section-animate {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      <ProductsHero
        creators={creators}
        categories={categories}
      />

      <div className="bg-black border-b border-white/10 relative z-40 filter-section-animate">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 overflow-visible">
          <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative w-full lg:w-1/2">
              <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearchSubmit(e);
                  }
                }}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 h-11 sm:h-12 rounded-xl border border-white/20 bg-gradient-to-br from-gray-800 to-gray-900 text-white text-xs sm:text-sm placeholder-white/40 hover:border-orange-400/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
              />
            </div>

            <div className="flex flex-col lg:flex-row gap-2 sm:gap-4 w-full lg:w-1/2">
              <div className="relative flex-1">
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange("category", e.target.value)}
                  className={`w-full px-4 sm:px-5 py-3 sm:py-3.5 h-11 sm:h-12 rounded-xl border bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm hover:shadow-[0_8px_24px_rgba(255,99,71,0.15)] focus:outline-none focus:ring-2 transition-all cursor-pointer font-medium appearance-none ${
                    filters.category ? "border-blue-400 focus:border-blue-400 focus:ring-blue-400/30" : "border-white/30 hover:border-orange-400 focus:border-orange-400 focus:ring-orange-400/30"
                  }`}
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
                {filters.category && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full"></div>
                )}
              </div>

              {(filters.category || searchInput || filters.creator) && (
                <button
                  onClick={clearFilters}
                  className="px-3 sm:px-4 py-3 sm:py-3.5 h-11 sm:h-12 rounded-xl border border-white/20 bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm hover:border-red-400 hover:shadow-[0_8px_24px_rgba(239,68,68,0.15)] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/30 transition-all cursor-pointer font-medium flex items-center justify-center gap-1.5"
                  title="Clear all filters"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center mb-4">
            <div className="flex gap-2 sm:gap-3 items-center overflow-x-auto overflow-y-visible scrollbar-hide pb-2 xs:pb-0 -mx-4 xs:mx-0 px-4 xs:px-0">
              <button
                onClick={() => handleViewChange("trending")}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 flex-shrink-0 ${activeView === "trending"
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
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 flex-shrink-0 ${activeView === "new"
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
                className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 flex-shrink-0 ${activeView === "popular"
                    ? "bg-gray-800 text-white border-red-500 shadow-[0_8px_20px_rgba(220,38,38,0.3)]"
                    : "bg-gray-800 text-white border-white/20 hover:border-red-400/50 hover:bg-gray-700"
                  }`}
                title="View popular products"
              >
                <Heart className={`w-4 h-4 sm:w-4 sm:h-4 ${activeView === "popular" ? "text-red-500" : "text-white/60"}`} />
                <span className="font-normal">Popular</span>
              </button>
            </div>

            <select
              value={filters.source}
              onChange={(e) => handleFilterChange("source", e.target.value as "printful" | "shopify" | "all")}
              className="flex-shrink-0 px-4 py-2.5 sm:py-3 h-11 sm:h-12 rounded-xl border border-white/30 bg-gradient-to-br from-gray-700 to-gray-800 text-white text-xs sm:text-sm hover:border-orange-400 hover:shadow-[0_8px_24px_rgba(255,99,71,0.15)] focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/30 transition-all cursor-pointer font-medium appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                paddingRight: '32px',
              }}
            >
              <option value="all">All Sources</option>
              <option value="printful">Printful</option>
              <option value="shopify">Shopify</option>
            </select>
          </div>
        </div>
      </div>

      {!loading && products.length > 0 && filters.category === "" && (
        <FeaturedProducts products={products} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 products-section-animate">
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