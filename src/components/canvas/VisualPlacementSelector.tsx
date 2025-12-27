"use client";

import React from "react";
import {
  Check,
  Shirt,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Heart,
  MapPin,
  Square,
  Circle
} from "lucide-react";

interface PlacementOption {
  id: string;
  label: string;
  hasDesign: boolean;
  image?: string;
}

interface VisualPlacementSelectorProps {
  availablePlacements: Record<string, string>;
  selectedPlacement: string;
  onSelectPlacement: (placement: string) => void;
  designsByPlacement: Record<string, number>; // count of designs per placement
}

const VisualPlacementSelector: React.FC<VisualPlacementSelectorProps> = ({
  availablePlacements,
  selectedPlacement,
  onSelectPlacement,
  designsByPlacement,
}) => {
  // Get proper icon component for each placement
  const getPlacementIcon = (placement: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      front: <Shirt className="w-full h-full" />,
      back: <RotateCcw className="w-full h-full" />,
      left: <ChevronLeft className="w-full h-full" />,
      right: <ChevronRight className="w-full h-full" />,
      sleeve_left: <ChevronLeft className="w-full h-full" />,
      sleeve_right: <ChevronRight className="w-full h-full" />,
      chest_left: <Heart className="w-full h-full" />,
      chest_right: <Heart className="w-full h-full" />,
      label: <Square className="w-full h-full" />,
      pocket: <Circle className="w-full h-full" />,
      default: <MapPin className="w-full h-full" />,
    };

    return iconMap[placement.toLowerCase()] || iconMap.default;
  };

  const placementOptions: PlacementOption[] = Object.entries(availablePlacements).map(
    ([key, label]) => ({
      id: key,
      label: typeof label === "string" ? label : key,
      hasDesign: (designsByPlacement[key] || 0) > 0,
    })
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <div className="text-xl font-extrabold text-white mb-2">
          Choose Where to Place Your Design
        </div>
        <p className="text-gray-400 text-sm">
          Select a placement area to add or edit your design
        </p>
      </div>

      {/* Visual Grid of Placements */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {placementOptions.map((placement) => {
          const isSelected = selectedPlacement === placement.id;
          const designCount = designsByPlacement[placement.id] || 0;

          return (
            <button
              key={placement.id}
              onClick={() => onSelectPlacement(placement.id)}
              className={`relative group transition-all bg-black rounded-lg p-3 sm:p-6 text-left ${
                isSelected
                  ? "border-2 border-white shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                  : "border-2 border-gray-700 hover:border-white hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              }`}
            >
              {/* Placement Icon/Illustration */}
              <div className="flex items-center justify-center mb-2 sm:mb-4">
                <div
                  className={`${
                    isSelected
                      ? "scale-110 text-white"
                      : "text-gray-500 group-hover:text-white group-hover:scale-105"
                  } transition-all w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center`}
                >
                  {getPlacementIcon(placement.id)}
                </div>
              </div>

              {/* Placement Name */}
              <div className="text-center">
                <div className="font-extrabold text-white text-xs sm:text-sm mb-1">
                  {placement.label}
                </div>

                {/* Design Count Badge */}
                {designCount > 0 && (
                  <div className="inline-flex items-center gap-1 bg-white/20 border border-white/30 rounded-full px-2 sm:px-3 py-1 text-xs sm:text-sm">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    <span className="text-xs font-extrabold text-white">
                      {designCount} design{designCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-white border border-white rounded-full p-1 sm:p-2 shadow-[0_4px_12px_rgba(255,255,255,0.3)]">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-2 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-sm text-gray-300">
            <strong className="text-white">Tip:</strong> You can add multiple designs to the same placement area. They'll be combined into your final product!
          </p>
        </div>
      </div>
    </div>
  );
};

export default VisualPlacementSelector;
