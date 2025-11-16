'use client';

import { use, useEffect } from 'react';
import { useProductData } from '@/hooks/useProductData';
import { useVariantSelection } from '@/hooks/useVariantSelection';
import { useProductWishlist } from '@/hooks/useProductWishlist';
import { useProductCart } from '@/hooks/useProductCart';

import { EnhancedProductImageGallery } from '@/components/products/product-detail/EnhancedProductImageGallery';
import { EnhancedProductInfo } from '@/components/products/product-detail/EnhancedProductInfo';
import { EnhancedProductVariantSelector } from '@/components/products/product-detail/EnhancedProductVariantSelector';
import { EnhancedProductActions } from '@/components/products/product-detail/EnhancedProductActions';
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
    <div className="bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <ProductPageNavigation />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mt-8">
          {/* Left Column - Images */}
          <EnhancedProductImageGallery productName={product.name} images={images} />

          {/* Right Column - Product Info & Actions */}
          <div className="space-y-6">
            <EnhancedProductInfo
              productName={product.name}
              description={product.description}
              basePrice={product.base_price}
              selectedVariantPrice={selectedVariant?.price}
              category={product.category}
            />

            <EnhancedProductVariantSelector
              variants={product.variants}
              selectedVariant={selectedVariant}
              onVariantChange={setSelectedVariant}
              getVariantColorAndSize={getVariantColorAndSize}
              getUniqueColors={getUniqueColors}
              getAvailableSizes={getAvailableSizes}
              getCurrentVariant={getCurrentVariant}
              isVariantAvailable={(v) => isVariantAvailable(v, product.source)}
            />

            <EnhancedProductActions
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

            {/* Creator Info */}
            <div className="bg-white border-4 border-black rounded-2xl p-6">
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
