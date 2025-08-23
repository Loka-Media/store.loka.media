import { useCallback } from 'react';
import { ProductVariant } from '@/lib/api';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductCart = (product: ProductDetails | null, selectedVariant: ProductVariant | null) => {
  const { addToCart } = useGuestCart();

  const handleAddToCart = useCallback(async (quantity: number) => {
    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    console.log('🛒 Add to cart called for product:', product?.name, 'variant:', selectedVariant.id);

    try {
      // Use unified GuestCart for both authenticated and guest users
      await addToCart(selectedVariant.id, quantity);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  }, [selectedVariant, product?.name, addToCart]);

  return {
    handleAddToCart
  };
};