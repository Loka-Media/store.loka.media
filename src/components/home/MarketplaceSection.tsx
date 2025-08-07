"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { productAPI, ExtendedProduct } from "@/lib/api";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import toast from "react-hot-toast";
import { SearchBar } from "./SearchBar";
import { FeaturedCreators } from "./FeaturedCreators";
import { ProductGrid } from "./ProductGrid";
import { Pagination } from "./Pagination";

interface MarketplaceSectionProps {
  isAuthenticated: boolean;
}

export function MarketplaceSection({
  isAuthenticated,
}: MarketplaceSectionProps) {
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<
    { category: string; product_count: number }[]
  >([]);
  const [creators, setCreators] = useState<
    { id: number; name: string; username: string; product_count: number }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const { addToCart } = useGuestCart();
  const { addToWishlist } = useWishlist();

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

  useEffect(() => {
    const category = searchParams.get("category") || "";
    const search = searchParams.get("search") || "";
    const creator = searchParams.get("creator") || "";
    const source =
      (searchParams.get("source") as "printful" | "shopify" | "all") || "all";

    setFilters((prev) => ({ ...prev, category, search, creator, source }));
    fetchCategories();
    fetchCreators();

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

  useEffect(() => {
    if (!loading) {
      fetchProducts();
    }
  }, [
    filters.category,
    filters.search,
    filters.creator,
    filters.source,
    filters.minPrice,
    filters.maxPrice,
    filters.sortBy,
    filters.sortOrder,
    pagination.offset,
  ]);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    const params = new URLSearchParams();
    if (newFilters.category) params.set("category", newFilters.category);
    if (newFilters.search) params.set("search", newFilters.search);
    if (newFilters.creator) params.set("creator", newFilters.creator);
    if (newFilters.source && newFilters.source !== "all")
      params.set("source", newFilters.source);

    router.push(`/?${params.toString()}`, undefined);
  };

  const handleFiltersUpdate = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
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
    router.push("/", undefined);
  };

  const handleCreatorSelect = (creatorName: string) => {
    handleFilterChange("creator", creatorName);
  };

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleSearch = () => {
    fetchProducts();
  };

  const handleAddToWishlist = (productId: string) => {
    addToWishlist(parseInt(productId));
  };

  const handlePageChange = (newOffset: number) => {
    setPagination((prev) => ({ ...prev, offset: newOffset }));
  };

  return (
    <section
      id="marketplace-section"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-950 text-white border-t border-gray-800"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
            Discover Amazing Products
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
            Explore a diverse collection of unique, custom-designed products
            from talented creators worldwide.
          </p>
          <SearchBar
            searchValue={filters.search}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
          />
        </div>

        <FeaturedCreators
          creators={creators}
          onCreatorSelect={handleCreatorSelect}
        />

        <div className="flex flex-col lg:flex-row gap-8">
          {/* <ProductFilters
            filters={filters}
            categories={categories}
            creators={creators}
            onFilterChange={handleFilterChange}
            onFiltersUpdate={handleFiltersUpdate}
            onClearFilters={handleClearFilters}
            onSearch={handleSearch}
          /> */}

          <ProductGrid
            products={products}
            loading={loading}
            viewMode={viewMode}
            totalProducts={pagination.total}
            isAuthenticated={isAuthenticated}
            onViewModeChange={setViewMode}
            onAddToWishlist={handleAddToWishlist}
          />
        </div>

        <Pagination pagination={pagination} onPageChange={handlePageChange} />
      </div>
    </section>
  );
}
