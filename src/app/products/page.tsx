/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { productAPI, ExtendedProduct } from "@/lib/api";

import { ProductsHero } from "@/components/products/ProductsHero";
import { FeaturedCreatorsSection } from "@/components/products/FeaturedCreatorsSection";
import { ProductsFilterTopBar } from "@/components/products/ProductsFilterTopBar";
import { ProductsControls } from "@/components/products/ProductsControls";
import { ProductsGrid } from "@/components/products/ProductsGrid";
import { ProductsList } from "@/components/products/ProductsList";
import { ProductsPagination } from "@/components/products/ProductsPagination";
import { NoProductsFound } from "@/components/products/NoProductsFound";
import { ProductsLoading } from "@/components/products/ProductsLoading";

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
        // toast.error("Failed to load products");
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

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      <ProductsHero
        filters={filters}
        setFilters={setFilters}
        fetchProducts={fetchProducts}
        pagination={pagination}
        creators={creators}
        categories={categories}
      />

      <FeaturedCreatorsSection
        creators={creators}
        handleFilterChange={handleFilterChange}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ProductsFilterTopBar
          filters={filters}
          setFilters={setFilters}
          handleFilterChange={handleFilterChange}
          clearFilters={clearFilters}
          fetchProducts={fetchProducts}
          categories={categories}
          creators={creators}
        />

        <div className="flex-1">
            <ProductsControls
              loading={loading}
              pagination={pagination}
              filters={filters}
              setFilters={setFilters}
              viewMode={viewMode}
              setViewMode={setViewMode}
            />

            {loading ? (
              <ProductsLoading message="Discovering amazing products..." />
            ) : products.length === 0 ? (
              <NoProductsFound clearFilters={clearFilters} />
            ) : (
              <>
                {viewMode === "grid" ? (
                  <ProductsGrid products={products} />
                ) : (
                  <ProductsList products={products} />
                )}

                <ProductsPagination
                  hasNext={pagination.hasNext}
                  setPagination={setPagination}
                  fetchProducts={fetchProducts}
                />
              </>
            )}
          </div>
        </div>
      </div>
  
  );
}