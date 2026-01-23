'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { cartAPI, CartItem, CartSummary } from '@/lib/api';
import { useAuth } from './AuthContext';
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
  printful_catalog_variant_id?: string;
  printful_availability_regions?: string[];
  availability_regions?: string[];
}

interface GuestCartContextType {
  items: GuestCartItem[];
  summary: CartSummary;
  loading: boolean;
  cartCount: number;
  addToCart: (variantId: number, quantity?: number) => Promise<boolean>;
  updateCartItem: (cartItemId: number, quantity: number) => Promise<boolean>;
  removeFromCart: (cartItemId: number) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const GuestCartContext = createContext<GuestCartContextType | undefined>(undefined);

export function GuestCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<GuestCartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary>({
    itemCount: 0,
    subtotal: '0.00',
    shipping: '0.00',
    total: '0.00'
  });
  const [loading, setLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Refs for optimization
  const lastRefreshTime = useRef<number>(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef<boolean>(false);

  // Minimum time between refreshes (in milliseconds)
  const MIN_REFRESH_INTERVAL = 2000; // 2 seconds

  // Load cart from localStorage for guest users
  const loadGuestCart = useCallback(() => {
    if (!isAuthenticated && isClient && typeof window !== 'undefined') {
      try {
        const savedCart = localStorage.getItem('guestCart');
        
        if (savedCart) {
          const guestCartData = JSON.parse(savedCart);
          const cartItems = guestCartData.items || [];
          const cartSummary = guestCartData.summary || {
            itemCount: 0,
            subtotal: '0.00',
            shipping: '0.00',
            total: '0.00'
          };
          
          setItems(cartItems);
          setSummary(cartSummary);
          setCartCount(cartItems.reduce((sum: number, item: GuestCartItem) => sum + item.quantity, 0));
        } else {
          // Initialize empty guest cart
          setItems([]);
          setSummary({
            itemCount: 0,
            subtotal: '0.00',
            shipping: '0.00',
            total: '0.00'
          });
          setCartCount(0);
        }
      } catch (error) {
        console.error('Failed to load guest cart from localStorage:', error);
        // Initialize empty guest cart on error
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
  }, [isAuthenticated, isClient]);

  // Save cart to localStorage for guest users
  const saveGuestCart = useCallback((cartItems: GuestCartItem[], cartSummary: CartSummary) => {
    if (!isAuthenticated && isClient && typeof window !== 'undefined') {
      try {
        const cartData = {
          items: cartItems,
          summary: cartSummary
        };
        localStorage.setItem('guestCart', JSON.stringify(cartData));
      } catch (error) {
        console.error('Failed to save guest cart to localStorage:', error);
      }
    }
  }, [isAuthenticated, isClient]);

  // Calculate cart summary
  const calculateSummary = useCallback((cartItems: GuestCartItem[]): CartSummary => {
    const subtotal = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const shipping = cartItems.length > 0 ? 5.99 : 0;
    const total = subtotal + shipping;

    return {
      itemCount: totalItems,
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2)
    };
  }, []);

  const fetchCartCount = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const response = await cartAPI.getCartCount();
        setCartCount(response.count);
      } else if (isClient && typeof window !== 'undefined') {
        // Count guest cart items from current state first, then fallback to localStorage
        if (items.length > 0) {
          const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(totalQuantity);
        } else {
          // Fallback to localStorage
          const savedCart = localStorage.getItem('guestCart');
          if (savedCart) {
            const guestCartData = JSON.parse(savedCart);
            const totalQuantity = guestCartData.items?.reduce((sum: number, item: GuestCartItem) => sum + item.quantity, 0) || 0;
            setCartCount(totalQuantity);
          } else {
            setCartCount(0);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  }, [isAuthenticated, items, isClient]);

  // Debounced refresh function to prevent excessive API calls
  const debouncedRefreshCart = useCallback(async (forceRefresh: boolean = false) => {
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

    if (isAuthenticated) {
      // Use authenticated cart API
      try {
        setLoading(true);
        const response = await cartAPI.getCart();
        const guestCartItems: GuestCartItem[] = response.items.map((item: CartItem) => ({
          ...item,
          price: String(item.price),
          total_price: String(item.total_price)
        }));
        setItems(guestCartItems);
        setSummary(response.summary);
        setCartCount(response.summary.itemCount);
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        // Silently fail - no error toast for cart operations
      } finally {
        setLoading(false);
      }
    } else {
      // Load guest cart from localStorage
      loadGuestCart();
    }
  }, [isAuthenticated, loadGuestCart]);

  // Public refresh function (for backward compatibility)
  const refreshCart = useCallback(async () => {
    await debouncedRefreshCart(true);
  }, [debouncedRefreshCart]);

  // Load cart data on mount and when auth status changes (optimized)
  useEffect(() => {
    if (!isClient) return; // Wait for client-side hydration
    
    if (!isInitialized.current) {
      isInitialized.current = true;
      // Initial load
      if (isAuthenticated && user) {
        debouncedRefreshCart(true); // This will update cart count automatically
      } else {
        loadGuestCart(); // This will update cart count automatically
      }
    } else {
      // Auth status changed after initialization
      if (isAuthenticated && user) {
        debouncedRefreshCart(true); // This will update cart count automatically
      } else {
        loadGuestCart(); // This will update cart count automatically
      }
    }
  }, [isAuthenticated, user, isClient, loadGuestCart, debouncedRefreshCart]);

  // Removed visibility change handler to reduce unnecessary API calls

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const addToCart = async (variantId: number, quantity: number = 1): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
      try {
        await cartAPI.addToCart(variantId, quantity);
        await refreshCart();
        return true;
      } catch (error: unknown) {
        console.error('Failed to add to cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    } else {
      // Guest cart logic - directly handle guest cart without trying authenticated API
      if (!isClient || typeof window === 'undefined') {
        toast.error('Unable to add to cart. Please try again.');
        return false;
      }
      
      try {
        // Try to get cached product data from localStorage
        let newItem: GuestCartItem;
        
        // First, let the current execution cycle complete to allow localStorage to be updated
        await new Promise(resolve => setTimeout(resolve, 10));
        
        try {
          const productCache = localStorage.getItem(`product_variant_${variantId}`);
          let cachedData = null;
          
          if (productCache) {
            cachedData = JSON.parse(productCache);
          }
          
          if (cachedData) {
            newItem = {
              id: Date.now(), // Temporary ID for guest cart
              product_id: cachedData.product_id || 0,
              variant_id: variantId,
              product_name: cachedData.product_name || 'Product',
              price: cachedData.price || '25.00',
              quantity,
              total_price: (parseFloat(cachedData.price || '25.00') * quantity).toFixed(2),
              size: cachedData.size || 'One Size',
              color: cachedData.color || 'Default',
              color_code: cachedData.color_code || '#808080',
              image_url: cachedData.image_url || cachedData.thumbnail_url,
              thumbnail_url: cachedData.thumbnail_url,
              creator_name: cachedData.creator_name || 'Creator',
              source: cachedData.source || 'unknown',
              shopify_variant_id: cachedData.shopify_variant_id,
              printful_variant_id: cachedData.printful_variant_id
            };
          } else {
            // Since there's no cached data, we cannot add the product to guest cart
            console.error('No cached product data available for variant:', variantId);
            return false;
          }
        } catch (error) {
          console.error('Failed to get cached product data:', error);
          return false;
        }
        
        // Check if item already exists in guest cart
        const existingItemIndex = items.findIndex(item => item.variant_id === variantId);
        let updatedItems: GuestCartItem[];
        
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += quantity;
          updatedItems[existingItemIndex].total_price = (parseFloat(updatedItems[existingItemIndex].price) * updatedItems[existingItemIndex].quantity).toFixed(2);
        } else {
          // Add new item
          updatedItems = [...items, newItem];
        }
        
        const newSummary = calculateSummary(updatedItems);
        
        setItems(updatedItems);
        setSummary(newSummary);
        setCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
        saveGuestCart(updatedItems, newSummary);

        // Cart count is already updated above, no need for API call

        return true;
      } catch (error) {
        console.error('Failed to add to guest cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    }
  };

  const updateCartItem = async (cartItemId: number, quantity: number): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
      try {
        await cartAPI.updateCartItem(cartItemId, quantity);
        await refreshCart();
        return true;
      } catch (error: unknown) {
        console.error('Failed to update cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    } else {
      // Guest cart logic
      try {
        if (quantity <= 0) {
          return removeFromCart(cartItemId);
        }
        
        const updatedItems = items.map(item => {
          if (item.id === cartItemId) {
            return {
              ...item,
              quantity,
              total_price: (parseFloat(item.price) * quantity).toFixed(2)
            };
          }
          return item;
        });
        
        const newSummary = calculateSummary(updatedItems);
        
        setItems(updatedItems);
        setSummary(newSummary);
        setCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
        saveGuestCart(updatedItems, newSummary);

        return true;
      } catch (error) {
        console.error('Failed to update guest cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    }
  };

  const removeFromCart = async (cartItemId: number): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
      try {
        await cartAPI.removeFromCart(cartItemId);
        await refreshCart();
        return true;
      } catch (error: unknown) {
        console.error('Failed to remove from cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    } else {
      // Guest cart logic
      try {
        const updatedItems = items.filter(item => item.id !== cartItemId);
        const newSummary = calculateSummary(updatedItems);
        
        setItems(updatedItems);
        setSummary(newSummary);
        setCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
        saveGuestCart(updatedItems, newSummary);

        return true;
      } catch (error) {
        console.error('Failed to remove from guest cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
      try {
        await cartAPI.clearCart();
        await refreshCart();
        return true;
      } catch (error: unknown) {
        console.error('Failed to clear cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    } else {
      // Guest cart logic
      try {
        setItems([]);
        setSummary({
          itemCount: 0,
          subtotal: '0.00',
          shipping: '0.00',
          total: '0.00'
        });
        setCartCount(0);
        if (isClient && typeof window !== 'undefined') {
          localStorage.removeItem('guestCart');
        }

        return true;
      } catch (error) {
        console.error('Failed to clear guest cart:', error);
        // Silently fail - no error toast for cart operations
        return false;
      }
    }
  };

  return (
    <GuestCartContext.Provider
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
    </GuestCartContext.Provider>
  );
}

export function useGuestCart() {
  const context = useContext(GuestCartContext);
  if (context === undefined) {
    throw new Error('useGuestCart must be used within a GuestCartProvider');
  }
  return context;
}