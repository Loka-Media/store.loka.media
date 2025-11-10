'use client';

import { use, useEffect } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useVariantSelection } from '@/hooks/useVariantSelection';
import { useProductWishlist } from '@/hooks/useProductWishlist';
import { useProductCart } from '@/hooks/useProductCart';

import { ProductImageGallery } from '@/components/products/product-detail/ProductImageGallery';
import { ProductInfo } from '@/components/products/product-detail/ProductInfo';
import { ProductVariantSelector } from '@/components/products/product-detail/ProductVariantSelector';
import { ProductActions } from '@/components/products/product-detail/ProductActions';
import { ProductMeta } from '@/components/products/product-detail/ProductMeta';
import { ProductPageLoader } from '@/components/products/product-detail/ProductPageLoader';
import { ProductNotFound } from '@/components/products/product-detail/ProductNotFound';
import { ProductPageNavigation } from '@/components/products/product-detail/ProductPageNavigation';

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  
  const { product, loading, isVariantAvailable } = useProductData(slug);
  
  const {
    selectedVariant,
    setSelectedVariant,
    getVariantColorAndSize,
    getUniqueColors,
    getAvailableSizes,
    getCurrentVariant,
    initializeSelectedVariant
  } = useVariantSelection(product, isVariantAvailable);
  
  const { isWishlisted, handleWishlistToggle } = useProductWishlist(product);
  const { handleAddToCart } = useProductCart(product, selectedVariant);

  // Product fetching is now handled automatically by the hook
  
  useEffect(() => {
    initializeSelectedVariant();
  }, [initializeSelectedVariant]);

  if (loading) {
    return <ProductPageLoader />;
  }

  if (!product) {
    return <ProductNotFound />;
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [product.thumbnail_url || '/placeholder-product.svg'];

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProductPageNavigation />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImageGallery productName={product.name} images={images} />

          <div className="space-y-8">
            <ProductInfo
              productName={product.name}
              description={product.description}
              basePrice={product.base_price}
              selectedVariantPrice={selectedVariant?.price}
            />
            <ProductVariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              getVariantColorAndSize={getVariantColorAndSize}
              getUniqueColors={getUniqueColors}
              getAvailableSizes={getAvailableSizes}
              getCurrentVariant={getCurrentVariant}
              isVariantAvailable={(v) => isVariantAvailable(v, product.source)}
            />
            <ProductActions
              selectedVariant={selectedVariant}
              isVariantAvailable={
                selectedVariant
                  ? isVariantAvailable(selectedVariant, product.source)
                  : false
              }
              isWishlisted={isWishlisted}
              onAddToCart={handleAddToCart}
              onWishlistToggle={handleWishlistToggle}
            />

            <div className="pt-8 border-t border-gray-200">
              <ProductMeta
                creatorName={product.creator_name}
                creatorUsername={product.creator_username}
                category={product.category}
                tags={product.tags}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
