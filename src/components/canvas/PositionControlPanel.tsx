import React, { useState } from 'react';
import { 
  Move, 
  RotateCw, 
  Maximize2, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  MousePointer,
  Grid3x3,
  Settings,
  X
} from 'lucide-react';
import { DesignFile } from './types';

interface PositionControlPanelProps {
  selectedDesignFile: DesignFile | null;
  updateDesignPosition: (designId: number, updates: any) => void;
  applyQuickPosition: (position: string) => void;
  onClose: () => void;
  activePrintFile: any;
}

const PositionControlPanel: React.FC<PositionControlPanelProps> = ({
  selectedDesignFile,
  updateDesignPosition,
  applyQuickPosition,
  onClose,
  activePrintFile
}) => {
  const [activeTab, setActiveTab] = useState<'position' | 'size' | 'alignment'>('position');
  const [manualEdit, setManualEdit] = useState({
    x: '',
    y: '',
    width: '',
    height: ''
  });

  if (!selectedDesignFile) {
    return (
      <div className="w-80 border-l border-gray-800 bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <MousePointer className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">Select a design to edit position</p>
        </div>
      </div>
    );
  }

  const handleManualUpdate = (field: string, value: string) => {
    setManualEdit(prev => ({ ...prev, [field]: value }));
  };

  const applyManualUpdate = (field: string) => {
    const numValue = parseInt(manualEdit[field as keyof typeof manualEdit]);
    if (isNaN(numValue)) return;

    const updates: any = {};
    
    // CRITICAL: Maintain ACTUAL DESIGN aspect ratio for width/height changes to prevent Printful errors
    if (field === 'width' || field === 'height') {
      if (!selectedDesignFile?.position) {
        console.error('No design file position - cannot maintain aspect ratio');
        return;
      }
      
      // Use the CURRENT design aspect ratio (which should match the actual image ratio)
      const currentDesignRatio = selectedDesignFile.position.width / selectedDesignFile.position.height;
      console.log(`🔒 Maintaining current design aspect ratio ${currentDesignRatio.toFixed(4)} for ${field} adjustment`);
      
      if (field === 'width') {
        // Adjust width, calculate height to maintain current design ratio
        const newWidth = numValue;
        const newHeight = newWidth / currentDesignRatio;
        
        updates.width = newWidth;
        updates.height = Math.round(newHeight);
        
        console.log(`📐 Width adjusted: ${newWidth}px → Height auto-calculated: ${Math.round(newHeight)}px`);
      } else if (field === 'height') {
        // Adjust height, calculate width to maintain current design ratio
        const newHeight = numValue;
        const newWidth = newHeight * currentDesignRatio;
        
        updates.height = newHeight;
        updates.width = Math.round(newWidth);
        
        console.log(`📐 Height adjusted: ${newHeight}px → Width auto-calculated: ${Math.round(newWidth)}px`);
      }
      
      // Show user feedback about aspect ratio maintenance
      const finalRatio = updates.width / updates.height;
      console.log(`✅ Final aspect ratio maintained: ${finalRatio.toFixed(4)} (matches design: ${currentDesignRatio.toFixed(4)})`);
      
    } else {
      // Position changes (x, y) don't affect aspect ratio
      switch (field) {
        case 'x':
          updates.left = numValue;
          break;
        case 'y':
          updates.top = numValue;
          break;
      }
    }
    
    updateDesignPosition(selectedDesignFile.id, updates);
    setManualEdit(prev => ({ ...prev, [field]: '' }));
  };

  const quickSizeAdjustments = [
    { label: '25%', multiplier: 0.25 },
    { label: '50%', multiplier: 0.5 },
    { label: '75%', multiplier: 0.75 },
    { label: '100%', multiplier: 1.0 },
  ];

  return (
    <div className="w-80 border-l border-gray-800 bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-orange-500" />
          <h3 className="font-semibold text-white">Position Controls</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Design Info */}
      <div className="p-4 border-b border-gray-800">
        <div className="text-sm font-medium text-white mb-1">
          {selectedDesignFile.filename}
        </div>
        <div className="text-xs text-gray-400 capitalize">
          Placement: {selectedDesignFile.placement.replace('_', ' ')}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-800">
        {[
          { id: 'position', label: 'Position', icon: MousePointer },
          { id: 'size', label: 'Size', icon: Maximize2 },
          { id: 'alignment', label: 'Align', icon: AlignCenter },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-orange-400 border-b-2 border-orange-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === 'position' && (
          <div className="space-y-6">
            {/* Quick Position Grid */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Quick Position</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { position: 'top-left', label: '↖', title: 'Top Left' },
                  { position: 'top-center', label: '↑', title: 'Top Center' },
                  { position: 'top-right', label: '↗', title: 'Top Right' },
                  { position: 'center-left', label: '←', title: 'Center Left' },
                  { position: 'center', label: '⊙', title: 'Center' },
                  { position: 'center-right', label: '→', title: 'Center Right' },
                  { position: 'bottom-left', label: '↙', title: 'Bottom Left' },
                  { position: 'bottom-center', label: '↓', title: 'Bottom Center' },
                  { position: 'bottom-right', label: '↘', title: 'Bottom Right' },
                ].map(({ position, label, title }) => (
                  <button
                    key={position}
                    onClick={() => applyQuickPosition(position)}
                    className="aspect-square flex items-center justify-center bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-lg transition-all"
                    title={title}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Position */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Precise Position</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">X Position (px)</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={manualEdit.x}
                        onChange={(e) => handleManualUpdate('x', e.target.value)}
                        placeholder={Math.round(selectedDesignFile.position.left).toString()}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        onClick={() => applyManualUpdate('x')}
                        disabled={!manualEdit.x}
                        className="px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white rounded-r-lg text-sm transition-colors"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Y Position (px)</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={manualEdit.y}
                        onChange={(e) => handleManualUpdate('y', e.target.value)}
                        placeholder={Math.round(selectedDesignFile.position.top).toString()}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        onClick={() => applyManualUpdate('y')}
                        disabled={!manualEdit.y}
                        className="px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white rounded-r-lg text-sm transition-colors"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Position Display */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Current Position</div>
                  <div className="text-sm text-white font-mono">
                    ({Math.round(selectedDesignFile.position.left)}, {Math.round(selectedDesignFile.position.top)})
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'size' && (
          <div className="space-y-6">
            {/* Quick Size */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Quick Size</h4>
              <div className="grid grid-cols-2 gap-2">
                {quickSizeAdjustments.map(({ label, multiplier }) => (
                  <button
                    key={label}
                    onClick={() => {
                      const maxWidth = activePrintFile?.width || 1000;
                      const maxHeight = activePrintFile?.height || 1000;
                      updateDesignPosition(selectedDesignFile.id, {
                        width: maxWidth * multiplier,
                        height: maxHeight * multiplier,
                      });
                    }}
                    className="px-4 py-2 bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-sm transition-all"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Size */}
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Custom Size</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={manualEdit.width}
                        onChange={(e) => handleManualUpdate('width', e.target.value)}
                        placeholder={Math.round(selectedDesignFile.position.width).toString()}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        onClick={() => applyManualUpdate('width')}
                        disabled={!manualEdit.width}
                        className="px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white rounded-r-lg text-sm transition-colors"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                    <div className="flex">
                      <input
                        type="number"
                        value={manualEdit.height}
                        onChange={(e) => handleManualUpdate('height', e.target.value)}
                        placeholder={Math.round(selectedDesignFile.position.height).toString()}
                        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-l-lg text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <button
                        onClick={() => applyManualUpdate('height')}
                        disabled={!manualEdit.height}
                        className="px-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-700 text-white rounded-r-lg text-sm transition-colors"
                      >
                        ✓
                      </button>
                    </div>
                  </div>
                </div>

                {/* Current Size Display */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">Current Size</div>
                  <div className="text-sm text-white font-mono">
                    {Math.round(selectedDesignFile.position.width)} × {Math.round(selectedDesignFile.position.height)}px
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alignment' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Horizontal Alignment</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => applyQuickPosition('center-left')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  <AlignLeft className="w-4 h-4" />
                  Left
                </button>
                <button
                  onClick={() => applyQuickPosition('center')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  <AlignCenter className="w-4 h-4" />
                  Center
                </button>
                <button
                  onClick={() => applyQuickPosition('center-right')}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  <AlignRight className="w-4 h-4" />
                  Right
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-200 mb-3">Vertical Alignment</h4>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => applyQuickPosition('top-center')}
                  className="px-3 py-2 bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  Top
                </button>
                <button
                  onClick={() => applyQuickPosition('center')}
                  className="px-3 py-2 bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  Middle
                </button>
                <button
                  onClick={() => applyQuickPosition('bottom-center')}
                  className="px-3 py-2 bg-gray-800 hover:bg-orange-500/20 border border-gray-600 hover:border-orange-500/50 rounded-lg text-white text-sm transition-all"
                >
                  Bottom
                </button>
              </div>
            </div>

            {/* Print Area Info */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Print Area</div>
              <div className="text-sm text-white font-mono">
                {activePrintFile ? `${activePrintFile.width} × ${activePrintFile.height}px` : 'Loading...'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionControlPanel;