'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  min_price: number;
  max_price: number;
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
  const { isAuthenticated, user } = useAuth();

  const fetchWishlistCount = async () => {
    try {
      const response = await wishlistAPI.getWishlistCount();
      setWishlistCount(response.count);
    } catch (error) {
      console.error('Failed to fetch wishlist count:', error);
    }
  };

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      setWishlistCount(0);
      return;
    }
    
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setItems(response.items || []);
      setWishlistCount(response.count || 0);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      // Don't show toast error on initial load to avoid spam
      setItems([]);
      setWishlistCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch wishlist data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshWishlist();
    } else {
      // Clear wishlist data when user logs out
      setItems([]);
      setWishlistCount(0);
    }
  }, [isAuthenticated, user, refreshWishlist]);

  // Add page visibility listener to refresh wishlist when user returns
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isAuthenticated && user) {
        // Page became visible, refresh wishlist data
        refreshWishlist();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
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
      
      // Refresh the entire wishlist to get accurate data
      await refreshWishlist();
      
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
      
      // Refresh the entire wishlist to get accurate data
      await refreshWishlist();
      
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