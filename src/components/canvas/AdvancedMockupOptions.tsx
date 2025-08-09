/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { printfulAPI } from '@/lib/api';
import { Settings, Palette, Sparkles } from 'lucide-react';

// All possible printing techniques with descriptions
const ALL_PRINTING_TECHNIQUES = {
  'DTG': { label: 'DTG Printing', description: 'Direct-to-garment digital printing' },
  'DTFILM': { label: 'DT Film Printing', description: 'Direct-to-film transfer printing' },
  'DIGITAL': { label: 'Digital Printing', description: 'Digital printing' },
  'CUT-SEW': { label: 'Cut & Sew', description: 'Cut & sew sublimation' },
  'UV': { label: 'UV Printing', description: 'UV printing' },
  'EMBROIDERY': { label: 'Embroidery', description: 'Embroidery' },
  'SUBLIMATION': { label: 'Sublimation', description: 'Sublimation' },
  'ENGRAVING': { label: 'Engraving', description: 'Engraving' },
  'SCREEN': { label: 'Screen Printing', description: 'Screen printing' },
  'VINYL': { label: 'Vinyl Printing', description: 'Vinyl cutting and application' },
} as const;

type TechniqueKey = keyof typeof ALL_PRINTING_TECHNIQUES;

interface AdvancedMockupOptionsProps {
  selectedProduct: {
    id: number;
    name: string;
    [key: string]: unknown;
  };
  selectedTechnique: string;
  onTechniqueChange: (technique: string) => void;
  selectedOptionGroups: string[];
  onOptionGroupsChange: (groups: string[]) => void;
  selectedOptions: string[];
  onOptionsChange: (options: string[]) => void;
  lifelikeEnabled: boolean;
  onLifelikeChange: (enabled: boolean) => void;
  mockupWidth: number;
  onWidthChange: (width: number) => void;
}

interface PrintFilesData {
  option_groups?: string[];
  options?: string[];
  available_techniques?: string[];
  [key: string]: unknown;
}

