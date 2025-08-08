'use client';

import { Eye, Play, CheckCircle, ChevronRight, Zap, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

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

interface MockupUrl {
  url: string;
  placement: string;
  variant_ids: number[];
  title?: string;
  option?: string;
  option_group?: string;
}

interface GenerateTabContentProps {
  onGeneratePreview: (advancedOptions?: {
    technique?: string;
    optionGroups?: string[];
    options?: string[];
    lifelike?: boolean;
    width?: number;
  }) => void;
  selectedTechnique: string;
  selectedOptionGroups: string[];
  selectedOptions: string[];
  lifelikeEnabled: boolean;
  mockupWidth: number;
  designFiles: DesignFile[];
  selectedVariants: number[];
  isGeneratingPreview: boolean;
  mockupUrls?: MockupUrl[];
  mockupStatus?: string;
  onNext: () => void;
}

const GenerateTabContent: React.FC<GenerateTabContentProps> = ({
  onGeneratePreview,
  selectedTechnique,
  selectedOptionGroups,
  selectedOptions,
  lifelikeEnabled,
  mockupWidth,
  designFiles,
  selectedVariants,
  isGeneratingPreview,
  mockupUrls,
  mockupStatus,
  onNext,
}) => {
  const handleGenerate = () => {
    onGeneratePreview({
      technique: selectedTechnique,
      optionGroups: selectedOptionGroups,
      options: selectedOptions,
      lifelike: lifelikeEnabled,
      width: mockupWidth,
    });
  };

  const isAdvancedSetup = 
    selectedTechnique !== "DTG" ||
    selectedOptionGroups.length > 0 ||
    selectedOptions.length > 0 ||
    lifelikeEnabled ||
    mockupWidth !== 1000;

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl inline-flex items-center justify-center mb-4">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Generate Mockup</h3>
        <p className="text-gray-400 text-sm font-medium">Create professional product previews</p>
      </div>

      {/* Pre-generation Summary */}
      <div className="space-y-4">
        <div className="bg-black/40 rounded-2xl p-5 border border-gray-800">
          <div className="text-sm font-bold text-gray-200 mb-3">Ready to Generate</div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Design Files:</span>
              <span className="text-white font-bold">{designFiles.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Product Variants:</span>
              <span className="text-white font-bold">{selectedVariants.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Placements:</span>
              <span className="text-white font-bold">
                {[...new Set(designFiles.map(df => df.placement))].join(', ') || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Advanced Settings Summary */}
        {isAdvancedSetup && (
          <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-5 border border-purple-500/30">
            <div className="flex items-center space-x-2 mb-3">
              <Zap className="w-4 h-4 text-purple-400" />
              <div className="text-sm font-bold text-purple-300">Advanced Configuration Active</div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">Technique:</span>
                <span className="text-white font-medium">{selectedTechnique}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Resolution:</span>
                <span className="text-white font-medium">{mockupWidth}px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Lifelike:</span>
                <span className="text-white font-medium">{lifelikeEnabled ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Styles:</span>
                <span className="text-white font-medium">
                  {selectedOptionGroups.length + selectedOptions.length || 'Default'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="space-y-4">
        <button
          onClick={handleGenerate}
          disabled={designFiles.length === 0 || selectedVariants.length === 0 || isGeneratingPreview}
          className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-green-500 hover:shadow-xl disabled:hover:shadow-lg flex items-center justify-center space-x-3"
        >
          {isGeneratingPreview ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Generating Preview...</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              <span>Generate Mockup Preview</span>
              {isAdvancedSetup && (
                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                  Advanced
                </span>
              )}
            </>
          )}
        </button>

        {(designFiles.length === 0 || selectedVariants.length === 0) && (
          <div className="text-center text-gray-400 text-sm">
            Add designs and select variants to enable generation
          </div>
        )}
      </div>

      {/* Generation Status */}
      {isGeneratingPreview && mockupStatus && (
        <div className="bg-blue-900/20 rounded-2xl p-4 border border-blue-500/30">
          <div className="text-sm font-bold text-blue-300 mb-2">Generation Status</div>
          <div className="text-xs text-white leading-relaxed">
            {mockupStatus}
          </div>
        </div>
      )}

      {/* Generated Mockups */}
      {mockupUrls && mockupUrls.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <div className="text-sm font-bold text-green-300">
                {mockupUrls.length} Mockup{mockupUrls.length > 1 ? 's' : ''} Generated
              </div>
            </div>
            <div className="text-xs text-gray-400 font-medium">
              Ready to finalize
            </div>
          </div>

          {/* Mockup Grid */}
          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {mockupUrls.map((mockup, index) => (
              <div key={index} className="group relative">
                <div className="bg-black/60 rounded-2xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300">
                  <div className="aspect-square relative">
                    <Image
                      src={mockup.url}
                      alt={mockup.title || `${mockup.placement} mockup`}
                      fill
                      className="object-cover"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-medium">
                      {mockup.placement.toUpperCase()}
                    </div>
                    
                    {mockup.option_group && (
                      <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {mockup.option_group}
                      </div>
                    )}

                    {mockup.variant_ids && mockup.variant_ids.length > 0 && (
                      <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                        {mockup.variant_ids.length} variant{mockup.variant_ids.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <div className="text-sm font-bold text-white truncate">
                      {mockup.title || `${mockup.placement.charAt(0).toUpperCase() + mockup.placement.slice(1)} View`}
                    </div>
                    {mockup.option && mockup.option !== "Main" && (
                      <div className="text-xs text-gray-400 mt-1">
                        {mockup.option} Style
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Finalize Button */}
          <button
            onClick={onNext}
            className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-2xl font-bold text-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg border-2 border-emerald-500 hover:shadow-xl flex items-center justify-center space-x-3"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Finalize Product</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isGeneratingPreview && (!mockupUrls || mockupUrls.length === 0) && (
        <div className="text-center py-8 bg-black/40 rounded-2xl border border-gray-800">
          <div className="p-3 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl inline-flex items-center justify-center mb-4">
            <ImageIcon className="w-6 h-6 text-white" />
          </div>
          <div className="text-lg font-bold text-gray-300 mb-2">No mockups yet</div>
          <div className="text-sm text-gray-500">Click Generate to create professional previews</div>
        </div>
      )}
    </div>
  );
};

export default GenerateTabContent;