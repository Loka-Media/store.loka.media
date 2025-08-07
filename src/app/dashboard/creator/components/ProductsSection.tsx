"use client";

import { Package, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import ProductCard from "./ProductCard";

interface CreatorProduct {
  id: number;
  is_active: boolean;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
}

interface ProductsSectionProps {
  products: CreatorProduct[];
  loading: boolean;
  onDelete: (productId: number) => void;
}

export function ProductsSection({ products, loading, onDelete }: ProductsSectionProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Package className="w-6 h-6 mr-2 text-orange-400" />
          Your Products
        </h2>
        <Link
          href="/dashboard/creator/products"
          className="text-orange-500 hover:text-orange-400 text-sm font-medium flex items-center transition-colors duration-200"
        >
          View all products
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-16 w-16 text-orange-500 animate-spin" />
            <p className="mt-4 text-lg font-medium text-gray-400">Loading your products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="mx-auto h-20 w-20 text-orange-500 opacity-70" />
            <h3 className="mt-6 text-2xl font-bold text-white">
              No products created yet
            </h3>
            <p className="mt-3 text-base text-gray-400 max-w-md">
              Get started by creating your first product and bring your ideas to life!
            </p>
            <div className="mt-8">
              <Link
                href="/dashboard/creator/products/create"
                className="inline-flex items-center px-8 py-3 border border-transparent shadow-sm text-base font-medium rounded-full text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200 transform hover:scale-105"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Product
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} onDelete={onDelete} />
        ))}
      </div>
        )}
      </div>
    </div>
  );
}
