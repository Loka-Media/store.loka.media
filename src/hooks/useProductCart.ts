import { useCallback } from 'react';
import { ProductVariant } from '@/lib/api';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductCart = (product: ProductDetails | null, selectedVariant: ProductVariant | null) => {
  const { addToCart: addToGuestCart } = useGuestCart();
  const { addToCart: addToAuthenticatedCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = useCallback(async (quantity: number) => {
    if (!selectedVariant) {
      toast.error('Please select a variant');
      return;
    }

    console.log('🛒 Add to cart called for product:', product?.name, 'variant:', selectedVariant.id);

    try {
      if (isAuthenticated) {
        await addToAuthenticatedCart(selectedVariant.id, quantity);
      } else {
        await addToGuestCart(selectedVariant.id, quantity);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  }, [selectedVariant, product?.name, isAuthenticated, addToAuthenticatedCart, addToGuestCart]);

  return {
    handleAddToCart
  };
};