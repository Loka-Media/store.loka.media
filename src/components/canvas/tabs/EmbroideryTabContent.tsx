import React from 'react';
import { EmbroideryOptions } from '../types';

interface EmbroideryTabContentProps {
  embroideryOptions: EmbroideryOptions;
  setEmbroideryOptions: (options: EmbroideryOptions) => void;
  selectedTechnique: string;
  activePlacement: string;
  getThreadColorOptions: (placementKey: string) => any;
}

const EmbroideryTabContent: React.FC<EmbroideryTabContentProps> = ({
  embroideryOptions,
  setEmbroideryOptions,
  selectedTechnique,
  activePlacement,
  getThreadColorOptions
}) => {
  const handleThreadColorChange = (placement: string, colorCode: string) => {
    const key = `thread_colors_${placement}` as keyof EmbroideryOptions;
    const currentColors = embroideryOptions[key] as string[] || [];
    
    setEmbroideryOptions({
      ...embroideryOptions,
      [key]: currentColors.includes(colorCode) 
        ? currentColors.filter(c => c !== colorCode)
        : [...currentColors, colorCode]
    });
  };

  if (selectedTechnique !== "Embroidery") {
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-white">Embroidery Options</h3>
        <div className="text-sm text-gray-400">
          Switch to Embroidery technique to configure embroidery options.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white">Embroidery Options</h3>
      
      {/* Thread Colors for Active Placement */}
      {activePlacement && (
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-gray-300 capitalize">
            Thread Colors - {activePlacement.replace('_', ' ')}
          </h4>
          
          {(() => {
            const colors = getThreadColorOptions(activePlacement);
            const hasColors = Object.keys(colors).length > 0;
            
            if (!hasColors) {
              return (
                <div className="text-xs text-gray-400 p-3 bg-gray-800 rounded-lg">
                  No thread colors available for this placement
                </div>
              );
            }

            const placementName = activePlacement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const currentColors = embroideryOptions[`thread_colors_${activePlacement}` as keyof EmbroideryOptions] as string[] || [];

            return (
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(colors).map(([colorCode, colorName]) => {
                  const isSelected = currentColors.includes(colorCode);
                  return (
                    <button
                      key={colorCode}
                      onClick={() => handleThreadColorChange(activePlacement, colorCode)}
                      className={`w-12 h-12 rounded-lg border-2 transition-all relative ${
                        isSelected
                          ? "border-white scale-110 shadow-lg"
                          : "border-gray-600 hover:border-gray-400"
                      }`}
                      style={{ backgroundColor: colorCode }}
                      title={`${colorName} (${colorCode})`}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/30 rounded-lg flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-300 mb-2">
          Special Instructions
        </label>
        <textarea
          value={embroideryOptions.notes}
          onChange={(e) => setEmbroideryOptions({
            ...embroideryOptions,
            notes: e.target.value
          })}
          placeholder="Add any special embroidery instructions..."
          className="w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-400 focus:ring-orange-500 focus:border-orange-500"
          rows={3}
        />
      </div>
    </div>
  );
};

export default EmbroideryTabContent;