import { useState, useCallback, useEffect } from 'react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductWishlist = (product: ProductDetails | null) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist, items: wishlistItems } = useWishlist();
  const { isAuthenticated } = useAuth();

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
      toast.error('Please login to manage wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        // State will be updated automatically by useEffect watching wishlistItems
      } else {
        await addToWishlist(product.id);
        // State will be updated automatically by useEffect watching wishlistItems
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  }, [product, isAuthenticated, isWishlisted, removeFromWishlist, addToWishlist]);

  return {
    isWishlisted,
    handleWishlistToggle
  };
};