import React, { useState } from 'react';
import { 
  Layers, 
  Image as ImageIcon, 
  Move, 
  AlignCenter,
  AlignLeft,
  AlignRight,
  RotateCw,
  Maximize,
  CheckCircle,
  Plus
} from 'lucide-react';
import Image from 'next/image';
import { DesignFile, UploadedFile, PrintFilesData } from '../types';

interface PlacementTab {
  id: string;
  label: string;
  hasDesign: boolean;
  isEmbroidery: boolean;
}

interface DesignTabContentProps {
  printFiles: PrintFilesData | null;
  activePlacement: string;
  setActivePlacement: (placement: string) => void;
  selectedPlacements: string[];
  setSelectedPlacements: (placements: string[]) => void;
  designFiles: DesignFile[];
  selectedDesignFile: DesignFile | null;
  setSelectedDesignFile: (file: DesignFile | null) => void;
  updateDesignPosition: (designId: number, updates: any) => void;
  uploadedFiles: UploadedFile[];
  handleAddDesign: (file: UploadedFile, placement: string) => void;
  onShowPositionPanel: () => void;
  selectedFile: UploadedFile | null;
  setSelectedFile: (file: UploadedFile | null) => void;
  applyQuickPosition: (position: string) => void;
}

type WorkflowStep = 'placement' | 'image' | 'position';

