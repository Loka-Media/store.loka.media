'use client';

import { Settings, Check } from 'lucide-react';
import Image from 'next/image';

interface VariantsTabContentProps {
  uniqueSizes: string[];
  selectedSizes: string[];
  setSelectedSizes: (sizes: string[]) => void;
  handleSelectAllSizes: () => void;
  uniqueColors: Array<{ name: string; code: string; image: string }>;
  selectedColors: string[];
  setSelectedColors: (colors: string[]) => void;
  selectedVariants: number[];
  loadingPrintFiles: boolean;
}

const VariantsTabContent: React.FC<VariantsTabContentProps> = ({
  uniqueSizes,
  selectedSizes,
  setSelectedSizes,
  handleSelectAllSizes,
  uniqueColors,
  selectedColors,
  setSelectedColors,
  selectedVariants,
  loadingPrintFiles,
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl inline-flex items-center justify-center mb-4">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Product Setup</h3>
        <p className="text-gray-400 text-sm font-medium">Configure your product variants</p>
      </div>

      {/* Size Selection */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-gray-200">
            Sizes ({selectedSizes.length}/{uniqueSizes.length})
          </label>
          <button
            onClick={handleSelectAllSizes}
            className="px-3 py-1 text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-all duration-200"
          >
            {selectedSizes.length === uniqueSizes.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {uniqueSizes.map((size) => (
            <button
              key={size}
              onClick={() =>
                setSelectedSizes(
                  selectedSizes.includes(size)
                    ? selectedSizes.filter((s) => s !== size)
                    : [...selectedSizes, size]
                )
              }
              className={`p-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-between ${
                selectedSizes.includes(size)
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                  : 'bg-black/60 text-gray-300 border border-gray-700 hover:border-orange-500/50 hover:text-orange-400'
              }`}
            >
              <span>{size}</span>
              {selectedSizes.includes(size) && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color Selection */}
      <div className="space-y-4">
        <label className="text-sm font-bold text-gray-200">
          Colors ({selectedColors.length}/{uniqueColors.length})
        </label>
        
        <div className="grid grid-cols-1 gap-3">
          {uniqueColors.map((color) => (
            <button
              key={color.name}
              onClick={() =>
                setSelectedColors(
                  selectedColors.includes(color.name)
                    ? selectedColors.filter((c) => c !== color.name)
                    : [...selectedColors, color.name]
                )
              }
              className={`p-4 rounded-xl transition-all duration-300 border-2 ${
                selectedColors.includes(color.name)
                  ? 'border-orange-500 bg-orange-500/10 shadow-lg'
                  : 'border-gray-700 hover:border-gray-600 bg-black/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-500 flex-shrink-0"
                  style={{ backgroundColor: color.code }}
                />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {color.name}
                    </span>
                    {selectedColors.includes(color.name) && (
                      <Check className="w-4 h-4 text-orange-400" />
                    )}
                  </div>
                </div>
                <div className="w-12 h-12 bg-gray-800 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                  <Image
                    src={color.image}
                    alt={color.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Variants Summary */}
      {selectedVariants.length > 0 && (
        <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border-2 border-green-500/30 rounded-2xl p-5 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <div className="text-green-300 font-bold text-lg">
              {selectedVariants.length} variants selected
            </div>
            <div className="text-green-400 text-sm font-medium">
              {selectedSizes.length} size{selectedSizes.length !== 1 ? 's' : ''} × {selectedColors.length} color{selectedColors.length !== 1 ? 's' : ''}
            </div>
            {loadingPrintFiles && (
              <div className="flex items-center justify-center space-x-3 text-orange-400 mt-4 bg-black/60 rounded-xl p-3 border border-orange-500/30">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                <span className="text-sm font-bold">
                  Loading print files...
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariantsTabContent;