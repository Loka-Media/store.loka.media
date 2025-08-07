'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Heart, ShoppingCart, Zap, User, Star } from 'lucide-react';
import { formatPrice, productAPI, ExtendedProduct } from '@/lib/api';
import { createProductSlug } from '@/lib/utils';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';

export function ProductListItem({ product }: { product: ExtendedProduct }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const imageUrl =
    product.thumbnail_url ||
    product.images?.[0] ||
    '/placeholder-product.svg';

  const { addToCart } = useGuestCart();
  const { addToWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  // Fix: Calculate discount and sale status once per product
  const { discountPercentage, isOnSale } = useMemo(() => {
    const randomDiscount = Math.floor(Math.random() * 30) + 5; // 5-34%
    const randomSale = Math.random() > 0.7; // 30% chance of being on sale
    return { discountPercentage: randomDiscount, isOnSale: randomSale };
  }, [product.id]); // Recalculate only if product ID changes

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const productData = await productAPI.getProduct(product.id);
      if (productData.variants && productData.variants.length > 0) {
        await addToCart(productData.variants[0].id, 1);
        toast.success('Added to cart!');
      } else {
        toast.error('No variants available');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <div className="group bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-700/50 hover:border-orange-500/30 backdrop-blur-sm">
      <Link
        href={`/products/${createProductSlug(product.name, product.id)}`}
        className="flex flex-col md:flex-row block"
      >
        <div className="relative md:w-80 h-64 md:h-auto flex-shrink-0">
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
                e.currentTarget.style.display = 'none';
                const fallbackImg =
                  e.currentTarget.parentElement?.querySelector(
                    '.fallback-img'
                  ) as HTMLImageElement;
                if (fallbackImg) {
                  fallbackImg.style.display = 'block';
                }
              }}
            />
            <img
              src={imageUrl}
              alt={product.name}
              className="fallback-img absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ display: 'none' }}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.svg';
              }}
            />
          </div>
        </div>

        <div className="flex-1 p-8">
          <div className="flex justify-between items-start h-full">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white hover:text-orange-400 transition-colors duration-200 mb-2">
                {product.name}
              </h3>

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
              </div>

              <p className="text-gray-400 mb-6 line-clamp-3 text-lg leading-relaxed">
                {product.description ||
                  'Discover this amazing product with unique design and premium quality craftsmanship.'}
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
                      product.product_source === 'printful'
                        ? 'bg-purple-900/80 text-purple-300 border-purple-600/30'
                        : product.product_source === 'shopify'
                        ? 'bg-green-900/80 text-green-300 border-green-600/30'
                        : 'bg-gray-800/80 text-gray-400 border-gray-600/30'
                    }`}
                  >
                    {product.product_source === 'printful'
                      ? '🎨 Printful'
                      : product.product_source === 'shopify'
                      ? '🛍️ Shopify'
                      : 'Custom'}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right ml-8 flex flex-col items-end">
              <div className="mb-4">
                {isOnSale && (
                  <div className="text-lg text-gray-500 line-through mb-1">
                    {/* Original price calculation for display */}
                    $
                    {(
                      parseFloat(
                        product.min_price.toString().replace(/,/g, '')
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
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-800/80 text-gray-400 hover:text-red-400 hover:bg-gray-700/80'
                  }`}
                  title="Add to wishlist"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isAuthenticated) {
                      toast.error('Please login to add items to wishlist');
                      return;
                    }
                    setIsWishlisted(!isWishlisted);
                    addToWishlist(product.id);
                    toast.success(
                      isWishlisted
                        ? 'Removed from wishlist!'
                        : 'Added to wishlist!'
                    );
                  }}
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isWishlisted ? 'fill-current' : ''
                    }`}
                  />
                </button>
                <button
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/30 flex items-center"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
