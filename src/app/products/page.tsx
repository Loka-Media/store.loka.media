/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { productAPI, formatPrice, ExtendedProduct } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
import { useGuestCart } from "@/contexts/GuestCartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Search,
  Grid,
  List,
  Heart,
  Star,
  User,
  Filter,
  // X, // Unused import
  ChevronDown,
  Eye,
  ShoppingCart,
  Zap,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Package,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

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

  const EnhancedProductCard = ({ product }: { product: ExtendedProduct }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [inventoryStatus, setInventoryStatus] = useState<{
      isAvailable: boolean;
      availableCount: number;
      totalCount: number;
      loading: boolean;
    }>({ isAvailable: true, availableCount: 0, totalCount: 0, loading: false });

    const imageUrl =
      product.thumbnail_url ||
      product.images?.[0] ||
      "/placeholder-product.svg";

    // Check inventory status when hovering
    const checkInventoryStatus = async () => {
      if (inventoryStatus.loading || inventoryStatus.totalCount > 0) return;

      try {
        setInventoryStatus((prev) => ({ ...prev, loading: true }));
        const productData = await productAPI.getProduct(product.id);
        if (productData.variants && productData.variants.length > 0) {
          const availableVariants = productData.variants.filter(
            (v: { inventory_available: boolean; in_stock: boolean; }) => v.inventory_available !== false && v.in_stock !== false
          );
          setInventoryStatus({
            isAvailable: availableVariants.length > 0,
            availableCount: availableVariants.length,
            totalCount: productData.variants.length,
            loading: false,
          });
        } else {
          setInventoryStatus({
            isAvailable: false,
            availableCount: 0,
            totalCount: 0,
            loading: false,
          });
        }
      } catch (error) {
        setInventoryStatus({
          isAvailable: true, // Default to available if check fails
          availableCount: 0,
          totalCount: 0,
          loading: false,
        });
      }
    };

    const handleQuickView = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      toast.success("Quick view coming soon!");
    };

    const handleAddToCart = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const productData = await productAPI.getProduct(product.id);
        if (productData.variants && productData.variants.length > 0) {
          // Check if any variants are available
          const availableVariants = productData.variants.filter(
            (v: { inventory_available: boolean; in_stock: boolean; }) => v.inventory_available !== false && v.in_stock !== false
          );

          if (availableVariants.length === 0) {
            toast.error("Product is currently out of stock");
            return;
          }

          await addToCart(availableVariants[0].id, 1);
          toast.success("Added to cart!");
        } else {
          toast.error("No variants available");
        }
      } catch (error) {
        const errorMessage =
          (error as any)?.response?.data?.error || "Failed to add to cart";
        if (
          errorMessage.includes("out of stock") ||
          errorMessage.includes("unavailable")
        ) {
          toast.error("Product is currently out of stock");
        } else {
          toast.error(errorMessage);
        }
      }
    };

    const discountPercentage = Math.floor(Math.random() * 30) + 5;
    const isOnSale = Math.random() > 0.7;

    return (
      <div
        className="group bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-700/50 hover:border-orange-500/30 backdrop-blur-sm relative"
        onMouseEnter={() => {
          setIsHovered(true);
          checkInventoryStatus();
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Sale badge */}
        {isOnSale && (
          <div className="absolute top-3 left-3 z-20">
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg animate-pulse">
              <Zap className="w-3 h-3 mr-1" />
              {discountPercentage}% OFF
            </div>
          </div>
        )}

        {/* Inventory status badge */}
        {inventoryStatus.totalCount > 0 && (
          <div className="absolute top-3 right-16 z-20">
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-lg ${
                inventoryStatus.isAvailable
                  ? "bg-green-500/90 text-white"
                  : "bg-red-500/90 text-white"
              }`}
            >
              {inventoryStatus.isAvailable ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <AlertTriangle className="w-3 h-3 mr-1" />
              )}
              {inventoryStatus.isAvailable
                ? `${inventoryStatus.availableCount}/${inventoryStatus.totalCount} Available`
                : "Out of Stock"}
            </div>
          </div>
        )}

        {inventoryStatus.loading && (
          <div className="absolute top-3 right-16 z-20">
            <div className="bg-gray-600/90 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-lg">
              <Package className="w-3 h-3 mr-1 animate-spin" />
              Checking...
            </div>
          </div>
        )}

        <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
          <div className="aspect-square relative overflow-hidden bg-gray-800">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className={`object-cover transition-all duration-700 ${
                isHovered ? "scale-110 rotate-1" : "scale-100"
              }`}
              unoptimized={true}
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const fallbackImg =
                  e.currentTarget.parentElement?.querySelector(
                    ".fallback-img"
                  ) as HTMLImageElement;
                if (fallbackImg) {
                  fallbackImg.style.display = "block";
                }
              }}
            />

            <img
              src={imageUrl}
              alt={product.name}
              className="fallback-img absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              style={{ display: "none" }}
              onError={(e) => {
                e.currentTarget.src = "/placeholder-product.svg";
              }}
            />

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Wishlist button */}
            <div className="absolute top-3 right-3">
              <button
                className={`p-2.5 backdrop-blur-md rounded-full transition-all duration-300 transform shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                  isWishlisted
                    ? "bg-red-500 text-white scale-110"
                    : "bg-black/70 text-gray-300 hover:text-red-400 hover:bg-black/90 hover:scale-110"
                }`}
                title="Add to wishlist"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    toast.error("Please login to add items to wishlist");
                    return;
                  }
                  setIsWishlisted(!isWishlisted);
                  addToWishlist(product.id);
                  toast.success(
                    isWishlisted
                      ? "Removed from wishlist!"
                      : "Added to wishlist!"
                  );
                }}
              >
                <Heart
                  className={`w-4 h-4 transition-all duration-200 ${
                    isWishlisted ? "fill-current" : ""
                  }`}
                />
              </button>
            </div>

            {/* Hover overlay with quick actions */}
            <div
              className={`absolute inset-0 flex items-center justify-center space-x-3 transition-all duration-300 ${
                isHovered
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <button
                onClick={handleQuickView}
                className="p-3 bg-white/90 backdrop-blur-sm rounded-full text-gray-800 hover:bg-white transition-all duration-200 transform hover:scale-110 shadow-lg"
                title="Quick view"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={
                  inventoryStatus.totalCount > 0 && !inventoryStatus.isAvailable
                }
                className={`p-3 backdrop-blur-sm rounded-full transition-all duration-200 transform shadow-lg ${
                  inventoryStatus.totalCount > 0 && !inventoryStatus.isAvailable
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600 hover:scale-110"
                }`}
                title={
                  inventoryStatus.totalCount > 0 && !inventoryStatus.isAvailable
                    ? "Out of stock"
                    : "Add to cart"
                }
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Link>

        <div className="p-6 relative z-10">
          <Link
            href={`/products/${createProductSlug(product.name, product.id)}`}
          >
            <h3 className="font-bold text-white hover:text-orange-400 transition-colors text-lg leading-tight line-clamp-2 mb-3 group-hover:text-orange-300">
              {product.name}
            </h3>
          </Link>

          {/* Creator and rating */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center bg-gray-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-gray-700/50">
              <div className="w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-2">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-gray-300 font-medium">
                {product.creator_name}
              </span>
            </div>

            <div className="flex items-center bg-yellow-500/20 rounded-full px-2 py-1">
              <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
              <span className="text-xs text-yellow-200 font-medium">4.8</span>
            </div>
          </div>

          {/* Price section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {isOnSale && (
                <span className="text-sm text-gray-500 line-through">
                  $
                  {(
                    parseFloat(product.min_price.toString().replace("$", "")) *
                    (1 + discountPercentage / 100)
                  ).toFixed(2)}
                </span>
              )}
              <span className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {formatPrice(product.min_price)}
              </span>
              {product.max_price > product.min_price && (
                <span className="text-sm text-gray-400">
                  - {formatPrice(product.max_price)}
                </span>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {product.category && (
              <span className="inline-flex items-center bg-gradient-to-r from-orange-800/80 to-orange-700/80 text-orange-200 text-xs px-3 py-1.5 rounded-full font-medium border border-orange-600/30 backdrop-blur-sm">
                {product.category}
              </span>
            )}

            {product.product_source && (
              <span
                className={`inline-flex items-center text-xs px-3 py-1.5 rounded-full font-medium border backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                  product.product_source === "printful"
                    ? "bg-purple-900/80 text-purple-300 border-purple-600/30"
                    : product.product_source === "shopify"
                    ? "bg-green-900/80 text-green-300 border-green-600/30"
                    : "bg-gray-800/80 text-gray-400 border-gray-600/30"
                }`}
              >
                {product.product_source === "printful"
                  ? "Printful"
                  : product.product_source === "shopify"
                  ? "Shopify"
                  : "Custom"}
              </span>
            )}
          </div>
        </div>

        {/* Shimmer effect */}
        <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 transition-transform duration-1000 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 via-transparent to-purple-600/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.02%22%3E%3Cpath%20d%3D%22M30%2030h30v30H30V30z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-orange-400 mr-3 animate-pulse" />
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Marketplace
              </h1>
              <TrendingUp className="w-8 h-8 text-orange-400 ml-3 animate-bounce" />
            </div>
            <p className="mt-6 text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Discover extraordinary designs from the world&apos;s most talented
              creators.
              <span className="text-orange-400 font-semibold">
                {" "}
                Premium quality
              </span>
              ,
              <span className="text-orange-400 font-semibold">
                {" "}
                unique artistry
              </span>
              , and{" "}
              <span className="text-orange-400 font-semibold">
                limitless creativity
              </span>{" "}
              await.
            </p>

            {/* Enhanced Search Bar */}
            <div className="mt-10 flex justify-center">
              <div className="relative w-full max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
                <div className="relative bg-gray-900/80 backdrop-blur-md rounded-2xl p-2 flex items-center space-x-3 shadow-2xl border border-gray-700/50">
                  <Search className="w-6 h-6 text-orange-400 ml-4" />
                  <input
                    type="text"
                    placeholder="Search for products, creators, or categories..."
                    className="flex-1 px-4 py-4 bg-transparent border-0 rounded-lg focus:ring-0 focus:outline-none text-white placeholder-gray-400 text-lg"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    onKeyPress={(e) => e.key === "Enter" && fetchProducts()}
                  />
                  <button
                    onClick={() => fetchProducts()}
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                  >
                    Search
                  </button>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {pagination.total}+
                </div>
                <div className="text-gray-400 mt-1">Unique Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {creators.length}+
                </div>
                <div className="text-gray-400 mt-1">Talented Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {categories.length}+
                </div>
                <div className="text-gray-400 mt-1">Categories</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Creators Section */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl p-8 mb-12 border border-gray-700/50 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center">
                <Sparkles className="w-8 h-8 text-orange-400 mr-3" />
                Featured Creators
              </h2>
              <p className="text-gray-400 mt-2 text-lg">
                Meet the artists behind extraordinary designs
              </p>
            </div>
            <Link
              href="/creators"
              className="text-orange-400 hover:text-orange-300 font-semibold text-lg transition-colors duration-200 flex items-center group"
            >
              View All Creators
              <ChevronDown className="w-5 h-5 ml-1 transform -rotate-90 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {creators.length > 0
              ? creators.slice(0, 4).map((creator) => (
                  <div
                    key={creator.id}
                    className="group text-center p-6 hover:bg-gray-800/50 rounded-2xl transition-all duration-300 cursor-pointer border border-transparent hover:border-orange-500/30 backdrop-blur-sm"
                    onClick={() => handleFilterChange("creator", creator.name)}
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {creator.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors duration-200">
                      {creator.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {creator.product_count} products
                    </p>
                    <div className="flex items-center justify-center mt-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-400 ml-1">4.8</span>
                    </div>
                  </div>
                ))
              : // Fallback creators with enhanced styling
                [
                  { name: "Featured Creator", products: 25, rating: "4.8" },
                  { name: "Design Studio", products: 18, rating: "4.9" },
                  { name: "Creative Mind", products: 32, rating: "4.7" },
                  { name: "Art Collective", products: 14, rating: "4.8" },
                ].map((creator, index) => (
                  <div
                    key={creator.name}
                    className="group text-center p-6 hover:bg-gray-800/50 rounded-2xl transition-all duration-300 border border-transparent hover:border-orange-500/30"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gradient-to-r from-orange-500 to-purple-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg">
                      <span className="text-white font-bold text-2xl">
                        {creator.name.charAt(0)}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-lg group-hover:text-orange-400 transition-colors duration-200">
                      {creator.name}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {creator.products} products
                    </p>
                    <div className="flex items-center justify-center mt-2">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-400 ml-1">
                        {creator.rating}
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Enhanced Filters Sidebar */}
          <div className="lg:w-80">
            <div className="sticky top-24">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-700/50 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-white text-xl flex items-center">
                    <Filter className="w-5 h-5 mr-2 text-orange-400" />
                    Filters
                  </h3>
                  <button
                    onClick={clearFilters}
                    className="text-gray-400 hover:text-orange-400 text-sm font-medium transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>

                {/* Enhanced filter sections with better styling */}
                <div className="space-y-6">
                  {/* Product Source */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Product Source
                    </label>
                    <select
                      value={filters.source}
                      onChange={(e) =>
                        handleFilterChange("source", e.target.value)
                      }
                      className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="all">All Sources</option>
                      <option value="printful">🎨 Printful Products</option>
                      <option value="shopify">🛍️ Shopify Products</option>
                    </select>
                  </div>

                  {/* Categories */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                      className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.category} value={cat.category}>
                          {cat.category} ({cat.product_count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Creators */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Creator
                    </label>
                    <select
                      value={filters.creator}
                      onChange={(e) =>
                        handleFilterChange("creator", e.target.value)
                      }
                      className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="">All Creators</option>
                      {creators.map((creator) => (
                        <option key={creator.id} value={creator.name}>
                          {creator.name} ({creator.product_count})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-3">
                      Price Range
                    </label>
                    <div className="flex space-x-3">
                      <input
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            minPrice: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            maxPrice: e.target.value,
                          }))
                        }
                        className="w-full p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-200"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => fetchProducts()}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-6 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 mt-6"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Products Section */}
          <div className="flex-1">
            {/* Enhanced Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div className="text-gray-400">
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading products...
                  </div>
                ) : (
                  <span className="text-lg">
                    <span className="text-orange-400 font-bold">
                      {pagination.total}
                    </span>{" "}
                    products found
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-4">
                {/* Enhanced Sort */}
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split("-");
                    setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                  }}
                  className="p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-white backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="created_at-DESC">Newest First</option>
                  <option value="created_at-ASC">Oldest First</option>
                  <option value="base_price-ASC">Price: Low to High</option>
                  <option value="base_price-DESC">Price: High to Low</option>
                  <option value="name-ASC">Name: A to Z</option>
                  <option value="name-DESC">Name: Z to A</option>
                </select>

                {/* Enhanced View Mode */}
                <div className="flex bg-gray-800/80 border border-gray-600/50 rounded-xl p-1 backdrop-blur-sm">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-orange-500 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-3 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-orange-500 text-white shadow-lg"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile filter toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-3 bg-gray-800/80 border border-gray-600/50 rounded-xl text-gray-400 hover:text-white backdrop-blur-sm transition-all duration-200"
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
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
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products.map((product) => (
                      <EnhancedProductCard key={product.id} product={product} />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {products.map((product) => (
                      <EnhancedProductListItem
                        key={product.id}
                        product={product}
                      />
                    ))}
                  </div>
                )}

                {/* Enhanced Pagination */}
                {pagination.hasNext && (
                  <div className="mt-16 text-center">
                    <button
                      onClick={() => {
                        setPagination((prev) => ({
                          ...prev,
                          offset: prev.offset + prev.limit,
                        }));
                        fetchProducts();
                      }}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 px-8 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                    >
                      Load More Products
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced List Item Component
  function EnhancedProductListItem({ product }: { product: ExtendedProduct }) {
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [inventoryStatus, setInventoryStatus] = useState<{
      isAvailable: boolean;
      availableCount: number;
      totalCount: number;
      loading: boolean;
    }>({ isAvailable: true, availableCount: 0, totalCount: 0, loading: false });

    const imageUrl =
      product.thumbnail_url ||
      product.images?.[0] ||
      "/placeholder-product.svg";

    // Check inventory status
    const checkInventoryStatus = async () => {
      if (inventoryStatus.loading || inventoryStatus.totalCount > 0) return;

      try {
        setInventoryStatus((prev) => ({ ...prev, loading: true }));
        const productData = await productAPI.getProduct(product.id);
        if (productData.variants && productData.variants.length > 0) {
          const availableVariants = productData.variants.filter(
            (v: { inventory_available: boolean; in_stock: boolean; }) => v.inventory_available !== false && v.in_stock !== false
          );
          setInventoryStatus({
            isAvailable: availableVariants.length > 0,
            availableCount: availableVariants.length,
            totalCount: productData.variants.length,
            loading: false,
          });
        } else {
          setInventoryStatus({
            isAvailable: false,
            availableCount: 0,
            totalCount: 0,
            loading: false,
          });
        }
      } catch (error) {
        setInventoryStatus({
          isAvailable: true, // Default to available if check fails
          availableCount: 0,
          totalCount: 0,
          loading: false,
        });
      }
    };

    const handleAddToCart = async () => {
      try {
        const productData = await productAPI.getProduct(product.id);
        if (productData.variants && productData.variants.length > 0) {
          // Check if any variants are available
          const availableVariants = productData.variants.filter(
            (v: { inventory_available: boolean; in_stock: boolean; }) => v.inventory_available !== false && v.in_stock !== false
          );

          if (availableVariants.length === 0) {
            toast.error("Product is currently out of stock");
            return;
          }

          await addToCart(availableVariants[0].id, 1);
          toast.success("Added to cart!");
        } else {
          toast.error("No variants available");
        }
      } catch (error) {
        const errorMessage =
          (error as any)?.response?.data?.error || "Failed to add to cart";
        if (
          errorMessage.includes("out of stock") ||
          errorMessage.includes("unavailable")
        ) {
          toast.error("Product is currently out of stock");
        } else {
          toast.error(errorMessage);
        }
      }
    };

    const discountPercentage = Math.floor(Math.random() * 30) + 5;
    const isOnSale = Math.random() > 0.7;

    return (
      <div
        className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-700/50 hover:border-orange-500/30 backdrop-blur-sm"
        onMouseEnter={checkInventoryStatus}
      >
        <div className="flex flex-col md:flex-row">
          <Link
            href={`/products/${createProductSlug(product.name, product.id)}`}
            className="relative md:w-80 h-64 md:h-auto flex-shrink-0"
          >
            {isOnSale && (
              <div className="absolute top-3 left-3 z-10">
                <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                  <Zap className="w-3 h-3 mr-1" />
                  {discountPercentage}% OFF
                </div>
              </div>
            )}
            <div className="w-full h-full relative overflow-hidden">
              <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized={true}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const fallbackImg =
                    e.currentTarget.parentElement?.querySelector(
                      ".fallback-img"
                    ) as HTMLImageElement;
                  if (fallbackImg) {
                    fallbackImg.style.display = "block";
                  }
                }}
              />
              <img
                src={imageUrl}
                alt={product.name}
                className="fallback-img absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ display: "none" }}
                onError={(e) => {
                  e.currentTarget.src = "/placeholder-product.svg";
                }}
              />
            </div>
          </Link>

          <div className="flex-1 p-8">
            <div className="flex justify-between items-start h-full">
              <div className="flex-1">
                <Link
                  href={`/products/${createProductSlug(
                    product.name,
                    product.id
                  )}`}
                >
                  <h3 className="text-2xl font-bold text-white hover:text-orange-400 transition-colors duration-200 mb-2">
                    {product.name}
                  </h3>
                </Link>

                <div className="flex items-center mb-4">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-300 font-medium">
                    by {product.creator_name}
                  </span>
                  <div className="flex items-center ml-4">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="text-yellow-200 font-medium">4.8</span>
                  </div>

                  {/* Inventory status */}
                  {inventoryStatus.totalCount > 0 && (
                    <div className="ml-4">
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                          inventoryStatus.isAvailable
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {inventoryStatus.isAvailable ? (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 mr-1" />
                        )}
                        {inventoryStatus.isAvailable
                          ? `${inventoryStatus.availableCount}/${inventoryStatus.totalCount} Available`
                          : "Out of Stock"}
                      </div>
                    </div>
                  )}

                  {inventoryStatus.loading && (
                    <div className="ml-4">
                      <div className="bg-gray-600/30 text-gray-400 px-3 py-1 rounded-full text-xs font-medium flex items-center border border-gray-600/30">
                        <Package className="w-3 h-3 mr-1 animate-spin" />
                        Checking...
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-gray-400 mb-6 line-clamp-3 text-lg leading-relaxed">
                  {product.description ||
                    "Discover this amazing product with unique design and premium quality craftsmanship."}
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {product.category && (
                    <span className="inline-flex items-center bg-gradient-to-r from-orange-800/80 to-orange-700/80 text-orange-200 text-sm px-4 py-2 rounded-full font-medium border border-orange-600/30">
                      {product.category}
                    </span>
                  )}
                  {product.product_source && (
                    <span
                      className={`inline-flex items-center text-sm px-4 py-2 rounded-full font-medium border ${
                        product.product_source === "printful"
                          ? "bg-purple-900/80 text-purple-300 border-purple-600/30"
                          : product.product_source === "shopify"
                          ? "bg-green-900/80 text-green-300 border-green-600/30"
                          : "bg-gray-800/80 text-gray-400 border-gray-600/30"
                      }`}
                    >
                      {product.product_source === "printful"
                        ? "🎨 Printful"
                        : product.product_source === "shopify"
                        ? "🛍️ Shopify"
                        : "Custom"}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right ml-8 flex flex-col items-end">
                <div className="mb-4">
                  {isOnSale && (
                    <div className="text-lg text-gray-500 line-through mb-1">
                      {/* Original price calculation for display */}$
                      {(
                        parseFloat(
                          product.min_price.toString().replace(/,/g, "")
                        ) *
                        (1 + discountPercentage / 100)
                      ).toFixed(2)}
                    </div>
                  )}
                  <div className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    {formatPrice(product.min_price)}
                    {product.max_price > product.min_price && (
                      <div className="text-xl text-gray-400 mt-1">
                        - {formatPrice(product.max_price)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    className={`p-3 rounded-xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                      isWishlisted
                        ? "bg-red-500 text-white"
                        : "bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-gray-700/80"
                    }`}
                    title="Add to wishlist"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Please login to add items to wishlist");
                        return;
                      }
                      setIsWishlisted(!isWishlisted);
                      addToWishlist(product.id);
                      toast.success(
                        isWishlisted
                          ? "Removed from wishlist!"
                          : "Added to wishlist!"
                      );
                    }}
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        isWishlisted ? "fill-current" : ""
                      }`}
                    />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={
                      inventoryStatus.totalCount > 0 &&
                      !inventoryStatus.isAvailable
                    }
                    className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 transform flex items-center ${
                      inventoryStatus.totalCount > 0 &&
                      !inventoryStatus.isAvailable
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30"
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {inventoryStatus.totalCount > 0 &&
                    !inventoryStatus.isAvailable
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
