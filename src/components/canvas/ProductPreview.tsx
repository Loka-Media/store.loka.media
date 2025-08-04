/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
// components/canvas/ProductPreview.jsx
"use client";

import Image from "next/image";
import { useMemo } from "react";

// Interfaces for better type safety
interface ProductVariant {
  id: number;
  size: string;
  color: string;
  color_code: string;
  price: string;
  in_stock: boolean;
  image: string;
}

interface ProductData {
  id: number;
  title: string;
  model: string;
  brand: string;
  type_name: string;
  type: string;
  image: string;
  variants?: ProductVariant[];
  variant_count?: number;
}

interface DesignFile {
  id: string | number;
  filename: string;
  placement: "front" | "back";
  url: string;
  position: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

interface ProductForm {
  name: string;
  description: string;
  markupPercentage: string;
  category: string;
  tags: string[];
}

interface ProductPreviewProps {
  selectedProduct:  any;
  productForm: ProductForm;
  designFiles: any[];
  selectedVariants: number[];
  loading: boolean;
}

const ProductPreview: React.FC<ProductPreviewProps> = ({
  selectedProduct,
  productForm,
  designFiles,
  selectedVariants,
  loading,
}) => {
  if (!selectedProduct) return null;

  const calculatePriceRange = (): {
    minPrice: number;
    maxPrice: number;
  } | null => {
    if (
      !selectedProduct.variants ||
      selectedVariants.length === 0 ||
      !productForm.markupPercentage
    ) {
      return null;
    }

    const markup = parseFloat(productForm.markupPercentage) / 100;

    // Check if markup is a valid number
    if (isNaN(markup)) return null;

    const selectedVariantData = selectedProduct.variants.filter((v: { id: number; }) =>
      selectedVariants.includes(v.id)
    );

    // Ensure we have variants to calculate with
    if (selectedVariantData.length === 0) return null;

    const prices = selectedVariantData.map(
      (v: { price: string; }) => parseFloat(v.price) * (1 + markup)
    );
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    return { minPrice, maxPrice };
  };

  // Memoize the price range calculation to prevent re-computation on every render
  const priceRange = useMemo(calculatePriceRange, [
    selectedProduct.variants,
    selectedVariants,
    productForm.markupPercentage,
  ]);

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-8">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Product Preview
      </h3>

      <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-4">
        {selectedProduct.image && (
          <Image
            src={selectedProduct.image}
            alt={
              selectedProduct.title || selectedProduct.model || "Product image"
            }
            fill
            className="object-cover"
            priority // Good for important, visible images
          />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="font-semibold text-gray-900">
            {productForm.name || selectedProduct.title || selectedProduct.model}
          </h4>
          <p className="text-sm text-gray-600">
            {selectedProduct.brand} -{" "}
            {selectedProduct.type_name || selectedProduct.type}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Design Files:</span>
            <span className="font-medium">{designFiles.length}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Available Variants:</span>
            <span className="font-medium">
              {selectedProduct.variants?.length || 0} /{" "}
              {selectedProduct.variant_count || "Unknown"}
            </span>
          </div>

          {selectedVariants.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Selected Variants:</span>
              <span className="font-medium text-indigo-600">
                {selectedVariants.length}
              </span>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="space-y-1">
          {loading && (
            <p className="text-xs text-blue-600">🔄 Loading variants...</p>
          )}
          {!loading &&
            (!selectedProduct.variants ||
              selectedProduct.variants.length === 0) && (
              <p className="text-xs text-orange-600">
                ⚠️ No variants loaded - product creation may fail
              </p>
            )}
          {!loading &&
            selectedProduct.variants &&
            selectedProduct.variants.length > 0 && (
              <div>
                <p className="text-xs text-green-600">
                  ✅ {selectedProduct.variants.length} variants loaded
                  successfully
                </p>
                {selectedVariants.length > 0 && (
                  <p className="text-xs text-indigo-600">
                    🎯 {selectedVariants.length} variants selected for product
                  </p>
                )}
              </div>
            )}
        </div>

        {/* Price Display */}
        {priceRange && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-lg font-bold text-gray-900">
              {priceRange.minPrice === priceRange.maxPrice
                ? `$${priceRange.minPrice.toFixed(2)}`
                : `$${priceRange.minPrice.toFixed(
                    2
                  )} - $${priceRange.maxPrice.toFixed(2)}`}
            </p>
            <p className="text-xs text-gray-500">
              Printful cost + {productForm.markupPercentage}% markup
            </p>
          </div>
        )}

        {/* Design Placements */}
        {designFiles.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Design Placements:
            </p>
            <div className="space-y-1">
              {designFiles.map((file) => (
                <div
                  key={`${file.id}-${file.placement}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-gray-600 capitalize">
                    {file.placement}:
                  </span>
                  <span className="text-gray-800 truncate ml-2 max-w-24">
                    {file.filename}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category and Tags */}
        {(productForm.category || productForm.tags.length > 0) && (
          <div className="pt-3 border-t border-gray-200">
            {productForm.category && (
              <div className="mb-2">
                <span className="text-xs text-gray-600">Category: </span>
                <span className="text-xs font-medium text-gray-800 capitalize">
                  {productForm.category}
                </span>
              </div>
            )}
            {productForm.tags.length > 0 && (
              <div>
                <span className="text-xs text-gray-600">Tags: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {productForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPreview;
