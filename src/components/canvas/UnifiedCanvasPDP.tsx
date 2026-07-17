/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Check,
  Upload,
  Plus,
  Trash2,
  HelpCircle,
  Info,
  Palette,
  Sparkles,
  ScanEye,
  ShoppingBag,
  ImageUpscale,
  Zap,
  AlertCircle,
  X,
  DollarSign,
  FileText,
  Tag,
  TrendingUp,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Percent,
} from "lucide-react";
import { Slider } from "@mui/material";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { printifyAPI } from "@/lib/api";
import { useGlobalMarkup } from "@/contexts/GlobalMarkupContext";

import { getCanvasDimensions, getActivePrintFile, applyQuickPosition } from "./utils";
import DesignCanvasTab from "./DesignCanvasTab";
import PrintingTechniqueSelector from "./PrintingTechniqueSelector";
import { RegionalAvailabilityPreview } from "./RegionalAvailabilityPreview";
import { FrontSVG, BackSVG, LeftSleeveSVG, RightSleeveSVG } from "./PlacementSVGs";

interface UnifiedCanvasPDPProps {
  selectedProduct: any;
  selectedVariants: number[];
  setSelectedVariants: (variants: number[]) => void;
  designFiles: any[];
  setDesignFiles: React.Dispatch<React.SetStateAction<any[]>>;
  uploadedFiles: any[];
  printFiles: any | null;
  onGeneratePreview: (updatedDesignFiles?: any[], advancedOptions?: any) => Promise<void>;
  isGeneratingPreview: boolean;
  mockupUrls: any[];
  mockupStatus: string;
  onPrintFilesLoaded: (printFiles: any) => void;
  onRefreshFiles: (page?: number) => void;
  productForm: {
    name: string;
    description: string;
    markupPercentage: string;
    category: string;
    tags: string[];
  };
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  onPublish: (updatedProductForm?: any) => Promise<void>;
  isPublishing: boolean;
  onProviderChange?: (providerId: number) => Promise<void>;
  currentPage?: number;
  totalPages?: number;
  isFetchingFiles?: boolean;
}

const cleanDescription = (text?: string): string => {
  if (!text) return "";
  // Strip HTML tags
  let clean = text.replace(/<[^>]*>?/gm, '');
  // Decode common HTML entities
  clean = clean
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
  return clean.trim();
};

// Helper to determine readable text contrast color (black or white) based on background hex code
const getContrastTextColor = (hexCode: string): string => {
  if (!hexCode) return "#ffffff";

  // Handle comma-separated multi-colors (use the primary/first color)
  let cleanHex = hexCode.split(",")[0].trim().toLowerCase();

  if (!cleanHex.startsWith("#")) {
    // Match common light CSS color names
    const lightColors = ["white", "yellow", "silver", "gold", "pink", "ash", "heather", "cream", "sand", "lime"];
    if (lightColors.some(color => cleanHex.includes(color))) {
      return "#000000";
    }
    return "#ffffff";
  }

  // Expand 3-digit hex (#fff) to 6-digit hex (#ffffff)
  if (cleanHex.length === 4) {
    cleanHex = "#" + cleanHex[1] + cleanHex[1] + cleanHex[2] + cleanHex[2] + cleanHex[3] + cleanHex[3];
  }

  const r = parseInt(cleanHex.substring(1, 3), 16);
  const g = parseInt(cleanHex.substring(3, 5), 16);
  const b = parseInt(cleanHex.substring(5, 7), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "#ffffff";
  }

  // HSP perceived brightness calculation
  const brightness = Math.sqrt(
    0.299 * (r * r) +
    0.587 * (g * g) +
    0.114 * (b * b)
  );

  // Threshold above 145 matches light background, returning black text for high readability
  return brightness > 145 ? "#000000" : "#ffffff";
};

// Helper to check if a product name indicates it is an apparel item
const isApparelByName = (name: string): boolean => {
  if (!name) return true;
  const lowerName = name.toLowerCase();
  const nonApparelKeywords = [
    "mug", "drinkware", "tumbler", "bottle", "cup", "glass",
    "poster", "canvas", "frame", "wall art", "print",
    "pillow", "blanket", "cushion", "rug", "towel",
    "sticker", "decal",
    "phone case", "case", "tech", "laptop sleeve",
    "notebook", "journal", "calendar", "card",
    "bag", "tote", "backpack", "pouch",
    "ornament", "magnet", "coaster", "keychain", "puzzle"
  ];
  return !nonApparelKeywords.some(keyword => lowerName.includes(keyword));
};

// Helper to check if a product object indicates it is an apparel item
const isApparelProduct = (product: any): boolean => {
  if (!product) return true;
  const type = (product.type_name || product.type || "").toLowerCase();
  const title = (product.title || product.name || "").toLowerCase();

  const nonApparelKeywords = [
    "mug", "drinkware", "tumbler", "bottle", "cup", "glass",
    "poster", "canvas", "frame", "wall art", "print",
    "pillow", "blanket", "cushion", "rug", "towel",
    "sticker", "decal",
    "phone case", "case", "tech", "laptop sleeve",
    "notebook", "journal", "calendar", "card",
    "bag", "tote", "backpack", "pouch",
    "ornament", "magnet", "coaster", "keychain", "puzzle"
  ];

  return !nonApparelKeywords.some(keyword => type.includes(keyword) || title.includes(keyword));
};

// Helper to render the vector outline based on placement and fabric color
const renderVectorOutline = (placement: string, fillHex: string, className?: string) => {
  const p = placement.toLowerCase();
  const fill = fillHex || "#ffffff";
  const contrastText = getContrastTextColor(fill);
  const stroke = contrastText === "#ffffff" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.15)";
  const strokeWidth = 0.8;

  const props = {
    className,
    fill,
    stroke,
    strokeWidth,
    width: "100%",
    height: "100%",
  };

  if (p.includes("back")) return <BackSVG {...props} />;
  if (p.includes("left") || p.includes("sleeve_left")) return <LeftSleeveSVG {...props} />;
  if (p.includes("right") || p.includes("sleeve_right")) return <RightSleeveSVG {...props} />;
  return <FrontSVG {...props} />;
};

