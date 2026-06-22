import { useState, useEffect } from 'react';
import { Globe, Check, X, AlertTriangle, RefreshCw, Eye, Info } from 'lucide-react';
import { printifyAPI } from '@/lib/api';
import { getUniqueRegionsFromProfiles, RegionalMapping, REST_OF_WORLD_CODE } from '@/lib/shipping-utils';

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
  title?: string;
  name?: string;
  variants: ProductVariant[];
  print_provider_id?: number;
  blueprint_id?: number;
}

interface RegionalAvailabilityPreviewProps {
  selectedProduct: ProductData | null;
  selectedVariants: number[];
  className?: string;
}

interface RegionalData {
  [regionCode: string]: {
    mapping: RegionalMapping;
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
  const [showRowTooltip, setShowRowTooltip] = useState(false);

  // Fetch regional availability data when variants change
  useEffect(() => {
    const fetchRegionalData = async () => {
      if (!selectedProduct || selectedVariants.length === 0) {
        setRegionalData({});
        return;
      }

      try {
        setLoading(true);

        // Determine blueprint ID and provider ID
        const blueprintId = selectedProduct.blueprint_id || selectedProduct.id;
        let providerId = selectedProduct.print_provider_id;

        // If provider ID is missing, fetch the first available provider for this blueprint
        if (!providerId) {
          const availability = await printifyAPI.checkProductAvailability(blueprintId);
          const providers = availability?.result?.providers || [];
          if (providers.length > 0) {
            providerId = providers[0].id || providers[0].print_provider_id;
          }
        }

        // Get the selected variant objects
        const selectedVariantObjects = selectedProduct.variants.filter(
          variant => selectedVariants.includes(variant.id)
        );

        const newRegionalData: RegionalData = {};

        // 1. Fetch shipping profiles to determine regions
        let regions: RegionalMapping[] = [];
        try {
          if (providerId) {
            const shippingResponse = await printifyAPI.getShippingProfiles(blueprintId, providerId);
            
            console.log("Shipping Response:", shippingResponse);
            console.log("Shipping Response JSON:", JSON.stringify(shippingResponse, null, 2));

            const profiles = shippingResponse?.profiles || (shippingResponse as any)?.data?.profiles || (shippingResponse as any)?.result?.profiles || [];
            
            console.log("Profiles:", profiles);

            regions = getUniqueRegionsFromProfiles(profiles);
            console.log("Mapped Regions:", regions);
          }
        } catch (shippingError) {
          console.warn('Failed to fetch shipping profiles, falling back to basic regions', shippingError);
        }

        // 2. Fetch catalog details to check specific variant availability
        const detailed = await printifyAPI.getBlueprintDetails(blueprintId);
        const catalogProduct = detailed?.data || detailed;

        const printifyVariants = catalogProduct?.variants || [];

        // Determine variant availability (overall)
        const variantDetails: Array<{
          id: number;
          size: string;
          color: string;
          available: boolean;
        }> = [];

        let overallAvailableCount = 0;
        selectedVariantObjects.forEach(variant => {
          const printifyVariant = printifyVariants.find((pv: { id: number; is_available?: boolean }) => pv.id === variant.id);
          const isAvailable = printifyVariant ? printifyVariant.is_available !== false : true; // Default true if not found to avoid false negatives

          if (isAvailable) overallAvailableCount++;

          variantDetails.push({
            id: variant.id,
            size: variant.size,
            color: variant.color,
            available: isAvailable
          });
        });

        const overallPercentage = selectedVariantObjects.length > 0
          ? Math.round((overallAvailableCount / selectedVariantObjects.length) * 100)
          : 0;

        // If no regions found from shipping API, use fallback basic regions
        if (regions.length === 0) {
          console.warn("Using fallback regions");
          regions = [
            { code: 'US', name: 'United States', isRestOfWorld: false },
            { code: 'CA', name: 'Canada', isRestOfWorld: false },
            { code: 'UK', name: 'United Kingdom', isRestOfWorld: false }
          ];
        }

        // Map data per region
        // We assume variant availability applies to all supported regions equally for now,
        // as the Printify API provides shipping countries per print provider, not per variant.
        regions.forEach(region => {
          newRegionalData[region.code] = {
            mapping: region,
            available_variants: overallAvailableCount,
            total_variants: selectedVariantObjects.length,
            availability_percentage: overallPercentage,
            variant_details: variantDetails
          };
        });

        setRegionalData(newRegionalData);
      } catch (error) {
        console.error('Failed to fetch regional availability:', error);

        // Ultimate fallback
        const fallbackRegions: RegionalMapping[] = [
          { code: 'US', name: 'United States', isRestOfWorld: false },
          { code: 'CA', name: 'Canada', isRestOfWorld: false }
        ];
        const fallbackData: RegionalData = {};

        const selectedVariantObjects = selectedProduct.variants.filter(
          variant => selectedVariants.includes(variant.id)
        );

        fallbackRegions.forEach(region => {
          fallbackData[region.code] = {
            mapping: region,
            available_variants: selectedVariantObjects.length,
            total_variants: selectedVariantObjects.length,
            availability_percentage: 100,
            variant_details: selectedVariantObjects.map(variant => ({
              id: variant.id,
              size: variant.size,
              color: variant.color,
              available: true
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

  const regionCodes = Object.keys(regionalData);
  const availableRegions = regionCodes.filter(code =>
    regionalData[code] && regionalData[code].available_variants > 0
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
          Your product will be available in <strong className="text-white">{availableRegions.length}</strong> out of {regionCodes.length} regions
        </p>

        <div className="flex flex-wrap gap-3">
          {regionCodes.map(code => {
            const data = regionalData[code];
            const isAvailable = data && data.available_variants > 0;
            const isRestOfWorld = data.mapping.isRestOfWorld;

            return (
              <div
                key={code}
                className={`relative flex items-center gap-4 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${isAvailable
                  ? 'bg-green-900/30 border border-green-500/30 hover:bg-green-900/40'
                  : 'bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800/70'
                  }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white whitespace-nowrap" title={data.mapping.name}>
                    {data.mapping.name}
                  </span>
                  {isRestOfWorld && (
                    <div
                      className="relative cursor-help"
                      onMouseEnter={() => setShowRowTooltip(true)}
                      onMouseLeave={() => setShowRowTooltip(false)}
                    >
                      <Info className="w-4 h-4 text-blue-400" />
                      {showRowTooltip && (
                        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-gray-900 border border-gray-700 rounded-lg text-xs font-normal text-gray-300 shadow-xl">
                          <p className="mb-2">
                            <strong>"Rest of World"</strong> includes over 150+ international destinations supported by Printify.
                          </p>
                          <p className="text-gray-400 mb-1">Popular destinations include:</p>
                          <ul className="list-disc pl-4 grid grid-cols-2 gap-x-2 text-gray-400">
                            <li>Germany</li>
                            <li>France</li>
                            <li>Italy</li>
                            <li>Spain</li>
                            <li>Brazil</li>
                            <li>India</li>
                            <li>Japan</li>
                            <li>New Zealand</li>
                            <li>Mexico</li>
                            <li>South Africa</li>
                          </ul>
                          <p className="mt-2 text-[10px] text-gray-500 italic">
                            *Excludes specific restricted countries (e.g., Cuba, Iran, North Korea, Syria).
                          </p>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-900 border-b border-r border-gray-700 transform rotate-45"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regionCodes.map(code => {
              const data = regionalData[code];
              if (!data || data.available_variants === 0) return null;

              return (
                <div key={code} className="bg-black/60 rounded-2xl p-4 border border-gray-700">
                  <h5 className="text-sm font-bold text-white mb-3">
                    {data.mapping.name}
                    <span className="text-gray-400 ml-1">({data.available_variants}/{data.total_variants} variants)</span>
                  </h5>
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {data.variant_details
                      .filter(variant => variant.available)
                      .map(variant => (
                        <div key={variant.id} className="text-sm text-gray-300 flex items-center gap-3 font-medium">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span className="truncate">{variant.size} - {variant.color}</span>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {availableRegions.length > 0 && (
        <div className="mt-6 p-4 bg-blue-900/20 rounded-2xl border border-blue-500/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-sm">
              <p className="font-bold text-blue-300 mb-2">Availability Summary</p>
              <p className="text-gray-300 font-medium">
                Your customers will be able to purchase this product in: <strong className="text-white">
                  {availableRegions.map(code =>
                    regionalData[code].mapping.name
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