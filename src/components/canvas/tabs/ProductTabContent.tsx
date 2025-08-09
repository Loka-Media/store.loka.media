import React from 'react';
import { Check } from 'lucide-react';
import { Product, ColorInfo } from '../types';

interface ProductTabContentProps {
  selectedProduct: Product;
  selectedTechnique: string;
  setSelectedTechnique: (technique: string) => void;
  uniqueColors: ColorInfo[];
  uniqueSizes: string[];
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[]) => void;
  openChildPanel: (content: string) => void;
}

const ProductTabContent: React.FC<ProductTabContentProps> = ({
  selectedTechnique,
  setSelectedTechnique,
  uniqueColors,
  uniqueSizes,
  selectedColors,
  setSelectedColors,
  selectedSizes,
  setSelectedSizes,
  openChildPanel
}) => {
  return (
    <div className="space-y-4">
      {/* Technique Selection */}
      <div>
        <h3 className="text-sm font-semibold text-white mb-2">Technique</h3>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setSelectedTechnique("DTG printing")}
            className={`p-3 border rounded-lg text-sm font-medium text-left transition-colors ${
              selectedTechnique === "DTG printing"
                ? "border-orange-500 bg-orange-900/20 text-white"
                : "border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-200"
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                <div className="w-4 h-4 bg-white rounded"></div>
              </div>
              <span className="text-current">DTG Printing</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTechnique("DTFILM printing")}
            className={`p-3 border rounded-lg text-sm font-medium text-left transition-colors ${
              selectedTechnique === "DTFILM printing"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <div className="w-4 h-4 bg-white rounded"></div>
              </div>
              <span>DTFILM Printing</span>
            </div>
          </button>
          <button
            onClick={() => setSelectedTechnique("Embroidery")}
            className={`p-3 border rounded-lg text-sm font-medium text-left transition-colors ${
              selectedTechnique === "Embroidery"
                ? "border-gray-900 bg-gray-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <div className="w-4 h-4 bg-white rounded"></div>
              </div>
              <span>Embroidery</span>
            </div>
          </button>
        </div>
      </div>

      {/* Color Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Color</h3>
          <button
            onClick={() => openChildPanel("colors")}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {uniqueColors.slice(0, 4).map((color: ColorInfo) => (
            <button
              key={color.name}
              onClick={() => {
                setSelectedColors([color.name]);
              }}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                selectedColors.includes(color.name)
                  ? "border-gray-900 scale-110"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ backgroundColor: color.code }}
              title={color.name}
            >
              {selectedColors.includes(color.name) && (
                <Check className="w-4 h-4 text-white mx-auto drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Size Selection */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Size</h3>
          <button
            onClick={() => openChildPanel("sizes")}
            className="text-xs text-blue-600 hover:text-blue-700"
          >
            View All
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {uniqueSizes.slice(0, 4).map((size) => (
            <button
              key={size}
              onClick={() => {
                setSelectedSizes(
                  selectedSizes.includes(size)
                    ? selectedSizes.filter((s) => s !== size)
                    : [...selectedSizes, size]
                );
              }}
              className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                selectedSizes.includes(size)
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-700 hover:border-gray-300"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductTabContent;