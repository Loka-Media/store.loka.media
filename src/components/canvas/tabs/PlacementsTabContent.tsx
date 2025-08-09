'use client';

import { Layers, CheckCircle } from 'lucide-react';

interface PrintFilesData {
  product_id: number;
  available_placements: Record<string, string>;
  printfiles: Array<{
    printfile_id: number;
    width: number;
    height: number;
    dpi: number;
    fill_mode: string;
    can_rotate: boolean;
  }>;
  variant_printfiles: Array<{
    variant_id: number;
    placements: Record<string, number>;
  }>;
}

interface DesignFile {
  id: number;
  filename: string;
  url: string;
  type: "design";
  placement: string;
  position: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
    limit_to_print_area: boolean;
  };
}

interface PlacementsTabContentProps {
  printFiles: PrintFilesData | null;
  activePlacement: string;
  setActivePlacement: (placement: string) => void;
  designFiles: DesignFile[];
}

const PlacementsTabContent: React.FC<PlacementsTabContentProps> = ({
  printFiles,
  activePlacement,
  setActivePlacement,
  designFiles,
}) => {
  if (!printFiles) {
    return (
      <div className="text-center py-8">
        <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl inline-flex items-center justify-center mb-4">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Print Files</h3>
        <p className="text-gray-400 text-sm font-medium">Select variants first to load placements</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl inline-flex items-center justify-center mb-4">
          <Layers className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Placements</h3>
        <p className="text-gray-400 text-sm font-medium">Choose where to place your designs</p>
      </div>

      <div className="space-y-3">
        {Object.entries(printFiles.available_placements).map(([key, label]) => {
          const hasDesign = designFiles.some((df) => df.placement === key);
          const isActive = activePlacement === key;

          return (
            <button
              key={key}
              onClick={() => setActivePlacement(key)}
              className={`w-full text-left px-5 py-4 rounded-xl text-sm transition-all duration-300 border-2 ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400 shadow-lg'
                  : hasDesign
                  ? 'text-white bg-green-900/30 border-green-500/50 hover:bg-green-900/40'
                  : 'text-gray-300 bg-black/60 border-gray-700 hover:border-gray-600 hover:bg-black/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    hasDesign ? 'bg-green-400 animate-pulse' : 'bg-gray-600'
                  }`} />
                  <span className="font-semibold">{label}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {hasDesign && (
                    <div className="flex items-center space-x-1 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-bold">Design Added</span>
                    </div>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </div>
              </div>

              {isActive && (
                <div className="mt-3 pt-3 border-t border-orange-300/30">
                  <p className="text-xs text-orange-100 font-medium">
                    Currently selected placement - add designs in the Upload tab
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Placement Summary */}
      <div className="bg-black/40 rounded-2xl p-5 border border-gray-800">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-200 mb-2">
            Placement Progress
          </div>
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-400 font-medium">
                {designFiles.length} with designs
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
              <span className="text-gray-400 font-medium">
                {Object.keys(printFiles.available_placements).length - designFiles.length} available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlacementsTabContent;