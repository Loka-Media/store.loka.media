import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductVariant } from '@/lib/api';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductCart = (product: ProductDetails | null, selectedVariant: ProductVariant | null) => {
  const { addToCart } = useGuestCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleAddToCart = useCallback(async (quantity: number) => {
    // Check if user is authenticated, redirect to login if not
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      router.push('/auth/login');
      return;
    }

    if (!selectedVariant || !product) {
      toast.error('Please select a variant');
      return;
    }

    console.log('🛒 Add to cart called for product:', product?.name, 'variant:', selectedVariant.id);

    try {
      // Cache variant data for guest cart before adding to cart
      const variantCacheData = {
        product_id: product.id,
        product_name: product.name,
        price: selectedVariant.price?.toString() || product.base_price?.toString() || '25.00',
        size: selectedVariant.size || selectedVariant.title?.split(' / ')[1] || 'One Size',
        color: selectedVariant.color || selectedVariant.title?.split(' / ')[0] || 'Default',
        color_code: selectedVariant.color_code || '#808080',
        image_url: selectedVariant.image_url || product.thumbnail_url || product.images?.[0],
        thumbnail_url: product.thumbnail_url || product.images?.[0],
        creator_name: product.creator?.name || product.creator_name || 'Unknown',
        source: product.source || 'unknown',
        shopify_variant_id: selectedVariant.shopify_variant_id,
        printful_variant_id: selectedVariant.printful_variant_id
      };

      // Store in localStorage for guest cart
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`product_variant_${selectedVariant.id}`, JSON.stringify(variantCacheData));
        } catch (error) {
          console.warn('Failed to cache variant data:', error);
          toast.error('Failed to prepare product data. Please try again.');
          return;
        }

        // Small delay to ensure localStorage write completes
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      // Use unified GuestCart for both authenticated and guest users
      const success = await addToCart(selectedVariant.id, quantity);

      if (success) {
        toast.success(`${product.name} added to cart!`);
      } else {
        toast.error('Failed to add to cart. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart. Please try again.');
    }
  }, [selectedVariant, product, addToCart]);

  return {
    handleAddToCart
  };
};