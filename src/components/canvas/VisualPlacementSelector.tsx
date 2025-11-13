"use client";

import React from "react";
import { Check, Plus } from "lucide-react";

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
  // Common placement icons/illustrations
  const placementIcons: Record<string, string> = {
    front: "👕 Front",
    back: "🔄 Back",
    left: "👈 Left",
    right: "👉 Right",
    sleeve_left: "💪 Left Sleeve",
    sleeve_right: "💪 Right Sleeve",
    chest_left: "💎 Left Chest",
    chest_right: "💎 Right Chest",
    default: "📍 Design Area",
  };

  const getPlacementIcon = (placement: string): string => {
    return placementIcons[placement] || placementIcons.default;
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
        <h3 className="text-xl font-extrabold text-black mb-2">
          Choose Where to Place Your Design
        </h3>
        <p className="text-gray-700 font-bold text-sm">
          Select a placement area to add or edit your design
        </p>
      </div>

      {/* Visual Grid of Placements */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {placementOptions.map((placement) => {
          const isSelected = selectedPlacement === placement.id;
          const designCount = designsByPlacement[placement.id] || 0;

          return (
            <button
              key={placement.id}
              onClick={() => onSelectPlacement(placement.id)}
              className={`relative group transition-all ${
                isSelected
                  ? "bg-gradient-to-br from-yellow-200 to-pink-200 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
                  : "bg-white border-2 border-gray-300 hover:border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
              } rounded-2xl p-6 text-left`}
            >
              {/* Placement Icon/Illustration */}
              <div className="flex items-center justify-center mb-4">
                <div
                  className={`text-4xl ${
                    isSelected ? "scale-110" : "group-hover:scale-105"
                  } transition-transform`}
                >
                  {getPlacementIcon(placement.id).split(" ")[0]}
                </div>
              </div>

              {/* Placement Name */}
              <div className="text-center">
                <h4 className="font-extrabold text-black text-sm mb-1">
                  {placement.label}
                </h4>

                {/* Design Count Badge */}
                {designCount > 0 ? (
                  <div className="inline-flex items-center gap-1 bg-green-400 border-2 border-black rounded-full px-3 py-1">
                    <Check className="w-3 h-3 text-black" />
                    <span className="text-xs font-extrabold text-black">
                      {designCount} design{designCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 bg-gray-200 border-2 border-black rounded-full px-3 py-1">
                    <Plus className="w-3 h-3 text-black" />
                    <span className="text-xs font-extrabold text-black">Add design</span>
                  </div>
                )}
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-yellow-300 border-4 border-black rounded-full p-2">
                  <Check className="w-4 h-4 text-black" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper Text */}
      <div className="bg-yellow-100 border-2 border-black rounded-xl p-4">
        <p className="text-sm font-bold text-black">
          💡 <strong>Tip:</strong> You can add multiple designs to the same placement area. They'll be combined into your final product!
        </p>
      </div>
    </div>
  );
};

export default VisualPlacementSelector;
