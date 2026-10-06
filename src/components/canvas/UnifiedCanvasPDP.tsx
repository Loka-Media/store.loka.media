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
}> = ({ mockupUrls, images = [], defaultImage, productName, designFiles, activePlacement = "front", onPlacementChange, activeColorHex, supportedPlacements }) => {
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

    let resolvedPlacement = "front";
    if (p.includes("back") || title.includes("back")) resolvedPlacement = "back";
    else if (p.includes("neck") || title.includes("neck") || p.includes("label") || title.includes("label")) resolvedPlacement = "neck";
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
        const placements = (supportedPlacements && supportedPlacements.length > 0)
          ? supportedPlacements
          : ["front", "back", "sleeve_left", "sleeve_right", "neck"];
        const hasBack = placements.some((p) => p.includes("back"));
        const hasNeck = placements.some((p) => p.includes("neck") || p.includes("label"));

        itemsToProcess = images.map((url, index) => {
          const urlLower = url.toLowerCase();
          let placement = "front";
          // In Printify, index 1 is standard Back View for apparel, or URL contains back/rear/reverse
          if ((index === 1 && hasBack) || urlLower.includes("back") || urlLower.includes("rear") || urlLower.includes("reverse")) {
            placement = "back";
          } else if ((index === 2 && hasNeck) || urlLower.includes("neck") || urlLower.includes("label")) {
            placement = "neck";
          } else if (urlLower.includes("left") || urlLower.includes("sleeve_left")) {
            placement = "sleeve_left";
          } else if (urlLower.includes("right") || urlLower.includes("sleeve_right")) {
            placement = "sleeve_right";
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

    const order = ["front", "right", "back", "left", "neck"];
    const result: any[] = [];

    const getPlacementType = (title: string, placement?: string) => {
      const p = (placement || "").toLowerCase();
      if (p.includes("front")) return "front";
      if (p.includes("back")) return "back";
      if (p.includes("neck") || p.includes("label") || p.includes("collar")) return "neck";
      if (p.includes("right") || p.includes("sleeve_right")) return "right";
      if (p.includes("left") || p.includes("sleeve_left")) return "left";

      const t = (title || "").toLowerCase();
      if (t.includes("front")) return "front";
      if (t.includes("back")) return "back";
      if (t.includes("neck") || t.includes("label") || t.includes("collar")) return "neck";
      if (t.includes("right") || t.includes("sleeve_right")) return "right";
      if (t.includes("left") || t.includes("sleeve_left")) return "left";
      return "other";
    };

    const groups: Record<string, any[]> = { front: [], right: [], back: [], left: [], neck: [], other: [] };
    itemsToProcess.forEach((m) => {
      const type = getPlacementType(m.title || "", m.placement);
      if (!groups[type]) groups[type] = [];
      groups[type].push(m);
    });

    order.forEach((key) => {
      if (groups[key] && groups[key].length > 0) {
        result.push(...groups[key]);
      }
    });
    if (groups.other && groups.other.length > 0) {
      result.push(...groups.other);
    }

    return result.length > 0 ? result : itemsToProcess;
  }, [mockupUrls, images, supportedPlacements]);

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
      if ((activePlacement === "neck" || activePlacement.includes("neck")) && (title.includes("neck") || placement.includes("neck") || title.includes("label") || placement.includes("label"))) return true;
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
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Local component states
  const [activePlacement, setActivePlacement] = useState<string>("front");
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

      if (lower === "left" || lower.includes("sleeve_left") || lower.includes("left_sleeve") || lower.startsWith("left_")) {
        return "sleeve_left";
      }
      if (lower === "right" || lower.includes("sleeve_right") || lower.includes("right_sleeve") || lower.startsWith("right_")) {
        return "sleeve_right";
      }
      if (lower.includes("neck_outer") || lower.includes("outer_neck")) {
        return "neck_outer";
      }
      if (lower.includes("neck") || lower.includes("collar") || lower.includes("label") || lower.includes("tag")) {
        return "neck";
      }
      if (lower === "front" || lower.startsWith("front_") || lower.startsWith("front-") || lower.includes("front") || lower === "chest") {
        return "front";
      }
      if (lower === "back" || lower.startsWith("back_") || lower.startsWith("back-") || lower.includes("back") || lower === "rear" || lower === "reverse") {
        return "back";
      }
      if (lower.includes("pocket")) {
        return "pocket";
      }
      if (lower.includes("hood")) {
        return "hood";
      }
      if (lower.includes("all_over") || lower.includes("wrap") || lower.includes("full")) {
        return "all_over";
      }

      return lower;
    };

    // 1. Collect directly from selectedProduct variant placeholders (Primary Printify source)
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

    // 2. Collect from selectedProduct root placeholders
    if (Array.isArray((selectedProduct as any)?.placeholders)) {
      (selectedProduct as any).placeholders.forEach((p: any) => {
        if (p.position) {
          const canonical = toCanonicalPlacement(p.position);
          if (canonical) discoveredPlacements.add(canonical);
        }
      });
    }

    // 3. Collect from printFiles printfiles
    if (printFiles?.printfiles && Array.isArray(printFiles.printfiles)) {
      printFiles.printfiles.forEach((pf: any) => {
        if (pf.position) {
          const canonical = toCanonicalPlacement(pf.position);
          if (canonical) discoveredPlacements.add(canonical);
        }
      });
    }

    // 4. Collect from printFiles variant_printfiles placements
    if (printFiles?.variant_printfiles && Array.isArray(printFiles.variant_printfiles) && printFiles.variant_printfiles.length > 0) {
      printFiles.variant_printfiles.forEach((vp: any) => {
        if (vp.placements) {
          Object.keys(vp.placements).forEach((k) => {
            const canonical = toCanonicalPlacement(k);
            if (canonical) discoveredPlacements.add(canonical);
          });
        }
      });
    }

    // 5. Fallback ONLY if no placeholders were discovered from Printify API data
    if (discoveredPlacements.size === 0) {
      if (mockupUrls && Array.isArray(mockupUrls) && mockupUrls.length > 0) {
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
      "front",
      "back",
      "neck",
      "neck_outer",
      "sleeve_left",
      "sleeve_right",
      "pocket",
      "hood",
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
    let baseWidth = activePrintFile.width * 0.7;
    let baseHeight = activePrintFile.height * 0.7;

    if (imageUrl) {
      try {
        const dimensions = await calculateAspectRatioAwareDimensions(
          imageUrl,
          activePrintFile,
          0.7,
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
    const baseLeft = Math.max(0, Math.round((activePrintFile.width - baseWidth) / 2));

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

  // Publish submit action
  const handlePublishSubmit = async () => {
    // Check Step 1: Variants
    if (selectedVariants.length === 0) {
      goToStep(1);
      toast.error("Step 1 incomplete: Please select at least one variant (color & size)");
      return;
    }

    // Check Step 2: Artwork
    const hasExistingImages = isEditing && (mockupUrls?.length > 0 || (selectedProduct?.images && selectedProduct.images.length > 0));
    if (designFiles.length === 0 && !hasExistingImages) {
      goToStep(2);
      toast.error("Step 2 incomplete: Please add and position your artwork on the canvas");
      return;
    }

    // Form validator for Step 3
    const errors: Record<string, string> = {};
    if (!productForm.name.trim()) errors.name = "Storefront product name is required";
    if (!productForm.description.trim()) {
      errors.description = "Product description is required";
    } else if (productForm.description.trim().length < 20) {
      errors.description = "Description must be at least 20 characters";
    }
    if (!productForm.category) errors.category = "Please select a category";
    if (!productForm.tags || productForm.tags.length === 0) {
      errors.tags = "Please select a Tag (Trending, New, or Popular)";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      goToStep(3);
      toast.error("Step 3 incomplete: Please fill out all required listing details");
      return;
    }

    if (!validationSummary.allValid) {
      goToStep(4);
      toast.error("Please complete all checklist items before publishing");
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
      front: "Front Print",
      back: "Back Print",
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
  const [isUploadingCustomImage, setIsUploadingCustomImage] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const customFileInputRef = useRef<HTMLInputElement>(null);

  // Helper to obtain active mockup list or initialize from catalog images
  const getEffectiveMockups = useCallback(() => {
    if (mockupUrls && mockupUrls.length > 0) return mockupUrls;
    const rawImages = selectedProduct?.images || (selectedProduct?.image ? [selectedProduct.image] : []);
    if (rawImages.length === 0) return [];
    return rawImages.map((url: string, index: number) => {
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
        variant_ids: []
      };
    });
  }, [mockupUrls, selectedProduct]);

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

  return (
    <div className="bg-[#050505] min-h-screen text-white relative pt-[30px] md:pt-[40px]">
      {/* Hidden input for custom image uploads */}
      <input
        type="file"
        ref={customFileInputRef}
        accept="image/*"
        multiple
        onChange={handleCustomImageUpload}
        className="hidden"
      />

      {/* Sticky Header with Product Info & Continue Button - offset by navbar height + 10px spacing */}
      <div className="sticky top-[90px] md:top-[98px] z-40 bg-black/80 backdrop-blur-md border-b border-white/10 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 text-gray-300 hover:text-white transition-all duration-200 flex-shrink-0 group cursor-pointer"
              title="Go back to previous page"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-sm sm:text-base md:text-lg font-bold font-clash text-white line-clamp-1">
                {selectedProduct?.title || selectedProduct?.name}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                SKU: {selectedProduct?.model || selectedProduct?.id} | {selectedProduct?.type_name}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <div title={mockupStatus !== 'Mockups loaded successfully!' && mockupUrls.length === 0 ? "Please generate high-quality mockups first" : (!validationSummary.allValid ? "Please fill in all required fields" : "")}>
              <Button
                onClick={handlePublishSubmit}
                disabled={isPublishing || !validationSummary.allValid || isGeneratingPreview || (!isEditing && mockupUrls.length === 0 && mockupStatus !== 'Mockups loaded successfully!')}
                className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isPublishing ? (
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>{isEditing ? "Updating..." : "Publishing..."}</span>
                  </div>
                ) : (
                  isEditing ? "Update Product" : "Publish Product"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* LEFT COLUMN: Main PDP Customizer Workspace */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">

          {/* Color-Coded Numbered Stepper Navigation Bar */}
          <div ref={topStepperRef} className="bg-gray-900/80 border border-white/10 rounded-3xl p-4 sm:p-5 backdrop-blur-md space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-[#FF6D1F]">
                    <Sparkles className="w-3.5 h-3.5" />
                    Easy 4-Step Creator Flow
                  </span>
                  <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                    Step {activeStep} of 4: {activeStep === 1 ? "Colors & Sizes" : activeStep === 2 ? "Artwork & Placement" : activeStep === 3 ? "Title & Profit Margin" : "Review & Go Live"}
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  Follow each numbered step from left to right. Simple, clear, and easy to complete.
                </p>
              </div>

              {/* Toggle View Mode: Guided vs All */}
              <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-2xl p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("stepper")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === "stepper"
                    ? "bg-[#FF6D1F] text-white shadow-[0_0_12px_rgba(255,109,31,0.4)]"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  <span>Guided Steps</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewMode === "all"
                    ? "bg-[#FF6D1F] text-white shadow-[0_0_12px_rgba(255,109,31,0.4)]"
                    : "text-gray-400 hover:text-white"
                    }`}
                >
                  <span>View All</span>
                </button>
              </div>
            </div>

            {/* 4 Color-Coded Step Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
              {/* Step 1: Sky Blue */}
              <button
                type="button"
                onClick={() => goToStep(1)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${activeStep === 1
                  ? "border-sky-500 bg-sky-500/10 shadow-[0_0_20px_rgba(14,165,233,0.2)] ring-1 ring-sky-500/40"
                  : validationSummary.variants
                    ? "border-sky-500/30 bg-black/40 hover:border-sky-500/60"
                    : "border-white/10 bg-black/30 hover:border-white/20 opacity-80"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${activeStep === 1
                    ? "bg-sky-500 text-black shadow-md shadow-sky-500/30"
                    : validationSummary.variants
                      ? "bg-green-500 text-black font-black"
                      : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    }`}>
                    {validationSummary.variants ? <Check className="w-4 h-4 stroke-[3]" /> : "1"}
                  </div>
                  {validationSummary.variants ? (
                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 px-2 py-0.5 rounded-full">
                      {selectedColors.length} colors
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold font-clash leading-tight ${activeStep === 1 ? "text-sky-300" : "text-white"}`}>
                    1. Colors & Sizes
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">Product options</div>
                </div>
              </button>

              {/* Step 2: Vibrant Orange */}
              <button
                type="button"
                onClick={() => goToStep(2)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${activeStep === 2
                  ? "border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.2)] ring-1 ring-orange-500/40"
                  : validationSummary.designs
                    ? "border-orange-500/30 bg-black/40 hover:border-orange-500/60"
                    : "border-white/10 bg-black/30 hover:border-white/20 opacity-80"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${activeStep === 2
                    ? "bg-[#FF6D1F] text-white shadow-md shadow-orange-500/30"
                    : validationSummary.designs
                      ? "bg-green-500 text-black font-black"
                      : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    }`}>
                    {validationSummary.designs ? <Check className="w-4 h-4 stroke-[3]" /> : "2"}
                  </div>
                  {validationSummary.designs ? (
                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Placed
                    </span>
                  ) : (
                    <span className="text-[10px] text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full">
                      {designFiles.length} designs
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold font-clash leading-tight ${activeStep === 2 ? "text-orange-300" : "text-white"}`}>
                    2. Add Artwork
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">Upload & position</div>
                </div>
              </button>

              {/* Step 3: Emerald Green */}
              <button
                type="button"
                onClick={() => goToStep(3)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${activeStep === 3
                  ? "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)] ring-1 ring-emerald-500/40"
                  : validationSummary.details
                    ? "border-emerald-500/30 bg-black/40 hover:border-emerald-500/60"
                    : "border-white/10 bg-black/30 hover:border-white/20 opacity-80"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${activeStep === 3
                    ? "bg-emerald-500 text-black shadow-md shadow-emerald-500/30"
                    : validationSummary.details
                      ? "bg-green-500 text-black font-black"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    }`}>
                    {validationSummary.details ? <Check className="w-4 h-4 stroke-[3]" /> : "3"}
                  </div>
                  {validationSummary.details ? (
                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Ready
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      {creatorMarkup}% Markup
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold font-clash leading-tight ${activeStep === 3 ? "text-emerald-300" : "text-white"}`}>
                    3. Title & Price
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">Details & profit</div>
                </div>
              </button>

              {/* Step 4: Royal Purple */}
              <button
                type="button"
                onClick={() => goToStep(4)}
                className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${activeStep === 4
                  ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/40"
                  : validationSummary.allValid
                    ? "border-purple-500/30 bg-black/40 hover:border-purple-500/60"
                    : "border-white/10 bg-black/30 hover:border-white/20 opacity-80"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${activeStep === 4
                    ? "bg-purple-500 text-white shadow-md shadow-purple-500/30"
                    : validationSummary.allValid
                      ? "bg-green-500 text-black font-black"
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    }`}>
                    {validationSummary.allValid ? <Check className="w-4 h-4 stroke-[3]" /> : "4"}
                  </div>
                  {validationSummary.allValid ? (
                    <span className="text-[10px] font-bold text-green-400 flex items-center gap-1 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" /> Ready!
                    </span>
                  ) : (
                    <span className="text-[10px] text-purple-400 font-semibold bg-purple-500/10 px-2 py-0.5 rounded-full">
                      Launch
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold font-clash leading-tight ${activeStep === 4 ? "text-purple-300" : "text-white"}`}>
                    4. Review & Launch
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-0.5">Final checklist</div>
                </div>
              </button>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: VARIANTS (COLORS & SIZES) - SKY BLUE THEME
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 1 || viewMode === "all") && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 1 Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-blue-500/10 to-transparent border border-sky-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500 text-black font-black text-lg flex items-center justify-center shadow-lg shadow-sky-500/25 flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Step 1 of 4</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">Colors & Sizes</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-clash text-white">Choose Product Variants</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-bold text-sky-300 self-start sm:self-auto">
                  <Palette className="w-4 h-4 text-sky-400" />
                  <span>{selectedColors.length} Colors • {selectedSizes.length} Sizes</span>
                </div>
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
                              className={`border-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${isSelected
                                ? "border-[#FF6D1F] bg-[#FF6D1F]/10 text-white font-bold"
                                : "border-white/10 bg-white/5 text-gray-300 hover:border-white/35"
                                }`}
                            >
                              <span>{size}</span>
                              {isSelected && (
                                <span className="bg-white/90 p-0.5 rounded-full flex-shrink-0">
                                  <Check className="w-3 h-3 text-black" />
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
                    if (selectedVariants.length === 0) {
                      toast.error("Please select at least 1 color and size");
                      return;
                    }
                    goToStep(2);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-black font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next: Add Artwork (Step 2)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: ARTWORK & POSITION - VIBRANT ORANGE THEME
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 2 || viewMode === "all") && (
            <div className="space-y-5 animate-fadeIn">
              {/* Step 2 Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-orange-500/15 via-[#FF6D1F]/10 to-transparent border border-[#FF6D1F]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FF6D1F] text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/25 flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Step 2 of 4</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">Artwork & Placement</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-clash text-white">Upload & Position Your Design</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-300 self-start sm:self-auto">
                  <Upload className="w-4 h-4 text-orange-400" />
                  <span>{designFiles.length} Placed Area(s)</span>
                </div>
              </div>

              {/* ✅ HOW IT WORKS - 3-Step Mini Guide */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { num: "1", icon: <UploadCloud className="w-4 h-4" />, title: "Upload", desc: "Add your artwork file", color: "text-orange-400 bg-orange-500/10 border-orange-500/30" },
                  { num: "2", icon: <Plus className="w-4 h-4" />, title: "Click to Place", desc: "Click any artwork below", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
                  { num: "3", icon: <Eye className="w-4 h-4" />, title: "Adjust & Preview", desc: "Drag to resize & move", color: "text-green-400 bg-green-500/10 border-green-500/30" },
                ].map((step, i) => (
                  <div key={i} className={`flex flex-col items-center text-center gap-2 p-3 rounded-2xl border ${step.color} backdrop-blur-sm`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${step.color}`}>
                      {step.icon}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{step.title}</div>
                      <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ PLACEMENT SELECTOR */}
              <div className="p-4 bg-gray-900/60 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-orange-400 block">Print Side</span>
                  <p className="text-[11px] text-gray-400">Which side to customize?</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getSupportedPlacements().map((placement) => {
                    const isActive = activePlacement === placement;
                    const hasAssigned = designFiles.find((d) => d.placement === placement);
                    return (
                      <button
                        key={placement}
                        type="button"
                        onClick={() => setActivePlacement(placement)}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${isActive
                          ? "bg-[#FF6D1F] text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/50"
                          : hasAssigned
                            ? "bg-orange-500/10 text-orange-300 border border-orange-500/30 hover:border-orange-500/60"
                            : "bg-black/50 text-gray-400 border border-white/10 hover:border-white/30 hover:text-white"
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

              {/* ✅ MAIN DESIGN STUDIO: Left controls + Right live canvas SIDE BY SIDE */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                {/* LEFT: Artwork Picker + Controls */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Choose Artwork</span>
                    <span className="text-[11px] text-gray-400">Click any image to place it ↓</span>
                  </div>

                  {/* Upload Dropzone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all duration-300 ${isDragging
                      ? "border-[#FF6D1F] bg-[#FF6D1F]/15 scale-[1.01]"
                      : "border-orange-500/30 bg-orange-500/5 hover:border-orange-500 hover:bg-orange-500/10"
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
                    {uploadingFile ? (
                      <div className="flex items-center justify-center gap-2 py-2">
                        <Loader2 className="w-5 h-5 text-[#FF6D1F] animate-spin" />
                        <span className="text-xs font-bold text-white">Uploading artwork...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3 py-1">
                        <div className="p-2.5 bg-[#FF6D1F]/20 border border-[#FF6D1F]/30 rounded-xl text-[#FF6D1F]">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-bold text-white">Upload New Artwork</p>
                          <p className="text-[10px] text-gray-400">PNG, SVG, JPG · Transparent PNG recommended</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Designs Library */}
                  <div className="bg-black/40 border border-white/5 p-3.5 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-300">Your Artwork Library</span>
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onRefreshFiles(currentPage - 1)}
                            disabled={currentPage <= 1 || isFetchingFiles}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {currentPage}/{totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => onRefreshFiles(currentPage + 1)}
                            disabled={currentPage >= totalPages || isFetchingFiles}
                            className="p-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {isFetchingFiles ? (
                      <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                        <span>Loading artwork...</span>
                      </div>
                    ) : uploadedFiles.length > 0 ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {uploadedFiles.map((file) => {
                          const hasAssigned = designFiles.find(
                            (d) => d.placement === activePlacement && (d.file_id === file.id || d.url === (file.file_url || file.preview_url || file.thumbnail_url))
                          );

                          return (
                            <div
                              key={file.id}
                              onClick={() => handleAddDesign(file)}
                              className={`group relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all bg-black/60 ${hasAssigned
                                ? "border-[#FF6D1F] ring-2 ring-orange-500/40 shadow-md shadow-orange-500/20"
                                : "border-white/10 hover:border-orange-500/50 hover:scale-[1.02]"
                                }`}
                              title="Click to place on shirt"
                            >
                              <img
                                src={file.thumbnail_url || file.file_url || file.preview_url}
                                alt="Artwork"
                                className="w-full h-full object-contain p-1 bg-gray-900"
                              />
                              {hasAssigned ? (
                                <div className="absolute top-1 right-1 bg-[#FF6D1F] text-white p-0.5 rounded-full shadow">
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
                    ) : (
                      <p className="text-xs text-gray-500 py-6 text-center">
                        No artwork uploaded yet. Upload one above!
                      </p>
                    )}
                  </div>

                  {/* Alignment & Helper Controls (When a design is placed) */}
                  {(() => {
                    const hasAssigned = designFiles.find((d) => d.placement === activePlacement);
                    if (!hasAssigned) {
                      return (
                        <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/20 text-xs text-orange-300 flex items-center gap-2">
                          <Info className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <span>👆 Click any artwork above to place it on the {getPlacementLabel(activePlacement)}. You can see it appear on the shirt preview instantly!</span>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3.5 bg-black/50 border border-green-500/20 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-green-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Design placed on {getPlacementLabel(activePlacement)} ✓
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDesign(activePlacement)}
                            className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="text-[10px] text-gray-400 mb-1">Quick Alignment:</div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCenterDesign("center")}
                            className="px-2 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-semibold text-gray-200 transition-colors cursor-pointer text-center"
                          >
                            Center
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCenterDesign("top-center")}
                            className="px-2 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-semibold text-gray-200 transition-colors cursor-pointer text-center"
                          >
                            Top
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCenterDesign("bottom-center")}
                            className="px-2 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 rounded-lg text-xs font-semibold text-gray-200 transition-colors cursor-pointer text-center"
                          >
                            Bottom
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleRemoveDesignBackground}
                          disabled={!selectedDesignFile || isRemovingBackground}
                          className="w-full px-3 py-1.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 hover:border-orange-500/60 rounded-xl text-xs font-bold text-orange-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                          <span>{isRemovingBackground ? "Removing Background..." : "✨ AI Remove Background"}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* RIGHT: Live Canvas Preview (always visible) */}
                <div className="space-y-2 w-full min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Live Preview</span>
                    <span className="text-[11px] text-gray-400">Drag to resize · Click to select</span>
                  </div>

                  <div className="bg-black/90 rounded-3xl border border-white/10 flex flex-col items-center justify-center min-h-[420px] relative w-full">
                    {/* Active Placement Badge */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-white bg-black/70 border border-white/10 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                        {getPlacementLabel(activePlacement)}
                      </span>
                      {designFiles.some((d) => d.placement === activePlacement) ? (
                        <span className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Check className="w-2.5 h-2.5" /> Design Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">
                          Waiting for artwork
                        </span>
                      )}
                    </div>

                    {/* The Interactive Canvas */}
                    <div className="w-full flex items-center justify-center pt-4">
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
                      />
                    </div>


                    <div className="pt-3 text-[11px] text-gray-400 text-center">
                      Drag corners to resize · Move design anywhere on the shirt
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2 Navigation Footer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="w-full sm:w-auto text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back: Step 1 (Variants)</span>
                </button>

                <Button
                  type="button"
                  onClick={() => {
                    const hasExistingImages = isEditing && (mockupUrls?.length > 0 || (selectedProduct?.images && selectedProduct.images.length > 0));
                    if (designFiles.length === 0 && !hasExistingImages) {
                      toast.error("Please upload or select an artwork for your shirt");
                      return;
                    }
                    goToStep(3);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-[#FF6D1F] hover:from-orange-400 hover:to-[#FF7A1A] text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next: Title & Price (Step 3)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: TITLE, STORY & PROFIT - EMERALD GREEN THEME
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 3 || viewMode === "all") && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 3 Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-black font-black text-lg flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Step 3 of 4</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">Storefront & Pricing</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-clash text-white">Title, Story & Creator Profit</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-300 self-start sm:self-auto">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Profit: {creatorMarkup}%</span>
                </div>
              </div>

              {/* Section 6: Storefront Details Form */}
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
                        data-lenis-prevent
                        value={productForm.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        onWheel={(e) => e.stopPropagation()}
                        rows={4}
                        placeholder="Describe your design and brand story... Must be at least 20 characters."
                        className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all overflow-y-auto resize-y min-h-[110px] max-h-[300px] ${formErrors.description ? "border-red-500/50 bg-red-500/5" : "border-white/10"
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

                      {/* Required Tag Selector */}
                      <div className="space-y-2">
                        <label className="block text-xs sm:text-sm font-semibold text-gray-300">
                          Select Tag <span className="text-red-400">*</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "Trending", label: "Trending", icon: "📈", color: "border-purple-500/50 bg-purple-500/10 text-purple-300" },
                            { id: "New", label: "New", icon: "✨", color: "border-blue-500/50 bg-blue-500/10 text-blue-300" },
                            { id: "Popular", label: "Popular", icon: "🔥", color: "border-red-500/50 bg-red-500/10 text-red-300" },
                          ].map((tagItem) => {
                            const isSelected = productForm.tags && productForm.tags.includes(tagItem.id);
                            return (
                              <button
                                key={tagItem.id}
                                type="button"
                                onClick={() => {
                                  handleInputChange("tags", [tagItem.id]);
                                  if (formErrors.tags) {
                                    setFormErrors((prev) => ({ ...prev, tags: "" }));
                                  }
                                }}
                                className={`py-3 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${isSelected
                                  ? `${tagItem.color} ring-2 ring-orange-500/50 shadow-lg scale-[1.02]`
                                  : "bg-black/60 border-white/10 text-gray-400 hover:border-white/30 hover:text-white"
                                  }`}
                              >
                                <span>{tagItem.icon}</span>
                                <span>{tagItem.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {formErrors.tags && <p className="text-xs text-red-400 mt-1">{formErrors.tags}</p>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* In-Step Creator Markup & Profit Calculator */}
              <div className="p-5 sm:p-6 bg-gradient-to-br from-gray-900 to-black rounded-3xl border border-emerald-500/30 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Percent className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Your Creator Profit Markup</h4>
                      <p className="text-xs text-gray-400">Slide to choose how much profit you earn on each sale</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                      {creatorMarkup}%
                    </span>
                    <span className="text-[10px] text-gray-500 block">Your Margin</span>
                  </div>
                </div>

                <div className="px-2">
                  <Slider
                    value={creatorMarkup}
                    min={0}
                    max={100}
                    step={1}
                    onChange={handleCreatorMarkupChange}
                    sx={creatorSliderSx}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs font-semibold text-gray-400 mr-2">Quick Presets:</span>
                  {CREATOR_MARKUP_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleCreatorPresetClick(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${creatorMarkup === preset
                        ? "bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20"
                        : "bg-black/60 text-gray-400 border-white/10 hover:border-emerald-500/40 hover:text-white"
                        }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-3 border-t border-white/10">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider block">Printify Premium</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-300">
                      {hasPriceRange ? `$${pricingRange.min.toFixed(2)} - $${pricingRange.max.toFixed(2)}` : `$${pricingRange.min.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Loka Base Cost</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-300">
                      {hasPriceRange ? `$${platformMinSellingPrice.toFixed(2)} - $${platformMaxSellingPrice.toFixed(2)}` : `$${platformMinSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Your Profit (+{creatorMarkup}%)</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-400">
                      +{hasPriceRange
                        ? `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)} - $${(maxSellingPrice - platformMaxSellingPrice).toFixed(2)}`
                        : `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)}`}
                    </span>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Customer Retail Price</span>
                    <span className="text-xs sm:text-sm font-extrabold text-white">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3 Navigation Footer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goToStep(2)}
                  className="w-full sm:w-auto text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back: Step 2 (Artwork)</span>
                </button>

                <Button
                  type="button"
                  onClick={() => {
                    if (!productForm.name.trim()) {
                      toast.error("Please enter a product title");
                      return;
                    }
                    if (!productForm.description.trim() || productForm.description.trim().length < 20) {
                      toast.error("Please enter a description (at least 20 characters)");
                      return;
                    }
                    if (!productForm.category) {
                      toast.error("Please select a marketplace category");
                      return;
                    }
                    if (!productForm.tags || productForm.tags.length === 0) {
                      toast.error("Please select a tag (Trending, New, or Popular)");
                      return;
                    }
                    goToStep(4);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-extrabold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Next: Review & Launch (Step 4)</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 4: REVIEW & LAUNCH LIVE - ROYAL PURPLE THEME
             ═══════════════════════════════════════════════════════════════ */}
          {(activeStep === 4 || viewMode === "all") && (
            <div className="space-y-6 animate-fadeIn">
              {/* Step 4 Header Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-500/15 via-indigo-500/10 to-transparent border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500 text-white font-black text-lg flex items-center justify-center shadow-lg shadow-purple-500/25 flex-shrink-0">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-purple-400">Step 4 of 4</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-400">Launch to Marketplace</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold font-clash text-white">Review & Publish Live</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-300 self-start sm:self-auto">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{validationSummary.allValid ? "All Systems Go! 🚀" : "Review Checklist Below"}</span>
                </div>
              </div>

              {/* Quick Step Summary Cards with Instant Edit Buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1 Recap */}
                <div className="bg-black/40 border border-sky-500/20 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-sky-400" /> Step 1: Variants
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(1)}
                        className="text-xs font-bold text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 mt-2 font-medium">
                      {selectedColors.length > 0 ? selectedColors.join(", ") : "No colors"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {selectedSizes.length > 0 ? selectedSizes.join(", ") : "No sizes"}
                    </p>
                  </div>
                </div>

                {/* Step 2 Recap */}
                <div className="bg-black/40 border border-orange-500/20 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-400" /> Step 2: Artwork
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(2)}
                        className="text-xs font-bold text-orange-400 hover:text-orange-300 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 mt-2 font-medium">
                      {designFiles.length} print area(s) configured
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {mockupUrls.length > 0 ? `${mockupUrls.length} mockups generated` : "Outlines loaded"}
                    </p>
                  </div>
                </div>

                {/* Step 3 Recap */}
                <div className="bg-black/40 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" /> Step 3: Details & Price
                      </span>
                      <button
                        type="button"
                        onClick={() => goToStep(3)}
                        className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-xs text-gray-300 mt-2 font-medium truncate">
                      {productForm.name || "Untitled Product"}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      Retail: {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`} ({creatorMarkup}% Markup)
                    </p>
                  </div>
                </div>
              </div>

              {/* Realistic Product Mockup Studio Card */}
              <div className="p-5 sm:p-6 bg-gray-900/50 rounded-3xl border border-white/10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2 font-clash">
                      <Sparkles className="w-5 h-5 text-[#FF6D1F]" />
                      High-Quality Product Mockups
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Preview realistic 3D angles and choose your storefront cover photo.
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleManualRegenerate}
                    disabled={isGeneratingPreview || designFiles.length === 0 || cooldown > 0}
                    className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs py-2 px-4 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingPreview ? "Generating..." : cooldown > 0 ? `Wait ${cooldown}s` : "Regenerate Previews"}
                  </Button>
                </div>

                {mockupStatus && (
                  <div className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center gap-2 text-xs text-gray-300">
                    <Info className="w-4 h-4 text-[#FF6D1F] flex-shrink-0" />
                    <span>{mockupStatus}</span>
                  </div>
                )}

                {/* View Mode Bar */}
                <div className="flex items-center justify-between bg-black/60 p-2 rounded-2xl border border-white/10">
                  <div className="flex border border-white/10 rounded-xl p-1 bg-black/60">
                    <button
                      type="button"
                      onClick={() => setMockupViewMode("360")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${mockupViewMode === "360" ? "bg-[#FF6D1F] text-white" : "text-gray-400 hover:text-white"
                        }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>360° Spin View</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMockupViewMode("grid")}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${mockupViewMode === "grid" ? "bg-[#FF6D1F] text-white" : "text-gray-400 hover:text-white"
                        }`}
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>Grid & Reorder</span>
                    </button>
                  </div>

                  <Button
                    type="button"
                    onClick={() => customFileInputRef.current?.click()}
                    disabled={isUploadingCustomImage}
                    className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl border border-white/10 cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 mr-1" />
                    <span>Upload Custom Photo</span>
                  </Button>
                </div>

                {/* Mockup Display */}
                {isGeneratingPreview ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 text-[#FF6D1F] animate-spin mx-auto" />
                    <p className="text-sm font-bold text-white">Rendering mockups...</p>
                  </div>
                ) : getEffectiveMockups().length > 0 ? (
                  mockupViewMode === "360" ? (
                    <div className="max-w-md mx-auto">
                      <Product360Viewer
                        mockupUrls={getEffectiveMockups()}
                        images={selectedProduct?.images || []}
                        defaultImage={selectedProduct?.image || (variants.length > 0 ? variants[0]?.image : undefined)}
                        productName={selectedProduct?.title || selectedProduct?.name}
                        designFiles={designFiles}
                        activePlacement={activePlacement}
                        onPlacementChange={setActivePlacement}
                        activeColorHex={activeColorHex}
                        supportedPlacements={getSupportedPlacements()}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 p-2.5 rounded-xl flex items-center gap-2">
                        <Star className="w-4 h-4 text-orange-400 fill-orange-400 flex-shrink-0" />
                        <span>Image <strong>#1 (★ COVER)</strong> is the primary storefront thumbnail. Drag cards or use buttons to reorder.</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {getEffectiveMockups().map((m: any, index: number) => {
                          const isCover = index === 0;
                          return (
                            <div
                              key={m.id || m.url || index}
                              draggable
                              onDragStart={(e) => handleImageDragStart(e, index)}
                              onDragOver={(e) => handleImageDragOver(e, index)}
                              onDrop={(e) => handleImageDrop(e, index)}
                              onDragEnd={handleImageDragEnd}
                              className={`border rounded-2xl overflow-hidden aspect-square p-2 bg-black/60 relative cursor-grab flex flex-col justify-between ${isCover ? "border-[#FF6D1F] ring-2 ring-orange-500/40 shadow-lg" : "border-white/10"
                                }`}
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                {isCover ? (
                                  <span className="bg-[#FF6D1F] text-white px-2 py-0.5 rounded-full font-bold">COVER ★</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSetAsCover(index)}
                                    className="text-gray-400 hover:text-white bg-black/60 px-1.5 py-0.5 rounded cursor-pointer"
                                  >
                                    Set Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="text-red-400 hover:text-red-300 p-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <img src={m.url} alt="Mockup" className="w-full h-28 object-contain my-auto" />
                              <div className="flex items-center justify-between text-[10px] text-gray-400">
                                <span className="truncate max-w-[100px]">{m.title || `View ${index + 1}`}</span>
                                <GripVertical className="w-3 h-3" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-12 text-center text-xs text-gray-400">
                    No mockups loaded yet. Click "Regenerate Previews" to fetch high-resolution mockups.
                  </div>
                )}
              </div>

              {/* Section 7: Review & Validation Summary */}
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

              {/* Big Launch Call To Action Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-purple-950/40 via-gray-900 to-black border border-purple-500/40 space-y-4 shadow-2xl">
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
                  <div className="text-right hidden sm:block">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Your Price</div>
                    <div className="text-xl font-black text-white">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handlePublishSubmit}
                  disabled={isPublishing || !validationSummary.allValid}
                  className="w-full bg-gradient-to-r from-purple-600 via-[#FF6D1F] to-orange-500 hover:opacity-95 text-white font-extrabold text-base py-4 rounded-2xl transition-all shadow-[0_0_30px_rgba(255,109,31,0.35)] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isPublishing ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{isEditing ? "Saving Changes..." : "Publishing to Marketplace..."}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span>{isEditing ? "Update Product Now" : "🚀 Publish Live to Marketplace"}</span>
                    </div>
                  )}
                </Button>
              </div>

              {/* Step 4 Navigation Footer */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-900/60 border border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(3)}
                  className="text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 font-semibold text-xs sm:text-sm px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back: Step 3 (Details & Price)</span>
                </button>

                <span className="text-xs text-gray-500 hidden sm:inline">
                  Step 4 of 4: Final Step
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Sticky Right Sidebar (Desktop) */}
        <div className="hidden lg:block">
          <div className="sticky top-[110px] space-y-6">

            {/* Desktop Step Progress Mini Card */}
            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Creation Progress</span>
                <span className="text-xs font-extrabold text-[#FF6D1F]">Step {activeStep} of 4</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
                <div className={`rounded-full transition-all ${activeStep >= 1 ? "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" : "bg-white/10"}`} />
                <div className={`rounded-full transition-all ${activeStep >= 2 ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" : "bg-white/10"}`} />
                <div className={`rounded-full transition-all ${activeStep >= 3 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-white/10"}`} />
                <div className={`rounded-full transition-all ${activeStep >= 4 ? "bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" : "bg-white/10"}`} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="truncate">{activeStep === 1 ? "🎨 1. Colors & Sizes" : activeStep === 2 ? "🖌️ 2. Add Artwork" : activeStep === 3 ? "🏷️ 3. Title & Price" : "🚀 4. Review & Go Live"}</span>
                {activeStep < 4 && (
                  <button
                    type="button"
                    onClick={() => goToStep(activeStep + 1)}
                    className="text-[#FF6D1F] hover:underline font-bold ml-2 flex-shrink-0 cursor-pointer"
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>

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
                supportedPlacements={getSupportedPlacements()}
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
                    <div className="text-right">
                      <span className="text-3xl font-extrabold text-orange-400 tabular-nums block">
                        {creatorMarkup}%
                      </span>
                    </div>
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
                      {CREATOR_MARKUP_PRESETS.map((preset) => {
                        const isActive = creatorMarkup === preset;

                        return (
                          <button
                            key={preset}
                            onClick={() => handleCreatorPresetClick(preset)}
                            className={`px-2 py-1 rounded-md text-[10px] font-bold border transition-all ${isActive
                              ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_8px_rgba(255,109,31,0.35)] cursor-pointer'
                              : 'bg-gray-900 text-gray-400 border-white/5 hover:border-orange-500/25 hover:text-gray-200 cursor-pointer'
                              }`}
                          >
                            {preset}%
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Pricing Summary & Clean Creator Breakdown */}
                <div className="mt-4 bg-black/60 border border-white/5 p-4 rounded-2xl space-y-2.5 text-[11px] backdrop-blur-md">

                  <div className="flex justify-between items-center text-gray-400 font-medium">
                    <span>Loka Base Cost</span>
                    <span className="text-orange-400 font-semibold">
                      {hasPriceRange ? `$${platformMinSellingPrice.toFixed(2)} - $${platformMaxSellingPrice.toFixed(2)}` : `$${platformMinSellingPrice.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-gray-400 font-medium">
                    <span>Creator Markup ({creatorMarkup}%)</span>
                    <span className="text-green-400 font-semibold">
                      +{hasPriceRange
                        ? `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)} - $${(maxSellingPrice - platformMaxSellingPrice).toFixed(2)}`
                        : `$${(minSellingPrice - platformMinSellingPrice).toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-white/10 mt-1 font-extrabold text-white text-xs">
                    <span>Product Cost</span>
                    <span className="text-white text-sm">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              </div>

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
              onClick={() => goToStep(activeStep + 1)}
              className="h-9 bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs px-3.5 rounded-xl flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,109,31,0.3)] cursor-pointer transition-all"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Button
              onClick={handlePublishSubmit}
              disabled={isPublishing || !validationSummary.allValid}
              className="h-9 bg-gradient-to-r from-purple-600 to-[#FF6D1F] text-white font-extrabold text-xs px-3.5 rounded-xl shadow-[0_0_12px_rgba(255,109,31,0.4)] disabled:opacity-50"
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
