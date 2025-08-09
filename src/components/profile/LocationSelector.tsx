'use client';

import { useState } from 'react';
import { userAPI } from '@/lib/api';
import { MapPin, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface LocationSelectorProps {
  currentCountry?: string;
  currentRegion?: string;
  onLocationUpdate?: (country: string, region?: string) => void;
}

const COUNTRIES = [
  { code: 'US', name: 'United States', regions: ['US'] },
  { code: 'CA', name: 'Canada', regions: ['CA'] },
  { code: 'MX', name: 'Mexico', regions: ['MX'] },
  { code: 'UK', name: 'United Kingdom', regions: ['UK'] },
  { code: 'DE', name: 'Germany', regions: ['EU'] },
  { code: 'FR', name: 'France', regions: ['EU'] },
  { code: 'ES', name: 'Spain', regions: ['EU'] },
  { code: 'IT', name: 'Italy', regions: ['EU'] },
  { code: 'NL', name: 'Netherlands', regions: ['EU'] },
  { code: 'AU', name: 'Australia', regions: ['AU'] },
  { code: 'JP', name: 'Japan', regions: ['JP'] },
];

export function LocationSelector({ currentCountry, currentRegion, onLocationUpdate }: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(currentCountry || 'US');
  const [loading, setLoading] = useState(false);

  const handleLocationUpdate = async () => {
    try {
      setLoading(true);
      const selectedCountryData = COUNTRIES.find(c => c.code === selectedCountry);
      const region = selectedCountryData?.regions[0];

      await userAPI.updateLocation({
        country: selectedCountry,
        region: region
      });

      toast.success('Location updated successfully!');
      onLocationUpdate?.(selectedCountry, region);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update location:', error);
      toast.error('Failed to update location');
    } finally {
      setLoading(false);
    }
  };

  const currentCountryName = COUNTRIES.find(c => c.code === currentCountry)?.name || 'United States';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition-colors text-sm"
      >
        <MapPin className="w-4 h-4 text-orange-500" />
        <span>{currentCountryName}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-white mb-3">Select Your Location</h3>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {COUNTRIES.map((country) => (
                <button
                  key={country.code}
                  onClick={() => setSelectedCountry(country.code)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedCountry === country.code
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{country.name}</span>
                    {selectedCountry === country.code && (
                      <Check className="w-4 h-4" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLocationUpdate}
                disabled={loading || selectedCountry === currentCountry}
                className="flex-1 px-3 py-2 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-md transition-colors"
              >
                {loading ? 'Updating...' : 'Update Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}