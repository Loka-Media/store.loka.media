import { useState, useCallback, useEffect } from 'react';
import { wishlistAPI } from '@/lib/api';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductWishlist = (product: ProductDetails | null) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addToWishlist, removeFromWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();

  const checkWishlistStatus = useCallback(async () => {
    if (!product || !isAuthenticated) return;
    try {
      const response = await wishlistAPI.isInWishlist(product.id);
      setIsWishlisted(response.isInWishlist);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  }, [product, isAuthenticated]);

  const handleWishlistToggle = useCallback(async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.error('Please login to manage wishlist');
      return;
    }
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist ❤️');
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      toast.error('Failed to update wishlist');
    }
  }, [product, isAuthenticated, isWishlisted, removeFromWishlist, addToWishlist]);

  useEffect(() => {
    if (product && isAuthenticated) {
      checkWishlistStatus();
    }
  }, [product, isAuthenticated, checkWishlistStatus]);

  return {
    isWishlisted,
    handleWishlistToggle
  };
};