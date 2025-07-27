'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { cartAPI, CartItem, CartSummary } from '@/lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  loading: boolean;
  cartCount: number;
  addToCart: (variantId: number, quantity?: number) => Promise<boolean>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    itemCount: 0,
    subtotal: '0.00',
    shipping: '0.00',
    total: '0.00'
  });
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const { isAuthenticated, user } = useAuth();

  // Fetch cart data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
      fetchCartCount();
    } else {
      // Clear cart data when user logs out
      setItems([]);
      setSummary({
        itemCount: 0,
        subtotal: '0.00',
        shipping: '0.00',
        total: '0.00'
      });
      setCartCount(0);
    }
  }, [isAuthenticated, user]);

  const fetchCartCount = async () => {
    try {
      const response = await cartAPI.getCartCount();
      setCartCount(response.count);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  const refreshCart = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setItems(response.items);
      setSummary(response.summary);
      setCartCount(response.summary.itemCount);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (variantId: number, quantity: number = 1): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return false;
    }

    try {
      await cartAPI.addToCart(variantId, quantity);
      toast.success('Added to cart!');
      await refreshCart();
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to add to cart';
      toast.error(message);
      return false;
    }
  };

  const updateCartItem = async (cartItemId: number, quantity: number): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to update cart');
      return false;
    }

    try {
      await cartAPI.updateCartItem(cartItemId, quantity);
      toast.success('Cart updated!');
      await refreshCart();
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to update cart';
      toast.error(message);
      return false;
    }
  };

  const removeFromCart = async (cartItemId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to remove items');
      return false;
    }

    try {
      await cartAPI.removeFromCart(cartItemId);
      toast.success('Item removed from cart');
      await refreshCart();
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to remove item';
      toast.error(message);
      return false;
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to clear cart');
      return false;
    }

    try {
      await cartAPI.clearCart();
      toast.success('Cart cleared');
      await refreshCart();
      return true;
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Failed to clear cart';
      toast.error(message);
      return false;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        loading,
        cartCount,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}