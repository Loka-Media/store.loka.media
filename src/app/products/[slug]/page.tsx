/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, ProductVariant, wishlistAPI } from '@/lib/api';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { parseProductSlug, createProductSlug } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { ProductImageGallery } from '@/components/products/product-detail/ProductImageGallery';
import { ProductInfo } from '@/components/products/product-detail/ProductInfo';
import { ProductVariantSelector } from '@/components/products/product-detail/ProductVariantSelector';
import { ProductActions } from '@/components/products/product-detail/ProductActions';
import { ProductMeta } from '@/components/products/product-detail/ProductMeta';
import { ProductShippingInfo } from '@/components/products/product-detail/ProductShippingInfo';

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
  source?: string;
}

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { addToCart } = useGuestCart();
  const { addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const parsedSlug = parseProductSlug(slug);
      const productId = parsedSlug ? parsedSlug.id : slug;

      const response = await productAPI.getProduct(productId);
      setProduct(response);

      if (!parsedSlug && response.name) {
        const correctSlug = createProductSlug(response.name, response.id);
        router.replace(`/products/${correctSlug}`);
        return;
      }

      if (response.variants && response.variants.length > 0) {
        const firstInStock = response.variants.find((v: any) => isVariantAvailable(v, response.source));
        setSelectedVariant(firstInStock || response.variants[0]);
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

  const handleAddToCart = async (quantity: number) => {
    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }
    try {
      await addToCart(selectedVariant.id, quantity);
      toast.success('Added to cart! 🎉');
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
        toast.success('Added to wishlist ❤️');
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  };

  // Variant helper functions (passed to selector component)
  const getVariantColorAndSize = (variant: ProductVariant) => {
    if (variant.color && variant.size) {
      return { color: variant.color, size: variant.size };
    } else if (variant.title?.includes(' - ')) {
      const parts = variant.title.split(' - ');
      return { size: parts[0] || 'Default', color: parts[1] || 'Default' };
    } else if (variant.title?.includes(' / ')) {
      const parts = variant.title.split(' / ');
      return { color: parts[0] || 'Default', size: parts[1] || 'Default' };
    } else {
      return { color: 'Default', size: 'Default' };
    }
  };

  const getUniqueColors = () => {
    if (!product?.variants) return [];
    const colors = new Map();
    product.variants.forEach(variant => {
      const color = getVariantColorAndSize(variant).color;
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
        return getVariantColorAndSize(variant).color === selectedColor;
      })
      .map(variant => getVariantColorAndSize(variant).size)
      .filter((size, index, self) => self.indexOf(size) === index);
  };

  const getCurrentVariant = (color: string, size: string) => {
    return product?.variants.find(variant => {
      const { color: variantColor, size: variantSize } = getVariantColorAndSize(variant);
      return variantColor === color && variantSize === size;
    });
  };

  const isVariantAvailable = (variant: ProductVariant, source?: string) => {
    const isPrintfulProduct = !!variant.printful_variant_id || source === 'printful';
    if (isPrintfulProduct) {
      return variant.available_for_sale !== undefined ? variant.available_for_sale : true;
    }
    if (variant.available_for_sale !== undefined) {
      return variant.available_for_sale && (variant.inventory_quantity || 0) > 0;
    }
    if (variant.stock_status) {
      return variant.stock_status === 'in_stock';
    }
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Product Not Found</h2>
          <Link href="/products" className="bg-orange-500 text-white font-bold py-3 px-6 rounded-md hover:bg-orange-600 transition-colors">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.thumbnail_url || '/placeholder-product.svg'];

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/products"
          className="inline-flex items-center mb-8 text-gray-400 hover:text-white group transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Products</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImageGallery productName={product.name} images={images} />

          <div className="space-y-8">
            <ProductInfo
              productName={product.name}
              description={product.description}
              basePrice={product.base_price}
              selectedVariantPrice={selectedVariant?.price}
            />
            <ProductVariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              getVariantColorAndSize={getVariantColorAndSize}
              getUniqueColors={getUniqueColors}
              getAvailableSizes={getAvailableSizes}
              getCurrentVariant={getCurrentVariant}
              isVariantAvailable={(v) => isVariantAvailable(v, product.source)}
            />
            <ProductActions
              selectedVariant={selectedVariant}
              isVariantAvailable={
                selectedVariant
                  ? isVariantAvailable(selectedVariant, product.source)
                  : false
              }
              isWishlisted={isWishlisted}
              onAddToCart={handleAddToCart}
              onWishlistToggle={handleWishlistToggle}
            />
            <div className="pt-8 border-t border-gray-800">
              <ProductMeta
                creatorName={product.creator_name}
                creatorUsername={product.creator_username}
                category={product.category}
                tags={product.tags}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
