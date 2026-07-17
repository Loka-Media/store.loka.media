"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGlobalMarkup } from "@/contexts/GlobalMarkupContext";
import { useRouter } from "next/navigation";
import { productAPI, formatPrice } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
import { ArrowLeft, Edit, ExternalLink, Grid, List, Plus, Search, Trash2, Package, Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import GradientTitle from "@/components/ui/GradientTitle";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationModal } from "@/components/ui/DeleteConfirmationModal";
import CreativeLoader from "@/components/CreativeLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Product {
  id: number;
  creator_id: number;
  name: string;
  description: string;
  base_price: number;
  markup_percentage: number;
  category: string;
  tags: string[];
  thumbnail_url: string;
  images: string[];
  is_active: boolean;
  creator_name: string;
  creator_username: string;
  variant_count: number;
  min_price: number;
  max_price: number;
  created_at: string;
}

export default function CreatorProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    status: "active",
    sortBy: "created_at",
    sortOrder: "DESC",
  });
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasNext: false,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const apiParams = {
        limit: 1000,
        offset: 0,
      };

      const response = await productAPI.getCreatorProducts(apiParams);

      // Transform products to ensure is_active is properly set from status field
      const transformedProducts = (response.products || []).map((product: any) => ({
        ...product,
        is_active: product.is_active !== undefined ? product.is_active : product.status === 'active',
      }));

      setProducts(transformedProducts);
      setPagination(
        response.pagination || {
          total: response.products?.length || 0,
          limit: 1000,
          offset: 0,
          hasNext: false,
        }
      );
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Failed to load your products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "creator" && user?.role !== "admin") {
      return;
    }

    fetchProducts();
  }, [user, fetchProducts]);

  const [deleteState, setDeleteState] = useState<{
    isOpen: boolean;
    productId: number | null;
    productName: string;
    isDeleting: boolean;
  }>({
    isOpen: false,
    productId: null,
    productName: "",
    isDeleting: false,
  });

  const confirmDeleteProduct = (productId: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    setDeleteState({
      isOpen: true,
      productId: product.id,
      productName: product.name,
      isDeleting: false,
    });
  };

  const executeDeleteProduct = async () => {
    if (!deleteState.productId) return;
    
    setDeleteState((prev) => ({ ...prev, isDeleting: true }));
    try {
      await productAPI.deleteProduct(deleteState.productId);
      setProducts((prev) => prev.filter((p) => p.id !== deleteState.productId));
      toast.success("Product deleted successfully");
      setDeleteState({ isOpen: false, productId: null, productName: "", isDeleting: false });
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
      setDeleteState((prev) => ({ ...prev, isDeleting: false }));
    }
  };

  // Extract unique categories from the products list dynamically
  const availableCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean))
  );

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !filters.search ||
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory =
      !filters.category || product.category === filters.category;
    const matchesStatus =
      !filters.status ||
      (filters.status === "active" ? product.is_active : !product.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedAndFilteredProducts = [...filteredProducts].sort((a, b) => {
    if (filters.sortBy === "created_at") {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return filters.sortOrder === "DESC" ? dateB - dateA : dateA - dateB;
    }
    if (filters.sortBy === "name") {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return filters.sortOrder === "ASC" ? -1 : 1;
      if (nameA > nameB) return filters.sortOrder === "ASC" ? 1 : -1;
      return 0;
    }
    if (filters.sortBy === "base_price") {
      const priceA = Number(a.base_price) || 0;
      const priceB = Number(b.base_price) || 0;
      return filters.sortOrder === "DESC" ? priceB - priceA : priceA - priceB;
    }
    return 0;
  });

  const handleToggleStatus = async (productId: number, currentStatus: boolean, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newStatus = !currentStatus;
    const toastId = toast.loading(newStatus ? "Activating product..." : "Deactivating product...");
    
    const prod = products.find(p => p.id === productId);
    if (!prod) {
      toast.error("Product not found in state", { id: toastId });
      return;
    }

    try {
      try {
        // First try the specialized status patch endpoint with all formatting variants
        await productAPI.updateProductStatus(productId, newStatus);
      } catch (patchError) {
        console.warn("PATCH /status endpoint failed, falling back to full PUT update:", patchError);
        // Fall back to updating the full product details with all status variants
        const updateData = {
          name: prod.name,
          description: prod.description,
          markupPercentage: prod.markup_percentage,
          category: prod.category,
          tags: prod.tags || [],
          thumbnailUrl: prod.thumbnail_url,
          images: prod.images || [],
          status: newStatus ? 'active' : 'inactive',
          is_active: newStatus,
          isActive: newStatus
        };
        await productAPI.updateProduct(productId, updateData);
      }

      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_active: newStatus, status: newStatus ? 'active' : 'inactive' } : p))
      );
      toast.success(newStatus ? "Product status updated successfully" : "Product status updated successfully", { id: toastId });
    } catch (error) {
      console.error("Failed to toggle product status:", error);
      toast.error(newStatus ? "Failed to activate product" : "Failed to deactivate product", { id: toastId });
    }
  };

  const handleSyncPrintify = async () => {
    try {
      const toastId = toast.loading("Syncing products from Printify...");
      // Hit the Next.js API route which will fetch all Printify products and save to backend
      const res = await fetch("/api/printify/sync/all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "Synced successfully", { id: toastId });
        fetchProducts(); // Refresh the list
      } else {
        throw new Error(data.error || "Sync failed");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to sync products from Printify");
    }
  };

  if (!user || (user.role !== "creator" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 sm:py-8">
            <div className="flex items-center gap-4 w-full justify-between">
              <Link
                href="/dashboard/creator"
                className="inline-flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base font-medium">Back</span>
              </Link>
            </div>
          </div>
          <div className="pb-6 sm:pb-8">
            <GradientTitle
              text="Your Products"
              size="sm"
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl"
            />
            <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">
              Manage your complete product catalog
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Tabs */}
        <div className="flex border-b border-white/10 mb-6 gap-6">
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: "active" }))}
            className={`pb-3 text-sm font-semibold relative transition-all ${
              filters.status === "active"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Active Products
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-normal text-gray-400">
                {products.filter(p => p.is_active).length}
              </span>
            </span>
            {filters.status === "active" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#FF6D1F]"></span>
            )}
          </button>
          
          <button
            onClick={() => setFilters(prev => ({ ...prev, status: "inactive" }))}
            className={`pb-3 text-sm font-semibold relative transition-all ${
              filters.status === "inactive"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >

            {filters.status === "inactive" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#FF6D1F]"></span>
            )}
          </button>

          <button
            onClick={() => setFilters(prev => ({ ...prev, status: "" }))}
            className={`pb-3 text-sm font-semibold relative transition-all ${
              filters.status === ""
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              All Products
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-normal text-gray-400">
                {products.length}
              </span>
            </span>
            {filters.status === "" && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-[#FF6D1F]"></span>
            )}
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="gradient-border-white-bottom p-6 sm:p-8 mb-8">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
                  placeholder="Search products..."
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </div>

              {/* Category Filter */}
              <Select
                value={filters.category || "all"}
                onValueChange={(val) => setFilters((prev) => ({ ...prev, category: val === "all" ? "" : val }))}
              >
                <SelectTrigger className="w-[160px] h-[42px] sm:h-[46px] bg-white/10 border-white/20 rounded-lg">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(val) => {
                  const [sortBy, sortOrder] = val.split("-");
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                }}
              >
                <SelectTrigger className="w-[180px] h-[42px] sm:h-[46px] bg-white/10 border-white/20 rounded-lg">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-DESC">Newest First</SelectItem>
                  <SelectItem value="created_at-ASC">Oldest First</SelectItem>
                  <SelectItem value="name-ASC">Name: A to Z</SelectItem>
                  <SelectItem value="name-DESC">Name: Z to A</SelectItem>
                  <SelectItem value="base_price-ASC">Price: Low to High</SelectItem>
                  <SelectItem value="base_price-DESC">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters Button */}
              {(filters.search || filters.category || filters.sortBy !== "created_at" || filters.sortOrder !== "DESC") && (
                <button 
                  onClick={() => setFilters(prev => ({ ...prev, search: "", category: "", sortBy: "created_at", sortOrder: "DESC" }))}
                  className="h-[42px] sm:h-[46px] px-4 rounded-lg bg-white/5 border border-white/20 hover:bg-white/10 text-white text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex items-center justify-between">
              {/* View Mode */}
              <div className="flex border border-white/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 sm:p-2.5 transition-all text-sm sm:text-base font-medium ${viewMode === "grid"
                    ? "bg-white/20 text-white"
                    : "bg-transparent text-white/70 hover:text-white"
                    }`}
                >
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 sm:p-2.5 transition-all text-sm sm:text-base font-medium border-l border-white/20 ${viewMode === "list"
                    ? "bg-white/20 text-white"
                    : "bg-transparent text-white/70 hover:text-white"
                    }`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm font-medium text-gray-400">
                <span className="text-white/80">{sortedAndFilteredProducts.length}</span>{" "}
                products
              </div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <CreativeLoader variant="product" message="Loading your products..." />
        ) : sortedAndFilteredProducts.length === 0 ? (
          <div className="gradient-border-white-bottom p-8 sm:p-12 flex flex-col items-center justify-center text-center">
            <div className="text-orange-400 mb-6">
              <Package className="mx-auto h-16 w-16 sm:h-20 sm:w-20" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              No products found
            </h3>
            <p className="text-sm sm:text-base text-gray-400 max-w-md mb-8">
              {filters.search || filters.category || filters.status
                ? "Try adjusting your filters to find what you're looking for"
                : "Get started by creating your first product"}
            </p>
            {!filters.search && !filters.category && !filters.status && (
              <Button href="/dashboard/creator/catalog" variant="primary">
                <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2 inline" />
                Create Your First Product
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            {sortedAndFilteredProducts.map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                onDelete={confirmDeleteProduct}
                onToggleStatus={handleToggleStatus}
              />
            ))}
          </div>
        ) : (
          <div className="gradient-border-white-bottom overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sortedAndFilteredProducts.map((product) => (
                  <ProductListRow
                    key={product.id}
                    product={product}
                    onDelete={confirmDeleteProduct}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={deleteState.isOpen}
        onClose={() => setDeleteState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeDeleteProduct}
        title="Delete Product"
        itemName={deleteState.productName}
        isLoading={deleteState.isDeleting}
      />
    </div>
  );
}

function ProductGridCard({
  product,
  onDelete,
  onToggleStatus,
}: {
  product: Product;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean, e?: React.MouseEvent) => void;
}) {
  const router = useRouter();
  const { globalMarkup } = useGlobalMarkup();

  const baseMarkup = (product as any).markup_percentage !== undefined ? (product as any).markup_percentage : 35;
  const baseCostMin = (product as any).base_price !== undefined ? parseFloat(String((product as any).base_price)) : product.min_price / (1 + baseMarkup / 100);
  const baseCostMax = (product as any).base_price !== undefined && product.max_price === product.min_price
    ? parseFloat(String((product as any).base_price))
    : product.max_price / (1 + baseMarkup / 100);

  const minSellingPrice = baseCostMin * (1 + globalMarkup / 100);
  const maxSellingPrice = baseCostMax * (1 + globalMarkup / 100);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(product.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleStatus(product.id, product.is_active, e);
  };

  const handleCardClick = () => {
    router.push(`/products/${createProductSlug(product.name, product.id)}`);
  };

  const getImageUrl = (url: any) => {
    if (!url) return "/placeholder-product.png";
    const strUrl = typeof url === 'string' ? url : url.src || url.url || "/placeholder-product.png";
    return strUrl.startsWith('//') ? `https:${strUrl}` : strUrl;
  };

  const [imgSrc, setImgSrc] = useState(() => getImageUrl(product.thumbnail_url));

  useEffect(() => {
    setImgSrc(getImageUrl(product.thumbnail_url));
  }, [product.thumbnail_url]);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="group cursor-pointer"
    >
      <div className="gradient-border-white-bottom overflow-hidden">
        <div className="w-full relative" style={{ aspectRatio: "1/1" }}>
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            unoptimized
            onError={() => setImgSrc("/placeholder-product.png")}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <button
            onClick={handleToggle}
            className="absolute top-3 right-3 z-10"
            title={product.is_active ? "Deactivate product" : "Activate product"}
          >
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold transition-all hover:scale-105 ${product.is_active
                ? "bg-green-500/20 text-green-400 border border-green-500/50"
                : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
                }`}
            >
              {product.is_active ? "● Active" : "○ Inactive"}
            </span>
          </button>

          {/* Action buttons overlay */}
          <div className="absolute bottom-3 right-3 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleToggle}
              className="p-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
              title={product.is_active ? "Deactivate product" : "Activate product"}
            >
              {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <Link
              href={`/dashboard/creator/products/${product.id}/edit`}
              className="p-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm"
              title="Edit product"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 bg-white/10 border border-white/20 text-white hover:bg-red-500/20 rounded-lg transition-all backdrop-blur-sm"
              title="Delete product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <h3 className="font-bold text-sm sm:text-base text-white mb-2 truncate group-hover:text-white/80 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs sm:text-sm text-gray-400 font-medium mb-3">
            {product.category || "Uncategorized"}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-xl font-bold text-white">
                {formatPrice(minSellingPrice)}
              </div>
              {maxSellingPrice > minSellingPrice && (
                <div className="text-xs text-gray-400">
                  to {formatPrice(maxSellingPrice)}
                </div>
              )}
            </div>
            <span className="text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/50 px-2.5 py-1 rounded-full">
              {product.variant_count}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductListRow({
  product,
  onDelete,
  onToggleStatus,
}: {
  product: Product;
  onDelete: (id: number) => void;
  onToggleStatus: (id: number, currentStatus: boolean, e?: React.MouseEvent) => void;
}) {
  const { globalMarkup } = useGlobalMarkup();

  const baseMarkup = (product as any).markup_percentage !== undefined ? (product as any).markup_percentage : 35;
  const baseCostMin = (product as any).base_price !== undefined ? parseFloat(String((product as any).base_price)) : product.min_price / (1 + baseMarkup / 100);
  const baseCostMax = (product as any).base_price !== undefined && product.max_price === product.min_price
    ? parseFloat(String((product as any).base_price))
    : product.max_price / (1 + baseMarkup / 100);

  const minSellingPrice = baseCostMin * (1 + globalMarkup / 100);
  const maxSellingPrice = baseCostMax * (1 + globalMarkup / 100);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(product.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleStatus(product.id, product.is_active, e);
  };

  const getImageUrl = (url: any) => {
    if (!url) return "/placeholder-product.png";
    const strUrl = typeof url === 'string' ? url : url.src || url.url || "/placeholder-product.png";
    return strUrl.startsWith('//') ? `https:${strUrl}` : strUrl;
  };

  const [imgSrc, setImgSrc] = useState(() => getImageUrl(product.thumbnail_url));

  useEffect(() => {
    setImgSrc(getImageUrl(product.thumbnail_url));
  }, [product.thumbnail_url]);

  return (
    <tr
      className="hover:bg-white/5 transition-colors cursor-pointer group"
      onClick={() =>
        window.open(
          `/products/${createProductSlug(product.name, product.id)}`,
          "_blank"
        )
      }
    >
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
            <div
              className="relative rounded-lg overflow-hidden border border-white/20 group-hover:border-white/40 transition-colors"
              style={{ aspectRatio: "1/1" }}
            >
              <Image
                src={imgSrc}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
                unoptimized
                onError={() => setImgSrc("/placeholder-product.png")}
              />
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-medium text-white truncate">
              {product.name}
            </div>
            <div className="text-xs text-gray-400 truncate max-w-xs hidden sm:block">
              {product.description}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
        {product.category || "Uncategorized"}
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-white font-medium">
        {formatPrice(minSellingPrice)}
        {maxSellingPrice > minSellingPrice && (
          <div className="text-gray-400 text-xs">
            to {formatPrice(maxSellingPrice)}
          </div>
        )}
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
        <button
          onClick={handleToggle}
          className="hover:scale-105 transition-all"
          title={product.is_active ? "Deactivate product" : "Activate product"}
        >
          <span
            className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${product.is_active
              ? "bg-green-500/20 text-green-400 border border-green-500/50"
              : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
              }`}
          >
            {product.is_active ? "● Active" : "● Inactive"}
          </span>
        </button>
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
        {product.variant_count}
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
        {formatDate(product.created_at)}
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
        <div className="flex justify-end gap-2">
          <button
            onClick={handleToggle}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title={product.is_active ? "Deactivate" : "Activate"}
          >
            {product.is_active ? <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
          <Link
            href={`/dashboard/creator/products/${product.id}/edit`}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="Edit"
            onClick={handleEdit}
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
          <button
            onClick={handleDelete}
            className="p-1.5 sm:p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
