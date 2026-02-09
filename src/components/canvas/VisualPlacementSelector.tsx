"use client";

import React from "react";
import { Check, Sparkles, ImageIcon } from "lucide-react";
import {
  FrontSVG,
  BackSVG,
  LeftSleeveSVG,
  RightSleeveSVG,
} from "./PlacementSVGs";

interface DesignFile {
  id: number;
  filename: string;
  url: string;
  placement: string;
  position: any;
}

interface PlacementOption {
  id: string;
  label: string;
  hasDesign: boolean;
  image?: string;
  designThumbnail?: string;
}

interface VisualPlacementSelectorProps {
  availablePlacements: Record<string, string>;
  selectedPlacement: string;
  onSelectPlacement: (placement: string) => void;
  designsByPlacement: Record<string, number>; // count of designs per placement
  designFiles?: DesignFile[]; // actual design files to show thumbnails
}

const VisualPlacementSelector: React.FC<VisualPlacementSelectorProps> = ({
  availablePlacements,
  selectedPlacement,
  onSelectPlacement,
  designsByPlacement,
  designFiles = [],
}) => {
  // Get proper SVG component for each placement
  const getPlacementIcon = (placement: string) => {
    const svgMap: Record<string, React.ReactNode> = {
      front: <FrontSVG className="w-full h-full" />,
      back: <BackSVG className="w-full h-full" />,
      left: <LeftSleeveSVG className="w-full h-full" />,
      right: <RightSleeveSVG className="w-full h-full" />,
      sleeve_left: <LeftSleeveSVG className="w-full h-full" />,
      sleeve_right: <RightSleeveSVG className="w-full h-full" />,
      chest_left: <FrontSVG className="w-full h-full" />,
      chest_right: <FrontSVG className="w-full h-full" />,
      label: <FrontSVG className="w-full h-full" />,
      pocket: <FrontSVG className="w-full h-full" />,
      default: <FrontSVG className="w-full h-full" />,
    };

    return svgMap[placement.toLowerCase()] || svgMap.default;
  };

  // Get design thumbnail for a placement
  const getDesignThumbnail = (placementId: string): string | undefined => {
    const design = designFiles.find((df) => df.placement === placementId);
    return design?.url;
  };

  const placementOptions: PlacementOption[] = Object.entries(availablePlacements).map(
    ([key, label]) => ({
      id: key,
      label: typeof label === "string" ? label : key,
      hasDesign: (designsByPlacement[key] || 0) > 0,
      designThumbnail: getDesignThumbnail(key),
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
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-3 w-full sm:max-w-2xl lg:max-w-6xl">
        {placementOptions.map((placement) => {
          const isSelected = selectedPlacement === placement.id;
          const designCount = designsByPlacement[placement.id] || 0;

          return (
            <button
              key={placement.id}
              onClick={() => {
                // If already selected, deselect. Otherwise select
                if (isSelected) {
                  onSelectPlacement(""); // Deselect
                } else {
                  onSelectPlacement(placement.id); // Select
                }
              }}
              className={`relative group transition-all bg-black rounded-2xl p-2 sm:p-3 md:p-4 lg:p-5 text-left h-28 sm:h-32 md:h-36 lg:h-32 w-full ${
                isSelected
                  ? "border-2 border-white shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
                  : placement.hasDesign
                  ? "border-2 border-orange-500/50 hover:border-orange-500 hover:shadow-[0_10px_30px_rgba(255,133,27,0.15)]"
                  : "border-2 border-gray-700 hover:border-white hover:shadow-[0_10px_30px_rgba(255,255,255,0.1)]"
              }`}
            >
              {/* Placement Icon/Illustration or Design Thumbnail */}
              <div className="flex items-center justify-center mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 flex-1">
                {placement.designThumbnail ? (
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden border border-white/20">
                    <img
                      src={placement.designThumbnail}
                      alt={`Design for ${placement.label}`}
                      className="w-full h-full object-contain bg-gray-800"
                    />
                  </div>
                ) : (
                  <div
                    className={`${
                      isSelected
                        ? "scale-110 text-white"
                        : "text-gray-500 group-hover:text-white group-hover:scale-105"
                    } transition-all w-8 h-8 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-14 lg:h-14 flex items-center justify-center`}
                  >
                    {getPlacementIcon(placement.id)}
                  </div>
                )}
              </div>

              {/* Placement Name */}
              <div className="text-center">
                <div className={`text-xs sm:text-xs md:text-sm lg:text-base ${placement.hasDesign ? 'text-orange-400 font-medium' : 'text-white'}`}>
                  {placement.label}
                </div>
                {placement.hasDesign && (
                  <div className="text-[10px] sm:text-xs text-orange-400/70 mt-0.5">
                    Design added
                  </div>
                )}
              </div>

              {/* Design Indicator Badge - Bottom Right */}
              {designCount > 0 && (
                <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 md:bottom-2.5 md:right-2.5 lg:bottom-3 lg:right-3 bg-orange-500 border border-orange-400 rounded-full min-w-5 h-5 sm:min-w-6 sm:h-6 md:min-w-7 md:h-7 flex items-center justify-center">
                  <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 bg-white border border-white rounded-full p-0.5 sm:p-1 shadow-[0_4px_12px_rgba(255,255,255,0.3)]">
                  <Check className="w-2 h-2 sm:w-3 sm:h-3 text-black" />
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
          <div className="text-sm text-gray-300">
            <strong className="text-white">How to add designs to multiple sides:</strong>
            <ol className="mt-2 space-y-1 list-decimal list-inside text-gray-400">
              <li>Select a placement (e.g., <span className="text-white">Front</span>) and choose a design from your files below</li>
              <li>Then select another placement (e.g., <span className="text-white">Back</span>) and choose a different design</li>
              <li>Placements with designs will show an <span className="text-orange-400">orange border</span> and thumbnail</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualPlacementSelector;
