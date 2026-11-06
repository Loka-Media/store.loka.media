import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWishlist, addPendingWishlistItem } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductWishlist = (product: ProductDetails | null) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addToWishlist, removeFromWishlist, isInWishlist, items: wishlistItems, wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Use cached data from context instead of making individual API calls
  useEffect(() => {
    if (product) {
      const inWishlist = isInWishlist(product.id);
      setIsWishlisted(inWishlist);
    } else {
      setIsWishlisted(false);
    }
  }, [product, isInWishlist, wishlistItems, wishlistCount]);

  const handleWishlistToggle = useCallback(async () => {
    if (!product) return;

    // If user is not logged in, add to pending wishlist and redirect to Sign In page
    if (!isAuthenticated) {
      if (!isWishlisted) {
        addPendingWishlistItem(product.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist! Redirecting to sign in...');
      }
      const currentUrl = typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : `/products/${product.id}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    try {
      setIsLoading(true);
      if (isWishlisted) {
        await removeFromWishlist(product.id);
        setIsWishlisted(false);
      } else {
        await addToWishlist(product.id);
        setIsWishlisted(true);
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