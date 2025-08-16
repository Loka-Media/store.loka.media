import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, ProductVariant } from '@/lib/api';
import { parseProductSlug, createProductSlug } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface ProductDetails {
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

export const useProductData = (slug: string) => {
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSlugRef = useRef<string>('');
  const hasInitialized = useRef<boolean>(false);

  const isVariantAvailable = useCallback((variant: ProductVariant, source?: string) => {
    const isPrintfulProduct = !!variant.printful_variant_id || source === 'printful';
    if (isPrintfulProduct) {
      return variant.available_for_sale !== false;
    }
    
    if (variant.available_for_sale !== undefined) {
      return variant.available_for_sale && (variant.inventory_quantity || 0) > 0;
    }
    if (variant.stock_status) {
      return variant.stock_status === 'in_stock';
    }
    return true;
  }, []);

  const fetchProduct = useCallback(async () => {
    // Prevent multiple calls for the same slug
    if (lastSlugRef.current === slug && hasInitialized.current) {
      return;
    }

    lastSlugRef.current = slug;
    hasInitialized.current = true;

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

      return response;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/products');
      return null;
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // Auto-fetch when slug changes
  useEffect(() => {
    if (slug && slug !== lastSlugRef.current) {
      fetchProduct();
    }
  }, [slug, fetchProduct]);

  return {
    product,
    loading,
    fetchProduct,
    isVariantAvailable
  };
};