// Interactive 360-degree product preview spin viewer component
// Interactive 360-degree product preview spin viewer component
const Product360Viewer: React.FC<{
  mockupUrls: any[];
  images?: string[];
  defaultImage?: string;
  productName: string;
  designFiles: any[];
  activePlacement?: string;
  onPlacementChange?: (placement: string) => void;
  activeColorHex?: string;
}> = ({ mockupUrls, images = [], defaultImage, productName, designFiles, activePlacement = "front", onPlacementChange, activeColorHex }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartActiveIndex = useRef(0);

  // Printable area mappings (percentage of mockup container) to overlay designs in real-time
  const MOCKUP_PRINT_AREAS: Record<string, { width: number; height: number; top: number; left: number }> = {
    front: { width: 33, height: 45, top: 24, left: 33.5 },
    back: { width: 33, height: 45, top: 22, left: 33.5 },
    left: { width: 15, height: 15, top: 32, left: 42.5 },
    right: { width: 15, height: 15, top: 32, left: 42.5 },
    sleeve_left: { width: 15, height: 15, top: 32, left: 42.5 },
    sleeve_right: { width: 15, height: 15, top: 32, left: 42.5 },
  };

  // Find if there's an active design for a mockup view based on its title
  const getDesignForMockup = (mockupTitle: string, placement?: string) => {
    if (!designFiles || designFiles.length === 0) return null;
    const title = mockupTitle.toLowerCase();
    const p = (placement || "").toLowerCase();

    let resolvedPlacement = "front";
    if (p.includes("back") || title.includes("back")) resolvedPlacement = "back";
    else if (p.includes("left") || title.includes("left")) resolvedPlacement = "sleeve_left";
    else if (p.includes("right") || title.includes("right")) resolvedPlacement = "sleeve_right";

    return designFiles.find((d) => d.placement === resolvedPlacement || (d.placement === "left" && resolvedPlacement === "sleeve_left") || (d.placement === "right" && resolvedPlacement === "sleeve_right"));
  };

  const getDesignForDefault = () => {
    if (!designFiles || designFiles.length === 0) return null;
    return designFiles.find((d) => d.placement === "front");
  };

  // Logical order of views for smooth rotation: Front -> Right Sleeve -> Back -> Left Sleeve
  const sortedMockups = useMemo(() => {
    let itemsToProcess = mockupUrls || [];
    const isBlueprint = !mockupUrls || mockupUrls.length === 0;

    if (itemsToProcess.length === 0) {
      if (images && images.length > 0) {
        itemsToProcess = images.map((url, index) => {
          let placement = "front";
          // Match index 2 or URL text for back view
          if (index === 2 || url.toLowerCase().includes("back") || url.toLowerCase().includes("reverse")) {
            placement = "back";
          } else if (url.toLowerCase().includes("left") || url.toLowerCase().includes("sleeve_left")) {
            placement = "sleeve_left";
          } else if (url.toLowerCase().includes("right") || url.toLowerCase().includes("sleeve_right")) {
            placement = "sleeve_right";
          } else if (index > 0) {
            placement = `other_${index}`;
          }

          let title = "Front View";
          if (placement === "back") title = "Back View";
          else if (placement === "sleeve_left") title = "Left Sleeve";
          else if (placement === "sleeve_right") title = "Right Sleeve";
          else if (placement.startsWith("other_")) title = `Angle View ${index}`;

          return {
            url,
            placement,
            title,
          };
        });
      }
    }

    if (itemsToProcess.length === 0) return [];

    // Filter out duplicate mockup URLs
    const seenUrls = new Set<string>();
    itemsToProcess = itemsToProcess.filter((m) => {
      const url = m.url || m.src || "";
      if (!url) return false;
      if (seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    });

    // Filter unique placements for blueprint mode to avoid duplicate thumbnails
    if (isBlueprint) {
      const seen = new Set();
      itemsToProcess = itemsToProcess.filter((m) => {
        const placement = m.placement || "front";
        if (seen.has(placement)) return false;
        seen.add(placement);
        return true;
      });
    }

    const order = ["front", "right", "back", "left"];
    const result: any[] = [];

    const getPlacementType = (title: string, placement?: string) => {
      const p = (placement || "").toLowerCase();
      if (p.includes("front")) return "front";
      if (p.includes("back")) return "back";
      if (p.includes("right") || p.includes("sleeve_right")) return "right";
      if (p.includes("left") || p.includes("sleeve_left")) return "left";

      const t = (title || "").toLowerCase();
      if (t.includes("front")) return "front";
      if (t.includes("back")) return "back";
      if (t.includes("right") || t.includes("sleeve_right")) return "right";
      if (t.includes("left") || t.includes("sleeve_left")) return "left";
      return "other";
    };

    const groups: Record<string, any[]> = { front: [], right: [], back: [], left: [], other: [] };
    itemsToProcess.forEach((m) => {
      const type = getPlacementType(m.title || "", m.placement);
      groups[type].push(m);
    });

    order.forEach((key) => {
      if (groups[key].length > 0) {
        result.push(...groups[key]);
      }
    });
    if (groups.other.length > 0) {
      result.push(...groups.other);
    }

    return result.length > 0 ? result : itemsToProcess;
  }, [mockupUrls, images]);

  // Reset active view index when mockup set changes or activePlacement changes
  useEffect(() => {
    if (!activePlacement || sortedMockups.length === 0) {
      setActiveIndex(0);
      return;
    }
    // Find index of mockup that matches activePlacement
    const index = sortedMockups.findIndex(m => {
      const title = (m.title || "").toLowerCase();
      const placement = (m.placement || "").toLowerCase();
      if (activePlacement === "front" && (title.includes("front") || placement === "front")) return true;
      if (activePlacement === "back" && (title.includes("back") || placement === "back")) return true;
      if ((activePlacement === "sleeve_left" || activePlacement === "left") && (title.includes("left") || title.includes("sleeve_left") || placement === "sleeve_left" || placement === "left")) return true;
      if ((activePlacement === "sleeve_right" || activePlacement === "right") && (title.includes("right") || title.includes("sleeve_right") || placement === "sleeve_right" || placement === "right")) return true;
      return false;
    });

    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [sortedMockups, activePlacement]);

  // Preload all mockup/catalog images
  useEffect(() => {
    sortedMockups.forEach((m) => {
      if (m?.url) {
        const img = new Image();
        img.src = m.url;
      }
    });
  }, [sortedMockups]);

  if (sortedMockups.length === 0) {
    const activeDesign = designFiles.find((d) => d.placement === activePlacement) || getDesignForDefault();
    const effectivePlacement = activeDesign ? activeDesign.placement : activePlacement;
    const area = MOCKUP_PRINT_AREAS[effectivePlacement] || MOCKUP_PRINT_AREAS.front;

    let designStyle: React.CSSProperties = {};
    if (activeDesign && activeDesign.position) {
      const w = (activeDesign.position.width / activeDesign.position.area_width) * 100;
      const h = (activeDesign.position.height / activeDesign.position.area_height) * 100;
      const t = (activeDesign.position.top / activeDesign.position.area_height) * 100;
      const l = (activeDesign.position.left / activeDesign.position.area_width) * 100;
      designStyle = {
        width: `${w}%`,
        height: `${h}%`,
        top: `${t}%`,
        left: `${l}%`,
        position: "absolute",
      };
    }

    return (
      <div className="aspect-square bg-[#f4f4f5] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative w-full p-8">
        <div className="relative w-full h-full flex items-center justify-center">
          {isApparelByName(productName) ? (
            renderVectorOutline(effectivePlacement, activeColorHex || "#ffffff", "w-full h-full object-contain max-h-[85%] max-w-[85%] select-none")
          ) : defaultImage ? (
            <img
              src={defaultImage}
              alt={productName}
              className="w-full h-full object-contain pointer-events-none"
            />
          ) : (
            <ShoppingBag className="w-12 h-12 text-gray-400" />
          )}


        </div>
      </div>
    );
  }

  const safeActiveIndex = activeIndex >= sortedMockups.length ? 0 : activeIndex;
  const activeMockup = sortedMockups[safeActiveIndex] || sortedMockups[0];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartActiveIndex.current = activeIndex;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartX.current;
    const threshold = 35; // Pixels per rotation step
    const indexOffset = -Math.round(deltaX / threshold); // Drag left, rotate clockwise

    let newIndex = (dragStartActiveIndex.current + indexOffset) % sortedMockups.length;
    if (newIndex < 0) {
      newIndex += sortedMockups.length;
    }
    if (newIndex !== activeIndex) {
      handleThumbnailClick(newIndex);
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    dragStartX.current = e.touches[0].clientX;
    dragStartActiveIndex.current = activeIndex;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - dragStartX.current;
    const threshold = 35;
    const indexOffset = -Math.round(deltaX / threshold);

    let newIndex = (dragStartActiveIndex.current + indexOffset) % sortedMockups.length;
    if (newIndex < 0) {
      newIndex += sortedMockups.length;
    }
    if (newIndex !== activeIndex) {
      handleThumbnailClick(newIndex);
    }
  };

  const rotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = (activeIndex - 1 + sortedMockups.length) % sortedMockups.length;
    handleThumbnailClick(newIndex);
  };

  const rotateRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newIndex = (activeIndex + 1) % sortedMockups.length;
    handleThumbnailClick(newIndex);
  };

  const handleThumbnailClick = (idx: number) => {
    setActiveIndex(idx);
    const item = sortedMockups[idx];
    if (item && onPlacementChange) {
      const placement = item.placement || "front";
      const validPlacements = ["front", "back", "left", "right", "sleeve_left", "sleeve_right"];
      if (validPlacements.includes(placement.toLowerCase())) {
        onPlacementChange(placement);
      }
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div
        className={`aspect-square bg-[#f4f4f5] rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative group select-none cursor-grab active:cursor-grabbing transition-all duration-300 ${isDragging ? "border-[#FF6D1F]/50 shadow-[0_0_20px_rgba(255,109,31,0.15)]" : ""
          }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        {/* Render all sorted mockups stacked for instant GPU-accelerated switching */}
        {sortedMockups.map((m, idx) => {
          const isCurrent = idx === activeIndex;
          const isBlueprint = !mockupUrls || mockupUrls.length === 0;

          // Find overlay design if we don't have generated mockups
          const design = isBlueprint ? getDesignForMockup(m.title || "", m.placement) : null;
          const effectivePlacement = design ? design.placement : (m.placement || "front");
          const area = MOCKUP_PRINT_AREAS[effectivePlacement] || MOCKUP_PRINT_AREAS.front;

          let designStyle: React.CSSProperties = {};
          if (design && design.position) {
            const w = (design.position.width / design.position.area_width) * 100;
            const h = (design.position.height / design.position.area_height) * 100;
            const t = (design.position.top / design.position.area_height) * 100;
            const l = (design.position.left / design.position.area_width) * 100;
            designStyle = {
              width: `${w}%`,
              height: `${h}%`,
              top: `${t}%`,
              left: `${l}%`,
              position: "absolute",
            };
          }

          return (
            <div
              key={idx}
              className={`absolute inset-0 w-full h-full transition-all duration-300 ease-out p-8 ${isCurrent
                ? "opacity-100 scale-100 z-10"
                : "opacity-0 scale-95 z-0 pointer-events-none"
                }`}
            >
              {isBlueprint ? (
                <div className="relative w-full h-full flex items-center justify-center bg-[#f4f4f5] rounded-2xl">
                  <img
                    src={m.url}
                    alt={m.title || `Catalog Image ${idx + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-white rounded-2xl">
                  <img
                    src={m.url}
                    alt={m.title || `Mockup ${idx + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* 360 Badge Overlay */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 rounded-full py-1 px-3 flex items-center gap-1.5 shadow-lg pointer-events-none z-20">
          <RotateCw className="w-3 h-3 text-[#FF6D1F] animate-spin" style={{ animationDuration: "8s" }} />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-200">Interactive Preview</span>
        </div>

        {/* Manual Arrow Controls (Hover State) */}
        {sortedMockups.length > 1 && (
          <>
            <button
              onClick={rotateLeft}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/95 text-white rounded-full flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md focus:outline-none z-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={rotateRight}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/95 text-white rounded-full flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md focus:outline-none z-20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Interactive Gesture Helper Text overlay */}
        <div className="absolute bottom-3 inset-x-0 mx-auto w-max bg-black/65 backdrop-blur-sm border border-white/5 rounded-full py-0.5 px-3 text-[10px] text-gray-400 opacity-100 transition-opacity duration-300 pointer-events-none z-20">
          Swipe/drag to spin or choose thumbnails below
        </div>
      </div>

      {/* Thumbnail Carousel Underneath */}
      {sortedMockups.length > 1 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 capitalize bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
              {activeMockup.title || "Product View"}
            </span>
            <span className="text-[10px] text-gray-500">
              {activeIndex + 1} of {sortedMockups.length}
            </span>
          </div>

          <div className="relative group/carousel">
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 px-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent [&::-webkit-scrollbar]:h-[5px]">
              {sortedMockups.map((m, idx) => {
                const isSelected = idx === activeIndex;
                const isBlueprint = !mockupUrls || mockupUrls.length === 0;
                const design = isBlueprint ? getDesignForMockup(m.title || "", m.placement) : null;
                const effectivePlacement = design ? design.placement : (m.placement || "front");
                const area = MOCKUP_PRINT_AREAS[effectivePlacement] || MOCKUP_PRINT_AREAS.front;

                let designStyle: React.CSSProperties = {};
                if (design && design.position) {
                  const w = (design.position.width / design.position.area_width) * 100;
                  const h = (design.position.height / design.position.area_height) * 100;
                  const t = (design.position.top / design.position.area_height) * 100;
                  const l = (design.position.left / design.position.area_width) * 100;
                  designStyle = {
                    width: `${w}%`,
                    height: `${h}%`,
                    top: `${t}%`,
                    left: `${l}%`,
                    position: "absolute",
                  };
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleThumbnailClick(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 flex items-center justify-center ${isSelected
                      ? "border-[#FF6D1F] scale-105 shadow-[0_0_12px_rgba(255,109,31,0.25)]"
                      : "border-white/10 hover:border-white/30"
                      } ${isBlueprint ? "bg-[#f4f4f5]" : "bg-black/40"}`}
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={m.url}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>

                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UnifiedCanvasPDP: React.FC<UnifiedCanvasPDPProps> = ({
  selectedProduct,
  selectedVariants,
  setSelectedVariants,
  designFiles,
  setDesignFiles,
  uploadedFiles,
  printFiles,
  onGeneratePreview,
  isGeneratingPreview,
  mockupUrls,
  mockupStatus,
  onPrintFilesLoaded,
  onRefreshFiles,
  productForm,
  setProductForm,
  onPublish,
  isPublishing,
  onProviderChange,
  currentPage = 1,
  totalPages = 1,
  isFetchingFiles = false,
}) => {
  const { globalMarkup, categoryMarkup, calculateSellingPrice } = useGlobalMarkup();
  // Mobile accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    variants: true,
    design: true,
    editor: true,
    mockups: true,
    listing: true,
    review: true,
  });

  // Local component states
  const [activePlacement, setActivePlacement] = useState<string>("front");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(["front"]);
  const [selectedDesignFile, setSelectedDesignFile] = useState<any | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | string | undefined>();
  const [aspectRatioIssues, setAspectRatioIssues] = useState<any[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [activeColor, setActiveColor] = useState<string>("");

  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string>("");
  const [availableTechniques, setAvailableTechniques] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ── Creator Markup ───────────────────────────────────────────────────────
  const CREATOR_MARKUP_PRESETS = [0, 10, 20, 30, 35, 40, 50, 75, 100];
  const [creatorMarkup, setCreatorMarkup] = useState<number>(() => {
    const parsed = parseFloat(productForm.markupPercentage);
    return isNaN(parsed) ? 30 : parsed;
  });

  // Sync slider when saved productForm is restored from localStorage
  useEffect(() => {
    const parsed = parseFloat(productForm.markupPercentage);
    if (!isNaN(parsed) && parsed !== creatorMarkup) {
      setCreatorMarkup(parsed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productForm.markupPercentage]);

  const handleCreatorMarkupChange = (_e: Event, val: number | number[]) => {
    const v = val as number;
    setCreatorMarkup(v);
    setProductForm((prev: any) => ({ ...prev, markupPercentage: String(v) }));
  };

  const handleCreatorPresetClick = (preset: number) => {
    setCreatorMarkup(preset);
    setProductForm((prev: any) => ({ ...prev, markupPercentage: String(preset) }));
  };

  const creatorSliderSx = {
    color: '#FF6D1F',
    height: 8,
    '& .MuiSlider-track': {
      border: 'none',
      background: 'linear-gradient(90deg, #FF6D1F, #FF8343)',
    },
    '& .MuiSlider-thumb': {
      height: 22,
      width: 22,
      backgroundColor: '#fff',
      border: '2px solid #FF6D1F',
      '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': { boxShadow: 'inherit' },
      '&::before': { display: 'none' },
    },
    '& .MuiSlider-rail': { opacity: 0.28, backgroundColor: '#d8d8d8' },
  };
  // ─────────────────────────────────────────────────────────────────────────

  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipAutoPreviewRef = useRef(false);

  // Get unique supported placements from printFiles based on blueprint
  const getSupportedPlacements = useCallback(() => {
    if (!printFiles || !printFiles.variant_printfiles || printFiles.variant_printfiles.length === 0) {
      // Fallback if printFiles is not yet loaded
      return ["front", "back", "sleeve_left", "sleeve_right"];
    }

    const defaultPlacements = ["front", "back", "sleeve_left", "sleeve_right", "neck"];

    // Collect all supported placement keys across all variant_printfiles
    const supportedKeys = new Set<string>();
    printFiles.variant_printfiles.forEach((vp: any) => {
      if (vp.placements) {
        Object.keys(vp.placements).forEach((k) => {
          supportedKeys.add(k.toLowerCase());
        });
      }
    });

    // Filter the default list to only those that exist in supportedKeys
    const filtered = defaultPlacements.filter((placement) => {
      const p = placement.toLowerCase();
      if (p === "sleeve_left" && (supportedKeys.has("left") || supportedKeys.has("sleeve_left"))) return true;
      if (p === "sleeve_right" && (supportedKeys.has("right") || supportedKeys.has("sleeve_right"))) return true;
      return supportedKeys.has(p);
    });

    // Fallback to ["front"] if empty for safety
    return filtered.length > 0 ? filtered : ["front"];
  }, [printFiles]);

  // Reset activePlacement if it becomes invalid/unsupported
  useEffect(() => {
    if (printFiles) {
      const supported = getSupportedPlacements();
      if (supported.length > 0) {
        const hasLeft = activePlacement === "sleeve_left" && (supported.includes("left") || supported.includes("sleeve_left"));
        const hasRight = activePlacement === "sleeve_right" && (supported.includes("right") || supported.includes("sleeve_right"));

        if (!supported.includes(activePlacement) && !hasLeft && !hasRight) {
          setActivePlacement(supported[0]);
        }
      }
    }
  }, [printFiles, activePlacement, getSupportedPlacements]);

  const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/png" });
  };

  const getImageSourceForBackgroundRemoval = (imageUrl: string): string => {
    if (!imageUrl) return imageUrl;
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) return imageUrl;
    if (imageUrl.startsWith("/")) return imageUrl;
    if (typeof window !== "undefined" && imageUrl.startsWith(window.location.origin)) return imageUrl;
    return `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
  };

  const removeWhiteBackgroundFromImage = async (imageUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Unable to create canvas context."));
            return;
          }

          ctx.drawImage(image, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          const sampleCorners = [
            [0, 0],
            [canvas.width - 1, 0],
            [0, canvas.height - 1],
            [canvas.width - 1, canvas.height - 1],
          ];

          const backgroundSamples = sampleCorners.map(([x, y]) => {
            const idx = (y * canvas.width + x) * 4;
            return {
              r: data[idx],
              g: data[idx + 1],
              b: data[idx + 2],
            };
          });

          const averageBg = backgroundSamples.reduce(
            (acc, sample) => ({
              r: acc.r + sample.r,
              g: acc.g + sample.g,
              b: acc.b + sample.b,
            }),
            { r: 0, g: 0, b: 0 }
          );

          averageBg.r /= backgroundSamples.length;
          averageBg.g /= backgroundSamples.length;
          averageBg.b /= backgroundSamples.length;

          const squaredDistance = (r: number, g: number, b: number) => {
            return (
              (r - averageBg.r) * (r - averageBg.r) +
              (g - averageBg.g) * (g - averageBg.g) +
              (b - averageBg.b) * (b - averageBg.b)
            );
          };

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const alpha = data[i + 3];
            const brightness = (r + g + b) / 3;
            const bgDistance = Math.sqrt(squaredDistance(r, g, b));

            // Remove near-white / background-like pixels while preserving darker design details
            const isNearTransparentBackground =
              alpha > 0 &&
              ((brightness >= 235 && bgDistance < 80) ||
                (r >= 245 && g >= 245 && b >= 245));

            if (isNearTransparentBackground) {
              data[i + 3] = 0;
            }
          }

          ctx.putImageData(imageData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          reject(err);
        }
      };
      image.onerror = () => {
        reject(new Error("Failed to load image for background removal."));
      };
      image.src = getImageSourceForBackgroundRemoval(imageUrl);
    });
  };

  const handleRemoveDesignBackground = async () => {
    if (!selectedDesignFile) {
      toast.error("Select a design first.");
      return;
    }

    const imageUrl = String(selectedDesignFile.url || "");
    if (!imageUrl) {
      toast.error("Unable to locate the selected design image.");
      return;
    }

    const isSvg = imageUrl.includes("image/svg+xml") || imageUrl.toLowerCase().endsWith(".svg");
    if (isSvg) {
      toast.error("Background removal is only available for raster designs (PNG/JPG/WebP). Please use a transparent SVG or a raster format.");
      return;
    }

    const proxiedUrl = getImageSourceForBackgroundRemoval(imageUrl);

    setIsRemovingBackground(true);
    try {
      const updatedUrl = await removeWhiteBackgroundFromImage(proxiedUrl);
      let finalUrl = updatedUrl;

      if (updatedUrl.startsWith("data:")) {
        try {
          const filename = selectedDesignFile.filename || `design-${Date.now()}.png`;
          const file = await dataUrlToFile(updatedUrl, filename);
          const uploadResponse = await printifyAPI.uploadFileDirectly(file);
          const uploadedUrl = uploadResponse?.result?.file_url || uploadResponse?.file_url;
          if (uploadedUrl) {
            finalUrl = uploadedUrl.replace(/%25/g, "%");
          } else {
            console.warn("Background removal produced a data URL, but upload response did not include a remote file URL.", uploadResponse);
          }
        } catch (uploadError) {
          console.error("Background removed but upload failed:", uploadError);
          toast.error("Background removed locally, but upload failed. Please try again.");
        }
      }

      const updatedDesign = { ...selectedDesignFile, url: finalUrl };
      const newDesignFiles = designFiles.map((design) =>
        design.id === updatedDesign.id ? updatedDesign : design
      );
      setDesignFiles(newDesignFiles);
      setSelectedDesignFile(updatedDesign);
      toast.success("Background removed from selected design.");

      if (onGeneratePreview && !isGeneratingPreview) {
        skipAutoPreviewRef.current = true;
        await onGeneratePreview(newDesignFiles);
      }
    } catch (err) {
      console.error("Background removal failed:", err);
      toast.error("Could not remove the background. Try a transparent PNG or a different file.");
    } finally {
      setIsRemovingBackground(false);
    }
  };

  // Extract unique colors & sizes
  const uniqueColors = useMemo(() => {
    const colorMap = new Map();
    selectedProduct?.variants?.forEach((v: any) => {
      if (!colorMap.has(v.color)) {
        colorMap.set(v.color, {
          name: v.color,
          code: v.color_code,
          image: v.image,
        });
      }
    });
    return Array.from(colorMap.values());
  }, [selectedProduct]);

  const uniqueSizes = useMemo(() => {
    return [...new Set(selectedProduct?.variants?.map((v: any) => v.size) || [])] as string[];
  }, [selectedProduct]);

  const activeColorHex = useMemo(() => {
    const matched = uniqueColors.find((c: any) => c.name === activeColor);
    return matched ? matched.code : "";
  }, [uniqueColors, activeColor]);

  const filteredMockupUrls = useMemo(() => {
    if (!mockupUrls || mockupUrls.length === 0) return [];
    if (!activeColor) return mockupUrls;

    // Find the variant IDs for the active color
    const activeVariantIds = selectedProduct?.variants
      ?.filter((v: any) => v.color === activeColor)
      ?.map((v: any) => v.id) || [];

    if (activeVariantIds.length === 0) return mockupUrls;

    const filtered = mockupUrls.filter((m: any) =>
      !m.variant_ids ||
      m.variant_ids.length === 0 ||
      m.variant_ids.some((vid: any) => activeVariantIds.includes(vid))
    );

    return filtered.length > 0 ? filtered : mockupUrls;
  }, [mockupUrls, activeColor, selectedProduct]);

  // Reset selections when product or provider changes
  useEffect(() => {
    setSelectedColors([]);
    setSelectedSizes([]);
    setActiveColor("");
  }, [selectedProduct?.id, selectedProduct?.print_provider_id, selectedProduct?.printProviderId]);

  // Load saved local selections or default to first options
  useEffect(() => {
    if (uniqueColors.length > 0 && selectedColors.length === 0) {
      setSelectedColors([uniqueColors[0].name]);
      setActiveColor(uniqueColors[0].name);
    }
    if (uniqueSizes.length > 0 && selectedSizes.length === 0) {
      setSelectedSizes(uniqueSizes);
    }
  }, [uniqueColors, uniqueSizes]);

  // Keep activeColor in sync if it is no longer selected
  useEffect(() => {
    if (selectedColors.length > 0 && !selectedColors.includes(activeColor)) {
      setActiveColor(selectedColors[0]);
    }
  }, [selectedColors, activeColor]);

  // Auto-select variants when colors/sizes change
  useEffect(() => {
    if (selectedColors.length > 0 && selectedSizes.length > 0 && selectedProduct?.variants) {
      const variantIds = selectedProduct.variants
        .filter((v: any) => selectedColors.includes(v.color) && selectedSizes.includes(v.size))
        .map((v: any) => v.id);
      setSelectedVariants(variantIds);
    } else {
      setSelectedVariants([]);
    }
  }, [selectedColors, selectedSizes, selectedProduct, setSelectedVariants]);

  // Fetch Print Files for product
  useEffect(() => {
    if (selectedVariants.length > 0 && !printFiles) {
      const loadPrintFiles = async () => {
        try {
          const data = await printifyAPI.getPrintFiles(selectedProduct.id);
          if (data?.result) {
            onPrintFilesLoaded(data.result);
            if (data.result.available_techniques) {
              setAvailableTechniques(data.result.available_techniques);
              setSelectedTechnique(data.result.available_techniques[0] || "DTG");
            }
          }
        } catch (error) {
          console.error("Failed to load print files:", error);
        }
      };
      loadPrintFiles();
    }
  }, [selectedVariants, printFiles, selectedProduct, onPrintFilesLoaded]);

  // Toggle Accordion section helper
  const toggleAccordion = (section: string) => {
    setOpenAccordions((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Pricing calculations — matches Catalog card formula exactly
  const variants = useMemo(() => {
    return selectedProduct?.variants?.filter((v: any) => selectedVariants.includes(v.id)) || [];
  }, [selectedProduct, selectedVariants]);

  // Base cost uses same formula as Catalog Product Card:
  // product.premiumPrice || (product.price * 0.77)
  // Falls back to lowest variant price if product-level price fields are missing
  const productBaseCost = useMemo(() => {
    if (!selectedProduct) return 0;

    // Primary: use product-level fields (matches Catalog card exactly)
    if (selectedProduct.premiumPrice) {
      return parseFloat(selectedProduct.premiumPrice);
    }
    if (selectedProduct.price) {
      return parseFloat((parseFloat(selectedProduct.price) * 0.77).toFixed(2));
    }

    // Fallback: compute from lowest selected variant price (wholesale → premium)
    const allVariants = selectedProduct?.variants || [];
    const activeVariants = allVariants.filter((v: any) => selectedVariants.includes(v.id));
    const sourceVariants = activeVariants.length > 0 ? activeVariants : allVariants;
    if (sourceVariants.length > 0) {
      const prices = sourceVariants
        .map((v: any) => parseFloat(v.price || '0'))
        .filter((p: number) => p > 0);
      if (prices.length > 0) {
        return parseFloat((Math.min(...prices) * 0.77).toFixed(2));
      }
    }

    return 0;
  }, [selectedProduct, selectedVariants]);

  // Platform selling price = admin/category markup applied (no creator markup yet)
  // Uses context's calculateSellingPrice with no category arg → matches Catalog card behavior
  const platformSellingPrice = calculateSellingPrice(productBaseCost);

  // Apply creator markup on top of the platform price
  const creatorMarkupMultiplier = 1 + creatorMarkup / 100;
  const minSellingPrice = Math.round(platformSellingPrice * creatorMarkupMultiplier * 100) / 100;
  const maxSellingPrice = minSellingPrice;
  const hasPriceRange = false;

  // Creator Profit = only the portion generated by the Creator Markup
  const creatorProfit = Math.round((minSellingPrice - platformSellingPrice) * 100) / 100;

  // Pricing debug log whenever pricing elements change
  useEffect(() => {
    if (!selectedProduct) return;
    const blueprintId = selectedProduct.id;
    const providerId = selectedProduct.printProviderId || selectedProduct.print_provider_id;

    console.log(`[Canvas Pricing Debug]
- Blueprint ID: ${blueprintId}
- Print Provider ID: ${providerId}
- Product Base Cost (Premium): $${productBaseCost.toFixed(2)}
- Platform Selling Price (Admin/Category): $${platformSellingPrice.toFixed(2)}
- Creator Markup: ${creatorMarkup}%
- Retail Price shown in UI: $${minSellingPrice.toFixed(2)}
- Creator Profit shown in UI: $${creatorProfit.toFixed(2)}`);
  }, [selectedProduct, productBaseCost, platformSellingPrice, minSellingPrice, creatorProfit, creatorMarkup]);

  // Cooldown state for manual preview regeneration
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleManualRegenerate = async () => {
    if (cooldown > 0) return;
    setCooldown(30); // Set 30-second cooldown
    await onGeneratePreview();
  };

  // Auto mockup preview generator is disabled to prevent slow "Generating Printify mockups..." loops
  // We rely on the local 360 viewer for real-time preview, and only generate on publish or manual click
  useEffect(() => {
    // Intentionally disabled auto-generation for faster user experience
  }, [designFiles, selectedVariants, mockupUrls, onGeneratePreview]);

  // Drag and Drop Upload Handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(Array.from(files));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadFiles(Array.from(files));
    }
  };

  const uploadFiles = async (files: File[]) => {
    const allowed = ["png", "jpg", "jpeg", "svg", "webp"];
    const validFiles = files.filter((f) => allowed.includes(f.name.split(".").pop()?.toLowerCase() || ""));

    if (validFiles.length === 0) {
      toast.error("Please upload valid image files (PNG, JPG, SVG, WebP)");
      return;
    }

    setUploadingFile(true);
    const toastId = toast.loading(`Uploading ${validFiles.length} file(s)...`);

    try {
      const uploadedList = [];
      for (const file of validFiles) {
        const response = await printifyAPI.uploadFileDirectly(file);
        const imgData = response?.data || response;
        if (imgData && imgData.id) {
          const newFile = {
            id: imgData.id,
            filename: imgData.file_name || file.name,
            file_url: imgData.preview_url,
            thumbnail_url: imgData.preview_url,
            width: imgData.width,
            height: imgData.height,
          };
          uploadedList.push(newFile);
        }
      }

      if (uploadedList.length > 0) {
        const saved = localStorage.getItem("uploaded_printify_images");
        const existing = saved ? JSON.parse(saved) : [];
        const merged = [...existing];
        uploadedList.forEach((newFile) => {
          if (!merged.some((f: any) => f.id === newFile.id)) {
            merged.unshift(newFile);
          }
        });
        localStorage.setItem("uploaded_printify_images", JSON.stringify(merged));
      }

      toast.success("Files uploaded successfully!", { id: toastId });
      onRefreshFiles();
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.", { id: toastId });
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add design to placement
  const handleAddDesign = async (file: any) => {
    const activePrintFile = getActivePrintFile(printFiles, selectedVariants, activePlacement);
    if (!activePrintFile) {
      toast.error("No print template available for this placement. Please select variants first.");
      return;
    }

    // Set placement as active and selected
    if (!selectedPlacements.includes(activePlacement)) {
      setSelectedPlacements((prev) => [...prev, activePlacement]);
    }

    setSelectedFileId(file.id);

    // Calculate initial placement bounds (center of printable area)
    const baseWidth = activePrintFile.width * 0.7;
    const baseHeight = activePrintFile.height * 0.7;
    const baseTop = (activePrintFile.height - baseHeight) / 2;
    const baseLeft = (activePrintFile.width - baseWidth) / 2;

    const newDesign: any = {
      id: Date.now(),
      printify_id: file.id,
      imageId: file.id,
      filename: file.filename || file.file_name,
      url: file.file_url || file.thumbnail_url || file.preview_url || "",
      type: "design",
      placement: activePlacement,
      position: {
        area_width: activePrintFile.width,
        area_height: activePrintFile.height,
        width: baseWidth,
        height: baseHeight,
        top: baseTop,
        left: baseLeft,
        limit_to_print_area: true,
      },
    };

    // Filter out previous designs for this placement (single design per placement)
    const filteredDesigns = designFiles.filter((d) => d.placement !== activePlacement);
    const updatedDesigns = [...filteredDesigns, newDesign];

    setDesignFiles(updatedDesigns);
    setSelectedDesignFile(newDesign);
    toast.success(`Design added to ${activePlacement}!`);
  };

  const handleRemoveDesign = (placement: string) => {
    setDesignFiles((prev) => prev.filter((d) => d.placement !== placement));
    setSelectedPlacements((prev) => prev.filter((p) => p !== placement));
    if (activePlacement === placement) {
      setSelectedDesignFile(null);
      setSelectedFileId(undefined);
    }
    toast.success(`Removed design from ${placement}`);
  };

  // Fast center alignment triggers
  const handleCenterDesign = (type: "center" | "top-center" | "bottom-center" | "center-left" | "center-right") => {
    const activePrintFile = getActivePrintFile(printFiles, selectedVariants, activePlacement);
    if (!selectedDesignFile || !activePrintFile) return;

    applyQuickPosition(type, selectedDesignFile, activePrintFile, (updatedDesign) => {
      setDesignFiles((prev) => prev.map((d) => (d.id === selectedDesignFile.id ? updatedDesign : d)));
      setSelectedDesignFile(updatedDesign);
    });
  };

  // Metadata form changes
  const handleInputChange = (field: string, value: any) => {
    setProductForm((prev: any) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().toLowerCase();
    if (cleanTag && !productForm.tags.includes(cleanTag) && productForm.tags.length < 10) {
      handleInputChange("tags", [...productForm.tags, cleanTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      productForm.tags.filter((t: string) => t !== tagToRemove)
    );
  };

  // Validations checklist helper
  const validationSummary = useMemo(() => {
    const isBlueprint = !selectedProduct?.printify_id;
    const checks = {
      variants: selectedVariants.length > 0,
      designs: designFiles.length > 0,
      aspectRatio: aspectRatioIssues.length === 0,
      mockups: isBlueprint ? true : (mockupUrls && mockupUrls.length > 0),
      details: productForm.name.trim().length > 0 && productForm.description.trim().length >= 20,
    };

    // Note: aspectRatio check is non-blocking (warnings only, does not prevent publishing)
    const blockingChecks = {
      variants: checks.variants,
      designs: checks.designs,
      mockups: checks.mockups,
      details: checks.details,
    };

    return {
      ...checks,
      allValid: Object.values(blockingChecks).every(Boolean),
    };
  }, [selectedVariants, designFiles, aspectRatioIssues, mockupUrls, productForm, selectedProduct]);

  // Publish submit action
  const handlePublishSubmit = async () => {
    // Form validator
    const errors: Record<string, string> = {};
    if (!productForm.name.trim()) errors.name = "Storefront product name is required";
    if (!productForm.description.trim()) {
      errors.description = "Product description is required";
    } else if (productForm.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
    }
    if (!productForm.category) errors.category = "Please select a category";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Please fill out the storefront details correctly");
      return;
    }

    if (!validationSummary.allValid) {
      toast.error("Please complete variant selection, design positioning, and mockup previews before publishing");
      return;
    }

    await onPublish(productForm);
  };

  // Get placement friendly name
  const getPlacementLabel = (placementId: string) => {
    const labels: Record<string, string> = {
      front: "Front Print",
      back: "Back Print",
      sleeve_left: "Left Sleeve",
      sleeve_right: "Right Sleeve",
      left: "Left Sleeve",
      right: "Right Sleeve",
      neck: "Neck Label",
    };
    return labels[placementId.toLowerCase()] || placementId;
  };

  const getPlacementIcon = (placementId: string) => {
    const svgs: Record<string, React.ReactNode> = {
      front: <FrontSVG className="w-5 h-5" />,
      back: <BackSVG className="w-5 h-5" />,
      left: <LeftSleeveSVG className="w-5 h-5" />,
      right: <RightSleeveSVG className="w-5 h-5" />,
      sleeve_left: <LeftSleeveSVG className="w-5 h-5" />,
      sleeve_right: <RightSleeveSVG className="w-5 h-5" />,
      neck: <Tag className="w-5 h-5 text-orange-400" />,
    };
    return svgs[placementId.toLowerCase()] || <FrontSVG className="w-5 h-5" />;
  };

  // Track viewer modes (360 interactive vs grid of all mockups)
  const [mockupViewMode, setMockupViewMode] = useState<"360" | "grid">("360");

  return (
    <div className="bg-[#050505] min-h-screen text-white relative pt-[30px] md:pt-[40px]">
      {/* Sticky Header with Product Info & Continue Button - offset by navbar height + 10px spacing */}
      <div className="sticky top-[90px] md:top-[98px] z-40 bg-black/80 backdrop-blur-md border-b border-white/10 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-sm sm:text-base md:text-lg font-bold font-clash text-white line-clamp-1">
              {selectedProduct?.title || selectedProduct?.name}
            </div>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">
              SKU: {selectedProduct?.model || selectedProduct?.id} | {selectedProduct?.type_name}
            </p>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <div title={mockupStatus !== 'Mockups loaded successfully!' ? "Please generate high-quality mockups first" : (!validationSummary.allValid ? "Please fill in all required fields" : "")}>
              <Button
                onClick={handlePublishSubmit}
                disabled={isPublishing || !validationSummary.allValid || isGeneratingPreview || mockupStatus !== 'Mockups loaded successfully!'}
                className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Publishing...</span>
                  </div>
                ) : (
                  "Publish Product"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT COLUMN: Main PDP Customizer Workspace */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">

          {/* Section 1: Product Information */}
          <div className="gradient-border-white-top p-5 sm:p-6 bg-gray-900/60 rounded-3xl backdrop-blur-sm border border-white/5">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-1/3 aspect-square relative bg-[#f4f4f5] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0 p-4">
                {selectedProduct?.image || (selectedProduct?.images && selectedProduct.images.length > 0) ? (
                  <img
                    src={selectedProduct?.image || selectedProduct?.images?.[0]}
                    alt={selectedProduct?.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <ShoppingBag className="w-12 h-12 text-gray-600" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <span className="text-[10px] sm:text-xs font-semibold bg-[#FF6D1F]/20 text-[#FF6D1F] px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Base Catalog Item
                </span>
                <h2 className="text-xl sm:text-2xl font-bold font-clash text-white">
                  {selectedProduct?.title || selectedProduct?.name}
                </h2>
                <div className="text-xs sm:text-sm text-gray-400 font-medium line-clamp-3 break-words overflow-hidden text-ellipsis">
                  {cleanDescription(selectedProduct?.description) || "High-quality custom creator merchandise product. Select colors and sizes, add designs on print areas, and preview your premium storefront ready mockup."}
                </div>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-gray-500">
                  <div>Type: <span className="text-white">{selectedProduct?.type_name || "Apparel"}</span></div>
                  <div>SKU: <span className="text-white">{selectedProduct?.id}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Variant Selection */}
          <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleAccordion("variants")}>
              <h3 className="text-lg sm:text-xl font-bold font-clash flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-[#FF6D1F]" />
                Choose Variants (Colors & Sizes)
              </h3>
              {openAccordions.variants ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.variants && (
              <div className="space-y-6 pt-3 animate-fadeIn">
                {/* Print Provider Select */}
                {selectedProduct?.providers && selectedProduct.providers.length > 0 && (
                  <div className="space-y-3 pb-4 border-b border-white/5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs sm:text-sm font-semibold text-gray-300 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-[#FF6D1F]" />
                        Select Print Provider
                      </label>
                      <span className="text-[10px] text-gray-500">
                        {selectedProduct.providers.length} provider(s) available
                      </span>
                    </div>
                    <Select
                      value={String(selectedProduct.print_provider_id || selectedProduct.printProviderId || "")}
                      onValueChange={(val) => {
                        const numericVal = parseInt(val);
                        if (numericVal && onProviderChange) {
                          onProviderChange(numericVal);
                        }
                      }}
                    >
                      <SelectTrigger className="w-full h-[46px] bg-black/60 border-white/10 rounded-xl px-4 text-xs sm:text-sm text-gray-200">
                        <SelectValue placeholder="Select Print Provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct.providers.map((provider: any) => (
                          <SelectItem key={provider.id} value={String(provider.id)}>
                            {provider.title} (ID: {provider.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Colors Select */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-semibold text-gray-300">Select Colors</label>
                    <span className="text-[10px] text-gray-500">{selectedColors.length} color(s) selected</span>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {uniqueColors.map((color: any) => {
                      const isSelected = selectedColors.includes(color.name);
                      return (
                        <button
                          key={color.name}
                          onClick={() => {
                            setActiveColor(color.name);
                            if (isSelected) {
                              if (selectedColors.length > 1) {
                                setSelectedColors(selectedColors.filter((c) => c !== color.name));
                              } else {
                                toast.error("Select at least one color");
                              }
                            } else {
                              setSelectedColors([...selectedColors, color.name]);
                            }
                          }}
                          className={`relative border-2 rounded-full px-4 py-2 flex items-center gap-2 transition-all duration-300 ${isSelected
                            ? (activeColor === color.name ? "border-[#FF6D1F] scale-105 shadow-[0_0_12px_rgba(255,109,31,0.3)]" : "border-white scale-105")
                            : "border-transparent hover:border-white/30"
                            }`}
                          style={{ backgroundColor: color.code }}
                        >
                          <span
                            className="text-xs font-semibold whitespace-nowrap"
                            style={{
                              color: getContrastTextColor(color.code),
                            }}
                          >
                            {color.name}
                          </span>
                          {isSelected && (
                            <span className="bg-white/90 p-0.5 rounded-full">
                              <Check className="w-3 h-3 text-black" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sizes Select */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-semibold text-gray-300">Select Sizes</label>
                    <div className="flex gap-3 text-[10px]">
                      <button
                        onClick={() => setSelectedSizes(uniqueSizes)}
                        className="text-[#FF6D1F] hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-gray-600">|</span>
                      <button
                        onClick={() => setSelectedSizes([])}
                        className="text-gray-400 hover:underline"
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {uniqueSizes.map((size: string) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedSizes(selectedSizes.filter((s) => s !== size));
                            } else {
                              setSelectedSizes([...selectedSizes, size]);
                            }
                          }}
                          className={`border-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${isSelected
                            ? "border-[#FF6D1F] bg-[#FF6D1F]/10 text-white font-bold"
                            : "border-white/10 bg-white/5 text-gray-300 hover:border-white/35"
                            }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Print Technique Select */}
                {availableTechniques.length > 0 && (
                  <PrintingTechniqueSelector
                    selectedTechnique={selectedTechnique}
                    onTechniqueChange={setSelectedTechnique}
                    availableTechniques={availableTechniques}
                    loading={false}
                  />
                )}

                {/* Regional Availability */}
                {selectedProduct && selectedVariants.length > 0 && (
                  <RegionalAvailabilityPreview
                    selectedProduct={selectedProduct}
                    selectedVariants={selectedVariants}
                  />
                )}
              </div>
            )}
          </div>

          {/* Section 3: Design Upload & Placement */}
          <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleAccordion("design")}>
              <h3 className="text-lg sm:text-xl font-bold font-clash flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-[#FF6D1F]" />
                Design Upload & Placement
              </h3>
              {openAccordions.design ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.design && (
              <div className="space-y-6 pt-3 animate-fadeIn">
                {/* Placement Cards */}
                <div className="space-y-3">
                  <label className="text-xs sm:text-sm font-semibold text-gray-300">Choose Placement Target</label>
                  <div className={`grid gap-3 grid-cols-2 sm:grid-cols-${Math.min(getSupportedPlacements().length, 4)}`}>
                    {getSupportedPlacements().map((placement) => {
                      const isActive = activePlacement === placement;
                      const hasAssigned = designFiles.find((d) => d.placement === placement);
                      return (
                        <div
                          key={placement}
                          onClick={() => setActivePlacement(placement)}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center justify-center gap-2 h-28 relative ${isActive
                            ? "border-white bg-white/5"
                            : hasAssigned
                              ? "border-[#FF6D1F]/50 bg-[#FF6D1F]/5"
                              : "border-white/10 bg-black/30 hover:border-white/30"
                            }`}
                        >
                          {hasAssigned ? (
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20">
                              <img
                                src={hasAssigned.url}
                                alt="Assigned Design"
                                className="w-full h-full object-contain bg-gray-800"
                              />
                            </div>
                          ) : (
                            getPlacementIcon(placement)
                          )}
                          <span className="text-xs font-semibold capitalize text-center">
                            {getPlacementLabel(placement)}
                          </span>

                          {hasAssigned && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDesign(placement);
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500/20 hover:bg-red-500/40 rounded-full border border-red-500/30 text-red-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 ${isDragging
                    ? "border-[#FF6D1F] bg-[#FF6D1F]/10 scale-[1.01]"
                    : "border-white/10 bg-black/40 hover:border-white/30"
                    }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.svg,.webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadingFile ? (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-10 h-10 text-[#FF6D1F] animate-spin" />
                      <p className="text-sm font-semibold">Uploading your design files...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
                        <Upload className="w-8 h-8 text-[#FF6D1F]" />
                      </div>
                      <p className="text-sm font-bold text-white">Drag & drop files or click to upload</p>
                      <p className="text-xs text-gray-500">Supports PNG, JPG, SVG, WebP (Transparent PNG recommended)</p>
                    </div>
                  )}
                </div>

                {/* Uploaded Gallery */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-semibold text-gray-300">
                      Your Uploaded designs
                    </label>
                    {totalPages > 1 && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onRefreshFiles(currentPage - 1)}
                          disabled={currentPage <= 1 || isFetchingFiles}
                          className="p-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-medium text-gray-400">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => onRefreshFiles(currentPage + 1)}
                          disabled={currentPage >= totalPages || isFetchingFiles}
                          className="p-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-50 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isFetchingFiles ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 border border-white/5 rounded-2xl bg-black/20">
                      <Loader2 className="w-6 h-6 text-[#FF6D1F] animate-spin" />
                      <span className="text-xs text-gray-400">Loading designs...</span>
                    </div>
                  ) : uploadedFiles.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {uploadedFiles.map((file) => {
                        const isAssigned = selectedFileId === file.id;
                        return (
                          <div
                            key={file.id}
                            onClick={() => handleAddDesign(file)}
                            className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all bg-black/50 ${isAssigned ? "border-[#FF6D1F]" : "border-white/10 hover:border-white/30"
                              }`}
                          >
                            <img
                              src={file.thumbnail_url || file.file_url || file.preview_url}
                              alt={file.filename || file.file_name || "Uploaded design"}
                              className="w-full h-full object-cover p-1 bg-gray-800"
                            />
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Plus className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 py-4 text-center border border-white/5 rounded-2xl bg-black/20">No uploaded files yet. Upload a design above to customize.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Live Position Editor */}
          <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleAccordion("editor")}>
              <h3 className="text-lg sm:text-xl font-bold font-clash flex items-center gap-2.5">
                <ImageUpscale className="w-5 h-5 text-[#FF6D1F]" />
                Live Position Editor
              </h3>
              {openAccordions.editor ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.editor && (
              <div className="space-y-6 pt-3 animate-fadeIn">
                <div className="bg-black/80 rounded-2xl p-4 sm:p-6 border border-white/10 flex flex-col items-center justify-center">
                  <DesignCanvasTab
                    designFiles={designFiles}
                    setDesignFiles={setDesignFiles}
                    activePlacement={activePlacement}
                    selectedPlacements={selectedPlacements}
                    setSelectedPlacements={setSelectedPlacements}
                    setActivePlacement={setActivePlacement}
                    selectedDesignFile={selectedDesignFile}
                    setSelectedDesignFile={setSelectedDesignFile}
                    activePrintFile={getActivePrintFile(printFiles, selectedVariants, activePlacement)}
                    updateDesignPosition={(designId, updates) => {
                      setDesignFiles((prev) => prev.map((d) => (d.id === designId ? { ...d, position: { ...d.position, ...updates } } : d)));
                    }}
                    onAspectRatioIssues={setAspectRatioIssues}
                    aspectRatioIssues={aspectRatioIssues}
                  />

                  {designFiles.length > 0 && selectedDesignFile && (
                    <div className="mt-6 w-full max-w-md bg-gray-900 p-4 rounded-xl border border-white/5 space-y-3">
                      <div className="text-xs font-semibold text-gray-400">Positioning Helpers</div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => handleCenterDesign("center")}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/15"
                        >
                          Center All
                        </button>
                        <button
                          onClick={() => handleCenterDesign("top-center")}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/15"
                        >
                          Center Top
                        </button>
                        <button
                          onClick={() => handleCenterDesign("bottom-center")}
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/15"
                        >
                          Center Bottom
                        </button>
                      </div>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        <button
                          type="button"
                          onClick={handleRemoveDesignBackground}
                          disabled={!selectedDesignFile || isRemovingBackground}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRemovingBackground ? "Removing Background..." : "Remove Background"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Live Product Mockups */}
          <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleAccordion("mockups")}>
              <h3 className="text-lg sm:text-xl font-bold font-clash flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#FF6D1F]" />
                Live Product Mockups
              </h3>
              {openAccordions.mockups ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.mockups && (
              <div className="space-y-6 pt-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-gray-400">
                    Real-time local preview is active. To fetch high-quality Printify mockups, click regenerate.
                  </p>
                  <Button
                    onClick={handleManualRegenerate}
                    disabled={isGeneratingPreview || designFiles.length === 0 || cooldown > 0}
                    className="bg-white/5 hover:bg-white/10 text-white font-semibold text-xs py-2 px-3 border border-white/10 rounded-lg self-start sm:self-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingPreview
                      ? "Generating..."
                      : cooldown > 0
                        ? `Wait ${cooldown}s`
                        : "Regenerate Previews"
                    }
                  </Button>
                </div>

                {mockupStatus && (
                  <div className="bg-gray-900 p-3.5 rounded-xl border border-white/5 flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#FF6D1F] flex-shrink-0" />
                    <span className="text-xs text-gray-300">{mockupStatus}</span>
                  </div>
                )}

                {/* Tab selector for 360° interactive vs grid of mockups */}
                {mockupUrls && mockupUrls.length > 0 && !isGeneratingPreview && (
                  <div className="flex border border-white/10 rounded-xl p-1 bg-black/40 w-fit">
                    <button
                      type="button"
                      onClick={() => setMockupViewMode("360")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${mockupViewMode === "360"
                        ? "bg-[#FF6D1F] text-white"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      360° Spin
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupViewMode("grid")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${mockupViewMode === "grid"
                        ? "bg-[#FF6D1F] text-white"
                        : "text-gray-400 hover:text-white"
                        }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      Grid View
                    </button>
                  </div>
                )}

                <div className="w-full">
                  {isGeneratingPreview ? (
                    // Mockup Grid Loading State Skeletons
                    <div className="grid grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-gray-800/40 rounded-2xl border border-white/5 animate-pulse flex flex-col items-center justify-center gap-2"
                        >
                          <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
                          <span className="text-[10px] text-gray-500">Preparing preview...</span>
                        </div>
                      ))}
                    </div>
                  ) : (mockupUrls && mockupUrls.length > 0) || (selectedProduct?.images && selectedProduct.images.length > 0) ? (
                    mockupViewMode === "360" ? (
                      <div className="max-w-md mx-auto">
                        <Product360Viewer
                          mockupUrls={mockupUrls}
                          images={selectedProduct?.images || []}
                          defaultImage={selectedProduct?.image || (variants.length > 0 ? variants[0]?.image : undefined)}
                          productName={selectedProduct?.title || selectedProduct?.name}
                          designFiles={designFiles}
                          activePlacement={activePlacement}
                          onPlacementChange={setActivePlacement}
                          activeColorHex={activeColorHex}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {((mockupUrls && mockupUrls.length > 0) ? mockupUrls : (selectedProduct?.images || []).map((url: string, index: number) => {
                          let placement = "front";
                          if (index === 2 || url.toLowerCase().includes("back") || url.toLowerCase().includes("reverse")) {
                            placement = "back";
                          } else if (url.toLowerCase().includes("left") || url.toLowerCase().includes("sleeve_left")) {
                            placement = "sleeve_left";
                          } else if (url.toLowerCase().includes("right") || url.toLowerCase().includes("sleeve_right")) {
                            placement = "sleeve_right";
                          } else if (index > 0) {
                            placement = `other_${index}`;
                          }

                          let title = "Front View";
                          if (placement === "back") title = "Back View";
                          else if (placement === "sleeve_left") title = "Left Sleeve";
                          else if (placement === "sleeve_right") title = "Right Sleeve";
                          else if (placement.startsWith("other_")) title = `Angle View ${index}`;

                          return {
                            url,
                            placement,
                            title,
                          };
                        })).map((m: any, index: number) => {
                          const isBlueprint = !mockupUrls || mockupUrls.length === 0;

                          // Find overlay design if we don't have generated mockups
                          const design = isBlueprint ? designFiles.find(d => d.placement === m.placement) : null;
                          const effectivePlacement = design ? design.placement : (m.placement || "front");

                          const MOCKUP_PRINT_AREAS: Record<string, { width: number; height: number; top: number; left: number }> = {
                            front: { width: 33, height: 45, top: 24, left: 33.5 },
                            back: { width: 33, height: 45, top: 22, left: 33.5 },
                            left: { width: 15, height: 15, top: 32, left: 42.5 },
                            right: { width: 15, height: 15, top: 32, left: 42.5 },
                            sleeve_left: { width: 15, height: 15, top: 32, left: 42.5 },
                            sleeve_right: { width: 15, height: 15, top: 32, left: 42.5 },
                          };
                          const area = MOCKUP_PRINT_AREAS[effectivePlacement] || MOCKUP_PRINT_AREAS.front;

                          let designStyle: React.CSSProperties = {};
                          if (design && design.position) {
                            const w = (design.position.width / design.position.area_width) * 100;
                            const h = (design.position.height / design.position.area_height) * 100;
                            const t = (design.position.top / design.position.area_height) * 100;
                            const l = (design.position.left / design.position.area_width) * 100;
                            designStyle = {
                              width: `${w}%`,
                              height: `${h}%`,
                              top: `${t}%`,
                              left: `${l}%`,
                              position: "absolute",
                            };
                          }
                          return (
                            <div
                              key={index}
                              className={`border border-white/10 rounded-2xl overflow-hidden hover:shadow-[0_10px_30px_rgba(255,109,31,0.1)] transition-all duration-300 relative aspect-square p-6 ${isBlueprint ? "bg-[#f4f4f5]" : "bg-black/40"
                                }`}
                            >
                              {isBlueprint ? (
                                <div className="relative w-full h-full flex items-center justify-center">
                                  <img
                                    src={m.url}
                                    alt={m.title || `Catalog Image ${index + 1}`}
                                    className="w-full h-full object-contain pointer-events-none"
                                  />
                                </div>
                              ) : (
                                <img src={m.url} alt={m.title || `Mockup ${index + 1}`} className="w-full h-full object-contain pointer-events-none" />
                              )}

                              <div className="absolute bottom-0 inset-x-0 bg-gray-900/80 p-2 text-center text-[10px] sm:text-xs text-gray-400 border-t border-white/5 z-20">
                                {m.title || "Product View"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  ) : (
                    <div className="py-12 text-center bg-black/20 rounded-2xl border border-white/5">
                      <ScanEye className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No previews generated yet</p>
                      <p className="text-xs text-gray-500 mt-1">Select variants and add a design to preview</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 6: Storefront Details Form */}
          <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleAccordion("listing")}>
              <h3 className="text-lg sm:text-xl font-bold font-clash flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#FF6D1F]" />
                Storefront Listing Details
              </h3>
              {openAccordions.listing ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.listing && (
              <div className="space-y-5 pt-3 animate-fadeIn">
                {/* Storefront Name */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="E.g., Limited Edition Neon Horizon Oversized Hoodie"
                    className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all ${formErrors.name ? "border-red-500/50 bg-red-500/5" : "border-white/10"
                      }`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                    Product Description *
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    placeholder="Describe your design and brand story... Must be at least 20 characters."
                    className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all resize-none ${formErrors.description ? "border-red-500/50 bg-red-500/5" : "border-white/10"
                      }`}
                  />
                  {formErrors.description ? (
                    <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>
                  ) : (
                    <p className="text-[10px] text-gray-500">
                      {productForm.description.trim().length} / 500 minimum character check
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                      Marketplace Category *
                    </label>
                    <Select
                      value={productForm.category || "placeholder"}
                      onValueChange={(val) => handleInputChange("category", val)}
                    >
                      <SelectTrigger className={`w-full h-[46px] px-4 bg-black/60 rounded-xl text-sm text-white ${formErrors.category ? "border-red-500/50 bg-red-500/5" : "border-white/10"}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder" disabled>Select category</SelectItem>
                        <SelectItem value="apparel">Apparel</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="home-living">Home & Living</SelectItem>
                        <SelectItem value="stationery">Stationery</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-xs text-red-400 mt-1">{formErrors.category}</p>}
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                      Search Tags (Optional)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                        placeholder="Press Enter or Plus to add"
                        className="flex-1 px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6D1F]"
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="px-4 bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white rounded-xl"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {productForm.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 bg-[#FF6D1F]/15 border border-[#FF6D1F]/20 text-[#FF6D1F] px-2.5 py-1 rounded-full text-xs"
                        >
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)}>
                            <X className="w-3 h-3 text-[#FF6D1F]" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 7: Review & Validation Summary */}
          <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleAccordion("review")}>
              <h3 className="text-lg sm:text-xl font-bold font-clash flex items-center gap-2.5">
                <ScanEye className="w-5 h-5 text-[#FF6D1F]" />
                Customization Review Checklist
              </h3>
              {openAccordions.review ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.review && (
              <div className="space-y-4 pt-3 text-xs sm:text-sm animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 p-3 rounded-xl">
                    <div className={`p-1.5 rounded-full ${validationSummary.variants ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {validationSummary.variants ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold">Variants Selected</div>
                      <div className="text-[10px] text-gray-500">
                        {selectedVariants.length} of {selectedProduct?.variants?.length || 0} variant IDs selected
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 p-3 rounded-xl">
                    <div className={`p-1.5 rounded-full ${validationSummary.designs ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {validationSummary.designs ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold">Designs Placed</div>
                      <div className="text-[10px] text-gray-500">
                        {designFiles.length} print area assignment(s) configured
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 p-3 rounded-xl">
                    <div className={`p-1.5 rounded-full ${validationSummary.aspectRatio ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                      {validationSummary.aspectRatio ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold">Aspect Ratio Status</div>
                      <div className="text-[10px] text-gray-500">
                        {validationSummary.aspectRatio ? "All placements pass backend validation" : `${aspectRatioIssues.length} aspect ratio warning(s) (non-blocking)`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 p-3 rounded-xl">
                    <div className={`p-1.5 rounded-full ${validationSummary.mockups ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {validationSummary.mockups ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold">Product Previews Ready</div>
                      <div className="text-[10px] text-gray-500">
                        {validationSummary.mockups
                          ? (!selectedProduct?.printify_id ? "Vector outlines loaded" : `${mockupUrls.length} view mockups ready`)
                          : "No mockups generated yet"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 bg-black/40 border border-white/5 p-3 rounded-xl md:col-span-2">
                    <div className={`p-1.5 rounded-full ${validationSummary.details ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {validationSummary.details ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold">Storefront Metadata Complete</div>
                      <div className="text-[10px] text-gray-500">
                        {validationSummary.details ? "Product name and description complete" : "Title and Description (&gt;=20 chars) are required"}
                      </div>
                    </div>
                  </div>
                </div>

                {validationSummary.allValid && (
                  <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl flex items-start gap-3 mt-4">
                    <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-green-400 text-sm">All Checks Passed Successfully!</h4>
                      <p className="text-xs text-green-300/80 mt-1">
                        Your custom product is fully configured and ready to be published live to the marketplace.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Right Sidebar (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-[110px] space-y-6">

            {/* Thumbnail Preview Card */}
            <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-5 space-y-5">
              <Product360Viewer
                mockupUrls={filteredMockupUrls}
                images={selectedProduct?.images || []}
                defaultImage={selectedProduct?.image || (variants.length > 0 ? variants[0]?.image : undefined)}
                productName={selectedProduct?.title || selectedProduct?.name}
                designFiles={designFiles}
                activePlacement={activePlacement}
                onPlacementChange={setActivePlacement}
                activeColorHex={activeColorHex}
              />

              <div className="space-y-1">
                <h4 className="font-bold font-clash text-base line-clamp-1">{productForm.name || "Custom Creator Product"}</h4>
                <p className="text-xs text-gray-400 capitalize">{productForm.category || "Apparel"}</p>
              </div>

              <hr className="border-white/10" />

              {/* Selections Details list */}
              <div className="space-y-3.5 text-xs text-gray-300">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Selected Colors:</span>
                  <span className="font-semibold text-white max-w-[150px] truncate text-right">
                    {selectedColors.length > 0 ? selectedColors.join(", ") : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Selected Sizes:</span>
                  <span className="font-semibold text-white max-w-[150px] truncate text-right">
                    {selectedSizes.length > 0 ? selectedSizes.join(", ") : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Designs Placed:</span>
                  <span className="font-semibold text-white">
                    {designFiles.length} placement(s)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Mockups generated:</span>
                  <span className="font-semibold text-white">
                    {mockupUrls.length} image(s)
                  </span>
                </div>
              </div>

              <hr className="border-white/10" />

              {/* Creator Markup */}
              <div className="relative p-5 bg-gradient-to-br from-gray-950 to-gray-900 rounded-2xl border border-white/8 shadow-xl overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                    <Percent className="w-4 h-4 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Creator Markup</h3>
                    <p className="text-[10px] text-gray-400">Set your own additional markup for this product.</p>
                  </div>
                </div>

                <div className="space-y-4 py-1">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-gray-400">Your Markup</span>
                    <span className="text-3xl font-extrabold text-orange-400 tabular-nums">
                      {creatorMarkup}%
                    </span>
                  </div>

                  <div className="px-1">
                    <Slider
                      value={creatorMarkup}
                      min={0}
                      max={100}
                      step={1}
                      onChange={handleCreatorMarkupChange}
                      sx={creatorSliderSx}
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Quick Presets</span>
                    <div className="flex flex-wrap gap-1.5">
                      {CREATOR_MARKUP_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => handleCreatorPresetClick(preset)}
                          className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                            creatorMarkup === preset
                              ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_8px_rgba(255,109,31,0.35)]'
                              : 'bg-gray-900 text-gray-400 border-white/5 hover:border-orange-500/25 hover:text-gray-200'
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="mt-4 bg-black/60 border border-white/5 p-3 rounded-xl space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Final Price:</span>
                    <span className="font-bold text-white text-xs">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Creator Profit:</span>
                    <span className="font-extrabold text-green-400 text-xs">
                      +${creatorProfit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Action button */}
              <Button
                onClick={handlePublishSubmit}
                disabled={isPublishing || !validationSummary.allValid}
                className="w-full bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-extrabold text-sm py-4 rounded-2xl transition-all shadow-[0_4px_25px_rgba(255,109,31,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPublishing ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Publishing to Marketplace...</span>
                  </div>
                ) : (
                  "Save & Publish Live"
                )}
              </Button>
            </div>

            {/* Creator Help banner */}
            <div className="bg-[#FF6D1F]/5 border border-[#FF6D1F]/15 rounded-3xl p-5 space-y-3">
              <h5 className="font-bold text-sm text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#FF6D1F]" />
                Creator Tips
              </h5>
              <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                <li>Choose bright colors to attract customer attention</li>
                <li>Write a description with materials & sizing tips</li>
                <li>Keep the main design centered for best results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Screen Experience */}
      <div className="sticky bottom-0 z-35 bg-black/90 backdrop-blur-md border-t border-white/10 py-3 px-4 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 bg-black/50">
            {mockupUrls && mockupUrls.length > 0 ? (
              <img src={mockupUrls[0].url} alt="Mobile Preview" className="w-full h-full object-contain" />
            ) : (
              <ShoppingBag className="w-5 h-5 text-gray-500 m-2" />
            )}
          </div>
          <div>
            <div className="text-[10px] text-gray-500">Retail Price Range</div>
            <div className="text-xs sm:text-sm font-bold text-[#FF6D1F]">
              {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
            </div>
          </div>
        </div>
        <div title={mockupStatus !== 'Mockups loaded successfully!' ? "Please generate high-quality mockups first" : (!validationSummary.allValid ? "Please fill in all required fields" : "")}>
          <Button
            onClick={handlePublishSubmit}
            disabled={isPublishing || !validationSummary.allValid || isGeneratingPreview || mockupStatus !== 'Mockups loaded successfully!'}
            className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? "Publishing..." : "Publish Product"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UnifiedCanvasPDP;
