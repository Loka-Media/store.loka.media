'use client';

import { useState } from 'react';
import { THREAD_COLORS } from '@/lib/printfulConstants';

interface ThreadColorSelectorProps {
  selectedColors: string[];
  onColorsChange: (colors: string[]) => void;
  maxColors?: number;
  className?: string;
}

export default function ThreadColorSelector({ 
  selectedColors, 
  onColorsChange, 
  maxColors = 5,
  className = '' 
}: ThreadColorSelectorProps) {
  const handleColorToggle = (colorValue: string) => {
    if (selectedColors.includes(colorValue)) {
      // Remove color
      onColorsChange(selectedColors.filter(c => c !== colorValue));
    } else {
      // Add color (if under max limit)
      if (selectedColors.length < maxColors) {
        onColorsChange([...selectedColors, colorValue]);
      }
    }
  };

  return (
    <div className={`thread-color-selector ${className}`}>
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Thread Colors for Embroidery
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          Select up to {maxColors} thread colors. Selected: {selectedColors.length}/{maxColors}
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {THREAD_COLORS.map((color) => {
          const isSelected = selectedColors.includes(color.value);
          const isDisabled = !isSelected && selectedColors.length >= maxColors;
          
          return (
            <button
              key={color.value}
              type="button"
              onClick={() => !isDisabled && handleColorToggle(color.value)}
              disabled={isDisabled}
              className={`
                relative p-3 rounded-lg border-2 transition-all duration-200 text-center
                ${isSelected 
                  ? 'border-indigo-500 bg-indigo-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-sm'
                }
              `}
            >
              {/* Color swatch */}
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-300 mx-auto mb-2 shadow-sm"
                style={{ backgroundColor: color.value }}
              />
              
              {/* Color name */}
              <span className="text-xs font-medium text-gray-700 block">
                {color.name}
              </span>
              
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected colors preview */}
      {selectedColors.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">Selected Colors:</p>
          <div className="flex flex-wrap gap-2">
            {selectedColors.map((colorValue) => {
              const color = THREAD_COLORS.find(c => c.value === colorValue);
              return (
                <div key={colorValue} className="flex items-center space-x-2 bg-white px-2 py-1 rounded-md border">
                  <div 
                    className="w-4 h-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: colorValue }}
                  />
                  <span className="text-xs text-gray-700">{color?.name}</span>
                  <button
                    type="button"
                    onClick={() => handleColorToggle(colorValue)}
                    className="text-gray-400 hover:text-red-500 text-xs"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}