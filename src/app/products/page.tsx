/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { productAPI, ExtendedProduct } from "@/lib/api";

import { ProductsHero } from "@/components/products/ProductsHero";
import { CategoryNavigation } from "@/components/products/CategoryNavigation";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { ProductViewTabs, ViewType } from "@/components/products/ProductViewTabs";
import { ProductsSidebar } from "@/components/products/ProductsSidebar";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { NoProductsFound } from "@/components/products/NoProductsFound";
import { ProductsLoading } from "@/components/products/ProductsLoading";

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="min-h-screen bg-white flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading marketplace...</p>
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
    <div className="bg-white text-black min-h-screen">
      {/* Simplified Hero with Search */}
      <ProductsHero
        filters={filters}
        setFilters={setFilters}
        fetchProducts={fetchProducts}
        pagination={pagination}
        creators={creators}
        categories={categories}
      />

      {/* Category Navigation */}
      <CategoryNavigation
        categories={categories}
        activeCategory={filters.category}
        onCategoryChange={(category) => handleFilterChange("category", category)}
      />

      {/* Featured Products Section */}
      {!loading && products.length > 0 && filters.category === "" && (
        <FeaturedProducts products={products} />
      )}

      {/* Main Content with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters - Hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <ProductsSidebar
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
          </aside>

          {/* Main Products Area */}
          <div className="flex-1">
            {/* View Tabs */}
            <ProductViewTabs
              activeView={activeView}
              onViewChange={handleViewChange}
              resultCount={pagination.total}
            />

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
        </div>
      </div>
    </div>
  );
}