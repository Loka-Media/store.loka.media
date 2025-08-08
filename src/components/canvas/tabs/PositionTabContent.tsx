'use client';

import { Move, Target } from 'lucide-react';

interface PrintFile {
  printfile_id: number;
  width: number;
  height: number;
  dpi: number;
  fill_mode: string;
  can_rotate: boolean;
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

interface PositionTabContentProps {
  selectedDesignFile: DesignFile;
  activePrintFile: PrintFile;
  updateDesignPosition: (designId: number, updates: Partial<DesignFile["position"]>) => void;
}

const PositionTabContent: React.FC<PositionTabContentProps> = ({
  selectedDesignFile,
  activePrintFile,
  updateDesignPosition,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl inline-flex items-center justify-center mb-4">
          <Move className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Position Control</h3>
        <p className="text-gray-400 text-sm font-medium">Fine-tune your design placement</p>
      </div>

      {/* Design Info */}
      <div className="bg-black/40 rounded-2xl p-4 border border-gray-800">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-200 mb-1">
            Currently Editing
          </div>
          <div className="text-lg font-bold text-white truncate">
            {selectedDesignFile.filename}
          </div>
          <div className="text-xs text-gray-400 capitalize">
            {selectedDesignFile.placement} placement
          </div>
        </div>
      </div>

      {/* Size Controls */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-gray-200">Size</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              Width (px)
            </label>
            <input
              type="number"
              value={Math.round(selectedDesignFile.position.width)}
              onChange={(e) =>
                updateDesignPosition(selectedDesignFile.id, {
                  width: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 transition-all duration-200"
              min="50"
              max={activePrintFile.width}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              Height (px)
            </label>
            <input
              type="number"
              value={Math.round(selectedDesignFile.position.height)}
              onChange={(e) =>
                updateDesignPosition(selectedDesignFile.id, {
                  height: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 transition-all duration-200"
              min="50"
              max={activePrintFile.height}
            />
          </div>
        </div>
      </div>

      {/* Position Controls */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-gray-200">Position</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              Top (px)
            </label>
            <input
              type="number"
              value={Math.round(selectedDesignFile.position.top)}
              onChange={(e) =>
                updateDesignPosition(selectedDesignFile.id, {
                  top: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 transition-all duration-200"
              min="0"
              max={activePrintFile.height - selectedDesignFile.position.height}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-2">
              Left (px)
            </label>
            <input
              type="number"
              value={Math.round(selectedDesignFile.position.left)}
              onChange={(e) =>
                updateDesignPosition(selectedDesignFile.id, {
                  left: parseInt(e.target.value) || 0,
                })
              }
              className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 transition-all duration-200"
              min="0"
              max={activePrintFile.width - selectedDesignFile.position.width}
            />
          </div>
        </div>
      </div>

      {/* Quick Position Presets */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="w-4 h-4 text-gray-400" />
          <div className="text-sm font-bold text-gray-200">Quick Position</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["top-left", "TL"],
            ["top-center", "TC"],
            ["top-right", "TR"],
            ["center-left", "CL"],
            ["center", "C"],
            ["center-right", "CR"],
            ["bottom-left", "BL"],
            ["bottom-center", "BC"],
            ["bottom-right", "BR"],
          ].map(([position, label]) => (
            <button
              key={position}
              onClick={() => {
                const { width, height, area_width, area_height } = selectedDesignFile.position;
                let top = 0, left = 0;

                // Calculate vertical position
                if (position.includes("center") && !position.includes("top") && !position.includes("bottom")) {
                  top = (area_height - height) / 2;
                } else if (position.includes("bottom")) {
                  top = area_height - height;
                }

                // Calculate horizontal position
                if (position.includes("center") && !position.includes("left") && !position.includes("right")) {
                  left = (area_width - width) / 2;
                } else if (position.includes("right")) {
                  left = area_width - width;
                }

                updateDesignPosition(selectedDesignFile.id, { top, left });
              }}
              className="px-3 py-3 text-sm font-bold bg-black/60 border border-gray-700 rounded-xl hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 text-white hover:text-orange-400"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Print Area Info */}
      <div className="bg-blue-900/20 rounded-2xl p-4 border border-blue-500/30">
        <div className="space-y-2">
          <div className="text-sm font-bold text-blue-300">Print Area Dimensions</div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-gray-400">Width:</span>
              <span className="text-white font-bold ml-2">{activePrintFile.width}px</span>
            </div>
            <div>
              <span className="text-gray-400">Height:</span>
              <span className="text-white font-bold ml-2">{activePrintFile.height}px</span>
            </div>
            <div>
              <span className="text-gray-400">DPI:</span>
              <span className="text-white font-bold ml-2">{activePrintFile.dpi}</span>
            </div>
            <div>
              <span className="text-gray-400">Fill Mode:</span>
              <span className="text-white font-bold ml-2 capitalize">{activePrintFile.fill_mode}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionTabContent;