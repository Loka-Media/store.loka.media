import React, { useState } from 'react';
import { 
  Heart, Star, Smile, Sun, Moon, Coffee, Camera, Music, 
  Car, Plane, Bike, Home, TreePine, Flower, Gift,
  ShoppingBag, Phone, Mail, MapPin, Clock, Calendar,
  Gamepad2, Headphones, Book, Palette, Brush, Scissors,
  Wrench, Settings, Shield, Lock, Key, Trophy,
  Crown, Diamond, Gem, Zap, Flame, Droplets,
  Search, Plus, Minus, X, Check, ArrowRight
} from 'lucide-react';
import { convertIconToImage, uploadIconAsImage, getIconSvgData } from '../../../utils/iconToImage';
import toast from 'react-hot-toast';

interface ClipartTabContentProps {
  onClipartImageCreated?: (imageUrl: string, filename: string) => Promise<void>;
}

const ClipartTabContent: React.FC<ClipartTabContentProps> = ({
  onClipartImageCreated
}) => {
  const [selectedCategory, setSelectedCategory] = useState('popular');
  const [selectedIcon, setSelectedIcon] = useState<React.ComponentType | null>(null);
  const [iconColor, setIconColor] = useState('#000000');
  const [iconSize, setIconSize] = useState(256);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const [isConverting, setIsConverting] = useState(false);

  // Icon categories
  const iconCategories = {
    popular: {
      label: 'Popular',
      icons: [Heart, Star, Smile, Sun, Coffee, Camera, Music, Gift, Crown, Diamond]
    },
    nature: {
      label: 'Nature',
      icons: [TreePine, Flower, Sun, Moon, Droplets, Flame]
    },
    transport: {
      label: 'Transport',
      icons: [Car, Plane, Bike]
    },
    lifestyle: {
      label: 'Lifestyle',
      icons: [Home, ShoppingBag, Phone, Mail, Coffee, Book, Headphones]
    },
    business: {
      label: 'Business',
      icons: [Trophy, Crown, Shield, Key, Settings, Calendar, Clock]
    },
    creative: {
      label: 'Creative',
      icons: [Palette, Brush, Scissors, Camera, Music]
    },
    tech: {
      label: 'Tech',
      icons: [Phone, Camera, Headphones, Settings, Lock, Shield]
    },
    actions: {
      label: 'Actions',
      icons: [Search, Plus, Check, X, ArrowRight, Zap]
    }
  };


  const handleCreateIconImage = async () => {
    if (!selectedIcon) {
      toast.error('Please select an icon first');
      return;
    }

    try {
      setIsConverting(true);

      // Convert icon component to image blob
      const imageBlob = await convertIconToImage(selectedIcon, {
        size: iconSize,
        color: iconColor,
        backgroundColor
      });

      // Upload the image
      const iconName = selectedIcon.displayName || selectedIcon.name || 'icon';
      const { url, filename } = await uploadIconAsImage(imageBlob, iconName);

      // Call the callback to add the clipart image to designs
      await onClipartImageCreated?.(url, filename);

      toast.success('Clipart converted to image successfully!');
      setSelectedIcon(null); // Clear selection
    } catch (error) {
      console.error('Error converting clipart to image:', error);
      toast.error('Failed to convert clipart to image');
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Clipart Library</h3>
      
      {/* Category Selector */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
        >
          {Object.entries(iconCategories).map(([key, category]) => (
            <option key={key} value={key}>{category.label}</option>
          ))}
        </select>
      </div>

      {/* Icon Grid */}
      <div className="space-y-2">
        <label className="block text-xs font-medium text-gray-700">Choose Icon</label>
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
          {iconCategories[selectedCategory as keyof typeof iconCategories].icons.map((IconComponent, index) => (
            <button
              key={index}
              onClick={() => setSelectedIcon(IconComponent)}
              className={`p-2 rounded-md border transition-all hover:bg-gray-50 ${
                selectedIcon === IconComponent
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200'
              }`}
            >
              <IconComponent className="w-6 h-6 text-gray-600" />
            </button>
          ))}
        </div>
      </div>

      {/* Icon Customization */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Icon Color</label>
          <input
            type="color"
            value={iconColor}
            onChange={(e) => setIconColor(e.target.value)}
            className="w-full h-8 border border-gray-300 rounded-md cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Background</label>
          <select
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
          >
            <option value="transparent">Transparent</option>
            <option value="#ffffff">White</option>
            <option value="#000000">Black</option>
            <option value="#f3f4f6">Light Gray</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Size: {iconSize}px</label>
        <input
          type="range"
          min="128"
          max="512"
          step="64"
          value={iconSize}
          onChange={(e) => setIconSize(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Small</span>
          <span>Large</span>
        </div>
      </div>

      {/* Preview */}
      {selectedIcon && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-700">Preview</label>
          <div 
            className="w-16 h-16 border border-gray-300 rounded-md flex items-center justify-center"
            style={{ backgroundColor: backgroundColor === 'transparent' ? '#f9fafb' : backgroundColor }}
          >
            {React.createElement(selectedIcon as any, {
              size: 32,
              color: iconColor
            })}
          </div>
        </div>
      )}

      <button
        onClick={handleCreateIconImage}
        disabled={!selectedIcon || isConverting}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConverting ? 'Converting Icon...' : 'Add Clipart as Image'}
      </button>
    </div>
  );
};

export default ClipartTabContent;