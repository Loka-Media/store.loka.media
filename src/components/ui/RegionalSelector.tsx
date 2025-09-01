'use client';

import React, { useState } from 'react';
import { CheckIcon, GlobeIcon, MapPinIcon } from 'lucide-react';

export interface RegionalSettings {
  targetRegions: string[];
  primaryRegion?: string;
  restrictToRegions: boolean;
}

interface ProductRegionalData {
  regional_availability?: Record<string, {
    available: boolean;
    variant_count: number;
    total_variants: number;
    coverage_percentage: number;
  }>;
  recommended_regions?: string[];
  recommended_primary_region?: string;
  analysis_timestamp?: string;
}

interface RegionalSelectorProps {
  value: RegionalSettings;
  onChange: (settings: RegionalSettings) => void;
  className?: string;
  showAdvanced?: boolean;
  productData?: ProductRegionalData;
}

const AVAILABLE_REGIONS = [
  { 
    code: 'US', 
    name: 'United States', 
    flag: '🇺🇸',
    description: 'Ships from USA facilities'
  },
  { 
    code: 'EU', 
    name: 'European Union', 
    flag: '🇪🇺',
    description: 'Ships from EU facilities'
  },
  { 
    code: 'UK', 
    name: 'United Kingdom', 
    flag: '🇬🇧',
    description: 'Ships from UK facilities (post-Brexit)'
  },
  { 
    code: 'CA', 
    name: 'Canada', 
    flag: '🇨🇦',
    description: 'Ships from Canadian facilities'
  },
  { 
    code: 'AU', 
    name: 'Australia', 
    flag: '🇦🇺',
    description: 'Ships from Australian facilities'
  },
  { 
    code: 'MX', 
    name: 'Mexico', 
    flag: '🇲🇽',
    description: 'Ships from Mexican facilities'
  },
  { 
    code: 'JP', 
    name: 'Japan', 
    flag: '🇯🇵',
    description: 'Ships from Japanese facilities'
  }
];

