'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { wishlistAPI } from '@/lib/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface WishlistItem {
  id: number;
  user_id: number;
  product_id: number;
  product_name: string;
  description: string;
  thumbnail_url: string;
  category: string;
  creator_id: number;
  creator_name: string;
  creator_username: string;
  creator?: {
    name: string;
    username: string;
  };
  min_price: number;
  max_price: number;
  price_range?: {
    min: string | number;
    max: string | number;
  };
  variant_count: number;
  created_at: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  wishlistCount: number;
  loading: boolean;
  addToWishlist: (productId: number) => Promise<boolean>;
  removeFromWishlist: (productId: number) => Promise<boolean>;
  clearWishlist: () => Promise<boolean>;
  isInWishlist: (productId: number) => boolean; // Changed to synchronous
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const { isAuthenticated, user } = useAuth();

  const refreshWishlist = useCallback(async (force = false) => {
    if (!isAuthenticated) {
      setItems([]);
      setWishlistCount(0);
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    if (!force && timeSinceLastFetch < 5000) {
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setItems(response.items || []);
      setWishlistCount(response.count || 0);
      lastFetchTimeRef.current = now;
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      setItems([]);
      setWishlistCount(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user) {
      refreshWishlist(true);
    } else {
      setItems([]);
      setWishlistCount(0);
      lastFetchTimeRef.current = 0;
    }
  }, [isAuthenticated, user, refreshWishlist]);

  useEffect(() => {
    let visibilityTimeout: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user) {
        clearTimeout(visibilityTimeout);
        visibilityTimeout = setTimeout(() => {
          refreshWishlist();
        }, 2000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(visibilityTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, user, refreshWishlist]);

  const addToWishlist = async (productId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return false;
    }

    try {
      await wishlistAPI.addToWishlist(productId);
      toast.success('Added to wishlist!');

      await refreshWishlist(true);

      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to add to wishlist';
      toast.error(message);
      return false;
    }
  };

  const removeFromWishlist = async (productId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to remove items');
      return false;
    }

    try {
      await wishlistAPI.removeFromWishlist(productId);
      toast.success('Removed from wishlist');

      await refreshWishlist(true);

      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to remove item';
      toast.error(message);
      return false;
    }
  };

  const clearWishlist = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to clear wishlist');
      return false;
    }

    try {
      await wishlistAPI.clearWishlist();
      toast.success('Wishlist cleared');
      
      // Clear state immediately since we know the result
      setItems([]);
      setWishlistCount(0);
      
      return true;
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to clear wishlist';
      toast.error(message);
      return false;
    }
  };

  const isInWishlist = (productId: number): boolean => {
    if (!isAuthenticated) return false;

    // Only use local state - no API calls needed since we have all wishlist data
    return items.some(item => item.product_id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        wishlistCount,
        loading,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}