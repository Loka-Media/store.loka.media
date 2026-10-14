/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Upload,
  Plus,
  ArrowLeft,
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
  Star,
  GripVertical,
  UploadCloud,
  ArrowRight,
  CheckCircle2,
  Layers,
  BookOpen,
  Footprints,
  Sliders,
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
import { useAuth } from "@/contexts/AuthContext";
import { CATEGORIES_MAP } from "@/config/categories";
import { calculateFinalRetailPrice, calculateRetailPriceFromMarkup, ensure99Pricing } from "@/lib/pricing-utils";

import { getCanvasDimensions, getActivePrintFile, applyQuickPosition, calculateAspectRatioAwareDimensions } from "./utils";
import DesignCanvasTab from "./DesignCanvasTab";
import PrintingTechniqueSelector from "./PrintingTechniqueSelector";
import { RegionalAvailabilityPreview } from "./RegionalAvailabilityPreview";
import { FrontSVG, BackSVG, LeftSleeveSVG, RightSleeveSVG, CollarSVG } from "./PlacementSVGs";

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
  setMockupUrls?: React.Dispatch<React.SetStateAction<any[]>>;
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
  isEditing?: boolean;
}

const cleanDescription = (text?: string): string => {
  if (!text) return "";
  // Strip HTML tags
  let clean = text.replace(/<[^>]*>?/gm, '');
  // Decode common HTML entities and clean Printify formatting artifact
  clean = clean
    .replace(/\.\.\:/g, '. ')
    .replace(/\.\:/g, ': ')
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
  supportedPlacements?: string[];
  activeUrl?: string;
}> = ({ mockupUrls, images = [], defaultImage, productName, designFiles, activePlacement = "front", onPlacementChange, activeColorHex, supportedPlacements, activeUrl }) => {
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
    neck: { width: 25, height: 25, top: 22, left: 37.5 },
  };

  // Find if there's an active design for a mockup view based on its title
  const getDesignForMockup = (mockupTitle: string, placement?: string) => {
    if (!designFiles || designFiles.length === 0) return null;
    const title = mockupTitle.toLowerCase();
    const p = (placement || "").toLowerCase();

    // 1. Direct placement match
    const direct = designFiles.find((d) => d.placement === p || d.placement === title);
    if (direct) return direct;

    // 2. Book / Journal cover views
    if (p.includes("back") || title.includes("back")) {
      const backDesign = designFiles.find((d) => d.placement === "back" || d.placement === "back_cover" || d.placement === "back_left_leg" || d.placement === "back_right_leg");
      if (backDesign) return backDesign;
    }

    if (p.includes("front") || title.includes("front")) {
      const frontDesign = designFiles.find((d) => d.placement === "front" || d.placement === "front_cover" || d.placement === "full_wrap" || d.placement === "front_left_leg" || d.placement === "front_right_leg");
      if (frontDesign) return frontDesign;
    }

    let resolvedPlacement = "front";
    if (p.includes("back") || title.includes("back")) resolvedPlacement = "back";
    else if (p.includes("neck") || title.includes("neck") || p.includes("label") || title.includes("label")) resolvedPlacement = "neck";
    else if (p.includes("left") || title.includes("left")) resolvedPlacement = "sleeve_left";
    else if (p.includes("right") || title.includes("right")) resolvedPlacement = "sleeve_right";

    return designFiles.find((d) => d.placement === resolvedPlacement || (d.placement === "left" && resolvedPlacement === "sleeve_left") || (d.placement === "right" && resolvedPlacement === "sleeve_right")) || designFiles[0] || null;
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
        const placements = (supportedPlacements && supportedPlacements.length > 0)
          ? supportedPlacements
          : ["front", "back", "sleeve_left", "sleeve_right", "neck"];
        const hasBack = placements.some((p) => p.includes("back"));

        itemsToProcess = images.map((url, index) => {
          const urlLower = url.toLowerCase();
          let placement = "front";

          if (urlLower.includes("back") || urlLower.includes("rear") || urlLower.includes("reverse")) {
            placement = "back";
          } else if (urlLower.includes("neck") || urlLower.includes("label") || urlLower.includes("collar")) {
            placement = "neck";
          } else if (urlLower.includes("left") || urlLower.includes("sleeve_left")) {
            placement = "sleeve_left";
          } else if (urlLower.includes("right") || urlLower.includes("sleeve_right")) {
            placement = "sleeve_right";
          } else if (hasBack && ((images.length <= 3 && index === 1) || (images.length >= 4 && index === 2))) {
            placement = "back";
          } else if (index > 0) {
            placement = `other_${index}`;
          }

          let title = "Front View";
          if (placement === "back") title = "Back View";
          else if (placement === "neck") title = "Neck Label";
          else if (placement === "sleeve_left") title = "Left Sleeve";
          else if (placement === "sleeve_right") title = "Right Sleeve";
          else if (placement.startsWith("other_")) title = `Angle View ${index}`;

          return {
            url,
            src: url,
            placement,
            title,
          };
        });
      }
    }

    if (itemsToProcess.length === 0) return [];

    // Filter out duplicate mockup URLs while preserving exact 1-to-1 card order
    const seenUrls = new Set<string>();
    return itemsToProcess.filter((m) => {
      const url = m.url || m.src || "";
      if (!url) return false;
      if (seenUrls.has(url)) return false;
      seenUrls.add(url);
      return true;
    });
  }, [mockupUrls, images, supportedPlacements]);

  // Sync activeIndex when parent passes a specific activeUrl (left-card click or placement change)
  useEffect(() => {
    if (!activeUrl || sortedMockups.length === 0) return;
    const index = sortedMockups.findIndex(m => (m.url || m.src) === activeUrl);
    if (index !== -1 && index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [activeUrl, sortedMockups]);

  // Reset active view index when mockup set changes or activePlacement changes
  useEffect(() => {
    if (!activePlacement || sortedMockups.length === 0) {
      return;
    }
    const target = (activePlacement || "").toLowerCase().trim();

    // Find index of mockup that matches activePlacement
    const index = sortedMockups.findIndex(m => {
      const title = (m.title || "").toLowerCase();
      const placement = (m.placement || "").toLowerCase();
      const url = (m.url || m.src || "").toLowerCase();

      if (target.includes("back")) {
        return placement.includes("back") || title.includes("back") || url.includes("back") || url.includes("rear") || url.includes("reverse");
      }
      if (target.includes("front")) {
        return (placement.includes("front") || title.includes("front") || url.includes("front")) && !placement.includes("back") && !title.includes("back");
      }
      if (target.includes("neck") || target.includes("label") || target.includes("collar")) {
        return title.includes("neck") || placement.includes("neck") || title.includes("label") || placement.includes("label");
      }
      if (target.includes("left")) {
        return title.includes("left") || title.includes("sleeve_left") || placement === "sleeve_left" || placement === "left";
      }
      if (target.includes("right")) {
        return title.includes("right") || title.includes("sleeve_right") || placement === "sleeve_right" || placement === "right";
      }
      return placement === target;
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
          {activeDesign && activeDesign.url && (
            <div
              className="absolute pointer-events-none z-10"
              style={{
                top: `${area.top}%`,
                left: `${area.left}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
              }}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={activeDesign.url}
                  alt="Design Artwork"
                  className="object-contain pointer-events-none"
                  style={designStyle}
                />
              </div>
            </div>
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
      const validPlacements = ["front", "back", "left", "right", "sleeve_left", "sleeve_right", "neck"];
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
                  {design && design.url && (
                    <div
                      className="absolute pointer-events-none z-10"
                      style={{
                        top: `${area.top}%`,
                        left: `${area.left}%`,
                        width: `${area.width}%`,
                        height: `${area.height}%`,
                      }}
                    >
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img
                          src={design.url}
                          alt="Design Artwork"
                          className="object-contain pointer-events-none"
                          style={designStyle}
                        />
                      </div>
                    </div>
                  )}
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
  setMockupUrls,
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
  isEditing = false,
}) => {
  const router = useRouter();
  const { globalMarkup, categoryMarkup, calculateSellingPrice } = useGlobalMarkup();
  const { user } = useAuth();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      try {
        const saved = sessionStorage.getItem("last_catalog_state");
        if (saved) {
          const { categoryId, subcategoryId } = JSON.parse(saved);
          if (categoryId && subcategoryId) {
            router.push(`/dashboard/creator/catalog?category=${categoryId}&subcategory=${subcategoryId}`);
            return;
          } else if (categoryId) {
            router.push(`/dashboard/creator/catalog?category=${categoryId}`);
            return;
          }
        }
      } catch (e) {
        console.error("Error reading last catalog state in canvas:", e);
      }
      router.push("/dashboard/creator/catalog");
    }
  };
  // Mobile accordion state
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    variants: true,
    design: true,
    editor: true,
    mockups: true,
    listing: true,
    review: true,
  });

  // Guided Step-by-Step Flow state: 1 (Variants), 2 (Artwork & Canvas), 3 (Title & Price), 4 (Review & Launch)
  const [activeStep, setActiveStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"stepper" | "all">("stepper");
  const [studioViewMode, setStudioViewMode] = useState<"canvas" | "mockup">("canvas");
  const topStepperRef = useRef<HTMLDivElement>(null);

  const goToStep = (stepNumber: number) => {
    setActiveStep(stepNumber);
    if (typeof window !== "undefined") {
      const resetScroll = () => {
        if ((window as any).__lenis) {
          (window as any).__lenis.scrollTo(0, { immediate: true });
          (window as any).__lenis.resize();
        }
        if ((window as any).lenis) {
          (window as any).lenis.scrollTo(0, { immediate: true });
        }
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      resetScroll();
      requestAnimationFrame(resetScroll);
      setTimeout(resetScroll, 30);
      setTimeout(resetScroll, 100);
      setTimeout(resetScroll, 250);
    }
  };

  // Always reset scroll to the top of the page when activeStep changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const resetScroll = () => {
      if ((window as any).__lenis) {
        (window as any).__lenis.scrollTo(0, { immediate: true });
        (window as any).__lenis.resize();
      }
      if ((window as any).lenis) {
        (window as any).lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    const rafId = requestAnimationFrame(resetScroll);
    const t1 = setTimeout(resetScroll, 30);
    const t2 = setTimeout(resetScroll, 100);
    const t3 = setTimeout(resetScroll, 250);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [activeStep]);

  // Automatic error redirection helper: switches step, opens accordion, scrolls smoothly, and focuses invalid field
  const scrollToFieldAndFocus = useCallback(
    (
      fieldId: string,
      options?: {
        step?: number;
        accordion?: string;
        focusSelector?: string;
        errorMessage?: string;
      }
    ) => {
      if (options?.step && viewMode !== "all") {
        setActiveStep(options.step);
      }
      if (options?.accordion) {
        setOpenAccordions((prev) => ({ ...prev, [options.accordion!]: true }));
      }

      if (options?.errorMessage) {
        toast.error(options.errorMessage, { id: `err-${fieldId}` });
      }

      // Allow DOM to re-render step and expanded accordion
      setTimeout(() => {
        const container = document.getElementById(fieldId);
        if (container) {
          const headerOffset = 180; // Fixed navbar (104px) + sticky header (64px) + breathing buffer
          const elementRect = container.getBoundingClientRect();
          const targetTop = Math.max(0, elementRect.top + window.pageYOffset - headerOffset);

          if ((window as any).__lenis) {
            (window as any).__lenis.scrollTo(targetTop, { duration: 0.8 });
          } else if ((window as any).lenis) {
            (window as any).lenis.scrollTo(targetTop, { duration: 0.8 });
          } else {
            window.scrollTo({ top: targetTop, behavior: "smooth" });
          }

          // Find focusable input/element
          const targetToFocus = options?.focusSelector
            ? (container.querySelector(options.focusSelector) as HTMLElement | null)
            : container.tagName === "INPUT" || container.tagName === "TEXTAREA"
            ? (container as HTMLElement)
            : (container.querySelector("input:not([type=hidden]), textarea, button") as HTMLElement | null);

          if (targetToFocus && typeof targetToFocus.focus === "function") {
            try {
              targetToFocus.focus({ preventScroll: true });
            } catch {
              // Ignore focus error
            }
          }

          // Add prominent visual error pulse
          container.classList.add("ring-2", "ring-red-500", "shadow-[0_0_25px_rgba(239,68,68,0.5)]");
          setTimeout(() => {
            container.classList.remove("ring-2", "ring-red-500", "shadow-[0_0_25px_rgba(239,68,68,0.5)]");
          }, 3500);
        }
      }, 150);
    },
    [viewMode]
  );

  // Local component states
  const [activePlacement, setActivePlacement] = useState<string>("front");
  const [activeMockupCardIndex, setActiveMockupCardIndex] = useState<number>(0);
  const [activeMockupUrl, setActiveMockupUrl] = useState<string>("");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(["front"]);
  const [selectedDesignFile, setSelectedDesignFile] = useState<any | null>(null);
  const [selectedFileId, setSelectedFileId] = useState<number | string | undefined>();
  const [aspectRatioIssues, setAspectRatioIssues] = useState<any[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [activeColor, setActiveColor] = useState<string>("");
  const [isDescExpanded, setIsDescExpanded] = useState<boolean>(false);

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
    if (v < 0) return;
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

  // Get unique supported placements dynamically from Printify API based on blueprint / variants
  const getSupportedPlacements = useCallback(() => {
    const discoveredPlacements = new Set<string>();

    const toCanonicalPlacement = (pos: string): string => {
      const lower = (pos || "").toLowerCase().trim();
      if (!lower) return "";

      // 1. Preserve specific multi-placement positions (legs, sides, covers, mugs, drinks, etc.)
      if (
        lower.includes("leg") ||
        lower.includes("side") ||
        lower.includes("cover") ||
        lower.includes("page") ||
        lower.includes("mug") ||
        lower.includes("drinkware") ||
        lower.includes("waistband") ||
        lower.includes("cuff")
      ) {
        return lower;
      }

      // 2. Sleeve normalization
      if (lower === "left" || lower === "sleeve_left" || lower === "left_sleeve") {
        return "sleeve_left";
      }
      if (lower === "right" || lower === "sleeve_right" || lower === "right_sleeve") {
        return "sleeve_right";
      }

      // 3. Neck normalization
      if (lower.includes("neck_outer") || lower.includes("outer_neck")) {
        return "neck_outer";
      }
      if (lower.includes("neck") || lower.includes("collar") || lower.includes("label") || lower.includes("tag")) {
        return "neck";
      }

      // 4. Standard apparel front/back
      if (lower === "front" || lower === "chest") {
        return "front";
      }
      if (lower === "back" || lower === "rear" || lower === "reverse") {
        return "back";
      }

      if (lower.includes("pocket")) return "pocket";
      if (lower.includes("hood")) return "hood";
      if (lower === "all_over" || lower === "aop") return "all_over";

      return lower;
    };

    // 1. Collect directly from selectedProduct variant placeholders (Primary dynamic Printify source)
    if (selectedProduct?.variants && Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0) {
      selectedProduct.variants.forEach((v: any) => {
        if (Array.isArray(v.placeholders)) {
          v.placeholders.forEach((p: any) => {
            if (p.position) {
              const canonical = toCanonicalPlacement(p.position);
              if (canonical) discoveredPlacements.add(canonical);
            }
          });
        }
      });
    }

    // 2. Collect from selectedProduct root placeholders if variant placeholders were not populated
    if (discoveredPlacements.size === 0 && Array.isArray((selectedProduct as any)?.placeholders)) {
      (selectedProduct as any).placeholders.forEach((p: any) => {
        if (p.position) {
          const canonical = toCanonicalPlacement(p.position);
          if (canonical) discoveredPlacements.add(canonical);
        }
      });
    }

    // 3. Wraparound books / journals detection (Hardcover Journal 485, notebooks, etc.)
    // In Printify, a wraparound book/journal is split into Front Cover and Back Cover (strictly 2 options)
    const title = ((selectedProduct?.title || selectedProduct?.name || "") as string).toLowerCase();
    const isWraparoundBookOrJournal = (() => {
      if (title.includes("journal") || title.includes("notebook") || title.includes("book") || title.includes("diary")) {
        return true;
      }
      const pf = printFiles?.printfiles?.[0];
      if (pf && pf.width && pf.height && (pf.width / pf.height > 1.25) && pf.width >= 3000) {
        return true;
      }
      return false;
    })();

    if (isWraparoundBookOrJournal) {
      discoveredPlacements.clear();
      discoveredPlacements.add("front_cover");
      discoveredPlacements.add("back_cover");
    }

    // 4. Fallback ONLY if no placeholders were discovered from Printify API data
    if (discoveredPlacements.size === 0) {
      if (printFiles?.printfiles && Array.isArray(printFiles.printfiles)) {
        printFiles.printfiles.forEach((pf: any) => {
          if (pf.position) {
            const canonical = toCanonicalPlacement(pf.position);
            if (canonical) discoveredPlacements.add(canonical);
          }
        });
      }

      if (discoveredPlacements.size === 0 && mockupUrls && Array.isArray(mockupUrls) && mockupUrls.length > 0) {
        mockupUrls.forEach((m: any) => {
          const p = (m.placement || "").toLowerCase().trim();
          const t = (m.title || "").toLowerCase().trim();
          if (p.includes("front") || t.includes("front")) discoveredPlacements.add("front");
          if (p.includes("back") || t.includes("back")) discoveredPlacements.add("back");
          if (p.includes("left") || t.includes("left")) discoveredPlacements.add("sleeve_left");
          if (p.includes("right") || t.includes("right")) discoveredPlacements.add("sleeve_right");
          if (p.includes("neck") || t.includes("neck") || p.includes("label") || t.includes("label")) discoveredPlacements.add("neck");
        });
      }

      if (discoveredPlacements.size === 0) {
        return ["front"];
      }
    }

    // Standard ordering preference matching Printify editor: Front -> Back -> Neck -> Sleeves -> Others
    const priorityOrder = [
      "front_cover",
      "back_cover",
      "front",
      "back",
      "front_left_leg",
      "front_right_leg",
      "back_left_leg",
      "back_right_leg",
      "left_leg",
      "right_leg",
      "left_side",
      "right_side",
      "mug_front",
      "mug_back",
      "drinkware_front",
      "drinkware_back",
      "neck",
      "neck_outer",
      "sleeve_left",
      "sleeve_right",
      "pocket",
      "hood",
      "outside_cover",
      "inside_cover",
      "outside",
      "inside",
      "all_over",
    ];

    const result: string[] = [];
    const added = new Set<string>();

    priorityOrder.forEach((pos) => {
      if (discoveredPlacements.has(pos) && !added.has(pos)) {
        added.add(pos);
        result.push(pos);
      }
    });

    // Add any remaining dynamic placements
    discoveredPlacements.forEach((pos) => {
      if (!added.has(pos) && !pos.startsWith("other")) {
        added.add(pos);
        result.push(pos);
      }
    });

    return result.length > 0 ? result : ["front"];
  }, [printFiles, selectedProduct, mockupUrls]);

  // Reset activePlacement if it becomes invalid/unsupported
  useEffect(() => {
    const supported = getSupportedPlacements();
    if (supported.length > 0) {
      const hasLeft = activePlacement === "sleeve_left" && (supported.includes("left") || supported.includes("sleeve_left"));
      const hasRight = activePlacement === "sleeve_right" && (supported.includes("right") || supported.includes("sleeve_right"));

      if (!supported.includes(activePlacement) && !hasLeft && !hasRight) {
        setActivePlacement(supported[0]);
      }
    }
  }, [printFiles, selectedProduct, activePlacement, getSupportedPlacements]);

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
          console.warn("Background removed locally, using local high-res data URL:", uploadError);
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

  // Helper to safely parse variant cost to dollars without dividing legitimate >$100 prices by 100
  const parseVariantCostToDollars = useCallback((val: any): number => {
    if (val == null || val === 'N/A') return 0;
    const num = typeof val === 'string' ? parseFloat(val) : Number(val);
    if (isNaN(num) || num <= 0) return 0;
    // Only if it's an integer >= 500 (e.g. raw Printify cents 10714 or 1200) convert from cents
    if (Number.isInteger(num) && num >= 500) {
      return num / 100;
    }
    return num;
  }, []);

  // Base cost and range uses selected variants pricing (or fallback to product defaults)
  const pricingRange = useMemo(() => {
    if (!selectedProduct) return { min: 0, max: 0, hasRange: false };

    const allVariants = selectedProduct?.variants || [];
    const activeVariants = allVariants.filter((v: any) => selectedVariants.includes(v.id));
    const sourceVariants = activeVariants.length > 0 ? activeVariants : allVariants;

    if (sourceVariants.length > 0) {
      const prices = sourceVariants
        .map((v: any) => {
          return parseVariantCostToDollars(v.premiumPrice) ||
                 parseVariantCostToDollars(v.cost) ||
                 parseVariantCostToDollars(v.price) || 0;
        })
        .filter((p: number) => p > 0);

      if (prices.length > 0) {
        const minCost = Math.min(...prices);
        const maxCost = Math.max(...prices);
        return {
          min: minCost,
          max: maxCost,
          hasRange: maxCost > minCost
        };
      }
    }

    const fallbackBase = parseVariantCostToDollars(selectedProduct.premiumPrice) ||
                         parseVariantCostToDollars(selectedProduct.cost) ||
                         parseVariantCostToDollars(selectedProduct.price) || 0;
    return { min: fallbackBase, max: fallbackBase, hasRange: false };
  }, [selectedProduct, selectedVariants, parseVariantCostToDollars]);

  // Platform selling price = admin/category markup applied (no creator markup yet)
  const platformMinSellingPrice = calculateSellingPrice(pricingRange.min);
  const platformMaxSellingPrice = calculateSellingPrice(pricingRange.max);

  // Calculate dynamic minimum required markup to keep Net Creator Profit > $0.00 after Stripe fee
  const minMarkup = useMemo(() => {
    if (!platformMinSellingPrice || isNaN(platformMinSellingPrice) || platformMinSellingPrice <= 0) return 0;
    return 0;
  }, [platformMinSellingPrice]);

  // Apply creator markup on top of the platform price using unified pricing formula
  const creatorMarkupMultiplier = 1 + creatorMarkup / 100;
  const minSellingPrice = calculateRetailPriceFromMarkup(platformMinSellingPrice, creatorMarkup);
  const maxSellingPrice = calculateRetailPriceFromMarkup(platformMaxSellingPrice, creatorMarkup);
  const hasPriceRange = pricingRange.hasRange;

  // Detailed pricing breakdown values
  const baseCostVal = pricingRange.min;
  const baseCostMaxVal = pricingRange.max;
  const shippingCostVal = 5.99;
  const platformFeeVal = minSellingPrice * 0.05;
  const platformFeeMaxVal = maxSellingPrice * 0.05;
  const stripeFeeVal = minSellingPrice * 0.029 + 0.30;
  const stripeFeeMaxVal = maxSellingPrice * 0.029 + 0.30;
  const taxesVal = minSellingPrice * 0.08;
  const taxesMaxVal = maxSellingPrice * 0.08;
  const totalHiddenChargesVal = platformFeeVal + stripeFeeVal + taxesVal;
  const totalHiddenChargesMaxVal = platformFeeMaxVal + stripeFeeMaxVal + taxesMaxVal;

  // Creator Net Profit = (Creator Price - Loka Base Cost) - Stripe Fee
  const rawCreatorProfit = (minSellingPrice - platformMinSellingPrice) - stripeFeeVal;
  const creatorProfit = Math.max(0, Math.round(rawCreatorProfit * 100) / 100);

  // Recalculate effective markup after rounding to X.99
  const effectiveMarkup = Math.round(((minSellingPrice / platformMinSellingPrice) - 1) * 100);

  // Helper to get effective markup for quick preset buttons
  const getEffectivePresetMarkup = useCallback((preset: number) => {
    if (!platformMinSellingPrice) return preset;
    const multiplier = 1 + preset / 100;
    const rawPrice = platformMinSellingPrice * multiplier;
    const roundedPrice = Math.ceil(rawPrice) - 0.01;
    return Math.round(((roundedPrice / platformMinSellingPrice) - 1) * 100);
  }, [platformMinSellingPrice]);

  // Pricing debug log whenever pricing elements change
  useEffect(() => {
    if (!selectedProduct) return;
    const blueprintId = selectedProduct.id;
    const providerId = selectedProduct.printProviderId || selectedProduct.print_provider_id;

    console.log(`[Canvas Pricing Debug]
- Blueprint ID: ${blueprintId}
- Print Provider ID: ${providerId}
- Product Base Cost (Premium): $${pricingRange.min.toFixed(2)}
- Platform Selling Price (Admin/Category): $${platformMinSellingPrice.toFixed(2)}
- Creator Markup: ${creatorMarkup}%
- Retail Price shown in UI: $${minSellingPrice.toFixed(2)}
- Creator Profit shown in UI: $${creatorProfit.toFixed(2)}`);
  }, [selectedProduct, pricingRange.min, platformMinSellingPrice, minSellingPrice, creatorProfit, creatorMarkup]);

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
    if (cooldown > 0 || isGeneratingPreview) return;
    if (!designFiles || designFiles.length === 0) {
      toast.error("Please add at least one design or image to the product first!");
      return;
    }
    setCooldown(30); // Set 30-second cooldown to avoid API rate limits
    try {
      await onGeneratePreview();
    } catch (err: any) {
      console.error("Preview generation error:", err);
    }
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
        const userId = user?.id;
        const userStorageKey = userId ? `uploaded_printify_images_${userId}` : "uploaded_printify_images";
        const saved = localStorage.getItem(userStorageKey) || localStorage.getItem("uploaded_printify_images");
        const existing = saved ? JSON.parse(saved) : [];
        const merged = [...existing];
        uploadedList.forEach((newFile: any) => {
          const item = { ...newFile, userId };
          if (!merged.some((f: any) => String(f.id) === String(item.id))) {
            merged.unshift(item);
          }
        });
        localStorage.setItem(userStorageKey, JSON.stringify(merged));
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
    let currentVariants = selectedVariants;
    if ((!currentVariants || currentVariants.length === 0) && selectedProduct?.variants?.length > 0) {
      const allVariantIds = selectedProduct.variants.map((v: any) => v.id);
      setSelectedVariants(allVariantIds);
      currentVariants = allVariantIds;
    }

    const activePrintFile = getActivePrintFile(printFiles, currentVariants, activePlacement);
    if (!activePrintFile) {
      toast.error("No print template available for this placement. Please select variants first.");
      return;
    }

    // Set placement as active and selected
    if (!selectedPlacements.includes(activePlacement)) {
      setSelectedPlacements((prev) => [...prev, activePlacement]);
    }

    setSelectedFileId(file.id);

    const imageUrl = file.file_url || file.thumbnail_url || file.preview_url || "";
    const isWraparoundCover = (activePrintFile.width / activePrintFile.height > 1.25) && activePrintFile.width >= 3000;
    const isCoverPlacement = activePlacement === "front_cover" || activePlacement === "back_cover";
    const targetScale = (isWraparoundCover && isCoverPlacement) ? 0.40 : 0.7;

    let baseWidth = activePrintFile.width * targetScale;
    let baseHeight = activePrintFile.height * targetScale;

    if (imageUrl) {
      try {
        const dimensions = await calculateAspectRatioAwareDimensions(
          imageUrl,
          activePrintFile,
          targetScale,
          false
        );
        baseWidth = dimensions.width;
        baseHeight = dimensions.height;
      } catch (err) {
        console.warn("Could not calculate aspect-ratio aware dimensions:", err);
      }
    }

    baseWidth = Math.round(baseWidth);
    baseHeight = Math.round(baseHeight);
    const baseTop = Math.max(0, Math.round((activePrintFile.height - baseHeight) / 2));
    let baseLeft = Math.max(0, Math.round((activePrintFile.width - baseWidth) / 2));

    if (isWraparoundCover) {
      if (activePlacement === "front_cover") {
        baseLeft = Math.round(activePrintFile.width * 0.75 - baseWidth / 2);
      } else if (activePlacement === "back_cover") {
        baseLeft = Math.round(activePrintFile.width * 0.25 - baseWidth / 2);
      }
    }

    const newDesign: any = {
      id: Date.now(),
      printify_id: file.id,
      imageId: file.id,
      filename: file.filename || file.file_name,
      url: imageUrl,
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

  const handleUpdateDesignPosition = useCallback((designId: number | string, updates: any) => {
    setDesignFiles((prev) => prev.map((d) => (d.id === designId ? { ...d, position: { ...d.position, ...updates } } : d)));
  }, [setDesignFiles]);

  const handleSetAspectRatioIssues = useCallback((issues: any[]) => {
    setAspectRatioIssues((prev) => {
      if (prev.length === 0 && issues.length === 0) return prev;
      if (prev.length === issues.length && JSON.stringify(prev) === JSON.stringify(issues)) return prev;
      return issues;
    });
  }, []);

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
    const hasExistingImages = isEditing && (mockupUrls?.length > 0 || (selectedProduct?.images && selectedProduct.images.length > 0));
    const checks = {
      variants: selectedVariants.length > 0,
      designs: isEditing ? (designFiles.length > 0 || hasExistingImages) : designFiles.length > 0,
      aspectRatio: aspectRatioIssues.length === 0,
      mockups: (isBlueprint || isEditing) ? true : (mockupUrls && mockupUrls.length > 0),
      details: productForm.name.trim().length > 0 && productForm.description.trim().length >= 20 && !!productForm.category && !!productForm.tags && productForm.tags.length > 0,
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
  }, [selectedVariants, designFiles, aspectRatioIssues, mockupUrls, productForm, selectedProduct, isEditing]);

  // Validate and redirect helper for each step
  const validateAndRedirect = (targetStep?: number): boolean => {
    // Check Step 1: Variants
    if (!targetStep || targetStep === 1) {
      if (selectedVariants.length === 0) {
        scrollToFieldAndFocus("field-variants", {
          step: 1,
          accordion: "variants",
          errorMessage: "Step 1 incomplete: Please select at least one color & size variant",
        });
        return false;
      }
    }

    // Check Step 2: Artwork
    if (!targetStep || targetStep === 2) {
      const hasExistingImages = isEditing && (mockupUrls?.length > 0 || (selectedProduct?.images && selectedProduct.images.length > 0));
      if (designFiles.length === 0 && !hasExistingImages) {
        scrollToFieldAndFocus("section-artwork", {
          step: 2,
          accordion: "design",
          errorMessage: "Step 2 incomplete: Please upload and place your artwork on the canvas",
        });
        return false;
      }
    }

    // Check Step 3: Title, Description, Category, Tags
    if (!targetStep || targetStep === 3) {
      const errors: Record<string, string> = {};
      if (!productForm.name.trim()) errors.name = "Storefront product name is required";
      if (!productForm.description.trim()) {
        errors.description = "Product description is required";
      } else if (productForm.description.trim().length < 20) {
        errors.description = "Description must be at least 20 characters";
      }
      if (!productForm.category || productForm.category === "placeholder") {
        errors.category = "Please select a marketplace category";
      }
      if (!productForm.tags || productForm.tags.length === 0) {
        errors.tags = "Please select a tag (Trending, New, or Popular)";
      }

      if (errors.name) {
        setFormErrors(errors);
        scrollToFieldAndFocus("field-product-name", {
          step: 3,
          accordion: "listing",
          focusSelector: "input",
          errorMessage: errors.name,
        });
        return false;
      }

      if (errors.description) {
        setFormErrors(errors);
        scrollToFieldAndFocus("field-product-description", {
          step: 3,
          accordion: "listing",
          focusSelector: "textarea",
          errorMessage: errors.description,
        });
        return false;
      }

      if (errors.category) {
        setFormErrors(errors);
        scrollToFieldAndFocus("field-product-category", {
          step: 3,
          accordion: "listing",
          focusSelector: "button",
          errorMessage: errors.category,
        });
        return false;
      }

      if (errors.tags) {
        setFormErrors(errors);
        scrollToFieldAndFocus("field-product-tags", {
          step: 3,
          accordion: "listing",
          errorMessage: errors.tags,
        });
        return false;
      }
    }

    // Check Step 4 Checklist & Mockups before publish
    if (!targetStep) {
      const isBlueprint = !selectedProduct?.printify_id;
      if (!isBlueprint && !isEditing && mockupUrls.length === 0 && mockupStatus !== 'Mockups loaded successfully!') {
        scrollToFieldAndFocus("field-mockup-studio", {
          step: 4,
          accordion: "review",
          errorMessage: "Please generate mockups or preview before publishing",
        });
        return false;
      }

      if (!validationSummary.allValid) {
        scrollToFieldAndFocus("field-checklist-review", {
          step: 4,
          accordion: "review",
          errorMessage: "Please complete all checklist items before publishing",
        });
        return false;
      }
    }

    return true;
  };

  // Save Draft action
  const handleSaveDraft = () => {
    try {
      const bId = selectedProduct?.id || selectedProduct?.blueprintId || "custom";
      const draftId = `draft_${bId}`;
      const draftData = {
        id: draftId,
        blueprintId: bId,
        productId: selectedProduct?.id,
        name: productForm.name || selectedProduct?.title || selectedProduct?.name,
        title: selectedProduct?.title || selectedProduct?.name,
        thumbnail: (mockupUrls && mockupUrls.length > 0 && (mockupUrls[0]?.url || mockupUrls[0]?.src)) || selectedProduct?.image || (selectedProduct?.images && selectedProduct.images[0]) || "",
        designFiles: designFiles, // Placed artworks with scales and offsets
        uploadedFiles: uploadedFiles, // Artworks library
        mockupUrls: mockupUrls,
        productForm,
        selectedVariants,
        selectedColors,
        selectedSizes,
        activePlacement,
        creatorMarkup,
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        // Save blueprint-specific draft for fast instant canvas restore
        localStorage.setItem(`loka_draft_${bId}`, JSON.stringify(draftData));

        // Add/update in master creator drafts list for the Dashboard Drafts view
        const existingDraftsJson = localStorage.getItem("loka_creator_drafts");
        let draftsList: any[] = [];
        try {
          draftsList = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];
          if (!Array.isArray(draftsList)) draftsList = [];
        } catch {
          draftsList = [];
        }

        // Deduplicate and insert at top
        draftsList = draftsList.filter((d: any) => String(d.blueprintId) !== String(bId) && d.id !== draftId);
        draftsList.unshift(draftData);
        localStorage.setItem("loka_creator_drafts", JSON.stringify(draftsList));

        toast.success("Draft saved! View & manage all drafts in Creator Hub > My Products > Saved Drafts.", {
          id: "draft-success",
          duration: 5000,
        });
      }
    } catch (e) {
      console.error("Failed to save draft:", e);
      toast.error("Failed to save draft.");
    }
  };

  // Continue to next step helper
  const handleContinueNext = () => {
    if (activeStep < 4) {
      if (validateAndRedirect(activeStep)) {
        goToStep(activeStep + 1);
      }
    } else {
      handlePublishSubmit();
    }
  };

  // Publish submit action
  const handlePublishSubmit = async () => {
    // Automatically validate and redirect user to first incomplete field
    if (!validateAndRedirect()) {
      return;
    }

    const finalForm = {
      ...productForm,
      markupPercentage: String(creatorMarkup),
      markup_percentage: creatorMarkup,
      price: minSellingPrice,
      base_price: minSellingPrice,
      basePrice: minSellingPrice,
      selling_price: minSellingPrice,
      retail_price: minSellingPrice,
      min_price: minSellingPrice,
      max_price: maxSellingPrice,
      minPrice: minSellingPrice,
      maxPrice: maxSellingPrice,
      variantPrices: (selectedProduct?.variants || []).map((v: any) => {
        const vCost = parseVariantCostToDollars(v.premiumPrice) ||
                      parseVariantCostToDollars(v.cost) ||
                      parseVariantCostToDollars(v.price) ||
                      pricingRange.min;
        const vPlatform = calculateSellingPrice(vCost);
        const vSelling = calculateRetailPriceFromMarkup(vPlatform, creatorMarkup);
        return {
          id: v.id,
          printify_variant_id: v.printify_variant_id || v.id,
          price: vSelling,
          cost: vCost
        };
      })
    };
    await onPublish(finalForm);
  };

  // Get placement friendly name
  const getPlacementLabel = (placementId: string) => {
    const labels: Record<string, string> = {
      front: "Front",
      back: "Back",
      front_cover: "Front Cover",
      back_cover: "Back Cover",
      full_wrap: "Full Cover Wrap",
      front_left_leg: "Front Left Leg",
      front_right_leg: "Front Right Leg",
      back_left_leg: "Back Left Leg",
      back_right_leg: "Back Right Leg",
      left_leg: "Left Leg",
      right_leg: "Right Leg",
      left_side: "Left Side",
      right_side: "Right Side",
      mug_front: "Mug Front",
      mug_back: "Mug Back",
      drinkware_front: "Front View",
      drinkware_back: "Back View",
      outside_cover: "Outside Cover",
      inside_cover: "Inside Cover",
      inside: "Inside",
      outside: "Outside",
      sleeve_left: "Left Sleeve",
      sleeve_right: "Right Sleeve",
      left: "Left Sleeve",
      right: "Right Sleeve",
      neck: "Neck Label",
      neck_outer: "Outer Neck",
      pocket: "Pocket",
      hood: "Hood",
      all_over: "All Over",
    };
    return labels[placementId.toLowerCase()] || placementId.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  };

  const getPlacementIcon = (placementId: string) => {
    const p = placementId.toLowerCase();
    if (p.includes("cover") || p.includes("journal") || p.includes("book") || p === "full_wrap") {
      return <BookOpen className="w-5 h-5 text-orange-400" />;
    }
    if (p.includes("leg") || p.includes("sock") || p.includes("foot")) {
      return <Footprints className="w-5 h-5 text-orange-400" />;
    }
    const svgs: Record<string, React.ReactNode> = {
      front: <FrontSVG className="w-5 h-5" />,
      back: <BackSVG className="w-5 h-5" />,
      left: <LeftSleeveSVG className="w-5 h-5" />,
      right: <RightSleeveSVG className="w-5 h-5" />,
      sleeve_left: <LeftSleeveSVG className="w-5 h-5" />,
      sleeve_right: <RightSleeveSVG className="w-5 h-5" />,
      neck: <Tag className="w-5 h-5 text-orange-400" />,
      all_over: <Layers className="w-5 h-5 text-orange-400" />,
    };
    return svgs[p] || <FrontSVG className="w-5 h-5" />;
  };

  // Track viewer modes (360 interactive vs grid of all mockups)
  const [mockupViewMode, setMockupViewMode] = useState<"360" | "grid">("360");
  const [isUploadingCustomImage, setIsUploadingCustomImage] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to obtain active mockup list or initialize from catalog images
  const getEffectiveMockups = useCallback(() => {
    if (mockupUrls && mockupUrls.length > 0) return mockupUrls;
    const rawImages = selectedProduct?.images || (selectedProduct?.image ? [selectedProduct.image] : []);
    if (rawImages.length === 0) return [];

    const supported = getSupportedPlacements();
    const hasBack = supported.some((p: string) => p.includes("back"));

    return rawImages.map((url: string, index: number) => {
      const urlLower = url.toLowerCase();
      let placement = "front";

      if (urlLower.includes("back") || urlLower.includes("reverse") || urlLower.includes("rear")) {
        placement = "back";
      } else if (urlLower.includes("neck") || urlLower.includes("label") || urlLower.includes("collar")) {
        placement = "neck";
      } else if (urlLower.includes("left") || urlLower.includes("sleeve_left")) {
        placement = "sleeve_left";
      } else if (urlLower.includes("right") || urlLower.includes("sleeve_right")) {
        placement = "sleeve_right";
      } else if (hasBack && ((rawImages.length <= 3 && index === 1) || (rawImages.length >= 4 && index === 2))) {
        placement = "back";
      } else if (index > 0) {
        placement = `other_${index}`;
      }

      let title = "Front View";
      if (placement === "back") title = "Back View";
      else if (placement === "neck") title = "Neck Label";
      else if (placement === "sleeve_left") title = "Left Sleeve";
      else if (placement === "sleeve_right") title = "Right Sleeve";
      else if (placement.startsWith("other_")) title = `Angle View ${index}`;

      return {
        url,
        src: url,
        placement,
        title,
        variant_ids: []
      };
    });
  }, [mockupUrls, selectedProduct, getSupportedPlacements]);

  // Helper to match any mockup item against a target placement string
  const isPlacementMatch = useCallback((item: any, targetPlacement: string) => {
    if (!item || !targetPlacement) return false;
    const target = targetPlacement.toLowerCase().trim();
    const p = (item.placement || "").toLowerCase().trim();
    const t = (item.title || "").toLowerCase().trim();
    const u = (item.url || item.src || "").toLowerCase().trim();

    // 1. Exact match on placement
    if (p === target) return true;

    // 2. Back view match
    if (target.includes("back")) {
      if (p.includes("back") || t.includes("back") || u.includes("back") || u.includes("rear") || u.includes("reverse")) {
        return true;
      }
    }

    // 3. Front view match
    if (target.includes("front")) {
      if ((p.includes("front") || t.includes("front") || u.includes("front")) && !p.includes("back") && !t.includes("back")) {
        return true;
      }
    }

    // 4. Neck / Collar / Label match
    if (target.includes("neck") || target.includes("collar") || target.includes("label")) {
      if (p.includes("neck") || p.includes("label") || p.includes("collar") ||
          t.includes("neck") || t.includes("label") || t.includes("collar") ||
          u.includes("neck") || u.includes("label") || u.includes("collar")) {
        return true;
      }
    }

    // 5. Left sleeve match
    if (target === "left" || target.includes("sleeve_left") || target.includes("left_sleeve")) {
      if (p.includes("left") || t.includes("left") || u.includes("left")) {
        return true;
      }
    }

    // 6. Right sleeve match
    if (target === "right" || target.includes("sleeve_right") || target.includes("right_sleeve")) {
      if (p.includes("right") || t.includes("right") || u.includes("right")) {
        return true;
      }
    }

    return false;
  }, []);

  // Helper to select a placement and automatically sync mockup card & preview image
  const handlePlacementSelect = useCallback((placement: string) => {
    setActivePlacement(placement);

    const mockups = getEffectiveMockups();
    if (mockups && mockups.length > 0) {
      const matchedIdx = mockups.findIndex((m: any) => isPlacementMatch(m, placement));
      if (matchedIdx !== -1) {
        setActiveMockupCardIndex(matchedIdx);
        const matchedUrl = mockups[matchedIdx]?.url || mockups[matchedIdx]?.src || "";
        if (matchedUrl) {
          setActiveMockupUrl(matchedUrl);
        }
      }
    }
  }, [getEffectiveMockups, isPlacementMatch]);

  // Keep mockup card and active mockup URL automatically synchronized with activePlacement
  useEffect(() => {
    if (!activePlacement) return;
    const mockups = getEffectiveMockups();
    if (!mockups || mockups.length === 0) return;

    const matchedIdx = mockups.findIndex((m: any) => isPlacementMatch(m, activePlacement));
    if (matchedIdx !== -1) {
      setActiveMockupCardIndex(matchedIdx);
      const matchedUrl = mockups[matchedIdx]?.url || mockups[matchedIdx]?.src || "";
      if (matchedUrl) {
        setActiveMockupUrl(matchedUrl);
      }
    }
  }, [activePlacement, getEffectiveMockups, isPlacementMatch]);

  // Reordering helpers
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    const current = getEffectiveMockups();
    if (fromIndex < 0 || fromIndex >= current.length || toIndex < 0 || toIndex >= current.length) return;
    const updated = [...current];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);
    if (setMockupUrls) {
      setMockupUrls(updated);
    }
    toast.success("Image order updated!", { id: "image-reorder" });
  };

  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    handleMoveImage(index, 0);
    toast.success("Set as main cover image!");
  };

  const handleRemoveImage = (index: number) => {
    const current = getEffectiveMockups();
    if (current.length <= 1) {
      toast.error("Product must have at least 1 image.");
      return;
    }
    const updated = current.filter((_: any, i: number) => i !== index);
    if (setMockupUrls) {
      setMockupUrls(updated);
    }
    toast.success("Image removed.");
  };

  // Custom Image Upload Handler
  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingCustomImage(true);
    const toastId = toast.loading(`Uploading ${files.length} custom image(s)...`);

    try {
      const currentList = getEffectiveMockups();
      const newItems: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const localDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        let finalUrl = localDataUrl;
        try {
          const uploadRes = await printifyAPI.uploadFileDirectly(file);
          const remoteUrl = uploadRes?.src || uploadRes?.preview_url || uploadRes?.url || uploadRes?.data?.src || uploadRes?.data?.preview_url;
          if (remoteUrl) {
            finalUrl = remoteUrl;
          }
        } catch (err) {
          console.warn("Direct image upload warning, using local preview:", err);
        }

        newItems.push({
          url: finalUrl,
          title: file.name.replace(/\.[^/.]+$/, "") || `Custom Image ${currentList.length + i + 1}`,
          placement: "custom",
          isCustomUpload: true,
          variant_ids: [],
          id: `custom_${Date.now()}_${i}`
        });
      }

      const updated = [...currentList, ...newItems];
      if (setMockupUrls) {
        setMockupUrls(updated);
      }
      toast.success(`${files.length} custom image(s) uploaded!`, { id: toastId });
    } catch (err: any) {
      console.error("Custom image upload error:", err);
      toast.error("Failed to upload image.", { id: toastId });
    } finally {
      setIsUploadingCustomImage(false);
      if (customFileInputRef.current) {
        customFileInputRef.current.value = "";
      }
    }
  };

  // HTML5 Drag and Drop handlers for Image Reordering
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      handleMoveImage(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  const CREATOR_STEPS = [
    {
      step: 1,
      num: "01",
      title: "Color & Sizes",
      subtitle: "Product options",
      isValid: validationSummary.variants,
    },
    {
      step: 2,
      num: "02",
      title: "Add Artwork",
      subtitle: "Upload & position",
      isValid: validationSummary.designs,
    },
    {
      step: 3,
      num: "03",
      title: "Title & Price",
      subtitle: "Product options",
      isValid: validationSummary.details,
    },
    {
      step: 4,
      num: "04",
      title: "Review & Launch",
      subtitle: "Final checklist",
      isValid: validationSummary.allValid,
    },
  ];

  return (
    <div className="bg-[#050505] min-h-screen text-white relative pt-[96px] md:pt-[104px] w-full max-w-full overflow-x-clip">
      {/* Hidden input for custom image uploads */}
      <input
        type="file"
        ref={customFileInputRef}
        accept="image/*"
        multiple
        onChange={handleCustomImageUpload}
        className="hidden"
      />

      {/* Sticky Header with Product Info & Continue Button - sits perfectly flush below fixed navbar */}
      <div className="sticky top-[96px] md:top-[104px] z-40 bg-[#080808]/95 backdrop-blur-md border-b border-white/10 shadow-2xl py-2.5 sm:py-3 px-3 sm:px-6 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4 w-full">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 text-gray-300 hover:text-white transition-all duration-200 flex-shrink-0 group cursor-pointer"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-base md:text-lg font-bold font-clash text-white line-clamp-1">
                {selectedProduct?.title || selectedProduct?.name}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                SKU: {selectedProduct?.model || selectedProduct?.id} | {selectedProduct?.type_name || selectedProduct?.brand || "Generic brand"}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-1.5 sm:gap-3">
            {activeStep === 2 && (
              <button
                type="button"
                onClick={handleManualRegenerate}
                disabled={isGeneratingPreview || designFiles.length === 0 || cooldown > 0}
                className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white transition-all shadow-[0_4px_16px_rgba(255,109,31,0.25)] flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed leading-none"
              >
                {isGeneratingPreview ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    <span className="leading-none">Generating...</span>
                  </>
                ) : cooldown > 0 ? (
                  <span className="leading-none">Wait {cooldown}s</span>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="leading-none">{mockupUrls && mockupUrls.length > 0 ? "Regenerate Preview" : "Generate Preview"}</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveDraft}
              className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold border border-white/20 bg-black/40 hover:bg-white/10 text-white transition-all cursor-pointer whitespace-nowrap flex items-center justify-center leading-none"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={handleContinueNext}
              disabled={isPublishing || isGeneratingPreview}
              className="h-9 sm:h-10 px-3.5 sm:px-5 rounded-xl text-xs sm:text-sm font-bold bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer flex items-center justify-center gap-1.5 leading-none"
            >
              {isPublishing ? (
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                  <span className="leading-none">{isEditing ? "Updating..." : "Publishing..."}</span>
                </div>
              ) : activeStep < 4 ? (
                <>
                  <span className="leading-none">Continue</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </>
              ) : (
                <span className="leading-none">{isEditing ? "Update Product" : "Publish Product"}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* FULL-WIDTH STEPPER BAR (Figma Design) */}
      <div ref={topStepperRef} className="max-w-7xl mx-auto px-3 sm:px-6 pt-5 sm:pt-7">
        <div className="bg-[#0B132B]/85 border border-white/10 rounded-2xl md:rounded-3xl p-5 sm:p-6 md:px-10 backdrop-blur-md shadow-2xl relative">
          <div className="relative">
            {/* Background connecting track line running between 01 and 04 */}
            <div className="absolute top-4 sm:top-4 left-[12.5%] right-[12.5%] h-[2px] bg-white/20 -translate-y-1/2 pointer-events-none" />

            {/* Active orange connecting track line */}
            <div
              className="absolute top-4 sm:top-4 left-[12.5%] h-[2px] bg-[#FF6D1F] -translate-y-1/2 pointer-events-none transition-all duration-300 shadow-[0_0_10px_rgba(255,109,31,0.6)]"
              style={{
                width:
                  activeStep === 1
                    ? "0%"
                    : activeStep === 2
                    ? "25%"
                    : activeStep === 3
                    ? "50%"
                    : "75%",
              }}
            />

            {/* 4 Steps */}
            <div className="grid grid-cols-4 relative z-10 w-full">
              {CREATOR_STEPS.map((s) => {
                const isActive = activeStep === s.step;
                const isPassed = activeStep > s.step;

                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => goToStep(s.step)}
                    className="flex flex-col items-center text-center cursor-pointer group transition-all"
                  >
                    {/* Circle badge */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold transition-all duration-200 ${
                        isActive
                          ? "bg-[#FF6D1F] text-white shadow-[0_0_16px_rgba(255,109,31,0.6)] ring-2 ring-[#FF6D1F]/50 scale-105"
                          : isPassed
                          ? "bg-[#FF6D1F] text-white shadow-sm"
                          : "bg-[#0B132B] border-2 border-white/40 text-white/70 group-hover:border-white/80 group-hover:text-white"
                      }`}
                    >
                      {s.num}
                    </div>

                    {/* Step Title & Subtitle */}
                    <div className="mt-2.5 space-y-0.5">
                      <div
                        className={`text-xs sm:text-sm font-bold font-clash leading-tight transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-gray-300 group-hover:text-white"
                        }`}
                      >
                        {s.title}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-400">
                        {s.subtitle}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT COLUMN: Main PDP Customizer Workspace */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: VARIANTS (COLORS & SIZES)
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 1 || viewMode === "all") && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 1 Typography Header (Figma Design) */}
              <div className="space-y-1 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6D1F]">
                  Step 01 to 04
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-clash text-white">
                  Choose Product Variants
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Select the product options you want to offer in your store.
                </p>
              </div>

              {/* Section 1: Product Information */}
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
                    <span className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${isEditing
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                      : "bg-[#FF6D1F]/20 text-[#FF6D1F]"
                      }`}>
                      {isEditing ? "Editing Product" : "Base Catalog Item"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-clash text-white">
                      {selectedProduct?.title || selectedProduct?.name}
                    </h2>
                    <div className="space-y-1 pt-1">
                      {(() => {
                        const fullDesc = cleanDescription(selectedProduct?.description) || "High-quality custom creator merchandise product. Select colors and sizes, add designs on print areas, and preview your premium storefront ready mockup.";
                        const isLongText = fullDesc.length > 120;

                        return (
                          <>
                            <p
                              className={`text-xs sm:text-sm text-gray-300 font-medium leading-relaxed break-words ${!isDescExpanded && isLongText ? "line-clamp-3" : ""
                                }`}
                              title={fullDesc}
                            >
                              {fullDesc}
                            </p>
                            {isLongText && (
                              <button
                                type="button"
                                onClick={() => setIsDescExpanded(!isDescExpanded)}
                                className="text-xs font-semibold text-[#FF6D1F] hover:underline flex items-center gap-1 mt-1 transition-colors cursor-pointer touch-manipulation py-1"
                              >
                                {isDescExpanded ? (
                                  <>
                                    <span>Show Less</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Read More</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-4 pt-2 text-xs text-gray-500">
                      <div>Type: <span className="text-white">{selectedProduct?.type_name || "Apparel"}</span></div>
                      <div>SKU: <span className="text-white">{selectedProduct?.id}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Variant Selection */}
              <div id="field-variants" className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6 scroll-mt-48 transition-all">
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
                        <div className="flex items-center gap-2.5">
                          <img src="/palette.png" alt="Select Colors" className="w-6 h-6 object-contain flex-shrink-0" />
                          <label className="text-sm sm:text-base font-bold font-clash text-white">Select Colors</label>
                        </div>
                        <span className="text-xs text-gray-400">{selectedColors.length} color(s) selected</span>
                      </div>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {uniqueColors.map((color: any) => {
                          const isSelected = selectedColors.includes(color.name);
                          const isActive = activeColor === color.name;
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
                              className={`relative border-2 rounded-full px-5 py-2 min-w-[85px] flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelected
                                ? isActive
                                  ? "border-[#FF6D1F] shadow-[0_0_12px_rgba(255,109,31,0.35)]"
                                  : "border-white"
                                : "border-white/20 hover:border-white/50 opacity-80 hover:opacity-100"
                                }`}
                              style={{ backgroundColor: color.code }}
                            >
                              <span
                                className="text-xs sm:text-sm font-semibold whitespace-nowrap"
                                style={{
                                  color: getContrastTextColor(color.code),
                                }}
                              >
                                {color.name}
                              </span>
                              {isSelected && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF6D1F] rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-[#0B132B] pointer-events-none">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
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
                        <div className="flex items-center gap-2.5">
                          <img src="/measuring-tape 1.png" alt="Select Sizes" className="w-6 h-6 object-contain flex-shrink-0" />
                          <label className="text-sm sm:text-base font-bold font-clash text-white">Select Sizes</label>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <button
                            onClick={() => setSelectedSizes(uniqueSizes)}
                            className="text-[#FF6D1F] hover:underline cursor-pointer font-medium"
                          >
                            Select All
                          </button>
                          <span className="text-gray-600">|</span>
                          <button
                            onClick={() => setSelectedSizes([])}
                            className="text-gray-400 hover:underline cursor-pointer font-medium"
                          >
                            Clear Selection
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 pt-1">
                        {uniqueSizes.map((size: string) => {
                          const isSelected = selectedSizes.includes(size);
                          const formatSizeLabel = (s: string) => {
                            const lower = s.toLowerCase().trim();
                            if (lower === "s") return "Small";
                            if (lower === "m") return "Medium";
                            if (lower === "l") return "Large";
                            if (lower === "xl") return "X-Large";
                            if (lower === "2xl" || lower === "xxl") return "2X-Large";
                            if (lower === "3xl" || lower === "xxxl") return "3X-Large";
                            return s;
                          };

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
                              className={`relative border-2 rounded-full px-5 py-2 min-w-[85px] text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer bg-black/80 ${isSelected
                                ? "border-white text-white shadow-sm"
                                : "border-white/20 text-gray-300 hover:border-white/50"
                                }`}
                            >
                              <span>{formatSizeLabel(size)}</span>
                              {isSelected && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#FF6D1F] rounded-full flex items-center justify-center text-white shadow-sm ring-2 ring-[#0B132B] pointer-events-none">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </span>
                              )}
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

              {/* Step 1 Navigation Footer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-400">
                  {selectedVariants.length > 0 ? (
                    <span className="text-green-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedColors.length} color(s) and {selectedSizes.length} size(s) selected
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" />
                      Please select at least 1 color and 1 size to continue
                    </span>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    if (validateAndRedirect(1)) {
                      goToStep(2);
                    }
                  }}
                  className="w-full sm:w-auto bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next Page</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: ARTWORK & POSITION (FIGMA DESIGN)
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 2 || viewMode === "all") && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 2 Typography Header (Figma Design) */}
              <div className="space-y-1 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6D1F]">
                  Step 02 to 04
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-clash text-white">
                  Add Artwork & Placement
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Upload your artwork and configure print positioning on each side.
                </p>
              </div>

              {/* Base Catalog Item Card */}
              <div className="p-5 sm:p-6 bg-gray-900/60 rounded-3xl border border-white/10 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-full sm:w-[150px] aspect-square relative bg-[#EBE8E1] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0 p-3">
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
                    <span className="inline-block bg-[#342318] text-[#FF6D1F] border border-orange-500/30 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      {isEditing ? "Editing Product" : "Base Catalog Item"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-clash text-white">
                      {selectedProduct?.title || selectedProduct?.name}
                    </h2>
                    <div className="space-y-1 pt-1">
                      {(() => {
                        const fullDesc = cleanDescription(selectedProduct?.description) || "High-quality custom creator merchandise product. Select colors and sizes, add designs on print areas, and preview your premium storefront ready mockup.";
                        const isLongText = fullDesc.length > 120;

                        return (
                          <>
                            <p
                              className={`text-xs sm:text-sm text-gray-300 font-medium leading-relaxed break-words ${!isDescExpanded && isLongText ? "line-clamp-3" : ""
                                }`}
                              title={fullDesc}
                            >
                              {fullDesc}
                            </p>
                            {isLongText && (
                              <button
                                type="button"
                                onClick={() => setIsDescExpanded(!isDescExpanded)}
                                className="text-xs font-semibold text-[#FF6D1F] hover:underline flex items-center gap-1 mt-1 transition-colors cursor-pointer touch-manipulation py-1"
                              >
                                {isDescExpanded ? (
                                  <>
                                    <span>Show Less</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Read More</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-5 pt-2 text-xs text-gray-400">
                      <div><span className="text-[#FF6D1F] font-bold">Type:</span> <span className="text-gray-200 ml-1.5">{selectedProduct?.type_name || selectedProduct?.brand || "Generic brand"}</span></div>
                      <div><span className="text-[#FF6D1F] font-bold">SKU:</span> <span className="text-gray-200 ml-1.5">{selectedProduct?.id || "624"}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload & Position Your Design Card (Figma Design) */}
              <div
                id="section-artwork"
                className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6 scroll-mt-48 transition-all"
              >
                <h3 className="text-xl font-bold font-clash text-white">
                  Upload & Position Your Design
                </h3>

                {/* Choose Artwork */}
                <div className="space-y-3">
                  <label className="text-xs sm:text-sm font-semibold text-gray-300 block">
                    Choose Artwork
                  </label>

                  {/* Upload Dropzone (Brown tint with dashed orange border) */}
                  <div
                    id="field-artwork"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 scroll-mt-48 flex items-center gap-4 ${isDragging
                      ? "border-[#FF6D1F] bg-[#FF6D1F]/20 scale-[1.01]"
                      : "border-[#8E5B37] bg-[#241A14] hover:bg-[#2C1F18]"
                      }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-12 h-12 rounded-xl bg-[#FF6D1F]/20 border border-[#FF6D1F]/30 flex items-center justify-center text-[#FF6D1F] flex-shrink-0">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs sm:text-sm font-bold text-white">Upload New Artwork</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">PNG, SVG, JPG. Transparent PNG recommended</p>
                    </div>
                    {uploadingFile && (
                      <div className="flex items-center gap-2 text-xs font-bold text-orange-400 flex-shrink-0">
                        <Loader2 className="w-4 h-4 animate-spin text-[#FF6D1F]" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>

                  {/* Artwork Library */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Your Artwork Library ({uploadedFiles.length})</span>
                        <span className="text-[11px] text-[#FF6D1F]">Click to place on product</span>
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-[260px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-orange-500/30 scrollbar-track-transparent">
                        {uploadedFiles.map((file) => {
                          const hasAssigned = designFiles.find(
                            (d) => d.placement === activePlacement && (d.file_id === file.id || d.url === (file.file_url || file.preview_url || file.thumbnail_url))
                          );
                          return (
                            <div
                              key={file.id}
                              onClick={() => handleAddDesign(file)}
                              className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-black/60 ${hasAssigned
                                ? "border-[#FF6D1F] ring-2 ring-orange-500/50 shadow-md shadow-orange-500/30"
                                : "border-white/10 hover:border-orange-500/50 hover:scale-[1.02]"
                                }`}
                              title="Click to place on product"
                            >
                              <img
                                src={file.thumbnail_url || file.file_url || file.preview_url}
                                alt="Artwork"
                                className="w-full h-full object-contain p-1.5 bg-gray-900"
                              />
                              {hasAssigned ? (
                                <div className="absolute top-1.5 right-1.5 bg-[#FF6D1F] text-white p-0.5 rounded-full shadow">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Plus className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Print side */}
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <label className="text-xs sm:text-sm font-semibold text-gray-300">Print side</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getSupportedPlacements().map((placement) => {
                        const isActive = activePlacement === placement;
                        const hasAssigned = designFiles.find((d) => d.placement === placement);
                        return (
                          <button
                            key={placement}
                            type="button"
                            onClick={() => handlePlacementSelect(placement)}
                            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${isActive
                              ? "bg-[#FF6D1F] text-white shadow-md shadow-orange-500/30"
                              : hasAssigned
                                ? "bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:border-orange-500/60"
                                : "bg-black/60 border border-white/20 text-gray-300 hover:border-white/40 hover:text-white"
                              }`}
                          >
                            <span className="capitalize">{getPlacementLabel(placement)}</span>
                            {hasAssigned && (
                              <span className="w-2 h-2 rounded-full bg-green-400 ring-2 ring-green-400/30 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Adjust & Resize Artwork (Main Design Canvas) */}
                <div className="space-y-3 pt-3 border-t border-white/5">
                  <div className="bg-gradient-to-b from-gray-900/80 to-black/90 rounded-2xl border border-white/10 p-3 sm:p-5 shadow-2xl">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/10 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-clash font-bold text-white text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-[#FF6D1F]" />
                          Adjust & Resize Artwork
                        </span>
                        <span className="text-[11px] font-semibold text-[#FF6D1F] bg-orange-500/10 border border-orange-500/30 px-2.5 py-0.5 rounded-full capitalize">
                          {getPlacementLabel(activePlacement)}
                        </span>
                        {(() => {
                          const apf = getActivePrintFile(printFiles, selectedVariants, activePlacement);
                          if (apf?.width && apf?.height) {
                            return (
                              <span className="text-[11px] text-gray-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                                {apf.width} × {apf.height} px
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                      <span className="text-[11px] text-gray-400 hidden sm:inline-block">
                        Drag corner dots to resize · Move design anywhere on print area
                      </span>
                    </div>

                    <div className="w-full flex items-center justify-center min-h-[340px]">
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
                        updateDesignPosition={handleUpdateDesignPosition}
                        onAspectRatioIssues={handleSetAspectRatioIssues}
                        aspectRatioIssues={aspectRatioIssues}
                        hidePlacementTabs={true}
                        productTitle={selectedProduct?.title || selectedProduct?.name || ""}
                        productType={selectedProduct?.type_name || selectedProduct?.brand || ""}
                        onRemoveDesign={handleRemoveDesign}
                        onRemoveBackground={handleRemoveDesignBackground}
                        isRemovingBackground={isRemovingBackground}
                      />
                    </div>
                  </div>
                </div>

                {/* Realistic Product Previews (Action Header & Generate Preview Button) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-[#FF6D1F]/15 via-black/50 to-black/40 border border-[#FF6D1F]/30 rounded-2xl shadow-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#FF6D1F]/20 border border-[#FF6D1F]/40 flex items-center justify-center flex-shrink-0 text-[#FF6D1F]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white">Realistic Product Previews</span>
                        {mockupUrls && mockupUrls.length > 0 && (
                          <span className="text-[10px] text-green-400 font-bold bg-green-500/15 border border-green-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" /> Generated ({mockupUrls.length})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate">
                        {isGeneratingPreview
                          ? mockupStatus || "Generating high-resolution mockups from Printify..."
                          : mockupUrls && mockupUrls.length > 0
                            ? "Mockups loaded. Click to regenerate if you updated your design."
                            : "Click 'Generate Preview' to render high-res mockups with your uploaded artwork"}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleManualRegenerate}
                    disabled={isGeneratingPreview || designFiles.length === 0 || cooldown > 0}
                    className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-[0_4px_16px_rgba(255,109,31,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    {isGeneratingPreview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : cooldown > 0 ? (
                      <span>Wait {cooldown}s</span>
                    ) : mockupUrls && mockupUrls.length > 0 ? (
                      <>
                        <RotateCw className="w-4 h-4" />
                        <span>Regenerate Previews</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Preview</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Mockup Gallery (4 Mockup Preview Cards Grid) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
                  {(() => {
                    const mockups = getEffectiveMockups();
                    const cardsToDisplay = mockups.length >= 4 
                      ? mockups.slice(0, 4) 
                      : [
                          ...mockups,
                          ...Array(Math.max(0, 4 - mockups.length)).fill(mockups[0] || { url: selectedProduct?.image })
                        ].slice(0, 4);

                    return cardsToDisplay.map((mockup: any, idx: number) => {
                      const isMockupActive = idx === activeMockupCardIndex;
                      const isBlueprint = !mockupUrls || mockupUrls.length === 0;
                      const cardDesign = isBlueprint ? designFiles.find(
                        (d) => d.placement === mockup.placement || 
                        (mockup.placement === 'sleeve_left' && (d.placement === 'left' || d.placement === 'sleeve_left')) || 
                        (mockup.placement === 'sleeve_right' && (d.placement === 'right' || d.placement === 'sleeve_right')) ||
                        (mockup.placement === 'back' && d.placement === 'back') ||
                        (mockup.placement === 'front' && (d.placement === 'front' || !d.placement))
                      ) : null;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setActiveMockupCardIndex(idx);
                            // Sync URL so right-side viewer jumps to this image
                            const url = mockup?.url || mockup?.src || "";
                            if (url) setActiveMockupUrl(url);

                            // Auto-sync print side button to this card's placement
                            const supported = getSupportedPlacements();
                            const matchedPlacement = supported.find((p) => isPlacementMatch(mockup, p));
                            if (matchedPlacement) {
                              setActivePlacement(matchedPlacement);
                            } else if (mockup?.placement && supported.includes(mockup.placement)) {
                              setActivePlacement(mockup.placement);
                            }
                          }}
                          className={`aspect-[4/5] rounded-2xl overflow-hidden border-2 bg-white/5 p-2 flex flex-col items-center justify-center transition-all cursor-pointer relative group ${isMockupActive
                            ? "border-[#FF6D1F] ring-2 ring-orange-500/30 shadow-lg shadow-orange-500/10 bg-white/10"
                            : "border-white/10 hover:border-white/30"
                            }`}
                        >
                          <div className="w-full h-full relative flex items-center justify-center">
                            {mockup?.url || mockup?.src ? (
                              <img
                                src={mockup.url || mockup.src}
                                alt={mockup.title || `View ${idx + 1}`}
                                className="w-full h-full object-contain pointer-events-none"
                              />
                            ) : (
                              <ShoppingBag className="w-8 h-8 text-gray-600" />
                            )}
                            {cardDesign && cardDesign.url && (
                              <div className="absolute pointer-events-none inset-0 flex items-center justify-center p-3">
                                <img
                                  src={cardDesign.url}
                                  alt="Artwork"
                                  className="w-[42%] h-[42%] object-contain"
                                />
                              </div>
                            )}
                          </div>
                          {mockup?.title && (
                            <span className="text-[10px] text-gray-400 mt-1 truncate max-w-full text-center">
                              {mockup.title}
                            </span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Progress Divider Line (half orange) matching Figma */}
                <div className="w-full h-[3px] bg-white/10 relative rounded-full overflow-hidden my-4">
                  <div className="absolute left-0 top-0 h-full bg-[#FF6D1F] w-1/2" />
                </div>

                {/* Step 2 Navigation Footer */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => goToStep(1)}
                    className="px-5 py-2.5 rounded-xl border border-white/20 bg-black/40 hover:bg-white/10 text-white font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <Button
                    type="button"
                    onClick={() => {
                      if (validateAndRedirect(2)) {
                        goToStep(3);
                      }
                    }}
                    className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: TITLE, STORY & PROFIT
             ═══════════════════════════════════════════════════════════════ */}
          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: TITLE, STORY & PROFIT (FIGMA DESIGN)
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 3 || viewMode === "all") && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 3 Typography Header (Figma Design) */}
              <div className="space-y-1 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6D1F]">
                  Step 03 to 04
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-clash text-white">
                  Choose Product Variants
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Select the product options you want to offer in your store.
                </p>
              </div>

              {/* Base Catalog Item Card (Figma Design) */}
              <div className="p-5 sm:p-6 bg-gray-900/60 rounded-3xl border border-white/10 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-full sm:w-[150px] aspect-square relative bg-[#EBE8E1] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0 p-3">
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
                    <span className="inline-block bg-[#342318] text-[#FF6D1F] border border-orange-500/30 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      {isEditing ? "Editing Product" : "Base Catalog Item"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-clash text-white">
                      {selectedProduct?.title || selectedProduct?.name}
                    </h2>
                    <div className="space-y-1 pt-1">
                      {(() => {
                        const fullDesc = cleanDescription(selectedProduct?.description) || "High-quality custom creator merchandise product. Select colors and sizes, add designs on print areas, and preview your premium storefront ready mockup.";
                        const isLongText = fullDesc.length > 120;

                        return (
                          <>
                            <p
                              className={`text-xs sm:text-sm text-gray-300 font-medium leading-relaxed break-words ${!isDescExpanded && isLongText ? "line-clamp-3" : ""
                                }`}
                              title={fullDesc}
                            >
                              {fullDesc}
                            </p>
                            {isLongText && (
                              <button
                                type="button"
                                onClick={() => setIsDescExpanded(!isDescExpanded)}
                                className="text-xs font-semibold text-[#FF6D1F] hover:underline flex items-center gap-1 mt-1 transition-colors cursor-pointer touch-manipulation py-1"
                              >
                                {isDescExpanded ? (
                                  <>
                                    <span>Show Less</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Read More</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-5 pt-2 text-xs text-gray-400">
                      <div><span className="text-[#FF6D1F] font-bold">Type:</span> <span className="text-gray-200 ml-1.5">{selectedProduct?.type_name || selectedProduct?.brand || "Generic brand"}</span></div>
                      <div><span className="text-[#FF6D1F] font-bold">SKU:</span> <span className="text-gray-200 ml-1.5">{selectedProduct?.id || "624"}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 1: Title,Story & Creator Profit (Figma Design) */}
              <div id="section-listing" className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-5 scroll-mt-48 transition-all">
                <h3 className="text-xl font-bold font-clash text-white">
                  Title,Story & Creator Profit
                </h3>

                {/* Product Title */}
                <div id="field-product-name" className="space-y-2 scroll-mt-48 transition-all">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                    Product Title <span className="text-[#FF6D1F]">*</span>
                  </label>
                  <input
                    id="input-product-name"
                    type="text"
                    value={productForm.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Custom Suitcase"
                    className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all ${formErrors.name ? "border-red-500 bg-red-500/10 ring-1 ring-red-500" : "border-white/10"
                      }`}
                  />
                  {formErrors.name && <p className="text-xs text-red-400 mt-1">{formErrors.name}</p>}
                </div>

                {/* Product Description */}
                <div id="field-product-description" className="space-y-2 scroll-mt-48 transition-all">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                      Product Description <span className="text-[#FF6D1F]">*</span>
                    </label>
                    <span className="text-[11px] text-gray-500">
                      {productForm.description ? cleanDescription(productForm.description).length : 0}/1500 Minium Character Check
                    </span>
                  </div>
                  <textarea
                    id="input-product-description"
                    data-lenis-prevent
                    rows={4}
                    value={cleanDescription(productForm.description)}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    onWheel={(e) => e.stopPropagation()}
                    placeholder="Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966 dummy text of the printing and typesetting industry Lorem Ipsum has been the industry's...."
                    className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all overflow-y-auto resize-y min-h-[110px] max-h-[300px] ${formErrors.description ? "border-red-500 bg-red-500/10 ring-1 ring-red-500" : "border-white/10"
                      }`}
                  />
                  {formErrors.description && <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>}
                </div>

                {/* Marketplace Category & Select Tag Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Category */}
                  <div id="field-product-category" className="space-y-2 scroll-mt-48 transition-all">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                      Marketplace category <span className="text-[#FF6D1F]">*</span>
                    </label>
                    <Select
                      value={productForm.category || "placeholder"}
                      onValueChange={(val) => handleInputChange("category", val)}
                    >
                      <SelectTrigger id="input-product-category" className={`w-full h-[46px] px-4 bg-black/60 rounded-xl text-sm text-white ${formErrors.category ? "border-red-500 bg-red-500/10 ring-1 ring-red-500" : "border-white/10"}`}>
                        <SelectValue key={productForm.category || "placeholder"} placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="placeholder" disabled>Select category</SelectItem>
                        {CATEGORIES_MAP.map((cat) => (
                          <SelectItem key={cat.id} value={cat.title}>
                            {cat.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && <p className="text-xs text-red-400 mt-1">{formErrors.category}</p>}
                  </div>

                  {/* Select Tag */}
                  <div id="field-product-tags" className="space-y-2 scroll-mt-48 transition-all">
                    <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                      Select tag <span className="text-[#FF6D1F]">*</span>
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      {["Trending", "New", "Popular"].map((tagName) => {
                        const isSelected = productForm.tags && productForm.tags.includes(tagName);
                        return (
                          <button
                            key={tagName}
                            type="button"
                            onClick={() => {
                              handleInputChange("tags", [tagName]);
                              if (formErrors.tags) {
                                setFormErrors((prev) => ({ ...prev, tags: "" }));
                              }
                            }}
                            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${isSelected
                              ? "bg-[#FF6D1F] text-white shadow-md shadow-orange-500/25 font-bold"
                              : "bg-[#141B26] border border-white/20 text-gray-300 hover:text-white hover:border-white/40"
                              }`}
                          >
                            {tagName}
                          </button>
                        );
                      })}
                    </div>
                    {formErrors.tags && <p className="text-xs text-red-400 mt-1">{formErrors.tags}</p>}
                  </div>
                </div>
              </div>

              {/* Card 2: Your Creator Profit Markup (Figma Design) */}
              <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold font-clash text-white">
                      Your Creator Profit Markup
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      slide to Choose how much profit you earn on each sale
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-extrabold text-[#FF6D1F] tabular-nums block">
                      {creatorMarkup}%
                    </span>
                    <span className="text-[11px] text-gray-400 block">Your Margin</span>
                  </div>
                </div>

                {/* Slider */}
                <div className="px-1 py-2">
                  <Slider
                    value={creatorMarkup}
                    min={0}
                    max={100}
                    step={1}
                    onChange={handleCreatorMarkupChange}
                    sx={creatorSliderSx}
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs font-semibold text-gray-400 mr-1">Quick Presets:</span>
                  {CREATOR_MARKUP_PRESETS.map((preset) => {
                    const isSelected = creatorMarkup === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handleCreatorPresetClick(preset)}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${isSelected
                          ? "bg-[#FF6D1F] text-white shadow-md shadow-orange-500/25 font-extrabold"
                          : "bg-[#141B26] border border-white/20 text-gray-300 hover:text-white hover:border-white/40"
                          }`}
                      >
                        {preset}%
                      </button>
                    );
                  })}
                </div>

                {/* 3 Summary Cards */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {/* Card 1: Base Cost */}
                  <div className="border border-white/10 bg-black/40 rounded-2xl p-3.5 space-y-1">
                    <span className="text-xs text-gray-400 font-medium block">Base Cost</span>
                    <span className="text-sm sm:text-base font-bold text-white block">
                      {hasPriceRange ? `$${platformMinSellingPrice.toFixed(2)} – $${platformMaxSellingPrice.toFixed(2)}` : `$${platformMinSellingPrice.toFixed(2)}`}
                    </span>
                  </div>

                  {/* Card 2: Your Profit */}
                  <div className="border border-emerald-500/30 bg-emerald-950/20 rounded-2xl p-3.5 space-y-1">
                    <span className="text-xs text-emerald-400 font-medium block">Your Profit ({creatorMarkup}%)</span>
                    <span className="text-sm sm:text-base font-bold text-emerald-300 block">
                      +{hasPriceRange
                        ? `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)} – $${(maxSellingPrice - platformMaxSellingPrice).toFixed(2)}`
                        : `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)}`}
                    </span>
                  </div>

                  {/* Card 3: Customer Retail Price */}
                  <div className="border border-white/10 bg-black/40 rounded-2xl p-3.5 space-y-1">
                    <span className="text-xs text-gray-400 font-medium block">Customer Retail Price</span>
                    <span className="text-sm sm:text-base font-bold text-white block">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} – $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                </div>

                {/* Step 3 Navigation Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => goToStep(2)}
                    className="px-5 py-2.5 rounded-xl border border-white/20 bg-transparent hover:bg-white/10 text-white font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <Button
                    type="button"
                    onClick={() => {
                      if (validateAndRedirect(3)) {
                        goToStep(4);
                      }
                    }}
                    className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Next Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 4: REVIEW & LAUNCH LIVE
             ═══════════════════════════════════════════════════════════════ */}
          {/* ═══════════════════════════════════════════════════════════════
              STEP 4: REVIEW & LAUNCH LIVE (FIGMA DESIGN)
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 4 || viewMode === "all") && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 4 Typography Header (Figma Design) */}
              <div className="space-y-1 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6D1F]">
                  Step 04
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-clash text-white">
                  Choose Product Variants
                </h1>
                <p className="text-xs sm:text-sm text-gray-400">
                  Select the product options you want to offer in your store.
                </p>
              </div>

              {/* Base Catalog Item Card (Figma Design) */}
              <div className="p-5 sm:p-6 bg-gray-900/60 rounded-3xl border border-white/10 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-full sm:w-[150px] aspect-square relative bg-[#EBE8E1] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0 p-3">
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
                    <span className="inline-block bg-[#342318] text-[#FF6D1F] border border-orange-500/30 text-[11px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                      {isEditing ? "Editing Product" : "Base Catalog Item"}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-bold font-clash text-white">
                      {selectedProduct?.title || selectedProduct?.name}
                    </h2>
                    <div className="space-y-1 pt-1">
                      {(() => {
                        const fullDesc = cleanDescription(selectedProduct?.description) || "High-quality custom creator merchandise product. Select colors and sizes, add designs on print areas, and preview your premium storefront ready mockup.";
                        const isLongText = fullDesc.length > 120;

                        return (
                          <>
                            <p
                              className={`text-xs sm:text-sm text-gray-300 font-medium leading-relaxed break-words ${!isDescExpanded && isLongText ? "line-clamp-3" : ""
                                }`}
                              title={fullDesc}
                            >
                              {fullDesc}
                            </p>
                            {isLongText && (
                              <button
                                type="button"
                                onClick={() => setIsDescExpanded(!isDescExpanded)}
                                className="text-xs font-semibold text-[#FF6D1F] hover:underline flex items-center gap-1 mt-1 transition-colors cursor-pointer touch-manipulation py-1"
                              >
                                {isDescExpanded ? (
                                  <>
                                    <span>Show Less</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>Read More</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-5 pt-2 text-xs text-gray-400">
                      <div><span className="text-[#FF6D1F] font-bold">Type:</span> <span className="text-gray-200 ml-1.5">{selectedProduct?.type_name || selectedProduct?.brand || "Generic brand"}</span></div>
                      <div><span className="text-[#FF6D1F] font-bold">SKU:</span> <span className="text-gray-200 ml-1.5">{selectedProduct?.id || "624"}</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 1: Review & Publish Live (Figma Design) */}
              <div id="field-mockup-studio" className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-4 scroll-mt-48 transition-all">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold font-clash text-white">
                    Review & Publish Live
                  </h3>
                  <button
                    type="button"
                    onClick={() => customFileInputRef.current?.click()}
                    disabled={isUploadingCustomImage}
                    className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-[0_4px_16px_rgba(255,109,31,0.3)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <span>Upload Image</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Hidden Custom Image Upload input */}
                <input
                  ref={customFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCustomImageUpload}
                />

                {/* Big Preview Showcase Frame (matching Figma neutral background) */}
                <div className="bg-[#E5E2DA] rounded-2xl border border-white/10 p-4 sm:p-6 relative">
                  <div className="w-full max-w-md mx-auto">
                    <Product360Viewer
                      mockupUrls={getEffectiveMockups()}
                      images={selectedProduct?.images || []}
                      defaultImage={selectedProduct?.image || (variants.length > 0 ? variants[0]?.image : undefined)}
                      productName={selectedProduct?.title || selectedProduct?.name}
                      designFiles={designFiles}
                      activePlacement={activePlacement}
                      onPlacementChange={handlePlacementSelect}
                      activeColorHex={activeColorHex}
                      supportedPlacements={getSupportedPlacements()}
                      activeUrl={activeMockupUrl}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-black/10 mt-3">
                    <div className="text-xs text-gray-700 font-medium">
                      {mockupUrls && mockupUrls.length > 0
                        ? `✓ ${mockupUrls.length} high-res storefront mockups ready for marketplace`
                        : "Realistic mockups previewed above with your placed artwork"}
                    </div>
                    <Button
                      type="button"
                      onClick={handleManualRegenerate}
                      disabled={isGeneratingPreview || designFiles.length === 0 || cooldown > 0}
                      className="bg-black/80 hover:bg-black text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer self-start sm:self-auto"
                    >
                      {isGeneratingPreview ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : cooldown > 0 ? (
                        <span>Wait {cooldown}s</span>
                      ) : (
                        <>
                          <RotateCw className="w-3.5 h-3.5 text-[#FF6D1F]" />
                          <span>Regenerate Previews</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Card 2: Customization Review Checklist (Figma Design) */}
              <div id="field-checklist-review" className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-4 scroll-mt-48 transition-all">
                <h3 className="text-xl font-bold font-clash text-white">
                  Customization Review Checklist
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Item 1: Variants Selected */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white">Variants Selected</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {selectedVariants.length > 0 ? `${selectedVariants.length} of ${selectedProduct?.variants?.length || selectedVariants.length} variant IDs selected` : "3 of 3 variant IDs selected"}
                      </div>
                    </div>
                  </div>

                  {/* Item 2: Design Placed */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white">Design Placed</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        {designFiles.length} print area assignment(s) configured
                      </div>
                    </div>
                  </div>

                  {/* Item 3: Aspect Ratio Status */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white">Aspect ratio Status</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        All placement pass backend validation
                      </div>
                    </div>
                  </div>

                  {/* Item 4: Product Previews Ready */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white">Product Previews Ready</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Vector outlines loaded
                      </div>
                    </div>
                  </div>

                  {/* Item 5: Storefront Metadata Complete */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3.5 sm:col-span-2">
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white">Storefront Metadata Complete</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Title and description (&gt;=20 chars) are required
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Big Ready to Go Live Card (Figma Design) */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1C1229] via-[#0E1322] to-[#0A0D18] border border-purple-500/30 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold font-clash text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Ready to Go Live?
                    </h4>
                    <p className="text-xs text-gray-400 mt-1">
                      Publish your product directly to the Loka Creator Marketplace.
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">YOUR PRICE</div>
                    <div className="text-xl sm:text-2xl font-black text-white">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePublishSubmit}
                  disabled={isPublishing}
                  className="w-full bg-gradient-to-r from-purple-700 via-[#8A3816] to-[#A3430C] border border-orange-500/30 hover:opacity-95 text-white font-extrabold text-sm sm:text-base py-4 rounded-xl transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isEditing ? "Saving Changes..." : "Publishing to Marketplace..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>🚀 Publish Live to Marketplace</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Step 4 Navigation Footer */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="px-5 py-2.5 rounded-xl border border-white/20 bg-transparent hover:bg-white/10 text-white font-medium text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Right Sidebar (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-[110px] space-y-6">

            {/* Live Preview Header (Figma Design) */}
            <div className="space-y-0.5">
              <h3 className="text-base sm:text-lg font-bold font-clash text-white">Live Preview</h3>
              <p className="text-[11px] sm:text-xs text-gray-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#FF6D1F] animate-pulse" />
                Updates as you configure your product
              </p>
            </div>

            {/* Thumbnail Preview Card */}
            <div className="bg-gray-900/50 border border-white/10 rounded-3xl p-5 space-y-5">
              <Product360Viewer
                mockupUrls={filteredMockupUrls && filteredMockupUrls.length > 0 ? filteredMockupUrls : getEffectiveMockups()}
                images={selectedProduct?.images || []}
                defaultImage={selectedProduct?.image || (variants.length > 0 ? variants[0]?.image : undefined)}
                productName={selectedProduct?.title || selectedProduct?.name}
                designFiles={designFiles}
                activePlacement={activePlacement}
                onPlacementChange={handlePlacementSelect}
                activeColorHex={activeColorHex}
                supportedPlacements={getSupportedPlacements()}
                activeUrl={activeMockupUrl}
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

              {/* Creator Markup Summary Card (Figma Design) */}
              <div className="bg-[#101726] border border-white/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-black">%</span>
                  <span>Creator Markup</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Loka Base Cost</span>
                    <span className="text-[#FF6D1F] font-bold">
                      {hasPriceRange ? `$${platformMinSellingPrice.toFixed(2)} – $${platformMaxSellingPrice.toFixed(2)}` : `$${platformMinSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 flex items-center gap-1">
                      Creator Profit
                      <span className="text-[10px] text-emerald-400/70 font-semibold">(+{creatorMarkup}%)</span>
                    </span>
                    <span className="text-emerald-400 font-bold">
                      +{hasPriceRange
                        ? `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)} – $${(maxSellingPrice - platformMaxSellingPrice).toFixed(2)}`
                        : `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                    <span className="text-gray-200 font-semibold">Final Product Price</span>
                    <span className="text-white font-extrabold text-sm">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} – $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Tips (Figma Design) */}
              <div className="bg-[#161D2B] border border-orange-500/20 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
                <h5 className="font-bold text-sm text-[#FF6D1F] flex items-center gap-2 font-clash">
                  <Sparkles className="w-4 h-4 text-[#FF6D1F]" />
                  Creator Tips
                </h5>
                <ul className="text-xs text-gray-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6D1F] font-bold text-sm leading-none">•</span>
                    <span>Choose bright colors to attract customer attention</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6D1F] font-bold text-sm leading-none">•</span>
                    <span>Write a description with materials & sizing tips</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#FF6D1F] font-bold text-sm leading-none">•</span>
                    <span>Keep the main design centered for best results</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Screen Experience */}
      <div className="sticky bottom-0 z-35 bg-black/95 backdrop-blur-md border-t border-white/10 py-3 px-4 flex items-center justify-between lg:hidden gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 bg-black/50 flex-shrink-0">
            {mockupUrls && mockupUrls.length > 0 ? (
              <img src={mockupUrls[0].url || mockupUrls[0].src} alt="Mobile Preview" className="w-full h-full object-contain" />
            ) : (
              <ShoppingBag className="w-4 h-4 text-gray-500 m-2" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] text-gray-400 truncate">
              Step {activeStep}/4 • {activeStep === 1 ? "Colors" : activeStep === 2 ? "Artwork" : activeStep === 3 ? "Pricing" : "Review"}
            </div>
            <div className="text-xs font-bold text-[#FF6D1F] truncate">
              {hasPriceRange ? `${minSellingPrice.toFixed(2)} - ${maxSellingPrice.toFixed(2)}` : `${minSellingPrice.toFixed(2)}`}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {activeStep > 1 && (
            <button
              type="button"
              onClick={() => goToStep(activeStep - 1)}
              className="h-9 px-2.5 text-xs text-gray-300 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          )}

          {activeStep < 4 ? (
            <button
              type="button"
              onClick={() => {
                if (validateAndRedirect(activeStep)) {
                  goToStep(activeStep + 1);
                }
              }}
              className="h-9 bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs px-3.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,109,31,0.3)] cursor-pointer transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Button
              onClick={handlePublishSubmit}
              disabled={isPublishing}
              className="h-9 bg-gradient-to-r from-purple-600 to-[#FF6D1F] text-white font-extrabold text-xs px-3.5 rounded-xl shadow-[0_0_12px_rgba(255,109,31,0.4)] disabled:opacity-50 cursor-pointer"
            >
              {isPublishing ? "Publishing..." : "Publish 🚀"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedCanvasPDP;
