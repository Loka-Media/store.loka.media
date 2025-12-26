"use client";

import { Package, Plus, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import GradientTitle from "@/components/ui/GradientTitle";
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
    <div className="border-t border-white/10 pt-12">
      <div className="mb-8 flex items-center justify-between">
        <GradientTitle text="Your Products" size="md" />
        {products.length > 0 && (
          <Link
            href="/dashboard/creator/products"
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-all group text-sm sm:text-base"
          >
            View All
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="text-purple-400 mb-6 animate-spin">
            <Loader2 className="h-12 w-12 sm:h-16 sm:w-16" />
          </div>
          <p className="text-base sm:text-lg font-bold text-gray-300">Loading your products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="gradient-border-white-top p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="text-orange-400 mb-6">
            <Package className="mx-auto h-16 w-16 sm:h-20 sm:w-20" />
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            No products created yet
          </h3>
          <p className="text-sm sm:text-base text-gray-400 max-w-md mb-8">
            Get started by creating your first product and bring your ideas to life!
          </p>
          <Link
            href="/dashboard/creator/catalog"
            className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-[0_10px_30px_rgba(255,99,71,0.3)] transition-all text-sm sm:text-base"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
            Create Your First Product
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.slice(0, 8).map((product) => (
              <EnhancedProductCard key={product.id} product={product} onDelete={onDelete} />
            ))}
          </div>

          {!loading && products.length > 8 && (
            <div className="mt-10 text-center">
              <Link
                href="/dashboard/creator/products"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-all text-sm sm:text-base"
              >
                View All {products.length} Products
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
