'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { Heart, Eye, ShoppingCart, Zap, User, Star } from 'lucide-react';
import { formatPrice, productAPI, ExtendedProduct } from '@/lib/api';
import { createProductSlug } from '@/lib/utils';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';

export function ProductCard({ product }: { product: ExtendedProduct }) {
  const [isHovered, setIsHovered] = useState(false);
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

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success('Quick view coming soon!');
  };

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
    <Link
      href={`/products/${createProductSlug(product.name, product.id)}`}
      className="group bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02] border border-gray-700/50 hover:border-orange-500/30 backdrop-blur-sm relative hover:shadow-2xl block"
      onMouseEnter={() => setIsHovered(true)}
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

      <div className="aspect-square relative overflow-hidden bg-gray-800">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className={`object-cover transition-all duration-700 ${
            isHovered ? 'scale-110 rotate-1' : 'scale-100'
          }`}
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
          className="fallback-img absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          style={{ display: 'none' }}
          onError={(e) => {
            e.currentTarget.src = '/placeholder-product.svg';
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Wishlist button */}
        <div className="absolute top-3 right-3 z-30">
          <button
            className={`p-2.5 backdrop-blur-md rounded-full transition-all duration-300 transform shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${
              isWishlisted
                ? 'bg-red-500 text-white scale-110'
                : 'bg-black/70 text-gray-300 hover:text-red-400 hover:bg-black/90 hover:scale-110'
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
              className={`w-4 h-4 transition-all duration-200 ${
                isWishlisted ? 'fill-current' : ''
              }`}
            />
          </button>
        </div>

        {/* Hover overlay with quick actions */}
        <div
          className={`absolute inset-0 flex items-center justify-center space-x-3 transition-all duration-300 z-20 ${
            isHovered
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
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
            className="p-3 bg-orange-500 backdrop-blur-sm rounded-full text-white hover:bg-orange-600 transition-all duration-200 transform hover:scale-110 shadow-lg"
            title="Add to cart"
          >
            <ShoppingCart className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <h3 className="font-bold text-white hover:text-orange-400 transition-colors text-lg leading-tight line-clamp-2 mb-3 group-hover:text-orange-300">
          {product.name}
        </h3>

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
                  parseFloat(product.min_price.toString().replace('$', '')) *
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
                product.product_source === 'printful'
                  ? 'bg-purple-900/80 text-purple-300 border-purple-600/30'
                  : product.product_source === 'shopify'
                  ? 'bg-green-900/80 text-green-300 border-green-600/30'
                  : 'bg-gray-800/80 text-gray-400 border-gray-600/30'
              }`}
            >
              {product.product_source === 'printful'
                ? 'Printful'
                : product.product_source === 'shopify'
                ? 'Shopify'
                : 'Custom'}
            </span>
          )}
        </div>
      </div>

      {/* Shimmer effect */}
      <div className="absolute inset-0 -top-2 -left-2 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12 transition-transform duration-1000 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>
    </Link>
  );
}