import React from 'react';
import Image from 'next/image';
import { PlayCircle } from 'lucide-react';
import { DesignFile, AdvancedMockupOptions } from './types';

interface PreviewTabProps {
  designFiles: DesignFile[];
  mockupUrls?: Array<{
    url: string;
    placement: string;
    variant_ids: number[];
    title?: string;
    option?: string;
    option_group?: string;
  }>;
  mockupStatus?: string;
  isGeneratingPreview: boolean;
  selectedTechnique: string;
  advancedOptions: AdvancedMockupOptions;
  onGeneratePreview: (options?: {
    technique?: string;
    optionGroups?: string[];
    options?: string[];
    lifelike?: boolean;
    width?: number;
  }) => void;
}

const PreviewTab: React.FC<PreviewTabProps> = ({
  designFiles,
  mockupUrls,
  mockupStatus,
  isGeneratingPreview,
  selectedTechnique,
  advancedOptions,
  onGeneratePreview
}) => {
  const handleGeneratePreview = () => {
    onGeneratePreview({
      technique: selectedTechnique,
      lifelike: advancedOptions.lifelike,
      width: advancedOptions.width,
      optionGroups: advancedOptions.optionGroups,
      options: advancedOptions.options,
    });
  };

  return (
    <div className="flex-1 bg-gray-900 min-h-screen">
      {/* Preview Header */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Mockup Preview</h2>
            <p className="text-gray-400 text-sm">Generate and review your product mockups</p>
          </div>
          
          {/* Generate Preview Button */}
          <button
            onClick={handleGeneratePreview}
            disabled={isGeneratingPreview || designFiles.length === 0}
            className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            {isGeneratingPreview ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                Generate Preview
              </>
            )}
          </button>
        </div>
        
        {/* Generation Status */}
        {isGeneratingPreview && mockupStatus && (
          <div className="mt-4 p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              <span className="text-orange-300 text-sm font-medium">{mockupStatus}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Preview Content */}
      <div className="flex-1 p-2 sm:p-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
        {mockupUrls && mockupUrls.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-6">
            {mockupUrls.map((mockup, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300"
              >
                <div className="aspect-square bg-gray-700 flex items-center justify-center">
                  <Image
                    src={mockup.url}
                    alt={mockup.title || `Mockup ${index + 1}`}
                    width={400}
                    height={400}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm mb-1">
                    {mockup.title || `Mockup ${index + 1}`}
                  </h3>
                  <p className="text-gray-400 text-xs">
                    {mockup.placement} • {mockup.variant_ids?.length || 1} variants
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <PlayCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Mockups Generated</h3>
              <p className="text-gray-400">
                {designFiles.length === 0
                  ? "Add designs from the Upload tab, then return here to generate mockups."
                  : "Use the 'Generate Preview' button in the header to create product mockups with your designs."
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewTab;