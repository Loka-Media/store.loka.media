'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { cartAPI, CartItem, CartSummary, printfulAPI, productAPI } from '@/lib/api';
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

  // Refs for optimization
  const lastRefreshTime = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef<boolean>(false);

  // Minimum time between refreshes (in milliseconds)
  const MIN_REFRESH_INTERVAL = 2000; // 2 seconds

  const fetchCartCount = async () => {
    try {
      const response = await cartAPI.getCartCount();
      setCartCount(response.count);
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  // Debounced refresh function to prevent excessive API calls
  const debouncedRefreshCart = useCallback(async (forceRefresh: boolean = false) => {
    if (!isAuthenticated) return;

    const now = Date.now();
    
    // Check if enough time has passed since last refresh
    if (!forceRefresh && (now - lastRefreshTime.current) < MIN_REFRESH_INTERVAL) {
      // Schedule refresh for later if not already scheduled
      if (!refreshTimeoutRef.current) {
        const remainingTime = MIN_REFRESH_INTERVAL - (now - lastRefreshTime.current);
        refreshTimeoutRef.current = setTimeout(() => {
          refreshTimeoutRef.current = null;
          debouncedRefreshCart(true);
        }, remainingTime);
      }
      return;
    }

    lastRefreshTime.current = now;
    
    try {
      setLoading(true);
      const response = await cartAPI.getCart();
      setItems(response.items);
      setSummary(response.summary);
      setCartCount(response.summary.itemCount);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      // Don't show error toast on background refreshes to avoid spam
      if (forceRefresh) {
        toast.error('Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Public refresh function (for backward compatibility)
  const refreshCart = useCallback(async () => {
    await debouncedRefreshCart(true);
  }, [debouncedRefreshCart]);

  // Fetch cart data when user is authenticated (optimized)
  useEffect(() => {
    if (!isInitialized.current) {
      isInitialized.current = true;
      // Initial load
      if (isAuthenticated && user) {
        debouncedRefreshCart(true); // This will update cart count automatically
      }
    } else {
      // Auth status changed after initialization
      if (isAuthenticated && user) {
        debouncedRefreshCart(true); // This will update cart count automatically
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
    }
  }, [isAuthenticated, user]);

  // Add page visibility API listener with rate limiting
  useEffect(() => {
    let lastVisibilityChange = 0;
    const VISIBILITY_THROTTLE = 5000; // 5 seconds

    const handleVisibilityChange = () => {
      const now = Date.now();
      if (!document.hidden && isAuthenticated && user && (now - lastVisibilityChange) > VISIBILITY_THROTTLE) {
        lastVisibilityChange = now;
        // Page became visible, refresh cart with debouncing
        debouncedRefreshCart(false); // Don't force, let debouncing handle it
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user, debouncedRefreshCart]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const addToCart = async (variantId: number, quantity: number = 1): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return false;
    }

    try {
      // Add to cart - backend will handle availability validation if needed
      await cartAPI.addToCart(variantId, quantity);
      toast.success('Added to cart!');
      await refreshCart();
      return true;
    } catch (error: unknown) {
      const errorResponse = error as { response?: { data?: { error?: string } } };
      const message = errorResponse?.response?.data?.error || 'Failed to add to cart';
      
      // Handle specific availability errors from backend
      if (message.includes('out of stock') || message.includes('unavailable') || message.includes('not available')) {
        toast.error('Product is currently out of stock');
      } else if (message.includes('insufficient inventory') || message.includes('not enough stock')) {
        toast.error('Insufficient stock for the requested quantity');
      } else {
        toast.error(message);
      }
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
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to update cart';
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
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to remove item';
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
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to clear cart';
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