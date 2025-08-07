/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { printfulAPI } from "@/lib/api";
import toast from "react-hot-toast";

// Interfaces for better type safety
interface ProductVariant {
  id: number;
  size: string;
  color: string;
  color_code: string;
  price: string; // Storing as string to handle currency from an API, will need to parse to float for calculations
  in_stock: boolean;
  inventory_available?: boolean;
  estimated_quantity?: number;
  can_create_product?: boolean;
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
  selectedProduct: any;
  selectedVariants: number[];
  setSelectedVariants: (updater: (prev: number[]) => number[]) => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onPrintFilesLoaded?: (printFiles: any) => void;
}

const VariantCard: React.FC<VariantCardProps> = ({
  variant,
  isSelected,
  onToggle,
}) => {
  const isAvailable = variant.inventory_available !== false && variant.in_stock !== false;
  const canSelect = isAvailable;

  return (
    <div
      className={`border rounded-lg p-4 transition-all relative ${
        !canSelect 
          ? "border-red-200 bg-red-50 cursor-not-allowed opacity-75"
          : isSelected
          ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200 cursor-pointer"
          : "border-gray-200 hover:border-gray-300 cursor-pointer"
      }`}
      onClick={() => canSelect && onToggle(variant.id)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className="w-4 h-4 rounded border-2 flex items-center justify-center"
            style={{ borderColor: isSelected ? "#6366f1" : "#d1d5db" }}
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

      <div className="text-xs space-y-1">
        <div className={`flex items-center space-x-1 ${
          isAvailable ? 'text-green-600' : 'text-red-600'
        }`}>
          <span>{isAvailable ? "✅" : "❌"}</span>
          <span className="font-medium">
            {isAvailable ? "Available" : "Out of Stock"}
          </span>
          {variant.estimated_quantity > 0 && (
            <span className="text-gray-500">
              ({variant.estimated_quantity === 999 ? "In Stock" : variant.estimated_quantity})
            </span>
          )}
        </div>
        {!isAvailable && (
          <div className="text-red-500 text-xs font-medium">
            Cannot create product with this variant
          </div>
        )}
      </div>
      
      {!canSelect && (
        <div className="absolute inset-0 bg-red-100 bg-opacity-75 rounded-lg flex items-center justify-center">
          <span className="text-red-700 font-medium text-sm">Out of Stock</span>
        </div>
      )}

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

const VariantsSummary: React.FC<VariantsSummaryProps> = ({
  selectedProduct,
  selectedVariants,
}) => {
  const selectedVariantData =
    selectedProduct?.variants?.filter((v) => selectedVariants.includes(v.id)) ||
    [];

  const avgCost =
    selectedVariantData.length > 0
      ? selectedVariantData.reduce((sum, v) => sum + parseFloat(v.price), 0) /
        selectedVariantData.length
      : 0;

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-medium text-gray-900 mb-2">
        Selected Variants Summary
      </h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Total variants:</span>
          <span className="ml-2 font-medium">{selectedVariants.length}</span>
        </div>
        <div>
          <span className="text-gray-600">Avg. cost:</span>
          <span className="ml-2 font-medium">${avgCost.toFixed(2)}</span>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        You&apos;ll set your markup percentage in the next step to determine
        final selling prices.
      </p>
    </div>
  );
};

const NoVariantsMessage: React.FC<NoVariantsMessageProps> = ({
  onPrevStep,
}) => {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 mb-4">
        <svg
          className="mx-auto h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No Variants Available
      </h3>
      <p className="text-gray-600 mb-4">
        This product doesn&apos;t have any variants loaded. Please go back and
        select a different product.
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
  onNextStep,
  onPrintFilesLoaded,
}) => {
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [loadingPrintFiles, setLoadingPrintFiles] = useState(false);
  const [printFilesLoaded, setPrintFilesLoaded] = useState(false);
  const [lastProductId, setLastProductId] = useState<number | null>(null);

  const hasVariants =
    selectedProduct?.variants && selectedProduct.variants.length > 0;
  
  // Check if selected variants have available inventory
  const getSelectedVariantsWithInventory = () => {
    if (!selectedProduct?.variants) return [];
    return selectedProduct.variants.filter((variant: any) => 
      selectedVariants.includes(variant.id) && 
      variant.inventory_available !== false && 
      variant.in_stock !== false
    );
  };
  
  const selectedAvailableVariants = getSelectedVariantsWithInventory();
  const hasAvailableVariants = selectedAvailableVariants.length > 0;
  const allSelectedVariantsOutOfStock = selectedVariants.length > 0 && selectedAvailableVariants.length === 0;

  // Get unique sizes and colors
  const uniqueSizes = [
    ...new Set(selectedProduct?.variants?.map((v: any) => v.size) || []),
  ];

  // Create a map to ensure unique colors by name, taking the first occurrence
  const colorMap = new Map();
  selectedProduct?.variants?.forEach((v: any) => {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, {
        name: v.color,
        code: v.color_code,
        image: v.image,
      });
    }
  });
  const uniqueColors = Array.from(colorMap.values());

  // Reset print files loading when product changes
  useEffect(() => {
    if (selectedProduct?.id && selectedProduct.id !== lastProductId) {
      setPrintFilesLoaded(false);
      setLastProductId(selectedProduct.id);
    }
  }, [selectedProduct?.id, lastProductId]);

  // Update selected variants when size/color selection changes
  useEffect(() => {
    if (!selectedProduct?.variants) return;

    const filteredVariants = selectedProduct.variants.filter(
      (variant: any) =>
        selectedSizes.includes(variant.size) &&
        selectedColors.includes(variant.color)
    );

    setSelectedVariants(() => filteredVariants.map((v: any) => v.id));
  }, [selectedSizes, selectedColors, selectedProduct, setSelectedVariants]);

  // Load print files when variants are selected (only once)
  useEffect(() => {
    const loadPrintFiles = async () => {
      if (
        selectedVariants.length === 0 ||
        !selectedProduct?.id ||
        printFilesLoaded ||
        loadingPrintFiles
      ) {
        return;
      }

      try {
        setLoadingPrintFiles(true);

        // Get print files using the correct backend API endpoint
        const printFilesResponse = await printfulAPI.getPrintFiles(
          selectedProduct.id
        );

        if (printFilesResponse?.result) {
          onPrintFilesLoaded?.(printFilesResponse.result);
          setPrintFilesLoaded(true);
          toast.success("Print files loaded successfully!");
        } else {
          console.warn("No print files data received");
        }
      } catch (error) {
        console.error("Failed to load print files:", error);
        toast.error("Failed to load print files");
      } finally {
        setLoadingPrintFiles(false);
      }
    };

    if (
      selectedVariants.length > 0 &&
      !printFilesLoaded &&
      !loadingPrintFiles
    ) {
      loadPrintFiles();
    }
  }, [
    selectedVariants.length,
    selectedProduct?.id,
    printFilesLoaded,
    loadingPrintFiles,
    onPrintFilesLoaded,
  ]);

  const handleSizeToggle = (size: string) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleColorToggle = (color: string) => {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color]
    );
  };

  if (!hasVariants) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Select Product Variants
        </h3>
        <NoVariantsMessage onPrevStep={onPrevStep} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Select Product Variants
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Choose sizes and colors for your product. Print files will be
        automatically loaded.
      </p>

      {/* Size Selection */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">Select Sizes</h4>
        <div className="flex flex-wrap gap-2">
          {uniqueSizes.map((size) => (
            <button
              key={size as any}
              onClick={() => handleSizeToggle(size as any)}
              className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                selectedSizes.includes(size as any)
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {size as any}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="mb-6">
        <h4 className="text-md font-medium text-gray-900 mb-3">
          Select Colors
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {uniqueColors.map((color) => (
            <div
              key={color.name}
              onClick={() => handleColorToggle(color.name)}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedColors.includes(color.name)
                  ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div
                  className="w-6 h-6 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.code }}
                />
                <span className="text-sm font-medium text-gray-900">
                  {color.name}
                </span>
              </div>
              <div className="w-full h-16 bg-gray-100 rounded overflow-hidden">
                <Image
                  src={color.image}
                  alt={color.name}
                  width={100}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Variants Summary */}
      {selectedVariants.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Selected Variants</h4>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">
              {selectedVariants.length} variants selected (
              {selectedSizes.length} sizes × {selectedColors.length} colors)
            </span>
            {loadingPrintFiles && (
              <div className="flex items-center space-x-2 text-indigo-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                <span>Loading print files...</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${hasAvailableVariants ? 'text-green-600' : 'text-red-600'}`}>
              {selectedAvailableVariants.length} available variants
            </span>
            {allSelectedVariantsOutOfStock && (
              <span className="text-red-600 text-xs font-medium">
                ⚠️ All selected variants are out of stock
              </span>
            )}
          </div>
        </div>
      )}

      {/* Inventory Warning */}
      {allSelectedVariantsOutOfStock && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="text-red-500 mt-0.5">⚠️</div>
            <div>
              <h4 className="font-medium text-red-800 mb-1">Cannot Create Product</h4>
              <p className="text-sm text-red-700">
                All selected variants are currently out of stock. Please select different variants that are available 
                or choose a different product to continue.
              </p>
            </div>
          </div>
        </div>
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
          disabled={selectedVariants.length === 0 || loadingPrintFiles || allSelectedVariantsOutOfStock}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingPrintFiles
            ? "Loading Print Files..."
            : selectedVariants.length === 0
            ? "Select Variants First"
            : allSelectedVariantsOutOfStock
            ? "All Variants Out of Stock"
            : `Continue with ${selectedAvailableVariants.length} Available Variants`}
        </button>
      </div>
    </div>
  );
};

export default VariantsStep;