const RegionalSelector: React.FC<RegionalSelectorProps> = ({
  value,
  onChange,
  className = '',
  showAdvanced = true,
  productData
}) => {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  
  // Auto-populate regions based on product data on first load
  const [hasInitialized, setHasInitialized] = useState(false);
  
  React.useEffect(() => {
    if (productData && !hasInitialized && productData.recommended_regions && productData.recommended_regions.length > 0) {
      // Only auto-populate if user hasn't made any selections yet
      if (value.targetRegions.length <= 1 && value.targetRegions[0] === 'US') {
        onChange({
          targetRegions: productData.recommended_regions,
          primaryRegion: productData.recommended_primary_region || productData.recommended_regions[0],
          restrictToRegions: value.restrictToRegions
        });
      }
      setHasInitialized(true);
    }
  }, [productData, hasInitialized, value, onChange]);

  const handleRegionToggle = (regionCode: string) => {
    const newRegions = value.targetRegions.includes(regionCode)
      ? value.targetRegions.filter(r => r !== regionCode)
      : [...value.targetRegions, regionCode];
    
    onChange({
      ...value,
      targetRegions: newRegions,
      primaryRegion: newRegions.includes(value.primaryRegion || '') ? value.primaryRegion : newRegions[0]
    });
  };

  const handlePrimaryRegionChange = (regionCode: string) => {
    onChange({
      ...value,
      primaryRegion: regionCode
    });
  };

  const handleRestrictToggle = () => {
    onChange({
      ...value,
      restrictToRegions: !value.restrictToRegions
    });
  };

  const selectedCount = value.targetRegions.length;
  const isGlobal = selectedCount >= 4;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <GlobeIcon className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              {selectedCount === 0 ? 'No regions selected' :
               selectedCount === 1 ? '1 region selected' :
               isGlobal ? 'Global availability' :
               `${selectedCount} regions selected`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {value.targetRegions.slice(0, 3).map(regionCode => {
              const region = AVAILABLE_REGIONS.find(r => r.code === regionCode);
              return (
                <span key={regionCode} className="text-lg">
                  {region?.flag}
                </span>
              );
            })}
            {selectedCount > 3 && (
              <span className="text-sm text-gray-500 ml-1">
                +{selectedCount - 3} more
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Region Selection Grid */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Available Regions
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_REGIONS.map((region) => {
            const isSelected = value.targetRegions.includes(region.code);
            const isPrimary = value.primaryRegion === region.code;
            
            // Get product-specific availability data
            const regionAvailability = productData?.regional_availability?.[region.code];
            const isRecommended = productData?.recommended_regions?.includes(region.code);
            
            return (
              <div
                key={region.code}
                className={`relative border rounded-lg p-3 cursor-pointer transition-all duration-200 hover:border-blue-300 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : isRecommended
                    ? 'border-green-300 bg-green-50 hover:border-green-400'
                    : regionAvailability && !regionAvailability.available
                    ? 'border-orange-300 bg-orange-50 hover:border-orange-400'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => handleRegionToggle(region.code)}
                onMouseEnter={() => setShowTooltip(region.code)}
                onMouseLeave={() => setShowTooltip(null)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 text-2xl">
                    {region.flag}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium text-gray-900 flex items-center gap-2">
                      {region.name}
                      {isRecommended && (
                        <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">
                          ✓ Recommended
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>{region.code}</span>
                      {regionAvailability && (
                        <span className={`${
                          regionAvailability.available 
                            ? 'text-green-600' 
                            : 'text-orange-600'
                        }`}>
                          {regionAvailability.coverage_percentage}% available
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isPrimary && isSelected && (
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        Primary
                      </span>
                    )}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <CheckIcon className="w-3 h-3 text-white" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Enhanced Tooltip */}
                {showTooltip === region.code && (
                  <div className="absolute z-10 bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded shadow-lg min-w-max">
                    <div className="font-medium mb-1">{region.description}</div>
                    {regionAvailability && (
                      <div className="border-t border-gray-700 pt-1 mt-1 space-y-1">
                        <div>Product Coverage: {regionAvailability.coverage_percentage}%</div>
                        <div>Available Variants: {regionAvailability.variant_count}/{regionAvailability.total_variants}</div>
                        {isRecommended && (
                          <div className="text-green-400">✓ Recommended for this product</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Primary Region Selection */}
      {value.targetRegions.length > 1 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Primary Region
          </h4>
          <p className="text-xs text-gray-500 mb-3">
            The primary region will be used for pricing and initial fulfillment
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {value.targetRegions.map((regionCode) => {
              const region = AVAILABLE_REGIONS.find(r => r.code === regionCode);
              const isPrimary = value.primaryRegion === regionCode;
              
              return (
                <button
                  key={regionCode}
                  type="button"
                  onClick={() => handlePrimaryRegionChange(regionCode)}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
                    isPrimary
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span>{region?.flag}</span>
                  <span>{region?.code}</span>
                  {isPrimary && <CheckIcon className="w-3 h-3 ml-auto" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Advanced Options
          </h4>
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={value.restrictToRegions}
                onChange={handleRestrictToggle}
                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-sm font-medium text-gray-900">
                  Strict Regional Restriction
                </div>
                <div className="text-xs text-gray-500">
                  Hide this product from customers outside selected regions
                </div>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Selection Warnings */}
      {selectedCount === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No regions selected
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                Please select at least one region where your product will be available.
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <CheckIcon className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Regional settings configured
              </h3>
              <div className="mt-1 text-sm text-green-700">
                Your product will be available in {selectedCount} region{selectedCount !== 1 ? 's' : ''}.
                {!isGlobal && (
                  <span className="block mt-1">
                    Consider adding more regions to reach a wider audience.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegionalSelector;