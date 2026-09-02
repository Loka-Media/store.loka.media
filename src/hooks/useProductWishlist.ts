import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist, addPendingWishlistItem } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductWishlist = (product: ProductDetails | null) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist, items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Use cached data from context instead of making individual API calls
  useEffect(() => {
    if (product && isAuthenticated) {
      const inWishlist = isInWishlist(product.id);
      setIsWishlisted(inWishlist);
    } else {
      setIsWishlisted(false);
    }
  }, [product, isAuthenticated, isInWishlist, wishlistItems]); // Watch wishlistItems for changes

  const handleWishlistToggle = useCallback(async () => {
    if (!product) return;
    if (!isAuthenticated) {
      addPendingWishlistItem(product.id);
      toast.success('Product saved! Please sign in to view your wishlist');
      router.push('/auth/login?redirect=/wishlist');
      return;
    }

    try {
      setIsLoading(true);
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        // State will be updated automatically by useEffect watching wishlistItems
      } else {
        await addToWishlist(product.id);
        // State will be updated automatically by useEffect watching wishlistItems
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [product, isAuthenticated, isWishlisted, removeFromWishlist, addToWishlist, router]);

  return {
    isWishlisted,
    isLoading,
    handleWishlistToggle
  };
};