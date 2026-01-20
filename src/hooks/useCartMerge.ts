import { useState, useCallback } from 'react';
import { CartMergeData, User, CheckoutStep } from '@/lib/checkout-types';
import { cartAPI, CartItem } from '@/lib/api';
import toast from 'react-hot-toast';

interface GuestCartItem {
  id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  price: string;
  quantity: number;
  total_price: string;
  size: string;
  color: string;
  color_code?: string;
  image_url?: string;
  thumbnail_url?: string;
  creator_name?: string;
  source?: string;
  shopify_variant_id?: string;
  printful_variant_id?: string;
}

export const useCartMerge = () => {
  const [cartMergeData, setCartMergeData] = useState<CartMergeData | null>(null);

  const checkCartMerge = useCallback(async (
    token: string, 
    userInfo: User, 
    guestCartItems: GuestCartItem[] | CartItem[],
    setCurrentStep: (step: CheckoutStep) => void,
    fillUserInfo: (userInfo: User) => void
  ) => {
    if (guestCartItems.length === 0) {
      toast.success('Logged in successfully!');
      fillUserInfo(userInfo);
      return;
    }

    try {
      const userCart = await cartAPI.getCart();
      const userCartCount = userCart.items?.length || 0;

      setCartMergeData({
        userCartCount,
        guestCartCount: guestCartItems.length,
        token,
        userInfo
      });
      setCurrentStep('cart-merge');

    } catch (error) {
      console.error('Cart check error:', error);
      toast.error('Login successful, but cart check failed');
    }
  }, []);

  const handleMergeConfirm = useCallback(async (
    guestCartItems: GuestCartItem[] | CartItem[],
    clearCart: () => Promise<boolean>,
    setLoading: (loading: boolean) => void
  ) => {
    if (!cartMergeData) return;
    
    try {
      setLoading(true);

      for (const item of guestCartItems) {
        await cartAPI.addToCart(item.variant_id, item.quantity);
      }

      await clearCart();
      await new Promise(resolve => setTimeout(resolve, 100));

      toast.success('Carts merged successfully! Redirecting to cart...');
      window.location.href = '/cart';

    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge carts');
    } finally {
      setLoading(false);
    }
  }, [cartMergeData]);

  const handleMergeCancel = useCallback(async (
    clearCart: () => Promise<boolean>
  ) => {
    if (cartMergeData) {
      await clearCart();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      toast.success('Using your saved cart. Redirecting to cart...');
      window.location.href = '/cart';
    }
  }, [cartMergeData]);

  return {
    cartMergeData,
    setCartMergeData,
    checkCartMerge,
    handleMergeConfirm,
    handleMergeCancel
  };
};