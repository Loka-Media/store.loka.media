/* eslint-disable @typescript-eslint/no-explicit-any */
// components/canvas/steps/VariantsStep.jsx
'use client';

import Image from 'next/image';
import { Fragment } from 'react';

// Interfaces for better type safety
interface ProductVariant {
  id: number;
  size: string;
  color: string;
  color_code: string;
  price: string; // Storing as string to handle currency from an API, will need to parse to float for calculations
  in_stock: boolean;
  image: string;
}

interface ProductData {
  id: number;
  title: string;
  variants: ProductVariant[];
}

interface VariantCardProps {
  variant: ProductVariant;
  isSelected: boolean;
  onToggle: (variantId: number) => void;
}

interface VariantsSummaryProps {
  selectedProduct: ProductData | null;
  selectedVariants: number[];
}

interface NoVariantsMessageProps {
  onPrevStep: () => void;
}

interface VariantsStepProps {
  selectedProduct:any;
  selectedVariants: number[];
  setSelectedVariants: (updater: (prev: number[]) => number[]) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
}

const VariantCard: React.FC<VariantCardProps> = ({ variant, isSelected, onToggle }) => {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onToggle(variant.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded border-2 flex items-center justify-center"
            style={{ borderColor: isSelected ? '#6366f1' : '#d1d5db' }}
          >
            {isSelected && (
              <div className="w-2 h-2 bg-indigo-600 rounded"></div>
            )}
          </div>
          <span className="text-sm font-medium text-gray-900">
            {variant.size}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          <div>Cost: ${variant.price}</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 mb-2">
        <div
          className="w-6 h-6 rounded-full border border-gray-300"
          style={{ backgroundColor: variant.color_code }}
          title={variant.color}
        ></div>
        <span className="text-sm text-gray-600">{variant.color}</span>
      </div>
      
      <div className="text-xs text-gray-600 space-y-1">
        <div>Production: {variant.in_stock ? '✅ In Stock' : '❌ Out of Stock'}</div>
      </div>
      
      <div className="mt-2">
        <div className="w-full h-20 bg-gray-100 rounded overflow-hidden relative">
          <Image
            src={variant.image}
            alt={`${variant.color} ${variant.size}`}
            fill
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
};

const VariantsSummary: React.FC<VariantsSummaryProps> = ({ selectedProduct, selectedVariants }) => {
  const selectedVariantData = selectedProduct?.variants?.filter(v => 
    selectedVariants.includes(v.id)
  ) || [];
  
  const avgCost = selectedVariantData.length > 0 
    ? selectedVariantData.reduce((sum, v) => sum + parseFloat(v.price), 0) / selectedVariantData.length
    : 0;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">Selected Variants Summary</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total variants:</span>
          <span className="ml-2 font-medium">{selectedVariants.length}</span>
        </div>
        <div>
          <span className="text-gray-600">Avg. cost:</span>
          <span className="ml-2 font-medium">
            ${avgCost.toFixed(2)}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        You&apos;ll set your markup percentage in the next step to determine final selling prices.
      </p>
    </div>
  );
};

const NoVariantsMessage: React.FC<NoVariantsMessageProps> = ({ onPrevStep }) => {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No Variants Available</h3>
      <p className="text-gray-600 mb-4">
        This product doesn&apos;t have any variants loaded. Please go back and select a different product.
      </p>
      <button
        onClick={onPrevStep}
        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
      >
        Back to Design
      </button>
    </div>
  );
};

const VariantsStep: React.FC<VariantsStepProps> = ({ 
  selectedProduct, 
  selectedVariants, 
  setSelectedVariants,
  onPrevStep,
  onNextStep
}) => {
  const hasVariants = selectedProduct?.variants && selectedProduct.variants.length > 0;

  const handleToggleAll = () => {
    if (!selectedProduct?.variants) return;
    
    if (selectedVariants.length === selectedProduct.variants.length) {
      setSelectedVariants(() => []);
    } else {
      setSelectedVariants(() => selectedProduct.variants.map(v => v.id));
    }
  };

  const handleToggleVariant = (variantId: number) => {
    setSelectedVariants(prev => 
      prev.includes(variantId)
        ? prev.filter(id => id !== variantId)
        : [...prev, variantId]
    );
  };

  if (!hasVariants) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Product Variants</h3>
        <NoVariantsMessage onPrevStep={onPrevStep} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Select Product Variants</h3>
      <p className="text-sm text-gray-600 mb-6">
        Choose which sizes and colors you want to offer for your product. Each variant will use your design files.
      </p>
      
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleToggleAll}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            {selectedVariants.length === selectedProduct.variants.length ? 'Deselect All' : 'Select All'}
          </button>
          <span className="text-sm text-gray-500">
            {selectedVariants.length} of {selectedProduct.variants.length} variants selected
          </span>
        </div>
        <div className="text-sm text-gray-500">
          {selectedVariants.length > 0 && (
            <div>
              Avg. cost: ${(selectedProduct.variants
                .filter(v => selectedVariants.includes(v.id))
                .reduce((sum, v) => sum + parseFloat(v.price), 0) / selectedVariants.length
              ).toFixed(2)} per variant
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
        {selectedProduct.variants.map((variant) => (
          <VariantCard
            key={variant.id}
            variant={variant}
            isSelected={selectedVariants.includes(variant.id)}
            onToggle={handleToggleVariant}
          />
        ))}
      </div>
      
      {selectedVariants.length > 0 && (
        <VariantsSummary 
          selectedProduct={selectedProduct} 
          selectedVariants={selectedVariants} 
        />
      )}
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={onPrevStep}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Design
        </button>
        <button
          onClick={onNextStep}
          disabled={selectedVariants.length === 0}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedVariants.length === 0 ? 'Select Variants First' : `Continue with ${selectedVariants.length} Variants`}
        </button>
      </div>
    </div>
  );
};

export default VariantsStep;