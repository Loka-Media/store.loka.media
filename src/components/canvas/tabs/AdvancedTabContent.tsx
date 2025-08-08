'use client';

import { Settings, Palette, Wand2, Zap } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  variants?: Array<{
    id: number;
    size: string;
    color: string;
    color_code: string;
    image: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface AdvancedTabContentProps {
  selectedProduct: Product;
  selectedTechnique: string;
  setSelectedTechnique: (technique: string) => void;
  selectedOptionGroups: string[];
  setSelectedOptionGroups: (groups: string[]) => void;
  selectedOptions: string[];
  setSelectedOptions: (options: string[]) => void;
  lifelikeEnabled: boolean;
  setLifelikeEnabled: (enabled: boolean) => void;
  mockupWidth: number;
  setMockupWidth: (width: number) => void;
}

const AdvancedTabContent: React.FC<AdvancedTabContentProps> = ({
  selectedProduct,
  selectedTechnique,
  setSelectedTechnique,
  selectedOptionGroups,
  setSelectedOptionGroups,
  selectedOptions,
  setSelectedOptions,
  lifelikeEnabled,
  setLifelikeEnabled,
  mockupWidth,
  setMockupWidth,
}) => {
  const techniques = ["DTG", "Sublimation", "Embroidery", "Screen Print"];
  const optionGroups = ["Background", "Model", "Lighting", "Angle"];
  const options = ["Flat", "Lifestyle", "Studio", "Outdoor", "Casual", "Professional"];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl inline-flex items-center justify-center mb-4">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Advanced Options</h3>
        <p className="text-gray-400 text-sm font-medium">Customize your mockup generation</p>
      </div>

      {/* Technique Selection */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-gray-400" />
          <div className="text-sm font-bold text-gray-200">Printing Technique</div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {techniques.map((technique) => (
            <button
              key={technique}
              onClick={() => setSelectedTechnique(technique)}
              className={`p-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                selectedTechnique === technique
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-400'
                  : 'bg-black/60 text-gray-300 border-gray-700 hover:border-gray-600'
              }`}
            >
              {technique}
            </button>
          ))}
        </div>
      </div>

      {/* Mockup Width */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Wand2 className="w-4 h-4 text-gray-400" />
          <div className="text-sm font-bold text-gray-200">Mockup Resolution</div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-300 font-medium">Width: {mockupWidth}px</span>
            <div className="text-xs text-gray-500">
              {mockupWidth < 800 ? 'Preview' : mockupWidth < 1200 ? 'Standard' : 'High Quality'}
            </div>
          </div>
          <input
            type="range"
            min="600"
            max="2000"
            step="100"
            value={mockupWidth}
            onChange={(e) => setMockupWidth(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => setMockupWidth(600)}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                mockupWidth === 600 ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setMockupWidth(1000)}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                mockupWidth === 1000 ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setMockupWidth(1600)}
              className={`py-2 px-3 rounded-lg font-medium transition-all ${
                mockupWidth === 1600 ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              HD
            </button>
          </div>
        </div>
      </div>

      {/* Lifelike Toggle */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-gray-400" />
          <div className="text-sm font-bold text-gray-200">Render Style</div>
        </div>
        <div className="bg-black/40 rounded-2xl p-4 border border-gray-800">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${
                lifelikeEnabled 
                  ? 'bg-orange-500 border-orange-500' 
                  : 'bg-black border-gray-600'
              }`}>
                {lifelikeEnabled && (
                  <div className="w-2 h-2 bg-white rounded-full mt-1 ml-1"></div>
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-white">Lifelike Rendering</div>
                <div className="text-xs text-gray-400">Enhanced realistic mockups</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={lifelikeEnabled}
              onChange={(e) => setLifelikeEnabled(e.target.checked)}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      {/* Option Groups */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-gray-200">Mockup Style Groups</div>
        <div className="grid grid-cols-2 gap-3">
          {optionGroups.map((group) => (
            <button
              key={group}
              onClick={() =>
                setSelectedOptionGroups(
                  selectedOptionGroups.includes(group)
                    ? selectedOptionGroups.filter((g) => g !== group)
                    : [...selectedOptionGroups, group]
                )
              }
              className={`p-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                selectedOptionGroups.includes(group)
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                  : 'bg-black/60 text-gray-300 border-gray-700 hover:border-gray-600'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Specific Options */}
      <div className="space-y-4">
        <div className="text-sm font-bold text-gray-200">Style Options</div>
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={option}
              onClick={() =>
                setSelectedOptions(
                  selectedOptions.includes(option)
                    ? selectedOptions.filter((o) => o !== option)
                    : [...selectedOptions, option]
                )
              }
              className={`p-3 rounded-xl text-sm font-bold transition-all duration-300 border-2 ${
                selectedOptions.includes(option)
                  ? 'bg-green-500/20 text-green-300 border-green-500/50'
                  : 'bg-black/60 text-gray-300 border-gray-700 hover:border-gray-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-5 border border-purple-500/30">
        <div className="text-sm font-bold text-purple-300 mb-3">Configuration Summary</div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-300">Technique:</span>
            <span className="text-white font-medium">{selectedTechnique || 'DTG (default)'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Resolution:</span>
            <span className="text-white font-medium">{mockupWidth}px</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Lifelike:</span>
            <span className="text-white font-medium">{lifelikeEnabled ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Style Groups:</span>
            <span className="text-white font-medium">{selectedOptionGroups.length || 'None'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-300">Options:</span>
            <span className="text-white font-medium">{selectedOptions.length || 'Default'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTabContent;