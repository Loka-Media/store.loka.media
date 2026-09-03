'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import GradientTitle from '@/components/ui/GradientTitle';
import { Package, Search, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CreativeLoader from '@/components/CreativeLoader';

interface Product {
  id: number;
  title: string;
  brand: string;
  model: string;
  image: string;
  type_name?: string;
  variant_count?: number;
  price?: string;
  premiumPrice?: string;
}

const ITEMS_PER_PAGE = 24;

export default function AdminProductsPage() {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/printify/catalog');
      const data = await res.json();

      const list = data?.result || data?.data || [];
      if (Array.isArray(list)) {
        setAllProducts(list);
      }
    } catch (error) {
      console.error('Error fetching admin published products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by search query
  const filteredProducts = allProducts.filter((product) => {
    const q = searchQuery.toLowerCase();
    return (
      product.title?.toLowerCase().includes(q) ||
      product.brand?.toLowerCase().includes(q) ||
      product.model?.toLowerCase().includes(q)
    );
  });

  // Calculate pagination
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="max-w-7xl mt-16 mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard/admin"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-orange-400 transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-900/30 border border-purple-500/30 flex items-center justify-center">
                <Package className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <GradientTitle text="Published Catalog Products" size="sm" />
                <p className="text-xs text-gray-400 mt-0.5">
                  Browsing {totalItems.toLocaleString()} active published products across all catalog categories
                </p>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[280px] sm:min-w-[340px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by title or brand..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CreativeLoader variant="product" message="Loading published catalog..." />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-white font-bold text-lg">No Products Found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search query</p>
          </div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
              {paginatedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-900 border border-gray-800 hover:border-purple-500/50 rounded-xl overflow-hidden group hover:shadow-[0_10px_25px_rgba(168,85,247,0.15)] transition-all duration-300 flex flex-col"
                >
                  <div className="aspect-square relative bg-black overflow-hidden">
                    <Image
                      src={product.image || '/placeholder-product.png'}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 16vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-gray-300 border border-white/10">
                      {product.brand}
                    </div>
                  </div>
                  <div className="p-3 flex flex-col justify-between flex-grow bg-gray-900">
                    <div>
                      <h4 className="text-xs font-bold text-white truncate line-clamp-1 group-hover:text-purple-300 transition-colors">
                        {product.title}
                      </h4>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {product.variant_count || 1} Variants
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400">
                        ${product.premiumPrice || product.price || '0.00'}
                      </span>
                      {product.price && (
                        <span className="text-[10px] text-gray-500 line-through">
                          ${product.price}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-900/80 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-400">
                  Showing <span className="font-bold text-white">{startIndex + 1}</span> to{' '}
                  <span className="font-bold text-white">
                    {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)}
                  </span>{' '}
                  of <span className="font-bold text-white">{totalItems.toLocaleString()}</span> products
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-black border border-gray-800 text-gray-300 hover:text-white hover:border-purple-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1 px-3 py-1 bg-black border border-gray-800 rounded-lg text-xs font-bold text-white">
                    <span>Page {currentPage}</span>
                    <span className="text-gray-500">/ {totalPages}</span>
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-black border border-gray-800 text-gray-300 hover:text-white hover:border-purple-500/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
