import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductVariant } from '@/lib/api';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalMarkup } from '@/contexts/GlobalMarkupContext';
import { ProductDetails } from './useProductData';
import toast from 'react-hot-toast';

export const useProductCart = (
  product: ProductDetails | null,
  selectedVariant: ProductVariant | null,
  activeColorImage?: string
) => {
  const { addToCart } = useGuestCart();
  const { isAuthenticated } = useAuth();
  const { calculateSellingPrice } = useGlobalMarkup();
  const router = useRouter();

  const handleAddToCart = useCallback(async (quantity: number) => {
    if (!selectedVariant || !product) {
      if (!isAuthenticated) {
        toast.error('Please login to add items to cart');
        router.push('/auth/login?redirect=/cart');
        return;
      }
      toast.error('Please select a variant');
      return;
    }

    console.log('🛒 Add to cart called for product:', product?.name, 'variant:', selectedVariant.id);

    try {
      const vCost = selectedVariant.cost || (selectedVariant.price ? parseFloat(String(selectedVariant.price)) / 1.35 : parseFloat(product.base_price?.toString() || '20.00'));
      
      // Determine the exact image for the selected variant/color
      const getResolvedColorImage = (): string => {
        if (activeColorImage && !activeColorImage.includes('placeholder')) {
          return activeColorImage;
        }
        if (selectedVariant?.image_url && !selectedVariant.image_url.includes('placeholder')) {
          return selectedVariant.image_url;
        }

        const vColor = (selectedVariant?.color || selectedVariant?.title?.split(' / ')[0] || '').toLowerCase().trim();
        if (vColor && vColor !== 'default' && product?.mockups && product.mockups.length > 0) {
          const matchingVariants = (product.variants || []).filter(v => {
            const c = (v.color || v.title?.split(' / ')[0] || '').toLowerCase().trim();
            return c === vColor;
          });
          const matchingIds = new Set(matchingVariants.flatMap(v => [v.id, (v as any).printify_variant_id].filter(Boolean)));
          
          const mockupMatch = product.mockups.find(m => {
            const ids = m.variant_ids || [];
            return ids.some((id: number) => matchingIds.has(id));
          });

          if (mockupMatch) {
            const url = (mockupMatch as any).permanent_url || (mockupMatch as any).url || (mockupMatch as any).src || (mockupMatch as any).image_url;
            if (url) return url;
          }
        }

        return product?.thumbnail_url || (Array.isArray(product?.images) ? product.images[0] : '') || '';
      };

      const resolvedColorImage = getResolvedColorImage();

      // Cache variant data for cart before adding to cart
      const variantCacheData = {
        product_id: product.id,
        product_name: product.name,
        cost: vCost,
        price: calculateSellingPrice(vCost).toString(),
        size: selectedVariant.size || selectedVariant.title?.split(' / ')[1] || 'One Size',
        color: selectedVariant.color || selectedVariant.title?.split(' / ')[0] || 'Default',
        color_code: selectedVariant.color_code || '#808080',
        image_url: resolvedColorImage,
        thumbnail_url: resolvedColorImage,
        creator_name: product.creator?.name || product.creator_name || 'Unknown',
        source: product.source || 'unknown',
        shopify_variant_id: selectedVariant.shopify_variant_id,
        printify_variant_id: selectedVariant.printify_variant_id,
        printful_variant_id: (selectedVariant as any).printful_variant_id || (product.source === 'printful' ? selectedVariant.id : undefined),
        printify_product_id: (product as any).printify_id || (product as any).printify_product_id,
        blueprint_id: (product as any).blueprint_id,
        print_provider_id: (product as any).print_provider_id
      };

      // Store in localStorage for cart image resolution
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`product_variant_${selectedVariant.id}`, JSON.stringify(variantCacheData));
        } catch (error) {
          console.warn('Failed to cache variant data:', error);
        }
      }

      // Add to GuestCart
      const success = await addToCart(selectedVariant.id, quantity);

      // Check if user is authenticated, redirect to login page with redirect=/cart
      if (!isAuthenticated) {
        toast.success(`${product.name} added! Please sign in to view your cart.`);
        router.push('/auth/login?redirect=/cart');
        return;
      }

      if (success) {
        toast.success(`${product.name} added to cart!`);
      } else {
        toast.error('Failed to add to cart. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart. Please try again.');
    }
  }, [selectedVariant, product, addToCart, isAuthenticated, calculateSellingPrice, router]);

  return {
    handleAddToCart
  };
};