/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();

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
  const [isPriceRangeOpen, setIsPriceRangeOpen] = useState(false);

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
    async () => {
      const startTime = performance.now();
      try {
        setLoading(true);
        const response = await productAPI.getProducts({
          limit: 1000,
          offset: 0,
        });
        setProducts(response.products);
        console.log(`API [Products]: ${(performance.now() - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
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

  // Fetch products (static fetch, then filter locally)
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

        const newUrl = searchInput || newFilters.category || newFilters.creator ? `/products?${params.toString()}` : '/products';
        router.replace(newUrl, { scroll: false });
      }
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput, filters, router]);

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

  // 3. Reset pagination offset when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, offset: 0 }));
  }, [filters]);

  // 4. Local client-side filtering, sorting, and pagination logic
  const filteredProducts = products.filter((product) => {
    if (filters.category && product.category !== filters.category) {
      return false;
    }
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const nameMatch = product.name?.toLowerCase().includes(query);
      const descMatch = product.description?.toLowerCase().includes(query);
      const categoryMatch = product.category?.toLowerCase().includes(query);
      if (!nameMatch && !descMatch && !categoryMatch) {
        return false;
      }
    }

    if (filters.creator) {
      const creatorFilter = String(filters.creator).toLowerCase().trim();
      
      const isIdMatch = product.creator_id && String(product.creator_id) === creatorFilter;
      const isUserIdMatch = (product as any).user_id && String((product as any).user_id) === creatorFilter;
      const isNameMatch = product.creator_name && product.creator_name.toLowerCase().includes(creatorFilter);
      const isUsernameMatch = product.creator_username && product.creator_username.toLowerCase().includes(creatorFilter);
      
      const creatorObj = product.creator as any;
      const isObjIdMatch = creatorObj?.id && String(creatorObj.id) === creatorFilter;
      const isObjNameMatch = creatorObj?.name && creatorObj.name.toLowerCase().includes(creatorFilter);
      const isObjUsernameMatch = creatorObj?.username && creatorObj.username.toLowerCase().includes(creatorFilter);

      if (!isIdMatch && !isUserIdMatch && !isNameMatch && !isUsernameMatch && !isObjIdMatch && !isObjNameMatch && !isObjUsernameMatch) {
        return false;
      }
    }

    if (filters.source && filters.source !== "all" && product.source !== filters.source) {
      return false;
    }
    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === "created_at") {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return filters.sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
    }
    if (filters.sortBy === "base_price") {
      const priceA = parseFloat(String(a.base_price)) || 0;
      const priceB = parseFloat(String(b.base_price)) || 0;
      return filters.sortOrder === "DESC" ? priceB - priceA : priceA - priceB;
    }
    return 0;
  });

  const paginatedProducts = sortedProducts.slice(0, pagination.offset + pagination.limit);
  const hasNext = sortedProducts.length > paginatedProducts.length;


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
    router.replace(newUrl, { scroll: false });
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

  const clearFilters = useCallback(() => {
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

    // Reset search input state
    setSearchInput("");

    // Clear the URL first to avoid sync issues
    router.replace('/products', { scroll: false });

    // Reset all state
    setPagination({ total: 0, limit: 20, offset: 0, hasNext: false });
    setFilters(clearedFilters);
  }, [router]);

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
          <form onSubmit={handleSearchSubmit} className="space-y-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-4 items-center">
              <div className="relative">
                <svg className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchSubmit(e);
                    }
                  }}
                  className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 h-12 rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900 to-black text-white text-sm placeholder-white/40 hover:border-orange-400/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange("category", e.target.value)}
                    className={`w-full px-4 py-3 h-12 rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900 to-black text-white text-sm appearance-none cursor-pointer ${filters.category ? "border-blue-400 focus:border-blue-400" : "hover:border-orange-400 focus:border-orange-400"}`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px center',
                    }}
                  >
                    <option value="">All Types</option>
                    {categories.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} ({cat.product_count})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="relative">
                  <select
                    value={filters.creator}
                    onChange={(e) => handleFilterChange("creator", e.target.value)}
                    className={`w-full px-4 py-3 h-12 rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900 to-black text-white text-sm appearance-none cursor-pointer ${filters.creator ? "border-blue-400 focus:border-blue-400" : "hover:border-orange-400 focus:border-orange-400"}`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 16px center',
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
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleViewChange("trending")}
                  className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all flex items-center gap-2 ${activeView === "trending"
                    ? "bg-gray-800 text-white border-purple-500"
                    : "bg-gray-900 text-white border-white/20 hover:border-purple-400 hover:bg-gray-800"
                    }`}
                >
                  Trending
                  <TrendingUp className={`w-4 h-4 ${activeView === "trending" ? "text-purple-400" : "text-white/60"}`} />
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange("new")}
                  className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all flex items-center gap-2 ${activeView === "new"
                    ? "bg-gray-800 text-white border-blue-500"
                    : "bg-gray-900 text-white border-white/20 hover:border-blue-400 hover:bg-gray-800"
                    }`}
                >
                  New
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    viewBox="0 0 42 42"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M19.25 22.75V26.25C19.25 26.7458 19.4177 27.1615 19.7531 27.4969C20.0885 27.8323 20.5042 28 21 28C21.4958 28 21.9115 27.8323 22.2469 27.4969C22.5823 27.1615 22.75 26.7458 22.75 26.25V22.75H26.25C26.7458 22.75 27.1615 22.5823 27.4969 22.2469C27.8323 21.9115 28 21.4958 28 21C28 20.5042 27.8323 20.0885 27.4969 19.7531C27.1615 19.4177 26.7458 19.25 26.25 19.25H22.75V15.75C22.75 15.2542 22.5823 14.8385 22.2469 14.5031C21.9115 14.1677 21.4958 14 21 14C20.5042 14 20.0885 14.1677 19.7531 14.5031C19.4177 14.8385 19.25 15.2542 19.25 15.75V19.25H15.75C15.2542 19.25 14.8385 19.4177 14.5031 19.7531C14.1677 20.0885 14 20.5042 14 21C14 21.4958 14.1677 21.9115 14.5031 22.2469C14.8385 22.5823 15.2542 22.75 15.75 22.75H19.25ZM21 38.5C20.5333 38.5 20.0885 38.4198 19.6656 38.2594C19.2427 38.099 18.8708 37.8438 18.55 37.4938L4.59375 23.4937C4.27292 23.1438 4.01042 22.7573 3.80625 22.3344C3.60208 21.9115 3.5 21.4667 3.5 21C3.5 20.5333 3.60208 20.0885 3.80625 19.6656C4.01042 19.2427 4.27292 18.8708 4.59375 18.55L18.55 4.55C18.9 4.2 19.2792 3.9375 19.6875 3.7625C20.0958 3.5875 20.5333 3.5 21 3.5C21.4667 3.5 21.9188 3.5875 22.3563 3.7625C22.7938 3.9375 23.1729 4.2 23.4937 4.55L37.4062 18.55C37.7271 18.9 37.9896 19.2792 38.1938 19.6875C38.3979 20.0958 38.5 20.5333 38.5 21C38.5 21.4667 38.4052 21.9115 38.2156 22.3344C38.026 22.7573 37.7562 23.1438 37.4062 23.4937L23.4937 37.4938C23.1729 37.8146 22.7938 38.0625 22.3563 38.2375C21.9188 38.4125 21.4667 38.5 21 38.5ZM21 35L34.9563 21L21 7L7.04375 21L21 35Z"
                      fill={activeView === "new" ? "#3A61FF" : "#9CA3AF"}
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleViewChange("popular")}
                  className={`px-4 py-3 rounded-2xl text-sm font-semibold border transition-all flex items-center gap-2 ${activeView === "popular"
                    ? "bg-gray-800 text-white border-red-500"
                    : "bg-gray-900 text-white border-white/20 hover:border-red-400 hover:bg-gray-800"
                    }`}
                >
                  Popular
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    viewBox="0 0 42 42"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <mask
                      id="heartMask"
                      style={{ maskType: "alpha" }}
                      maskUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="42"
                      height="42"
                    >
                      <rect width="42" height="42" fill="#D9D9D9" />
                    </mask>

                    <g mask="url(#heartMask)">
                      <path
                        d="M21 38.5009C17.0917 38.5009 13.7812 37.1446 11.0687 34.4321C8.35625 31.7196 7 28.4092 7 24.5009C7 21.205 7.97708 18.0404 9.93125 15.0071C11.8854 11.9738 14.5687 9.31961 17.9812 7.04461C18.6229 6.60711 19.2865 6.58524 19.9719 6.97899C20.6573 7.37274 21 7.96336 21 8.75086V11.0259C21 12.0175 21.3427 12.8488 22.0281 13.5196C22.7135 14.1904 23.5521 14.5259 24.5438 14.5259C25.0396 14.5259 25.5135 14.4165 25.9656 14.1977C26.4177 13.979 26.8188 13.6654 27.1688 13.2571C27.4021 12.9654 27.701 12.7832 28.0656 12.7102C28.4302 12.6373 28.7729 12.7175 29.0938 12.9509C30.9312 14.2634 32.375 15.9404 33.425 17.9821C34.475 20.0238 35 22.1967 35 24.5009C35 28.4092 33.6438 31.7196 30.9312 34.4321C28.2188 37.1446 24.9083 38.5009 21 38.5009ZM10.5 24.5009C10.5 26.0175 10.8063 27.454 11.4188 28.8102C12.0312 30.1665 12.9062 31.355 14.0438 32.3759C14.0146 32.23 14 32.0988 14 31.9821V31.5884C14 30.655 14.175 29.78 14.525 28.9634C14.875 28.1467 15.3854 27.4029 16.0563 26.7321L21 21.8759L25.9438 26.7321C26.6146 27.4029 27.125 28.1467 27.475 28.9634C27.825 29.78 28 30.655 28 31.5884V31.9821C28 32.0988 27.9854 32.23 27.9563 32.3759C29.0938 31.355 29.9688 30.1665 30.5813 28.8102C31.1938 27.454 31.5 26.0175 31.5 24.5009C31.5 23.0425 31.2302 21.6644 30.6906 20.3665C30.151 19.0686 29.3708 17.9092 28.35 16.8884C27.7667 17.2675 27.1542 17.5519 26.5125 17.7415C25.8708 17.9311 25.2146 18.0259 24.5438 18.0259C22.7354 18.0259 21.1677 17.4279 19.8406 16.2321C18.5135 15.0363 17.7479 13.5634 17.5437 11.8134C15.2688 13.7384 13.526 15.7873 12.3156 17.9602C11.1052 20.1332 10.5 22.3134 10.5 24.5009ZM21 26.7759L18.5063 29.2259C18.1854 29.5467 17.9375 29.9113 17.7625 30.3196C17.5875 30.7279 17.5 31.1509 17.5 31.5884C17.5 32.5217 17.8427 33.3238 18.5281 33.9946C19.2135 34.6654 20.0375 35.0009 21 35.0009C21.9625 35.0009 22.7865 34.6654 23.4719 33.9946C24.1573 33.3238 24.5 32.5217 24.5 31.5884C24.5 31.1217 24.4125 30.6915 24.2375 30.2977C24.0625 29.904 23.8146 29.5467 23.4937 29.2259L21 26.7759Z"
                        fill={activeView === "popular" ? "#FF1F1F" : "#9CA3AF"}
                      />
                    </g>
                  </svg>
                </button>
              </div>

              <div className="w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setIsPriceRangeOpen((open) => !open)}
                  className="w-full lg:w-auto px-4 py-3 rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900 to-black text-white text-sm font-semibold hover:border-orange-400 hover:bg-gray-800 transition-all"
                >
                  {filters.minPrice !== undefined || filters.maxPrice !== undefined
                    ? `$${filters.minPrice ?? 0} - $${filters.maxPrice ?? "Any"}`
                    : "$ Price Range"}
                </button>
              </div>
            </div>

            {isPriceRangeOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl border border-white/10 bg-gray-950/90">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice ?? ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "minPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-black text-white text-sm placeholder-white/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice ?? ""}
                  onChange={(e) =>
                    handleFilterChange(
                      "maxPrice",
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-white/20 bg-black text-white text-sm placeholder-white/50 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
            )}

            {(filters.category || searchInput || filters.creator || filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setIsPriceRangeOpen(false);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-3 h-12 rounded-2xl border border-white/20 bg-gradient-to-br from-gray-900 to-black text-white text-sm font-semibold hover:border-red-400 hover:bg-gray-800 transition-all"
                >
                  <X className="w-4 h-4" />
                  Clear
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {!loading && paginatedProducts.length > 0 && filters.category === "" && (
        <FeaturedProducts products={paginatedProducts} />
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 products-section-animate">
        {loading ? (
          <ProductsLoading message="Discovering amazing products..." />
        ) : paginatedProducts.length === 0 ? (
          <NoProductsFound clearFilters={clearFilters} />
        ) : (
          <>
            <ProductsGrid products={paginatedProducts} />

            <ProductsPagination
              hasNext={hasNext}
              loading={false}
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