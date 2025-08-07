/* eslint-disable @typescript-eslint/no-explicit-any */
// components/canvas/steps/FinalizeStep.jsx
"use client";

import { useState } from "react";
import { Eye, Loader2 } from "lucide-react";
import RegionalSelector, { RegionalSettings } from "../ui/RegionalSelector";

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
  variants: ProductVariant[];
}

interface DesignFile {
  id: string | number;
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
  regionalSettings: RegionalSettings;
}

interface MockupPreviewProps {
  mockupUrl: string | null;
  onGenerateMockup: () => void;
  isGenerating: boolean;
}

interface ProductFormFieldsProps {
  productForm: ProductForm;
  setProductForm: React.Dispatch<React.SetStateAction<ProductForm>>;
}

interface PricingPreviewProps {
  selectedProduct: ProductData | null;
  selectedVariants: number[];
  markupPercentage: string;
}

interface FinalizeStepProps {
  productForm: ProductForm;
  setProductForm: React.Dispatch<React.SetStateAction<ProductForm>>;
  selectedProduct: any;
  selectedVariants: number[];
  designFiles: any[];
  mockupUrl: string | null;
  onGenerateMockup: () => void;
  isGeneratingMockup: boolean;
  onPrevStep: () => void;
}

const MockupPreview: React.FC<MockupPreviewProps> = ({
  mockupUrl,
  onGenerateMockup,
  isGenerating,
}) => {
  return (
    <div className="mb-6">
      <h4 className="text-md font-medium text-gray-900 mb-3">Product Mockup</h4>
      {mockupUrl ? (
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
          {/* We use a standard img tag here since the mockup URL is likely an external resource */}
          <img
            src={mockupUrl}
            alt="Product Mockup"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
          <div className="text-center">
            <Eye className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-3">
              Generate a mockup to preview your design
            </p>
            <button
              onClick={onGenerateMockup}
              disabled={isGenerating}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Generate Mockup
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductFormFields: React.FC<ProductFormFieldsProps> = ({
  productForm,
  setProductForm,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label
          htmlFor="product-name"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Product Name *
        </label>
        <input
          type="text"
          id="product-name"
          value={productForm.name}
          onChange={(e) =>
            setProductForm((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          placeholder="Enter product name"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={productForm.description}
          onChange={(e) =>
            setProductForm((prev) => ({ ...prev, description: e.target.value }))
          }
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          placeholder="Describe your product"
        />
      </div>

      <div>
        <label
          htmlFor="markup-percentage"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Markup Percentage (%)
        </label>
        <input
          type="number"
          id="markup-percentage"
          min="0"
          max="1000"
          value={productForm.markupPercentage}
          onChange={(e) =>
            setProductForm((prev) => ({
              ...prev,
              markupPercentage: e.target.value,
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          placeholder="30"
        />
        <p className="text-xs text-gray-500 mt-1">
          This markup will be added to each variant&apos;s Printful cost to
          determine your selling price.
        </p>
      </div>

      <div>
        <label
          htmlFor="category"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Category
        </label>
        <select
          id="category"
          value={productForm.category}
          onChange={(e) =>
            setProductForm((prev) => ({ ...prev, category: e.target.value }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
        >
          <option value="">Select category</option>
          <option value="apparel">Apparel</option>
          <option value="accessories">Accessories</option>
          <option value="home-living">Home & Living</option>
          <option value="bags">Bags</option>
          <option value="drinkware">Drinkware</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="tags"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Tags (comma separated)
        </label>
        <input
          type="text"
          id="tags"
          value={productForm.tags.join(", ")}
          onChange={(e) =>
            setProductForm((prev) => ({
              ...prev,
              tags: e.target.value
                .split(",")
                .map((tag) => tag.trim())
                .filter(Boolean),
            }))
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
          placeholder="casual, summer, trendy"
        />
      </div>
    </div>
  );
};

const PricingPreview: React.FC<PricingPreviewProps> = ({
  selectedProduct,
  selectedVariants,
  markupPercentage,
}) => {
  if (
    !selectedProduct?.variants ||
    selectedVariants.length === 0 ||
    !markupPercentage
  ) {
    return null;
  }

  const selectedVariantData = selectedProduct.variants.filter((v) =>
    selectedVariants.includes(v.id)
  );
  const markup = parseFloat(markupPercentage) / 100;

  if (isNaN(markup)) return null;

  const prices = selectedVariantData.map(
    (v) => parseFloat(v.price) * (1 + markup)
  );
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice =
    prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return (
    <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
      <h4 className="font-medium text-indigo-900 mb-3">Pricing Preview</h4>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-indigo-700">Price Range:</span>
          <div className="font-medium text-indigo-900">
            {minPrice === maxPrice
              ? `$${minPrice.toFixed(2)}`
              : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`}
          </div>
        </div>
        <div>
          <span className="text-indigo-700">Avg. Price:</span>
          <div className="font-medium text-indigo-900">
            ${avgPrice.toFixed(2)}
          </div>
        </div>
        <div>
          <span className="text-indigo-700">Markup:</span>
          <div className="font-medium text-indigo-900">{markupPercentage}%</div>
        </div>
      </div>
    </div>
  );
};

const FinalizeStep: React.FC<FinalizeStepProps> = ({
  productForm,
  setProductForm,
  selectedProduct,
  selectedVariants,
  designFiles,
  mockupUrl,
  onGenerateMockup,
  isGeneratingMockup,
  onPrevStep,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        p
      </h3>

      <MockupPreview
        mockupUrl={mockupUrl}
        onGenerateMockup={onGenerateMockup}
        isGenerating={isGeneratingMockup}
      />

      <ProductFormFields
        productForm={productForm}
        setProductForm={setProductForm}
      />

      {/* Regional Settings */}
      <div className="mt-8">
        <RegionalSelector
          value={productForm.regionalSettings}
          onChange={(settings) =>
            setProductForm((prev) => ({
              ...prev,
              regionalSettings: settings,
            }))
          }
          showAdvanced={true}
        />
      </div>

      <PricingPreview
        selectedProduct={selectedProduct}
        selectedVariants={selectedVariants}
        markupPercentage={productForm.markupPercentage}
      />

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onPrevStep}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Variants
        </button>
      </div>
    </div>
  );
};

export default FinalizeStep;
