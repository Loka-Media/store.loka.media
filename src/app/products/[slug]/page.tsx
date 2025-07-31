'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, ProductVariant, formatPrice, wishlistAPI } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseProductSlug, createProductSlug } from '@/lib/utils';
import { 
  ArrowLeft, 
  Heart, 
  ShoppingCart, 
  Star, 
  User, 
  Package,
  Truck,
  Shield,
  Check,
  ChevronLeft,
  ChevronRight,
  Share2,
  Zap,
  Award,
  Eye,
  Plus,
  Minus
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ProductDetails {
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
  created_at: string;
  variants: ProductVariant[];
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const TRUNCATE_LENGTH = 200;

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [/* addingToCart */, setAddingToCart] = useState(false);
  const [viewCount] = useState(Math.floor(Math.random() * 500) + 100);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [canTruncate, setCanTruncate] = useState(false);


  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      
      const parsedSlug = parseProductSlug(slug);
      
      let productId;
      if (!parsedSlug) {
        const isNumeric = /^\d+$/.test(slug);
        if (!isNumeric) {
          throw new Error('Invalid product URL');
        }
        productId = slug;
      } else {
        productId = parsedSlug.id;
      }
      
      const response = await productAPI.getProduct(productId);
      setProduct(response);
      
      if (!parsedSlug && response.name) {
        const correctSlug = createProductSlug(response.name, response.id);
        router.replace(`/products/${correctSlug}`);
        return;
      }
      
      if (response.variants && response.variants.length > 0) {
        // Default to the first in-stock variant, or just the first variant
        const firstInStock = response.variants.find((v: { stock_status: string; }) => v.stock_status === 'in_stock');
        setSelectedVariant(firstInStock || response.variants[0]);
      }
      
      if (response.images && response.images.length > 0) {
        setSelectedImageIndex(0);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/products');
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  const checkWishlistStatus = useCallback(async () => {
    if (!product) return;
    try {
      const response = await wishlistAPI.isInWishlist(product.id);
      setIsWishlisted(response.isInWishlist);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  }, [product]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated, checkWishlistStatus]);

  useEffect(() => {
    if (product?.description && product.description.length > TRUNCATE_LENGTH) {
      setCanTruncate(true);
    } else {
      setCanTruncate(false);
    }
  }, [product?.description]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product?.name || 'Product',
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(selectedVariant.id, quantity);
      toast.success('Added to cart! 🎉');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!product) return;
    
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist ❤️');
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const getUniqueColors = () => {
    if (!product?.variants) return [];
    const colors = new Map();
    product.variants.forEach(variant => {
      let color;
      if (variant.color) {
        color = variant.color;
      } else if (variant.title?.includes(' - ')) {
        // Printful format: "2XL - Black" -> "Black"
        color = variant.title.split(' - ')[1] || 'Default';
      } else if (variant.title?.includes(' / ')) {
        // Shopify format: "Wine / S" -> "Wine"
        color = variant.title.split(' / ')[0] || 'Default';
      } else {
        color = 'Default';
      }
      const colorCode = variant.color_code || '#000000';
      if (!colors.has(color)) {
        colors.set(color, colorCode);
      }
    });
    return Array.from(colors.entries());
  };

  const getAvailableSizes = (selectedColor?: string) => {
    if (!product?.variants) return [];
    return product.variants
      .filter(variant => {
        if (!selectedColor) return true;
        let color;
        if (variant.color) {
          color = variant.color;
        } else if (variant.title?.includes(' - ')) {
          // Printful format: "2XL - Black" -> "Black"
          color = variant.title.split(' - ')[1] || 'Default';
        } else if (variant.title?.includes(' / ')) {
          // Shopify format: "Wine / S" -> "Wine"
          color = variant.title.split(' / ')[0] || 'Default';
        } else {
          color = 'Default';
        }
        return color === selectedColor;
      })
      .map(variant => {
        if (variant.size) {
          return variant.size;
        } else if (variant.title?.includes(' - ')) {
          // Printful format: "2XL - Black" -> "2XL"
          return variant.title.split(' - ')[0] || 'Default';
        } else if (variant.title?.includes(' / ')) {
          // Shopify format: "Wine / S" -> "S"
          return variant.title.split(' / ')[1] || 'Default';
        } else {
          return 'Default';
        }
      })
      .filter((size, index, self) => self.indexOf(size) === index);
  };

  const getVariantColorAndSize = (variant: ProductVariant) => {
    if (variant.color && variant.size) {
      return { color: variant.color, size: variant.size };
    } else if (variant.title?.includes(' - ')) {
      // Printful format: "2XL - Black" 
      const parts = variant.title.split(' - ');
      return { 
        size: parts[0] || 'Default',
        color: parts[1] || 'Default'
      };
    } else if (variant.title?.includes(' / ')) {
      // Shopify format: "Wine / S"
      const parts = variant.title.split(' / ');
      return {
        color: parts[0] || 'Default',
        size: parts[1] || 'Default'
      };
    } else {
      return { color: 'Default', size: 'Default' };
    }
  };

  const getCurrentVariant = (color: string, size: string) => {
    return product?.variants.find(variant => {
      const { color: variantColor, size: variantSize } = getVariantColorAndSize(variant);
      return variantColor === color && variantSize === size;
    });
  };

  const isVariantAvailable = (variant: ProductVariant) => {
    // Check if this is a Printful product by looking for printful_variant_id
    const isPrintfulProduct = !!variant.printful_variant_id || product?.source === 'printful';
    
    if (isPrintfulProduct) {
      // For Printful variants, use available_for_sale if present, otherwise assume available
      // Printful is print-on-demand, so inventory_quantity 0 doesn't mean out of stock
      return variant.available_for_sale !== undefined ? variant.available_for_sale : true;
    }
    
    // For Shopify-only variants (no printful_variant_id)
    if (variant.available_for_sale !== undefined) {
      return variant.available_for_sale && (variant.inventory_quantity || 0) > 0;
    }
    
    // For variants with explicit stock_status
    if (variant.stock_status) {
      return variant.stock_status === 'in_stock';
    }
    
    // Default to available
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-purple-500 border-r-pink-500"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-16 w-16 border-4 border-transparent border-b-blue-500 border-l-cyan-500"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Product not found</h2>
          <Link href="/products" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.thumbnail_url || '/placeholder-product.svg'];

  const selectedColor = selectedVariant ? getVariantColorAndSize(selectedVariant).color : undefined;
  const availableSizes = getAvailableSizes(selectedColor);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <nav className="flex items-center space-x-2 text-sm text-slate-400 mb-8 backdrop-blur-md bg-slate-800/50 rounded-full px-6 py-3 border border-slate-700">
          <Link href="/products" className="hover:text-purple-400 transition-colors duration-200">Products</Link>
          <span className="text-slate-600">/</span>
          <span className="text-white font-medium">{product.name}</span>
        </nav>

        <Link
          href="/products"
          className="inline-flex items-center mb-8 text-slate-300 hover:text-white group transition-all duration-300"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">Back to Products</span>
        </Link>

        <div className="bg-slate-800/60 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 p-8 lg:p-12">
            {/* Product Images */}
            <div className="relative group">
              <div className="aspect-square overflow-hidden rounded-2xl bg-slate-900/50 border border-slate-700 relative">
                <Image
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className={`w-full h-full object-cover transition-all duration-700 ${isImageZoomed ? 'scale-150' : 'scale-100 hover:scale-105'}`}
                  unoptimized={true}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.svg';
                  }}
                  onClick={() => setIsImageZoomed(!isImageZoomed)}
                />
                
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}

                <button
                  onClick={handleShare}
                  className="absolute top-4 right-4 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-all duration-300 hover:scale-110"
                >
                  <Share2 className="w-5 h-5" />
                </button>

                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          selectedImageIndex === index 
                            ? 'bg-white scale-125' 
                            : 'bg-white/40 hover:bg-white/70'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {images.length > 1 && (
                <div className="mt-6 grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                        selectedImageIndex === index 
                          ? 'border-purple-400 shadow-lg shadow-purple-500/25' 
                          : 'border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} view ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-cover"
                        unoptimized={true}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.svg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="mt-10 lg:mt-0">
              <div className="max-w-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-slate-700/50 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-600">
                      <User className="w-4 h-4 text-purple-400 mr-2" />
                      <span className="text-sm text-white font-medium">
                        {product.creator_name}
                      </span>
                    </div>
                    <div className="flex items-center bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-full px-3 py-1 border border-yellow-500/30">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-yellow-100 ml-1 font-medium">4.8</span>
                    </div>
                  </div>
                  <div className="flex items-center text-slate-400 text-sm">
                    <Eye className="w-4 h-4 mr-1" />
                    <span>{viewCount} views</span>
                  </div>
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-white mb-4 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
                  {product.name}
                </h1>

                <div className="flex flex-wrap gap-3 mb-6">
                  {product.category && (
                    <span className="inline-block bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm text-purple-200 text-sm px-4 py-2 rounded-full font-medium border border-purple-500/30">
                      {product.category}
                    </span>
                  )}
                  <span className="inline-flex items-center bg-gradient-to-r from-green-600/30 to-emerald-600/30 backdrop-blur-sm text-green-200 text-sm px-3 py-1 rounded-full font-medium border border-green-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    Limited Edition
                  </span>
                  <span className="inline-flex items-center bg-gradient-to-r from-blue-600/30 to-cyan-600/30 backdrop-blur-sm text-blue-200 text-sm px-3 py-1 rounded-full font-medium border border-blue-500/30">
                    <Award className="w-3 h-3 mr-1" />
                    Premium Quality
                  </span>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline space-x-4">
                    <p className="text-4xl font-bold text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text">
                      {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.base_price)}
                    </p>
                    <span className="text-lg text-slate-400 line-through">
                      {formatPrice((selectedVariant?.price || product.base_price) * 1.3)}
                    </span>
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      23% OFF
                    </span>
                  </div>
                  <p className="text-sm text-green-400 mt-2 flex items-center">
                    <Check className="w-4 h-4 mr-1" />
                    Free shipping on orders over $50
                  </p>
                </div>

                {product.description && (
                  <div className="mb-8 p-6 bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {canTruncate && !isDescriptionExpanded
                        ? `${product.description.substring(0, TRUNCATE_LENGTH)}...`
                        : product.description}
                    </p>
                    {canTruncate && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-purple-400 font-semibold mt-4 hover:text-purple-300 transition-colors duration-200"
                      >
                        {isDescriptionExpanded ? 'Show Less' : 'Show More'}
                      </button>
                    )}
                  </div>
                )}


                {product.variants && product.variants.length > 0 && (
                  <div className="mt-8">
                    {/* Check if this has color/size structure or is in title format */}
                    {(product.variants[0]?.color && product.variants[0]?.size) || 
                     (product.variants[0]?.title?.includes(' - ') || product.variants[0]?.title?.includes(' / ')) ? (
                      <>
                        {/* Color Selection for Printful products */}
                        <div className="mb-6">
                          <h3 className="text-sm font-medium text-white mb-3">
                            Color: {selectedVariant ? getVariantColorAndSize(selectedVariant).color : 'Select Color'}
                          </h3>
                          <div className="flex space-x-3">
                            {getUniqueColors().map(([colorName, colorCode]) => (
                              <button
                                key={colorName}
                                onClick={() => {
                                  const currentSize = selectedVariant ? getVariantColorAndSize(selectedVariant).size : availableSizes[0];
                                  const newVariant = getCurrentVariant(colorName, currentSize);
                                  if (newVariant) setSelectedVariant(newVariant);
                                }}
                                className={`w-8 h-8 rounded-full border-2 ${
                                  selectedVariant && getVariantColorAndSize(selectedVariant).color === colorName
                                    ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-500'
                                    : 'border-gray-300'
                                }`}
                                style={{ backgroundColor: colorCode }}
                                title={colorName}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Size Selection for Printful products */}
                        {getUniqueColors().length > 0 && (
                          <div className="mb-6">
                            <h3 className="text-sm font-medium text-white mb-3">
                              Size: {selectedVariant ? getVariantColorAndSize(selectedVariant).size : 'Select Size'}
                            </h3>
                            <div className="grid grid-cols-4 gap-2">
                              {availableSizes.map((size) => {
                                const currentColor = selectedVariant ? getVariantColorAndSize(selectedVariant).color : getUniqueColors()[0]?.[0];
                                const variant = getCurrentVariant(currentColor, size);
                                const isAvailable = variant ? isVariantAvailable(variant) : false;
                                const isSelected = selectedVariant ? getVariantColorAndSize(selectedVariant).size === size : false;
                            
                            return (
                              <button
                                key={size}
                                onClick={() => {
                                  if (variant && isAvailable) {
                                    setSelectedVariant(variant);
                                  }
                                }}
                                disabled={!isAvailable}
                                className={`py-3 px-4 text-sm font-semibold rounded-xl border transition-all duration-300 hover:scale-105 ${
                                  isSelected
                                    ? 'border-purple-400 bg-gradient-to-r from-purple-600/30 to-pink-600/30 text-white shadow-lg shadow-purple-500/25'
                                    : isAvailable
                                    ? 'border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700/80 hover:border-slate-500'
                                    : 'border-slate-700 bg-slate-800/50 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                      </>
                    ) : (
                      /* Simple dropdown for Shopify products */
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Variant
                        </h3>
                        <select
                          value={selectedVariant?.id || ''}
                          onChange={(e) => {
                            const variant = product.variants.find(v => v.id === parseInt(e.target.value));
                            if (variant) setSelectedVariant(variant);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select a variant</option>
                          {product.variants.map((variant) => (
                            <option 
                              key={variant.id} 
                              value={variant.id}
                              disabled={!isVariantAvailable(variant)}
                            >
                              {variant.title} - {formatPrice(variant.price)} 
                              {!isVariantAvailable(variant) && ' (Out of Stock)'}
                              {variant.inventory_quantity !== undefined && ` (${variant.inventory_quantity} available)`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Stock Status */}
                    {selectedVariant && (
                      <div className="mb-6">
                        <div className="flex items-center">
                          {isVariantAvailable(selectedVariant) ? (
                            <>
                              <Check className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-sm text-green-600 font-medium">
                                In Stock
                                {selectedVariant.inventory_quantity !== undefined && 
                                  ` (${selectedVariant.inventory_quantity} available)`}
                              </span>
                            </>
                          ) : (
                            <>
                              <Package className="w-5 h-5 text-red-500 mr-2" />
                              <span className="text-sm text-red-600 font-medium">Out of Stock</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-8">
                  <label className="block text-lg font-semibold text-white mb-4">
                    Quantity
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center bg-slate-900/70 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-3 text-white hover:bg-slate-700/50 transition-colors duration-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-6 py-3 text-white font-semibold min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(10, quantity + 1))}
                        className="p-3 text-white hover:bg-slate-700/50 transition-colors duration-200"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-slate-400 text-sm">Max 10 items</span>
                  </div>
                </div>

                <div className="flex space-x-4 mb-8">
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || !isVariantAvailable(selectedVariant)}
                    className="flex-1 bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {!selectedVariant ? 'Select Variant' : !isVariantAvailable(selectedVariant) ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center ${
                      isWishlisted
                        ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-500/25 hover:shadow-red-500/40'
                        : 'bg-slate-800/80 backdrop-blur-sm border border-slate-700 text-white hover:bg-slate-700/80 shadow-black/20'
                    }`}
                  >
                    <Heart className={`w-6 h-6 transition-all duration-300 ${isWishlisted ? 'fill-current scale-110' : ''}`} />
                  </button>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-400" />
                    Premium Features
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center group">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <Truck className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Free Express Shipping</p>
                        <p className="text-slate-400 text-sm">On orders over $50</p>
                      </div>
                    </div>
                    <div className="flex items-center group">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <Shield className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">30-Day Returns</p>
                        <p className="text-slate-400 text-sm">Hassle-free return policy</p>
                      </div>
                    </div>
                    <div className="flex items-center group">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform duration-300">
                        <Award className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Premium Quality</p>
                        <p className="text-slate-400 text-sm">Print-on-demand excellence</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};