"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { productAPI, formatPrice } from "@/lib/api";
import { createProductSlug } from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Grid,
  List,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import GradientTitle from "@/components/ui/GradientTitle";
import { Button } from "@/components/ui/button";

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
    status: "",
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
      const response = await productAPI.getCreatorProducts({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset,
      });

      setProducts(response.products || []);
      setPagination(
        response.pagination || {
          total: 0,
          limit: 20,
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
  }, [filters, pagination.limit, pagination.offset]);

  useEffect(() => {
    if (user?.role !== "creator" && user?.role !== "admin") {
      return;
    }

    fetchProducts();
  }, [user, filters, fetchProducts]);

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      await productAPI.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error("Failed to delete product");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      !filters.search ||
      product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      product.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory =
      !filters.category || product.category === filters.category;
    const matchesStatus = !filters.status;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (!user || (user.role !== "creator" && user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6 sm:py-8">
            <div className="flex items-center gap-4">
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
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, category: e.target.value }))
                }
                className="px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
              >
                <option value="" className="bg-black">
                  All Categories
                </option>
                <option value="T-Shirts" className="bg-black">
                  T-Shirts
                </option>
                <option value="Hoodies" className="bg-black">
                  Hoodies
                </option>
                <option value="Mugs" className="bg-black">
                  Mugs
                </option>
                <option value="Posters" className="bg-black">
                  Posters
                </option>
              </select>

              {/* Sort */}
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-");
                  setFilters((prev) => ({ ...prev, sortBy, sortOrder }));
                }}
                className="px-4 py-2.5 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40 transition-all text-sm sm:text-base"
              >
                <option value="created_at-DESC" className="bg-black">
                  Newest First
                </option>
                <option value="created_at-ASC" className="bg-black">
                  Oldest First
                </option>
                <option value="name-ASC" className="bg-black">
                  Name: A to Z
                </option>
                <option value="name-DESC" className="bg-black">
                  Name: Z to A
                </option>
                <option value="base_price-ASC" className="bg-black">
                  Price: Low to High
                </option>
                <option value="base_price-DESC" className="bg-black">
                  Price: High to Low
                </option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              {/* View Mode */}
              <div className="flex border border-white/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 sm:p-2.5 transition-all text-sm sm:text-base font-medium ${
                    viewMode === "grid"
                      ? "bg-white/20 text-white"
                      : "bg-transparent text-white/70 hover:text-white"
                  }`}
                >
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 sm:p-2.5 transition-all text-sm sm:text-base font-medium border-l border-white/20 ${
                    viewMode === "list"
                      ? "bg-white/20 text-white"
                      : "bg-transparent text-white/70 hover:text-white"
                  }`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm font-medium text-gray-400">
                <span className="text-white/80">{filteredProducts.length}</span>{" "}
                products
              </div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-purple-400 mb-6 animate-spin">
              <Loader2 className="h-12 w-12 sm:h-16 sm:w-16" />
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-300">
              Loading your products...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
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
            {filteredProducts.map((product) => (
              <ProductGridCard
                key={product.id}
                product={product}
                onDelete={handleDeleteProduct}
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
                {filteredProducts.map((product) => (
                  <ProductListRow
                    key={product.id}
                    product={product}
                    onDelete={handleDeleteProduct}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductGridCard({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: number) => void;
}) {
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(product.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
      <div className="group cursor-pointer">
        <div className="gradient-border-white-bottom overflow-hidden">
          <div className="w-full relative" style={{ aspectRatio: "1/1" }}>
            <Image
              src={product.thumbnail_url || "/placeholder-product.png"}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="absolute top-3 right-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  product.is_active
                    ? "bg-green-500/20 text-green-400 border border-green-500/50"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
                }`}
              >
                {product.is_active ? "● Active" : "● Inactive"}
              </span>
            </div>

            {/* Action buttons overlay */}
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                  {formatPrice(product.min_price)}
                </div>
                {product.max_price > product.min_price && (
                  <div className="text-xs text-gray-400">
                    to {formatPrice(product.max_price)}
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
    </Link>
  );
}

function ProductListRow({
  product,
  onDelete,
}: {
  product: Product;
  onDelete: (id: number) => void;
}) {
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
                src={product.thumbnail_url || "/placeholder-product.png"}
                alt={product.name}
                fill
                className="object-cover"
                sizes="48px"
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
        {formatPrice(product.min_price)}
        {product.max_price > product.min_price && (
          <div className="text-gray-400 text-xs">
            to {formatPrice(product.max_price)}
          </div>
        )}
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
        <span
          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
            product.is_active
              ? "bg-green-500/20 text-green-400 border border-green-500/50"
              : "bg-gray-500/20 text-gray-400 border border-gray-500/50"
          }`}
        >
          {product.is_active ? "● Active" : "● Inactive"}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
        {product.variant_count}
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-400">
        {formatDate(product.created_at)}
      </td>
      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
        <div className="flex justify-end gap-2">
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
