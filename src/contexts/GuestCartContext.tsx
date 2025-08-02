'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { cartAPI, CartItem, CartSummary, publicAPI } from '@/lib/api';
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
  const { isAuthenticated, user } = useAuth();

  // Load cart from localStorage for guest users
  const loadGuestCart = useCallback(() => {
    if (!isAuthenticated) {
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
          setCartCount(cartItems.reduce((sum, item) => sum + item.quantity, 0));
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
  }, [isAuthenticated]);

  // Save cart to localStorage for guest users
  const saveGuestCart = useCallback((cartItems: GuestCartItem[], cartSummary: CartSummary) => {
    if (!isAuthenticated) {
      try {
        localStorage.setItem('guestCart', JSON.stringify({
          items: cartItems,
          summary: cartSummary
        }));
      } catch (error) {
        console.error('Failed to save guest cart to localStorage:', error);
      }
    }
  }, [isAuthenticated]);

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

  const fetchCartCount = async () => {
    try {
      if (isAuthenticated) {
        const response = await cartAPI.getCartCount();
        setCartCount(response.count);
      } else {
        // Count guest cart items
        const savedCart = localStorage.getItem('guestCart');
        if (savedCart) {
          const guestCartData = JSON.parse(savedCart);
          const totalQuantity = guestCartData.items?.reduce((sum: number, item: GuestCartItem) => sum + item.quantity, 0) || 0;
          setCartCount(totalQuantity);
        }
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error);
    }
  };

  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      // Use authenticated cart API
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
    } else {
      // Load guest cart from localStorage
      loadGuestCart();
    }
  }, [isAuthenticated, loadGuestCart]);

  // Load cart data on mount and when auth status changes
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCart();
      fetchCartCount();
    } else {
      // Load guest cart only
      loadGuestCart();
    }
  }, [isAuthenticated, user, refreshCart, loadGuestCart]);

  const addToCart = async (variantId: number, quantity: number = 1): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
      try {
        await cartAPI.addToCart(variantId, quantity);
        toast.success('Added to cart!');
        await refreshCart();
        return true;
      } catch (error: unknown) {
        const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to add to cart';
        toast.error(message);
        return false;
      }
    } else {
      // Guest cart logic - we need to fetch product variant details
      try {
        // For guest cart, we need to get product details first
        // Use the existing cartAPI for consistency but handle the auth error
        try {
          await cartAPI.addToCart(variantId, quantity);
          toast.success('Added to cart!');
          // This means user got authenticated in the meantime, refresh the whole cart
          await refreshCart();
          return true;
        } catch (authError) {
          // Auth failed, continue with guest cart logic
          // Fetch real product variant details
          let newItem: GuestCartItem;
          
          try {
            const variantData = await publicAPI.getProductVariant(variantId);
            
            newItem = {
              id: Date.now(), // Temporary ID for guest cart
              product_id: variantData.product_id,
              variant_id: variantId,
              product_name: variantData.product_name,
              price: variantData.final_price,
              quantity,
              total_price: (parseFloat(variantData.final_price) * quantity).toFixed(2),
              size: variantData.size || variantData.title?.split(' / ')[1] || 'One Size',
              color: variantData.color || variantData.title?.split(' / ')[0] || 'Default',
              color_code: variantData.color_code,
              image_url: variantData.image_url || variantData.thumbnail_url,
              thumbnail_url: variantData.thumbnail_url,
              creator_name: variantData.creator_name,
              source: variantData.source || 'unknown',
              shopify_variant_id: variantData.shopify_variant_id,
              printful_variant_id: variantData.printful_variant_id
            };
          } catch (variantError) {
            console.error('Failed to fetch variant details:', variantError);
            // Fallback to placeholder data if API fails
            newItem = {
              id: Date.now(),
              product_id: 0,
              variant_id: variantId,
              product_name: `Product Variant ${variantId}`,
              price: '25.00',
              quantity,
              total_price: (25.00 * quantity).toFixed(2),
              size: 'One Size',
              color: 'Default',
              source: 'unknown'
            };
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
          
          toast.success('Added to cart!');
          return true;
        }
      } catch (error) {
        toast.error('Failed to add to cart');
        return false;
      }
    }
  };

  const updateCartItem = async (cartItemId: number, quantity: number): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
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
        
        toast.success('Cart updated!');
        return true;
      } catch (error) {
        toast.error('Failed to update cart');
        return false;
      }
    }
  };

  const removeFromCart = async (cartItemId: number): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
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
    } else {
      // Guest cart logic
      try {
        const updatedItems = items.filter(item => item.id !== cartItemId);
        const newSummary = calculateSummary(updatedItems);
        
        setItems(updatedItems);
        setSummary(newSummary);
        setCartCount(updatedItems.reduce((sum, item) => sum + item.quantity, 0));
        saveGuestCart(updatedItems, newSummary);
        
        toast.success('Item removed from cart');
        return true;
      } catch (error) {
        toast.error('Failed to remove item');
        return false;
      }
    }
  };

  const clearCart = async (): Promise<boolean> => {
    if (isAuthenticated) {
      // Use authenticated cart API
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
        localStorage.removeItem('guestCart');
        
        toast.success('Cart cleared');
        return true;
      } catch (error) {
        toast.error('Failed to clear cart');
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