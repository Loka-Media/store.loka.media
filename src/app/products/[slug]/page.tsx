'use client';

import { use, useEffect } from 'react';
import { Shield, Truck, Package } from 'lucide-react';
import { useProductData } from '@/hooks/useProductData';
import { useVariantSelection } from '@/hooks/useVariantSelection';
import { useProductWishlist } from '@/hooks/useProductWishlist';
import { useProductCart } from '@/hooks/useProductCart';

import { EnhancedProductImageGallery } from '@/components/products/product-detail/EnhancedProductImageGallery';
import { EnhancedProductInfo, EnhancedProductDescription } from '@/components/products/product-detail/EnhancedProductInfo';
import { EnhancedProductVariantSelector } from '@/components/products/product-detail/EnhancedProductVariantSelector';
import { EnhancedProductActions } from '@/components/products/product-detail/EnhancedProductActions';
import { FeatureCard } from '@/components/products/product-detail/FeatureCard';
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
    <div className="bg-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 lg:py-8">
        <ProductPageNavigation />

        {/* 4-Section Layout: Top Left, Top Right, Bottom Left, Bottom Right */}

        {/* TOP ROW - With white gradient border */}
        <div className="gradient-border-white-top p-3 sm:p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
          {/* TOP LEFT - Image Gallery */}
          <div>
            <EnhancedProductImageGallery productName={product.name} images={images} />
          </div>

          {/* TOP RIGHT - Product Info & Actions */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <EnhancedProductInfo
              productName={product.name}
              description={product.description}
              basePrice={product.base_price}
              selectedVariantPrice={selectedVariant?.price}
              category={product.category}
              creatorName={product.creator_name}
              markupPercentage={product.markup_percentage}
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
          </div>
        </div>

        {/* BOTTOM ROW - With white gradient border (bottom) */}
        <div className="gradient-border-white-bottom p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {/* BOTTOM LEFT - Feature Cards */}
            <div className="gradient-border-white-top p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <FeatureCard
                  iconSvg={
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path opacity="0.984" fillRule="evenodd" clipRule="evenodd" d="M35.0832 6.39852C36.8489 6.28918 38.4896 6.68761 40.0051 7.59383C41.8291 9.27717 43.6104 11.0115 45.3488 12.797C47.7395 12.8438 50.1301 12.8907 52.5207 12.9376C55.7493 13.4007 57.7884 15.2053 58.6379 18.3516C58.8164 21.0175 58.91 23.6894 58.9192 26.3673C60.5598 28.0079 62.2004 29.6485 63.841 31.2892C65.2535 33.2419 65.6753 35.3982 65.1067 37.7579C64.833 38.6801 64.4111 39.5239 63.841 40.2892C62.2004 41.9298 60.5598 43.5704 58.9192 45.211C60.6016 55.8566 56.1251 60.3801 45.4895 58.7814C43.6145 60.5627 41.7394 62.3438 39.8645 64.1251C37.2394 65.5314 34.6145 65.5314 31.9895 64.1251C30.1145 62.3438 28.2394 60.5627 26.3645 58.7814C15.7243 60.3755 11.2477 55.8521 12.9348 45.211C11.1025 43.4257 9.32123 41.5975 7.59101 39.7267C6.07011 36.8225 6.21073 34.01 8.01288 31.2892C9.65351 29.6485 11.2941 28.0079 12.9348 26.3673C12.9816 23.9298 13.0285 21.4922 13.0754 19.0548C13.6031 15.9022 15.4078 13.91 18.4894 13.0782C21.156 12.9018 23.8279 12.8081 26.5051 12.797C28.2435 11.0115 30.0248 9.27717 31.8488 7.59383C32.8677 6.98139 33.9458 6.58295 35.0832 6.39852ZM34.0988 18.7735C41.4427 18.402 47.0442 21.3081 50.9035 27.4923C54.3961 34.5659 53.693 41.1752 48.7941 47.3204C43.62 52.6396 37.456 54.2567 30.302 52.172C23.6555 49.5556 19.8352 44.7041 18.841 37.6173C18.4426 30.3271 21.3254 24.7724 27.4895 20.9532C29.5741 19.813 31.7773 19.0864 34.0988 18.7735Z" fill="url(#paint0_linear_1353_2169)"/>
                      <path opacity="0.973" fillRule="evenodd" clipRule="evenodd" d="M34.3815 23.1323C41.233 22.8414 45.8501 25.8881 48.233 32.2729C49.6363 38.4846 47.7379 43.383 42.5377 46.9682C36.7016 49.8975 31.3814 49.171 26.5768 44.7885C22.6304 40.0176 22.0679 34.8613 24.8893 29.3198C27.1169 25.8267 30.281 23.7641 34.3815 23.1323ZM42.3971 29.1792C42.1315 29.2948 41.8502 29.4119 41.5533 29.5307C39.3767 32.0572 37.2674 34.6353 35.2252 37.2651C35.0846 37.3589 34.944 37.3589 34.8033 37.2651C33.293 35.7542 31.6993 34.348 30.0221 33.0464C27.7977 32.8804 26.9306 33.8881 27.4205 36.0698C29.5075 38.2505 31.6872 40.3364 33.9596 42.3276C34.896 42.7917 35.7632 42.6744 36.5612 41.976C39.3327 38.7829 42.0516 35.5485 44.7174 32.2729C45.0577 30.4309 44.2843 29.3997 42.3971 29.1792Z" fill="url(#paint1_linear_1353_2169)"/>
                      <defs>
                        <linearGradient id="paint0_linear_1353_2169" x1="35.9492" y1="6.38086" x2="35.9492" y2="65.1798" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FB1FFF"/>
                          <stop offset="1" stopColor="#500851"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_1353_2169" x1="35.9027" y1="23.1133" x2="35.9027" y2="48.7286" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FB1FFF"/>
                          <stop offset="1" stopColor="#500851"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  }
                  color="pink"
                  title="Quality Guaranteed"
                  subtitle="Premium materials"
                />
                <FeatureCard
                  iconSvg={
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <g clipPath="url(#clip0_1353_2181)">
                        <path opacity="0.994" fillRule="evenodd" clipRule="evenodd" d="M71.9297 34.3819C71.9297 39.3975 71.9297 44.4131 71.9297 49.4287C71.6745 49.9883 71.2526 50.3867 70.6641 50.6241C69.1649 50.6944 67.6648 50.7178 66.1641 50.6944C65.388 54.2125 63.2318 56.3454 59.6953 57.0928C55.8173 57.556 52.8877 56.1263 50.9062 52.8037C50.595 52.1282 50.3841 51.4251 50.2734 50.6944C43.1484 50.6944 36.0235 50.6944 28.8984 50.6944C28.1223 54.2125 25.9661 56.3454 22.4297 57.0928C18.5517 57.556 15.622 56.1263 13.6406 52.8037C13.3294 52.1282 13.1185 51.4251 13.0078 50.6944C11.3197 50.7178 9.63217 50.6944 7.94531 50.6241C7.35937 50.4131 6.96094 50.0147 6.75 49.4287C6.6797 47.0385 6.65626 44.6479 6.67969 42.2569C4.85096 42.2803 3.02283 42.2569 1.19531 42.1865C0.60677 41.9492 0.184895 41.5508 -0.0703125 40.9912C-0.0703125 40.4287 -0.0703125 39.8662 -0.0703125 39.3037C0.184895 38.7442 0.60677 38.3458 1.19531 38.1084C7.80469 38.0616 14.4141 38.0146 21.0234 37.9678C22.2538 37.8391 22.9569 37.1595 23.1328 35.9287C22.9569 34.698 22.2538 34.0183 21.0234 33.8897C14.4141 33.8428 7.80469 33.7959 1.19531 33.749C0.60677 33.5117 0.184895 33.1133 -0.0703125 32.5537C-0.0703125 31.9912 -0.0703125 31.4287 -0.0703125 30.8662C0.184895 30.3067 0.60677 29.9083 1.19531 29.6709C5.74218 29.6241 10.2891 29.5771 14.8359 29.5303C16.6641 29.0371 17.1796 27.9356 16.3828 26.2256C16.1679 26.0342 15.9335 25.8701 15.6797 25.7334C11.5595 25.5529 7.43453 25.4591 3.30469 25.4522C2.12134 24.8407 1.7229 23.8798 2.10938 22.5694C2.32031 21.9834 2.71875 21.585 3.30469 21.374C4.42872 21.3037 5.55372 21.2804 6.67969 21.3037C6.65626 19.475 6.6797 17.6469 6.75 15.8194C6.96094 15.2334 7.35937 14.835 7.94531 14.624C20.9765 14.5537 34.0078 14.5302 47.0391 14.5537C47.0156 18.7728 47.0391 22.9915 47.1094 27.21C47.2265 28.4521 47.9063 29.1319 49.1484 29.249C54.8672 29.2959 60.5859 29.3428 66.3047 29.3897C69.2305 29.903 71.1055 31.5671 71.9297 34.3819ZM20.0391 45.3506C22.3086 45.0903 23.8321 46.0279 24.6094 48.1631C24.9349 50.3683 24.0677 51.8916 22.0078 52.7334C19.748 53.0922 18.1776 52.2251 17.2969 50.1319C16.9386 47.7975 17.8526 46.2036 20.0391 45.3506ZM57.3047 45.3506C59.5742 45.0903 61.0978 46.0279 61.875 48.1631C62.2005 50.3683 61.3333 51.8916 59.2734 52.7334C57.0136 53.0922 55.4432 52.2251 54.5625 50.1319C54.2042 47.7975 55.1183 46.2036 57.3047 45.3506Z" fill="url(#paint0_linear_1353_2181)"/>
                        <path opacity="0.982" fillRule="evenodd" clipRule="evenodd" d="M51.2578 14.9766C55.2659 15.7743 58.383 17.8837 60.6094 21.3047C61.418 22.4997 62.1914 23.7184 62.9297 24.9609C59.0401 25.1016 55.1496 25.1484 51.2578 25.1016C51.2578 21.7266 51.2578 18.3516 51.2578 14.9766Z" fill="url(#paint1_linear_1353_2181)"/>
                      </g>
                      <defs>
                        <linearGradient id="paint0_linear_1353_2181" x1="35.9297" y1="14.5449" x2="35.9297" y2="57.1778" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FF6D1F"/>
                          <stop offset="1" stopColor="#772C05"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_1353_2181" x1="57.0938" y1="14.9766" x2="57.0938" y2="25.1191" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FF6D1F"/>
                          <stop offset="1" stopColor="#772C05"/>
                        </linearGradient>
                        <clipPath id="clip0_1353_2181">
                          <rect width="72" height="72" fill="white"/>
                        </clipPath>
                      </defs>
                    </svg>
                  }
                  color="orange"
                  title="Fast Shipping"
                  subtitle="5-7 business days"
                />
                <FeatureCard
                  iconSvg={
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path opacity="0.956" fillRule="evenodd" clipRule="evenodd" d="M33.2578 0.0703125C33.5132 1.61096 33.6303 3.2047 33.6094 4.85156C33.7265 4.96875 33.8438 5.08594 33.9609 5.20312C43.8206 5.94944 52.0002 10.0041 58.5 17.3672C65.8301 26.7358 67.9395 37.1888 64.8281 48.7266C60.7354 60.9289 52.415 68.4523 39.8672 71.2969C28.1429 73.1856 18.182 69.8809 9.98438 61.3828C8.33286 59.4499 6.90318 57.3639 5.69531 55.125C5.71875 55.0547 5.74218 54.9844 5.76562 54.9141C10.965 63.3195 18.4884 68.2647 28.3359 69.75C41.6211 70.9712 51.6289 65.8852 58.3594 54.4922C63.3078 44.821 63.1204 35.2585 57.7969 25.8047C52.2803 17.3489 44.4521 12.802 34.3125 12.1641C33.9753 12.2285 33.741 12.416 33.6094 12.7266C33.5858 14.1352 33.5154 15.5415 33.3984 16.9453C28.9911 14.1794 24.6317 11.3435 20.3203 8.4375C24.6659 5.68008 28.9783 2.89102 33.2578 0.0703125Z" fill="url(#paint0_linear_1353_2193)"/>
                      <path opacity="0.959" fillRule="evenodd" clipRule="evenodd" d="M31.8516 21.8672C33.8584 22.9177 35.8272 24.0427 37.7578 25.2422C31.7197 28.7653 25.6493 32.2341 19.5469 35.6484C17.6393 34.5891 15.7409 33.5109 13.8516 32.4141C19.8605 28.8948 25.8604 25.3792 31.8516 21.8672Z" fill="url(#paint1_linear_1353_2193)"/>
                      <path opacity="0.945" fillRule="evenodd" clipRule="evenodd" d="M39.0234 26.0859C40.3671 26.7112 41.6796 27.4143 42.9609 28.1953C43.1484 28.2891 43.1484 28.3828 42.9609 28.4766C36.9609 31.8984 30.961 35.3204 24.9609 38.7422C23.6721 38.0277 22.4065 37.2776 21.1641 36.4922C27.1197 33.0196 33.0728 29.5508 39.0234 26.0859Z" fill="url(#paint2_linear_1353_2193)"/>
                      <path opacity="0.958" fillRule="evenodd" clipRule="evenodd" d="M44.3672 29.1797C44.721 29.2155 45.0492 29.3328 45.3516 29.5312C46.8755 30.4574 48.4224 31.348 49.9922 32.2031C50.1796 32.3438 50.1796 32.4844 49.9922 32.625C44.1328 35.9532 38.2735 39.2812 32.4141 42.6094C32.2266 42.7032 32.039 42.7032 31.8516 42.6094C30.0703 41.5782 28.2891 40.5468 26.5078 39.5156C32.4697 36.0665 38.423 32.6212 44.3672 29.1797Z" fill="url(#paint3_linear_1353_2193)"/>
                      <path opacity="0.982" fillRule="evenodd" clipRule="evenodd" d="M13.1504 33.6797C15.0792 34.7027 16.9776 35.7809 18.8457 36.9141C18.8925 39.1641 18.9395 41.4141 18.9863 43.6641C19.5114 44.1495 20.0973 44.5479 20.7441 44.8594C22.0324 45.5268 23.298 46.2299 24.541 46.9688C24.9882 47.1144 25.3398 46.9973 25.5957 46.6172C25.6425 44.6484 25.6895 42.6797 25.7363 40.7109C27.6343 41.7535 29.5093 42.8317 31.3613 43.9453C31.4551 51.0234 31.4551 58.1016 31.3613 65.1797C25.3264 61.7288 19.303 58.26 13.291 54.7734C13.1504 47.7428 13.1035 40.7115 13.1504 33.6797Z" fill="url(#paint4_linear_1353_2193)"/>
                      <path opacity="0.976" fillRule="evenodd" clipRule="evenodd" d="M50.6953 33.6797C50.8828 37.1237 50.9766 40.6159 50.9766 44.1562C50.9531 47.6484 50.9298 51.1407 50.9063 54.6328C44.9293 58.137 38.9293 61.6058 32.9063 65.0391C32.8125 58.0078 32.8125 50.9766 32.9063 43.9453C38.8596 40.5426 44.7894 37.1208 50.6953 33.6797Z" fill="url(#paint5_linear_1353_2193)"/>
                      <path opacity="0.914" fillRule="evenodd" clipRule="evenodd" d="M20.3222 37.7578C21.6149 38.4396 22.9039 39.1427 24.1894 39.8672C24.2597 41.601 24.2832 43.3353 24.2597 45.0703C22.9855 44.4565 21.7198 43.8002 20.4628 43.1016C20.3223 41.3228 20.2755 39.5415 20.3222 37.7578Z" fill="url(#paint6_linear_1353_2193)"/>
                      <defs>
                        <linearGradient id="paint0_linear_1353_2193" x1="35.9571" y1="0.0703125" x2="35.9571" y2="71.812" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <linearGradient id="paint1_linear_1353_2193" x1="25.8047" y1="21.8672" x2="25.8047" y2="35.6484" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <linearGradient id="paint2_linear_1353_2193" x1="32.1328" y1="26.0859" x2="32.1328" y2="38.7422" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <linearGradient id="paint3_linear_1353_2193" x1="38.3203" y1="29.1797" x2="38.3203" y2="42.6797" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <linearGradient id="paint4_linear_1353_2193" x1="22.2822" y1="33.6797" x2="22.2822" y2="65.1797" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <linearGradient id="paint5_linear_1353_2193" x1="41.9063" y1="33.6797" x2="41.9063" y2="65.0391" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                        <linearGradient id="paint6_linear_1353_2193" x1="22.2866" y1="37.7578" x2="22.2866" y2="45.0703" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#5EC900"/>
                          <stop offset="1" stopColor="#224801"/>
                        </linearGradient>
                      </defs>
                    </svg>
                  }
                  color="green"
                  title="Easy Returns"
                  subtitle="30-day guarantee"
                />
              </div>
            </div>

            {/* BOTTOM RIGHT - Product Description & Tags */}
            <div className="gradient-border-white-top p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="space-y-3 sm:space-y-4 md:space-y-5">
                <div>
                  <div className="text-sm sm:text-base font-bold text-gray-300 mb-2 sm:mb-3">Product Description</div>
                  <EnhancedProductDescription description={product.description} />
                </div>

                {/* Tags and Metadata */}
                {product.tags && product.tags.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-gray-400 mb-2">Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags.map((tag) => (
                        <span key={tag} className="bg-white/10 border border-white/10 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-lg">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
