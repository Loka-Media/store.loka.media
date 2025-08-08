'use client';

import { useState, useEffect } from 'react';
import { ProductVariant, publicAPI } from '@/lib/api';
import { Globe, Check, X, AlertTriangle, RefreshCw } from 'lucide-react';

interface RegionalAvailabilityProps {
  selectedVariant: ProductVariant | null;
  userRegion?: string;
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

export function RegionalAvailability({ selectedVariant, userRegion = 'US' }: RegionalAvailabilityProps) {
  const [variantData, setVariantData] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch real-time variant data when selectedVariant changes
  useEffect(() => {
    const fetchVariantData = async () => {
      if (!selectedVariant?.id) return;
      
      try {
        setLoading(true);
        const response = await publicAPI.getProductVariant(selectedVariant.id);
        setVariantData(response);
      } catch (error) {
        console.error('Failed to fetch variant data:', error);
        setVariantData(selectedVariant); // Fallback to provided data
      } finally {
        setLoading(false);
      }
    };

    fetchVariantData();
  }, [selectedVariant?.id]);

  if (!selectedVariant) return null;

  const currentVariant = variantData || selectedVariant;
  
  // Extract regional availability data from real-time API response
  const availabilityStatus = currentVariant.availability_status || [];
  const availableRegions = availabilityStatus
    .filter(status => status.status === 'in_stock')
    .map(status => status.region);

  // Check if available in user's region
  const availableInUserRegion = availableRegions.includes(userRegion);

  // All supported regions
  const allRegions = Object.keys(REGION_NAMES);
  
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-orange-500" />
          <h3 className="text-sm font-medium text-white">Regional Availability</h3>
        </div>
        {loading && (
          <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
        )}
      </div>

      {/* User's region status */}
      <div className={`flex items-center gap-2 p-3 rounded-md mb-3 ${
        availableInUserRegion 
          ? 'bg-green-900/30 border border-green-700/30' 
          : 'bg-red-900/30 border border-red-700/30'
      }`}>
        {availableInUserRegion ? (
          <>
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-green-400 text-sm font-medium">
              Available in your region ({REGION_NAMES[userRegion as keyof typeof REGION_NAMES] || userRegion})
            </span>
          </>
        ) : (
          <>
            <X className="w-4 h-4 text-red-500" />
            <div className="flex-1">
              <span className="text-red-400 text-sm font-medium">
                Not available in your region ({REGION_NAMES[userRegion as keyof typeof REGION_NAMES] || userRegion})
              </span>
              {availableRegions.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Available in: {availableRegions.map(region => 
                    REGION_NAMES[region as keyof typeof REGION_NAMES] || region
                  ).join(', ')}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Show available regions only */}
      {availableRegions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Available Regions</h4>
          <div className="flex flex-wrap gap-2">
            {availableRegions.map(region => (
              <span
                key={region}
                className={`px-2 py-1 text-xs rounded-md border ${
                  region === userRegion
                    ? 'bg-green-900/30 border-green-700/30 text-green-400'
                    : 'bg-gray-800 border-gray-700 text-gray-300'
                }`}
              >
                {REGION_NAMES[region as keyof typeof REGION_NAMES] || region}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Update location prompt */}
      {userRegion === 'US' && (
        <div className="mt-3 p-2 bg-blue-900/30 border border-blue-700/30 rounded-md">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-300">
              <p className="font-medium">Update your location for accurate availability</p>
              <p className="text-blue-400 mt-1">
                We're showing US availability by default. Update your profile with your country for personalized results.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}