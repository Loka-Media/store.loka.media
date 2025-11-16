"use client";

import { Package, Plus, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import EnhancedProductCard from "./EnhancedProductCard";

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

export function EnhancedProductsSection({ products, loading, onDelete }: ProductsSectionProps) {
  return (
    <div className="bg-white border-4 border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] overflow-hidden">
      <div className="px-6 py-5 border-b-4 border-black bg-gradient-to-r from-purple-200 to-pink-200">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-black flex items-center">
            <div className="bg-purple-500 border-4 border-black rounded-xl p-2 mr-3">
              <Package className="w-6 h-6 text-white" />
            </div>
            Your Products
          </h2>
          <Link
            href="/dashboard/creator/products"
            className="inline-flex items-center px-4 py-2 bg-black text-white font-extrabold rounded-xl hover:bg-purple-600 transition-all group"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="bg-gradient-to-r from-purple-400 to-pink-400 border-4 border-black rounded-full p-4 mb-4">
              <Loader2 className="h-12 w-12 text-white animate-spin" />
            </div>
            <p className="text-lg font-extrabold text-black">Loading your products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gradient-to-br from-yellow-200 to-orange-300 border-4 border-black rounded-2xl p-8 mb-6">
              <Package className="mx-auto h-16 w-16 text-black" />
            </div>
            <h3 className="text-3xl font-extrabold text-black mb-3">
              No products created yet
            </h3>
            <p className="text-lg font-bold text-gray-700 max-w-md mb-8">
              Get started by creating your first product and bring your ideas to life!
            </p>
            <Link
              href="/dashboard/creator/catalog"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-400 to-pink-400 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg"
            >
              <Plus className="w-6 h-6 mr-2" />
              Create Your First Product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <EnhancedProductCard key={product.id} product={product} onDelete={onDelete} />
            ))}
          </div>
        )}

        {!loading && products.length > 8 && (
          <div className="mt-8 text-center">
            <Link
              href="/dashboard/creator/products"
              className="inline-flex items-center px-6 py-3 bg-white border-4 border-black text-black font-extrabold rounded-xl hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              View All {products.length} Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