const DesignTabContent: React.FC<DesignTabContentProps> = ({
  printFiles,
  activePlacement,
  setActivePlacement,
  selectedPlacements,
  setSelectedPlacements,
  designFiles,
  selectedDesignFile,
  setSelectedDesignFile,
  uploadedFiles,
  handleAddDesign,
  selectedFile,
  setSelectedFile,
  applyQuickPosition,
}) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('placement');

  // Get placement tabs from print files
  const placementTabs: PlacementTab[] = printFiles?.available_placements
    ? Object.entries(printFiles.available_placements).map(([key, label]) => ({
        id: key,
        label: label,
        hasDesign: designFiles.some(df => df.placement === key),
        isEmbroidery: key.includes("embroidery")
      }))
    : [];

  const handlePlacementSelect = (placement: string) => {
    setActivePlacement(placement);
    
    // Check if this placement already has a design
    const existingDesign = designFiles.find(df => df.placement === placement);
    if (existingDesign) {
      setSelectedDesignFile(existingDesign);
      setCurrentStep('position');
    } else {
      setCurrentStep('image');
    }
  };

  const handleImageSelect = (file: UploadedFile) => {
    setSelectedFile(file);
    if (activePlacement) {
      handleAddDesign(file, activePlacement);
      setCurrentStep('position');
    }
  };

  const handleRemoveDesign = (placement: string) => {
    const design = designFiles.find(df => df.placement === placement);
    if (design) {
      // Remove from selectedPlacements and designFiles
      setSelectedPlacements(selectedPlacements.filter(p => p !== placement));
      setSelectedDesignFile(null);
      setCurrentStep('image');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'placement':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl inline-flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Choose Placement</h4>
              <p className="text-gray-400 text-sm">Select where to place your design</p>
            </div>

            <div className="space-y-3">
              {placementTabs.length === 0 ? (
                <div className="text-center py-8 bg-black/40 rounded-2xl border border-gray-800">
                  <div className="text-gray-400">Loading placements...</div>
                </div>
              ) : (
                placementTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handlePlacementSelect(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-4 border rounded-2xl text-sm font-medium transition-all duration-300 ${
                      activePlacement === tab.id
                        ? "border-orange-500 bg-orange-500/10 text-orange-300"
                        : tab.hasDesign 
                        ? "border-green-500/50 bg-green-500/5 text-green-300 hover:border-green-500"
                        : "border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {tab.isEmbroidery && (
                        <div className="w-3 h-3 bg-purple-500 rounded-full" title="Embroidery placement"></div>
                      )}
                      <span className="font-semibold">{tab.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {tab.hasDesign ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl inline-flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Select Image</h4>
              <p className="text-gray-400 text-sm">Choose a design for <span className="text-orange-400 font-semibold">{activePlacement}</span></p>
            </div>

            <button
              onClick={() => setCurrentStep('placement')}
              className="w-full mb-4 px-3 py-2 text-sm text-gray-400 hover:text-white border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
            >
              ← Change Placement
            </button>

            {uploadedFiles.length === 0 ? (
              <div className="text-center py-12 bg-black/40 rounded-2xl border border-gray-800">
                <div className="p-4 bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl inline-flex items-center justify-center mb-4">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <div className="text-lg font-bold text-gray-300 mb-2">No images available</div>
                <div className="text-sm text-gray-500">Go to Upload tab to add design files</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleImageSelect(file)}
                    className={`group relative p-1 border rounded-2xl transition-all duration-300 ${
                      selectedFile?.id === file.id
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">
                      <Image
                        src={file.thumbnail_url || file.file_url || ''}
                        alt={file.filename}
                        width={120}
                        height={120}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div className="p-2">
                      <div className="text-xs font-medium text-white truncate">
                        {file.filename}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'position':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl inline-flex items-center justify-center mb-4">
                <Move className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Position Design</h4>
              <p className="text-gray-400 text-sm">Perfect the placement of your design</p>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCurrentStep('placement')}
                className="flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
              >
                ← Placement
              </button>
              <button
                onClick={() => setCurrentStep('image')}
                className="flex-1 px-3 py-2 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-xl hover:border-gray-600 transition-colors"
              >
                ← Image
              </button>
            </div>

            {/* Current Design Info */}
            {selectedDesignFile && (
              <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-700 rounded-xl overflow-hidden">
                    <Image
                      src={selectedDesignFile.url}
                      alt={selectedDesignFile.filename}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{selectedDesignFile.filename}</div>
                    <div className="text-xs text-gray-400">On {selectedDesignFile.placement}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveDesign(selectedDesignFile.placement)}
                    className="px-3 py-1 text-xs text-red-400 hover:text-red-300 border border-red-500/50 rounded-lg hover:border-red-500 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* Quick Position Controls */}
            <div className="space-y-4">
              <div className="text-sm font-bold text-gray-200">Quick Position</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { position: 'top-left', label: '↖' },
                  { position: 'top-center', label: '↑' },
                  { position: 'top-right', label: '↗' },
                  { position: 'center-left', label: '←' },
                  { position: 'center', label: '⊙' },
                  { position: 'center-right', label: '→' },
                  { position: 'bottom-left', label: '↙' },
                  { position: 'bottom-center', label: '↓' },
                  { position: 'bottom-right', label: '↘' },
                ].map(({ position, label }) => (
                  <button
                    key={position}
                    onClick={() => applyQuickPosition(position)}
                    className="aspect-square flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-xl text-white text-lg transition-colors"
                    title={position.replace('-', ' ')}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Position Details */}
            {selectedDesignFile && (
              <div className="space-y-4">
                <div className="text-sm font-bold text-gray-200">Position Details</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">X Position</label>
                    <div className="text-sm text-white font-mono bg-gray-800 px-3 py-2 rounded-lg">
                      {Math.round(selectedDesignFile.position.left)}px
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Y Position</label>
                    <div className="text-sm text-white font-mono bg-gray-800 px-3 py-2 rounded-lg">
                      {Math.round(selectedDesignFile.position.top)}px
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Width</label>
                    <div className="text-sm text-white font-mono bg-gray-800 px-3 py-2 rounded-lg">
                      {Math.round(selectedDesignFile.position.width)}px
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Height</label>
                    <div className="text-sm text-white font-mono bg-gray-800 px-3 py-2 rounded-lg">
                      {Math.round(selectedDesignFile.position.height)}px
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {[
          { step: 'placement', label: 'Placement', icon: Layers },
          { step: 'image', label: 'Image', icon: ImageIcon },
          { step: 'position', label: 'Position', icon: Move },
        ].map(({ step, label, icon: Icon }, index) => (
          <div key={step} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step as WorkflowStep)}
              className={`p-2 rounded-xl transition-all ${
                currentStep === step
                  ? 'bg-orange-500 text-white'
                  : index < ['placement', 'image', 'position'].indexOf(currentStep)
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
            {index < 2 && (
              <div className={`w-8 h-px mx-2 ${
                index < ['placement', 'image', 'position'].indexOf(currentStep)
                  ? 'bg-green-500'
                  : 'bg-gray-700'
              }`} />
            )}
          </div>
        ))}
      </div>

      <div className="text-xs text-center text-gray-500 font-medium">
        Step {['placement', 'image', 'position'].indexOf(currentStep) + 1} of 3
      </div>

      {/* Step Content */}
      <div className="flex-1">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default DesignTabContent;