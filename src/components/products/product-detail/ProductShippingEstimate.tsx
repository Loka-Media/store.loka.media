'use client';

import { useState, useEffect } from 'react';
import { Truck, Info } from 'lucide-react';
import { getShippingCountries } from '@/lib/location-utils';

interface ProductShippingEstimateProps {
  blueprintId: number | string | null;
  printProviderId: number | string | null;
  printifyVariantId: number | string | null;
}

export function ProductShippingEstimate({
  blueprintId,
  printProviderId,
  printifyVariantId
}: ProductShippingEstimateProps) {
  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [shippingProfiles, setShippingProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [estimate, setEstimate] = useState<{ first: number; additional: number } | null>(null);

  // Load countries list
  useEffect(() => {
    async function loadCountries() {
      try {
        const data = await getShippingCountries();
        if (data) {
          // Sort US first, then alphabetically
          const sorted = [...data].sort((a, b) => {
            if (a.code === 'US') return -1;
            if (b.code === 'US') return 1;
            return a.name.localeCompare(b.name);
          });
          setCountries(sorted);
        }
      } catch (err) {
        console.error('Failed to load shipping countries:', err);
      }
    }
    loadCountries();
  }, []);

  // Fetch shipping profiles for the blueprint
  useEffect(() => {
    if (!blueprintId || !printProviderId) return;

    async function fetchProfiles() {
      setLoading(true);
      try {
        const res = await fetch(`/api/printify/catalog/${blueprintId}/providers/${printProviderId}/shipping`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data?.profiles) {
            setShippingProfiles(json.data.profiles);
          }
        }
      } catch (err) {
        console.error('Failed to fetch shipping profiles:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, [blueprintId, printProviderId]);

  // Calculate rate whenever profiles, selectedCountry, or printifyVariantId changes
  useEffect(() => {
    if (shippingProfiles.length === 0) return;

    let matchingProfiles = shippingProfiles.filter((p: any) =>
      p.variant_ids && p.variant_ids.includes(Number(printifyVariantId))
    );

    if (matchingProfiles.length === 0) {
      matchingProfiles = shippingProfiles;
    }

    // Match country
    let matchedProfile = matchingProfiles.find((p: any) =>
      p.countries && p.countries.some((c: string) => c.toUpperCase() === selectedCountry.toUpperCase())
    );

    // Fallback to REST_OF_THE_WORLD
    if (!matchedProfile) {
      matchedProfile = matchingProfiles.find((p: any) =>
        p.countries && p.countries.some((c: string) => c.toUpperCase() === 'REST_OF_THE_WORLD')
      );
    }

    // Default fallback
    if (!matchedProfile) {
      matchedProfile = matchingProfiles[0];
    }

    if (matchedProfile) {
      setEstimate({
        first: matchedProfile.first_item.cost / 100,
        additional: matchedProfile.additional_items.cost / 100
      });
    } else {
      setEstimate(null);
    }
  }, [shippingProfiles, selectedCountry, printifyVariantId]);

  if (!blueprintId || !printProviderId) {
    return null;
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 sm:p-4 mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white">
          <Truck className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold">Shipping Information</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <label htmlFor="shipping-country-select" className="text-xs text-gray-400">Ship to:</label>
          <select
            id="shipping-country-select"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-black border border-white/20 text-white rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-orange-500 transition-colors"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center space-x-2 text-gray-400 text-xs py-1">
          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-orange-500 border-t-transparent" />
          <span>Calculating shipping rates...</span>
        </div>
      ) : estimate ? (
        <div className="space-y-1 sm:space-y-1.5 text-xs text-gray-300">
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
            <span>First Item:</span>
            <span className="font-bold text-white">${estimate.first.toFixed(2)} USD</span>
          </div>
          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg">
            <span>Additional Items:</span>
            <span className="font-bold text-white">${estimate.additional.toFixed(2)} USD</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-gray-400 mt-1">
            <Info className="w-3 h-3 text-orange-400 flex-shrink-0" />
            <span>Multiple items ship combined from the same print provider.</span>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-400 py-1">
          Standard flat rate shipping: $5.99 USD
        </div>
      )}
    </div>
  );
}
