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
  Check
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

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      
      // Parse the slug to get the product ID
      const parsedSlug = parseProductSlug(slug);
      
      let productId;
      if (!parsedSlug) {
        // If slug is just a number (old format), use it directly
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
      
      // Redirect to SEO-friendly URL if user accessed via old numeric URL
      if (!parsedSlug && response.name) {
        const correctSlug = createProductSlug(response.name, response.id);
        router.replace(`/products/${correctSlug}`);
        return;
      }
      
      // Select first available variant by default
      if (response.variants && response.variants.length > 0) {
        setSelectedVariant(response.variants[0]);
      }
      
      // Set first image as selected
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
      await addToCart(selectedVariant.id, quantity);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
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
        toast.success('Added to wishlist');
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
      if (!colors.has(variant.color)) {
        colors.set(variant.color, variant.color_code);
      }
    });
    return Array.from(colors.entries());
  };

  const getAvailableSizes = (selectedColor?: string) => {
    if (!product?.variants) return [];
    return product.variants
      .filter(variant => !selectedColor || variant.color === selectedColor)
      .map(variant => variant.size)
      .filter((size, index, self) => self.indexOf(size) === index);
  };

  const getCurrentVariant = (color: string, size: string) => {
    return product?.variants.find(variant => 
      variant.color === color && variant.size === size
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h2>
          <Link href="/products" className="text-indigo-600 hover:text-indigo-500">
            Browse all products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.thumbnail_url || '/placeholder-product.svg'];

  const selectedColor = selectedVariant?.color;
  const availableSizes = getAvailableSizes(selectedColor);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <Link href="/products" className="hover:text-indigo-600">Products</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        {/* Back Button */}
        <Link
          href="/products"
          className="inline-flex items-center mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Products
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8">
            {/* Product Images */}
            <div className="lg:max-w-lg lg:self-end">
              <div className="aspect-square overflow-hidden rounded-lg">
                <Image
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  unoptimized={true}
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-product.svg';
                  }}
                />
              </div>
              
              {/* Image Thumbnails */}
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-md overflow-hidden border-2 ${
                        selectedImageIndex === index 
                          ? 'border-indigo-500' 
                          : 'border-gray-200 hover:border-gray-300'
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
            <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
              <div className="lg:max-w-lg">
                {/* Creator Info */}
                <div className="flex items-center mb-4">
                  <div className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                    <User className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-700 font-medium">
                      {product.creator_name}
                    </span>
                  </div>
                  <div className="flex items-center ml-4">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-500 ml-1">4.8 (124 reviews)</span>
                  </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {product.name}
                </h1>

                {/* Category */}
                {product.category && (
                  <div className="mt-3">
                    <span className="inline-block bg-indigo-100 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium">
                      {product.category}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-6">
                  <p className="text-3xl tracking-tight text-gray-900">
                    {selectedVariant ? formatPrice(selectedVariant.price) : formatPrice(product.base_price)}
                  </p>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900">Description</h3>
                    <div className="mt-2 prose prose-sm text-gray-600">
                      <p>{product.description}</p>
                    </div>
                  </div>
                )}

                {/* Variant Selection */}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-8">
                    {/* Color Selection */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">
                        Color: {selectedVariant?.color}
                      </h3>
                      <div className="flex space-x-3">
                        {getUniqueColors().map(([colorName, colorCode]) => (
                          <button
                            key={colorName}
                            onClick={() => {
                              const newVariant = getCurrentVariant(colorName, selectedVariant?.size || availableSizes[0]);
                              if (newVariant) setSelectedVariant(newVariant);
                            }}
                            className={`w-8 h-8 rounded-full border-2 ${
                              selectedVariant?.color === colorName
                                ? 'border-gray-900 ring-2 ring-offset-2 ring-gray-500'
                                : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: colorCode }}
                            title={colorName}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Size Selection */}
                    {selectedColor && (
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-900 mb-3">
                          Size: {selectedVariant?.size}
                        </h3>
                        <div className="grid grid-cols-4 gap-2">
                          {availableSizes.map((size) => {
                            const variant = getCurrentVariant(selectedColor, size);
                            const isAvailable = variant?.stock_status === 'in_stock';
                            const isSelected = selectedVariant?.size === size;
                            
                            return (
                              <button
                                key={size}
                                onClick={() => {
                                  if (variant && isAvailable) {
                                    setSelectedVariant(variant);
                                  }
                                }}
                                disabled={!isAvailable}
                                className={`py-2 px-3 text-sm font-medium rounded-md border ${
                                  isSelected
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                    : isAvailable
                                    ? 'border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
                                    : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Stock Status */}
                    {selectedVariant && (
                      <div className="mb-6">
                        <div className="flex items-center">
                          {selectedVariant.stock_status === 'in_stock' ? (
                            <>
                              <Check className="w-5 h-5 text-green-500 mr-2" />
                              <span className="text-sm text-green-600 font-medium">In Stock</span>
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

                {/* Quantity Selection */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <select
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="w-20 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock_status !== 'in_stock'}
                    className="flex-1 bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Add to Cart
                  </button>
                  
                  <button
                    onClick={handleWishlistToggle}
                    className={`border rounded-md py-3 px-4 flex items-center justify-center text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                      isWishlisted
                        ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Product Features */}
                <div className="mt-10 border-t border-gray-200 pt-8">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Features</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Truck className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">Free shipping on orders over $50</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">30-day return policy</span>
                    </div>
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="text-sm text-gray-600">Print-on-demand quality</span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}