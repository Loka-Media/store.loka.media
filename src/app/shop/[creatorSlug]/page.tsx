/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { productAPI, ExtendedProduct } from "@/lib/api";
import { TrendingUp, Zap, Heart, ChevronLeft, ChevronRight } from "lucide-react";

import { CreatorHero } from "@/components/products/CreatorHero";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { NoProductsFound } from "@/components/products/NoProductsFound";
import { ProductsLoading } from "@/components/products/ProductsLoading";
import CreativeLoader from "@/components/CreativeLoader";
import type { ViewType } from "@/components/products/ProductViewTabs";

export default function CreatorShopPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Suspense
        fallback={
          <div className="min-h-screen bg-black text-white">
            <CreativeLoader variant="product" message="Loading creator shop..." />
          </div>
        }
      >
        <CreatorShopContent />
      </Suspense>
    </div>
  );
}

function CreatorShopContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const creatorSlug = params.creatorSlug as string;

  // Refs to track initialization and prevent strict mode double-fetching
  const isStaticDataFetched = useRef(false);
  const lastFetchedFiltersRef = useRef<string | null>(null);

  const [creator, setCreator] = useState<any>(null);
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<
    { category: string; product_count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>("trending");
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollArrows, setShowScrollArrows] = useState(false);

  const checkScrollability = useCallback(() => {
    if (categoryScrollRef.current) {
      const { scrollWidth, clientWidth } = categoryScrollRef.current;
      setShowScrollArrows(scrollWidth > clientWidth);
    }
  }, []);

  useEffect(() => {
    checkScrollability();
    const timer = setTimeout(checkScrollability, 150);
    window.addEventListener("resize", checkScrollability);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [categories, checkScrollability]);

  const [filters, setFilters] = useState(() => ({
    category: searchParams.get("category") || "",
    search: "",
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
          creator: creatorSlug, // Always filter by creator slug/username
          isActive: true, // Only show active products on the shop page
        };

        // Only add filter params if they have values
        if (customFilters.category) cleanFilters.category = customFilters.category;
        if (customFilters.search) cleanFilters.search = customFilters.search;
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

        console.log(`API [Creator Products]: ${(performance.now() - startTime).toFixed(2)}ms`);

      } catch (error) {
        console.error("Failed to fetch creator products:", error);
      } finally {
        if (appendMode) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [creatorSlug]
  );

  const fetchCategories = useCallback(async () => {
    try {
      const start = performance.now();
      const response = await productAPI.getCategories({ creator: creatorSlug });
      setCategories(response.categories);
      console.log(`API [Categories]: ${(performance.now() - start).toFixed(2)}ms`);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  }, [creatorSlug]);

  const fetchCreator = useCallback(async () => {
    try {
      const start = performance.now();
      
      // Try to find matching creator in creators list to get official name and username
      const creatorsRes = await productAPI.getCreators();
      const list = creatorsRes.creators || [];
      const matchingCreator = list.find(
        (c: any) =>
          c.username.toLowerCase() === creatorSlug.toLowerCase() ||
          c.name.replace(/\s+/g, "").toLowerCase() === creatorSlug.toLowerCase()
      );

      if (matchingCreator) {
        setCreator({
          name: matchingCreator.name,
          username: matchingCreator.username,
          profileImg: matchingCreator.profile_img,
        });
      } else {
        // Fallback: query backend directly for a product to see if we can extract creator details
        const response = await productAPI.getProducts({ creator: creatorSlug, limit: 1, offset: 0 });
        if (response.products.length > 0 && response.products[0].creator) {
          const creatorInfo = {
            name: response.products[0].creator.name || response.products[0].creator_name,
            username: response.products[0].creator.username || creatorSlug,
          };
          setCreator(creatorInfo);
        } else {
          // Default fallback using slug
          setCreator({
            name: creatorSlug,
            username: creatorSlug,
          });
        }
      }

      console.log(`API [Creator Info]: ${(performance.now() - start).toFixed(2)}ms`);
    } catch (error) {
      console.error("Failed to fetch creator info:", error);
      setCreator({
        name: creatorSlug,
        username: creatorSlug,
      });
    }
  }, [creatorSlug]);

  // 1. Static Data Fetch - Strictly Once
  useEffect(() => {
    if (isStaticDataFetched.current) return;
    isStaticDataFetched.current = true;

    fetchCategories();
    fetchCreator();
  }, [fetchCategories, fetchCreator]);

  // URL Sync for Category Filter
  useEffect(() => {
    const currentCategory = searchParams.get("category") || "";
    const currentSource = (searchParams.get("source") as "printful" | "shopify" | "all") || "all";
    const currentMinPrice = searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined;
    const currentMaxPrice = searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined;

    setFilters(prev => {
      if (
        prev.category === currentCategory &&
        prev.source === currentSource &&
        prev.minPrice === currentMinPrice &&
        prev.maxPrice === currentMaxPrice
      ) {
        return prev;
      }
      return {
        ...prev,
        category: currentCategory,
        source: currentSource,
        minPrice: currentMinPrice,
        maxPrice: currentMaxPrice
      };
    });
  }, [searchParams]);

  // 3. Main Data Fetch - De-duped Strict Mode Guard
  useEffect(() => {
    const filtersKey = JSON.stringify(filters);

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
    fetchProducts(filters, { limit: pagination.limit, offset: pagination.offset }, true);
  }, [pagination.offset, fetchProducts, filters, pagination.limit]);

  const updateURL = (updatedFilters: typeof filters) => {
    const params = new URLSearchParams();
    if (updatedFilters.category) params.set("category", updatedFilters.category);
    if (updatedFilters.source && updatedFilters.source !== "all")
      params.set("source", updatedFilters.source);
    if (updatedFilters.minPrice) params.set("minPrice", updatedFilters.minPrice.toString());
    if (updatedFilters.maxPrice) params.set("maxPrice", updatedFilters.maxPrice.toString());

    const newUrl = params.toString() ? `/shop/${creatorSlug}?${params.toString()}` : `/shop/${creatorSlug}`;
    window.history.replaceState({}, '', newUrl);
  };

  const handleFilterChange = (key: string, value: string | number | undefined) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const clearFilters = useCallback(() => {
    handleFilterChange("category", "");
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

  const scrollCategories = (direction: "left" | "right") => {
    if (categoryScrollRef.current) {
      const scrollAmount = 200;
      categoryScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  if (!creator && !loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Creator Not Found</h2>
          <p className="text-white/60">The creator you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen pt-12 sm:pt-16">
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

      {creator && (
        <CreatorHero
          creatorName={creator.name}
          creatorUsername={creator.username}
          avatarUrl={creator.profileImg || creator.profile_img || undefined}
          isVerified={false}
          tagline="Exclusive drops and curated essentials."
          productCount={pagination.total}
          categoryCount={categories.length}
        />
      )}

      <div className="bg-black border-b border-white/10 relative z-40 filter-section-animate">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8 overflow-visible">
          {/* Category Chips with Navigation Arrows */}
          <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Left Arrow */}
              {showScrollArrows && (
                <button
                  onClick={() => scrollCategories("left")}
                  className="flex-shrink-0 p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 transition-colors"
                  title="Scroll left"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Category Chips Container */}
              <div
                ref={categoryScrollRef}
                className="flex gap-2 items-center overflow-x-auto overflow-y-visible scrollbar-hide pb-2 xs:pb-0 flex-1"
              >
                <button
                  onClick={() => handleFilterChange("category", "")}
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-all flex-shrink-0 whitespace-nowrap ${
                    filters.category === ""
                      ? "bg-white text-black border-white"
                      : "border-white/30 text-white/80 hover:border-white/60"
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => handleFilterChange("category", cat.category)}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold border transition-all flex-shrink-0 whitespace-nowrap ${
                      filters.category === cat.category
                        ? "bg-orange-500 text-white border-orange-500"
                        : "border-white/30 text-white/80 hover:border-white/60"
                    }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Right Arrow */}
              {showScrollArrows && (
                <button
                  onClick={() => scrollCategories("right")}
                  className="flex-shrink-0 p-2 rounded-lg border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/40 transition-colors"
                  title="Scroll right"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          {/* View Type Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center sm:justify-end mb-4">
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 products-section-animate">
        {loading ? (
          <ProductsLoading message="Discovering creator's products..." />
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
    </div>
  );
}
