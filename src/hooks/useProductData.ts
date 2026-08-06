import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { productAPI, ProductVariant } from '@/lib/api';
import { parseProductSlug, createProductSlug } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface ProductDetails {
  id: number;
  creator_id: number;
  name: string;
  description: string;
  base_price: number;
  markup_percentage: number;
  category: string;
  tags: string[];
  thumbnail_url: string;
  images: string[];
  mockups?: Array<{
    permanent_url: string;
    variant_ids: number[];
    placement: string;
  }>;
  is_active: boolean;
  creator_name: string;
  creator_username: string;
  creator?: {
    name: string;
    username: string;
  };
  created_at: string;
  variants: ProductVariant[];
  source?: string;
  printify_blueprint_id?: number | null;
  printify_print_provider_id?: number | null;
}

export const useProductData = (slug: string) => {
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSlugRef = useRef<string>('');
  const hasInitialized = useRef<boolean>(false);

  const isVariantAvailable = useCallback((variant: ProductVariant, source?: string) => {
    const isPrintifyProduct = !!variant.printify_variant_id || source === 'printify';
    if (isPrintifyProduct) {
      return variant.available_for_sale !== false;
    }
    
    if (variant.available_for_sale !== undefined) {
      return variant.available_for_sale && (variant.inventory_quantity || 0) > 0;
    }
    if (variant.stock_status) {
      return variant.stock_status === 'in_stock';
    }
    return true;
  }, []);

  const fetchProduct = useCallback(async () => {
    // Prevent multiple calls for the same slug
    if (lastSlugRef.current === slug && hasInitialized.current) {
      return;
    }

    lastSlugRef.current = slug;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const parsedSlug = parseProductSlug(slug);
      const productId = parsedSlug ? parsedSlug.id : slug;

      const response = await productAPI.getProduct(productId);

      // Fix stringified array from backend
      if (typeof response.images === 'string') {
        try {
          response.images = JSON.parse(response.images);
        } catch (e) {
          response.images = [];
        }
      }

      if (typeof response.thumbnail_url === 'string' && response.thumbnail_url.startsWith('[')) {
        try {
          const parsed = JSON.parse(response.thumbnail_url);
          if (parsed.length) response.thumbnail_url = parsed[0];
        } catch (e) {}
      }

      setProduct(response);

      // Check if product is missing images — fetch from Printify in background to repair
      const hasImages = (
        (response.thumbnail_url && !String(response.thumbnail_url).includes('placeholder')) ||
        (Array.isArray(response.images) && response.images.some((i: any) => i && !String(i).includes('placeholder')))
      );

      const printifyProdId = response.printify_id || response.printify_product_id;
      const isValidPrintifyId = printifyProdId && /^[0-9a-fA-F]{24}$/.test(String(printifyProdId));

      // Check for blueprint ID stored incorrectly as printify_product_id (small integer like "15")
      const blueprintId = response.printify_blueprint_id
        || response.blueprint_id
        || (typeof response.printify_product_id === 'number' ? response.printify_product_id : null)
        || (typeof response.printify_product_id === 'string' && /^\d{1,5}$/.test(response.printify_product_id) ? parseInt(response.printify_product_id) : null);

      if (!hasImages) {
        if (isValidPrintifyId) {
          // Fetch real mockup images from Printify and patch DB
          console.log(`[Image Repair] Product ${response.id} has no images, fetching from Printify (${printifyProdId})...`);
          fetch(`/api/printify/products/${printifyProdId}`)
            .then(res => res.json())
            .then(data => {
              if (data?.success && data?.data) {
                const pd = data.data;
                const mockupUrls: string[] = (pd.mockups || [])
                  .map((m: any) => m.permanent_url || m.src || m.url)
                  .filter(Boolean);
                const imageUrls: string[] = (pd.images || [])
                  .map((i: any) => i.src || i.url || i)
                  .filter((u: string) => u && !u.includes('placeholder'));
                const allImages = mockupUrls.length > 0 ? mockupUrls : imageUrls;

                if (allImages.length > 0) {
                  console.log(`[Image Repair] Got ${allImages.length} images from Printify, updating product state`);
                  setProduct(prev => {
                    if (!prev) return null;
                    return { ...prev, thumbnail_url: allImages[0], images: allImages };
                  });
                  // Also patch DB so this is fixed for future loads
                  fetch('/api/printify/repair-images', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ product_id: response.id, printify_product_id: printifyProdId }),
                  }).catch(() => {/* non-fatal */});
                }
              }
            })
            .catch(err => {
              console.error('[Image Repair] Failed to fetch images from Printify:', err);
            });
        } else if (blueprintId) {
          // Fallback: use blueprint catalog images (base garment photos from Printify)
          console.log(`[Image Fallback] Product ${response.id} has no images, fetching blueprint ${blueprintId} catalog images...`);
          fetch(`/api/printify/catalog/${blueprintId}`)
            .then(res => res.json())
            .then(data => {
              const bpImages: string[] = (data?.data?.images || data?.images || []).filter(Boolean);
              if (bpImages.length > 0) {
                console.log(`[Image Fallback] Using ${bpImages.length} blueprint catalog images for product ${response.id}`);
                setProduct(prev => {
                  if (!prev) return null;
                  return { ...prev, thumbnail_url: bpImages[0], images: bpImages };
                });
              }
            })
            .catch(err => {
              console.error('[Image Fallback] Failed to fetch blueprint catalog images:', err);
            });
        }
      }


      // Trigger background real-time variant availability sync for Printify products
      if (response && response.source === 'printify' && isValidPrintifyId) {
        fetch(`/api/printify/products/${printifyProdId}`)
          .then(res => res.json())
          .then(data => {
            if (data?.success && data?.data?.variants) {
              const printifyVariants = data.data.variants;
              const availabilityMap = new Map<number, boolean>();
              printifyVariants.forEach((pv: any) => {
                availabilityMap.set(Number(pv.id), pv.isAvailable ?? pv.is_available);
              });

              setProduct(prevProduct => {
                if (!prevProduct) return null;
                const updatedVariants = prevProduct.variants.map(v => {
                  const variantPrintifyId = v.printify_variant_id || v.id;
                  const isAvailable = availabilityMap.get(Number(variantPrintifyId));
                  return {
                    ...v,
                    available_for_sale: isAvailable !== undefined ? isAvailable : v.available_for_sale
                  };
                });
                return {
                  ...prevProduct,
                  variants: updatedVariants
                };
              });
              console.log(`[Real-time Stock Sync] Synced ${printifyVariants.length} variants from Printify`);
            }
          })
          .catch(err => {
            console.error('Failed to sync real-time availability from Printify:', err);
          });
      } else if (!isValidPrintifyId) {
        console.warn(`[Real-time Stock Sync] Skipped background fetch: printify_id is missing or invalid (${printifyProdId})`);
      }

      if (!parsedSlug && response.name) {
        const correctSlug = createProductSlug(response.name, response.id);
        router.replace(`/products/${correctSlug}`);
        return;
      }

      return response;
    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Product not found');
      router.push('/products');
      return null;
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  // Auto-fetch when slug changes
  useEffect(() => {
    if (slug && slug !== lastSlugRef.current) {
      fetchProduct();
    }
  }, [slug, fetchProduct]);

  return {
    product,
    loading,
    fetchProduct,
    isVariantAvailable
  };
};