const AdvancedMockupOptions: React.FC<AdvancedMockupOptionsProps> = ({
  selectedProduct,
  selectedTechnique,
  onTechniqueChange,
  selectedOptionGroups,
  onOptionGroupsChange,
  selectedOptions,
  onOptionsChange,
  lifelikeEnabled,
  onLifelikeChange,
  mockupWidth,
  onWidthChange
}) => {
  const [printFilesData, setPrintFilesData] = useState<PrintFilesData | null>(null);
  const [availableTechniques, setAvailableTechniques] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTechniques, setLoadingTechniques] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse error message to extract allowed techniques
  const parseAllowedTechniques = useCallback((errorMessage: string): string[] => {
    if (errorMessage.includes('Allowed values:')) {
      const allowedMatch = errorMessage.match(/Allowed values:\s*([A-Z,\s]+)/i);
      if (allowedMatch) {
        return allowedMatch[1]
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0);
      }
    }
    return [];
  }, []);

  // Load available techniques for the product
  useEffect(() => {
    const loadAvailableTechniques = async () => {
      if (!selectedProduct?.id) {
        setAvailableTechniques([]);
        return;
      }

      try {
        setLoadingTechniques(true);
        setError(null);

        // First, try to get print files without technique parameter
        const data = await printfulAPI.getPrintFiles(selectedProduct.id);
        
        if (data?.result?.available_techniques && Array.isArray(data.result.available_techniques)) {
          const techniques = data.result.available_techniques;
          setAvailableTechniques(techniques);
          
          // Set default technique if current selection is not available
          if (techniques.length > 0 && (!selectedTechnique || !techniques.includes(selectedTechnique))) {
            onTechniqueChange(techniques[0]);
          }
        } else {
          // If no available_techniques in response, use fallback
          const fallbackTechniques = ['DTG', 'DTFILM'];
          setAvailableTechniques(fallbackTechniques);
          
          if (!selectedTechnique || !fallbackTechniques.includes(selectedTechnique)) {
            onTechniqueChange(fallbackTechniques[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load available techniques:', err);
        
        // Try to parse error message for allowed techniques
        let errorMessage = '';
        const error = err as any;
        
        if (error?.response?.data?.result) {
          errorMessage = error.response.data.result;
        } else if (error?.response?.data?.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }

        const parsedTechniques = parseAllowedTechniques(errorMessage);
        
        if (parsedTechniques.length > 0) {
          setAvailableTechniques(parsedTechniques);
          
          if (!selectedTechnique || !parsedTechniques.includes(selectedTechnique)) {
            onTechniqueChange(parsedTechniques[0]);
          }
        } else {
          // Ultimate fallback
          const fallbackTechniques = ['DTG'];
          setAvailableTechniques(fallbackTechniques);
          
          if (!selectedTechnique || !fallbackTechniques.includes(selectedTechnique)) {
            onTechniqueChange(fallbackTechniques[0]);
          }
          
          setError('Could not determine available techniques. Using default.');
        }
      } finally {
        setLoadingTechniques(false);
      }
    };

    loadAvailableTechniques();
  }, [selectedProduct?.id, parseAllowedTechniques, onTechniqueChange]);

  // Load print files data with selected technique
  useEffect(() => {
    const loadPrintFilesData = async () => {
      if (!selectedProduct?.id || !selectedTechnique || availableTechniques.length === 0) {
        setPrintFilesData(null);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const data = await printfulAPI.getPrintFiles(selectedProduct.id, selectedTechnique);
        setPrintFilesData(data?.result || null);
      } catch (err) {
        console.error('Failed to load print files data:', err);
        setPrintFilesData(null);
        setError('Failed to load style options for this technique.');
      } finally {
        setLoading(false);
      }
    };

    loadPrintFilesData();
  }, [selectedProduct?.id, selectedTechnique, availableTechniques]);

  const availableOptionGroups = printFilesData?.option_groups || [];
  const availableOptions = printFilesData?.options || [];

  if (!selectedProduct?.id) {
    return (
      <div className="text-center p-4">
        <p className="text-sm text-gray-500">Please select a product first</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Printing Technique Selection */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2" />
          Printing Technique
        </h4>
        
        {loadingTechniques ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600 mr-2"></div>
            <span className="text-sm text-gray-600">Loading available techniques...</span>
          </div>
        ) : availableTechniques.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableTechniques.map((techniqueValue) => {
              const technique = ALL_PRINTING_TECHNIQUES[techniqueValue as TechniqueKey] || {
                label: techniqueValue,
                description: `${techniqueValue} printing technique`
              };
              
              return (
                <button
                  key={techniqueValue}
                  onClick={() => onTechniqueChange(techniqueValue)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedTechnique === techniqueValue
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-300 hover:border-gray-400 bg-white'
                  }`}
                >
                  <div className="font-semibold text-sm">{technique.label}</div>
                  <div className="text-xs text-gray-600 mt-1">{technique.description}</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">No printing techniques available for this product</p>
          </div>
        )}
      </div>

      {/* Mockup Style Options */}
      {(availableOptionGroups.length > 0 || availableOptions.length > 0) && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <Palette className="w-4 h-4 mr-2" />
            Mockup Styles
          </h4>

          {/* Option Groups */}
          {availableOptionGroups.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">Style Groups</label>
              <div className="flex flex-wrap gap-2">
                {availableOptionGroups.map((group: string) => (
                  <button
                    key={group}
                    onClick={() => {
                      const newGroups = selectedOptionGroups.includes(group)
                        ? selectedOptionGroups.filter(g => g !== group)
                        : [...selectedOptionGroups, group];
                      onOptionGroupsChange(newGroups);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                      selectedOptionGroups.includes(group)
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Individual Options */}
          {availableOptions.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Style Options</label>
              <div className="flex flex-wrap gap-2">
                {availableOptions.map((option: string) => (
                  <button
                    key={option}
                    onClick={() => {
                      const newOptions = selectedOptions.includes(option)
                        ? selectedOptions.filter(o => o !== option)
                        : [...selectedOptions, option];
                      onOptionsChange(newOptions);
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
                      selectedOptions.includes(option)
                        ? 'bg-green-500 text-white border-green-500 shadow-lg'
                        : 'bg-white text-gray-800 border-gray-300 hover:border-green-400 hover:text-green-600'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Options */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
          <Sparkles className="w-4 h-4 mr-2" />
          Advanced Options
        </h4>

        {/* Lifelike Effect */}
        <div className="mb-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={lifelikeEnabled}
              onChange={(e) => onLifelikeChange(e.target.checked)}
              className="w-5 h-5 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
            />
            <div>
              <span className="font-semibold text-gray-900">Lifelike Effect</span>
              <p className="text-sm text-gray-600">Simulates how dark designs look over dark products</p>
            </div>
          </label>
        </div>

        {/* Mockup Width */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Mockup Width: {mockupWidth}px
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={mockupWidth}
              onChange={(e) => onWidthChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="w-20">
              <input
                type="number"
                min="50"
                max="2000"
                step="50"
                value={mockupWidth}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 50 && value <= 2000) {
                    onWidthChange(value);
                  }
                }}
                className="w-full px-2 py-1 text-sm font-semibold text-gray-900 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Higher width = better quality but slower generation</p>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading style options...</p>
        </div>
      )}
    </div>
  );
};

export default AdvancedMockupOptions;