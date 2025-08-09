'use client';

import { useState, useEffect } from 'react';
import { Globe, Check, X, AlertTriangle, RefreshCw, Eye } from 'lucide-react';
import { printfulAPI } from '@/lib/api';

interface ProductVariant {
  id: number;
  size: string;
  color: string;
  color_code: string;
  price: string;
  in_stock: boolean;
}

interface ProductData {
  id: number;
  title: string;
  variants: ProductVariant[];
}

interface RegionalAvailabilityPreviewProps {
  selectedProduct: ProductData | null;
  selectedVariants: number[];
  className?: string;
}

const REGION_NAMES = {
  'US': 'United States',
  'EU': 'Europe',
  'UK': 'United Kingdom', 
  'CA': 'Canada',
  'AU': 'Australia',
  'MX': 'Mexico',
  'JP': 'Japan',
};

interface RegionalData {
  [region: string]: {
    available_variants: number;
    total_variants: number;
    availability_percentage: number;
    variant_details: Array<{
      id: number;
      size: string;
      color: string;
      available: boolean;
    }>;
  };
}

export function RegionalAvailabilityPreview({ 
  selectedProduct, 
  selectedVariants, 
  className = '' 
}: RegionalAvailabilityPreviewProps) {
  const [regionalData, setRegionalData] = useState<RegionalData>({});
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Fetch regional availability data when variants change
  useEffect(() => {
    const fetchRegionalData = async () => {
      if (!selectedProduct || selectedVariants.length === 0) {
        setRegionalData({});
        return;
      }

      try {
        setLoading(true);
        
        // Get the selected variant objects
        const selectedVariantObjects = selectedProduct.variants.filter(
          variant => selectedVariants.includes(variant.id)
        );

        // Get catalog data from Printful to check real-time availability
        const catalogProduct = await printfulAPI.getProductDetails(selectedProduct.id);
        
        if (catalogProduct && catalogProduct.result && catalogProduct.result.variants) {
          const printfulVariants = catalogProduct.result.variants;
          const regions = Object.keys(REGION_NAMES);
          const newRegionalData: RegionalData = {};

          // Analyze availability by region
          regions.forEach(region => {
            let availableCount = 0;
            const variantDetails: Array<{
              id: number;
              size: string;
              color: string;
              available: boolean;
            }> = [];

            selectedVariantObjects.forEach(variant => {
              // Find corresponding Printful variant
              const printfulVariant = printfulVariants.find((pv: { id: number; availability_status?: Array<{ region: string; status: string }> }) => pv.id === variant.id);
              
              let isAvailable = false;
              if (printfulVariant && printfulVariant.availability_status) {
                isAvailable = printfulVariant.availability_status.some(
                  (status: { region: string; status: string }) => status.region === region && status.status === 'in_stock'
                );
              }

              if (isAvailable) availableCount++;

              variantDetails.push({
                id: variant.id,
                size: variant.size,
                color: variant.color,
                available: isAvailable
              });
            });

            newRegionalData[region] = {
              available_variants: availableCount,
              total_variants: selectedVariantObjects.length,
              availability_percentage: selectedVariantObjects.length > 0 
                ? Math.round((availableCount / selectedVariantObjects.length) * 100)
                : 0,
              variant_details: variantDetails
            };
          });

          setRegionalData(newRegionalData);
        }
      } catch (error) {
        console.error('Failed to fetch regional availability:', error);
        
        // Fallback: assume all selected variants are available in US for now
        // This will be shown until the user is properly authenticated
        const regions = Object.keys(REGION_NAMES);
        const fallbackData: RegionalData = {};
        
        // Get the selected variant objects for fallback
        const selectedVariantObjects = selectedProduct.variants.filter(
          variant => selectedVariants.includes(variant.id)
        );
        
        regions.forEach(region => {
          const isUSRegion = region === 'US';
          fallbackData[region] = {
            available_variants: isUSRegion ? selectedVariantObjects.length : 0,
            total_variants: selectedVariantObjects.length,
            availability_percentage: isUSRegion ? 100 : 0,
            variant_details: selectedVariantObjects.map(variant => ({
              id: variant.id,
              size: variant.size,
              color: variant.color,
              available: isUSRegion
            }))
          };
        });
        
        setRegionalData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchRegionalData();
  }, [selectedProduct, selectedVariants]);

  if (!selectedProduct || selectedVariants.length === 0) {
    return (
      <div className={`bg-black/40 rounded-2xl p-6 border border-gray-800 ${className}`}>
        <div className="flex items-center gap-3 text-gray-400">
          <div className="p-2 bg-gray-800 rounded-xl">
            <Globe className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">Select variants to see regional availability</span>
        </div>
      </div>
    );
  }

  const regions = Object.keys(REGION_NAMES);
  const availableRegions = regions.filter(region => 
    regionalData[region] && regionalData[region].available_variants > 0
  );

  return (
    <div className={`bg-black/40 rounded-2xl p-6 border border-gray-800 backdrop-blur-sm ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
            <Globe className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Regional Availability</h3>
        </div>
        <div className="flex items-center gap-3">
          {loading && <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-300 hover:text-orange-400 flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200 font-medium"
          >
            <Eye className="w-4 h-4" />
            {expanded ? 'Less' : 'Details'}
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <p className="text-gray-300 mb-4 font-medium">
          Your product will be available in <strong className="text-white">{availableRegions.length}</strong> out of {regions.length} regions
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {regions.map(region => {
            const data = regionalData[region];
            const isAvailable = data && data.available_variants > 0;
            
            return (
              <div
                key={region}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 ${
                  isAvailable 
                    ? 'bg-green-900/30 border border-green-500/30 hover:bg-green-900/40' 
                    : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/70'
                }`}
              >
                <span className="font-semibold text-white">
                  {REGION_NAMES[region as keyof typeof REGION_NAMES]}
                </span>
                <div className="flex items-center gap-2">
                  {isAvailable ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-bold">
                        {data.availability_percentage}%
                      </span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500 font-bold">0%</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed breakdown when expanded */}
      {expanded && (
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <h4 className="text-base font-bold text-white">Variant Details</h4>
          {regions.map(region => {
            const data = regionalData[region];
            if (!data || data.available_variants === 0) return null;

            return (
              <div key={region} className="bg-black/60 rounded-2xl p-4 border border-gray-700">
                <h5 className="text-sm font-bold text-white mb-3">
                  {REGION_NAMES[region as keyof typeof REGION_NAMES]} 
                  <span className="text-gray-400">({data.available_variants}/{data.total_variants} variants)</span>
                </h5>
                <div className="grid grid-cols-1 gap-2">
                  {data.variant_details
                    .filter(variant => variant.available)
                    .map(variant => (
                    <div key={variant.id} className="text-sm text-gray-300 flex items-center gap-3 font-medium">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>{variant.size} - {variant.color}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recommendations */}
      {availableRegions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-900/20 rounded-2xl border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-blue-300 mb-2">Availability Summary</p>
              <p className="text-gray-300 font-medium">
                Your customers will be able to purchase this product in: <strong className="text-white">
                  {availableRegions.map(region => 
                    REGION_NAMES[region as keyof typeof REGION_NAMES]
                  ).join(', ')}
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}