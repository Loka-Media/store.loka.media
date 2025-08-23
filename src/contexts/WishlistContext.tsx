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
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const response = await wishlistAPI.getWishlist();
      setItems(response.items);
      setWishlistCount(response.count);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch wishlist data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshWishlist();
      // Don't call fetchWishlistCount separately since refreshWishlist already updates count
    } else {
      // Clear wishlist data when user logs out
      setItems([]);
      setWishlistCount(0);
    }
  }, [isAuthenticated, user]); // Removed refreshWishlist from dependencies to prevent loop

  const addToWishlist = async (productId: number): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to wishlist');
      return false;
    }

    try {
      const response = await wishlistAPI.addToWishlist(productId);
      toast.success('Added to wishlist!');
      
      // Update local state instead of full refresh
      setWishlistCount(prev => prev + 1);
      
      // Add item to local wishlist for immediate UI updates
      // We'll add a basic wishlist item that will be replaced on next refresh
      setItems(prev => [...prev, {
        id: Date.now(), // temporary ID
        user_id: user?.id || 0,
        product_id: productId,
        product_name: `Product ${productId}`, // will be updated on next refresh
        description: '',
        thumbnail_url: '',
        category: '',
        creator_id: 0,
        creator_name: '',
        creator_username: '',
        min_price: 0,
        max_price: 0,
        variant_count: 1,
        created_at: new Date().toISOString()
      }]);
      
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
      
      // Update local state instead of full refresh
      setWishlistCount(prev => Math.max(0, prev - 1));
      setItems(prev => prev.filter(item => item.product_id !== productId));
      
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
      
      // Update local state instead of full refresh
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