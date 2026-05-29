/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { printfulAPI } from "@/lib/api";
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
  onGeneratePreview: (advancedOptions?: any) => Promise<void>;
  isGeneratingPreview: boolean;
  mockupUrls: any[];
  mockupStatus: string;
  onPrintFilesLoaded: (printFiles: any) => void;
  onRefreshFiles: () => void;
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
}

// Interactive 360-degree product preview spin viewer component
const Product360Viewer: React.FC<{
  mockupUrls: any[];
  defaultImage?: string;
  productName: string;
}> = ({ mockupUrls, defaultImage, productName }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartActiveIndex = useRef(0);

  // Logical order of views for smooth rotation: Front -> Right Sleeve -> Back -> Left Sleeve
  const sortedMockups = useMemo(() => {
    if (!mockupUrls || mockupUrls.length === 0) return [];
    const order = ["front", "right", "back", "left"];
    const result: any[] = [];
    
    const getPlacementType = (title: string) => {
      const t = title.toLowerCase();
      if (t.includes("front")) return "front";
      if (t.includes("back")) return "back";
      if (t.includes("right") || t.includes("sleeve_right")) return "right";
      if (t.includes("left") || t.includes("sleeve_left")) return "left";
      return "other";
    };
    
    const groups: Record<string, any[]> = { front: [], right: [], back: [], left: [], other: [] };
    mockupUrls.forEach((m) => {
      const type = getPlacementType(m.title || "");
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
    
    return result.length > 0 ? result : mockupUrls;
  }, [mockupUrls]);

  // Reset active view index when mockup set changes
  useEffect(() => {
    setActiveIndex(0);
  }, [sortedMockups.length]);

  if (sortedMockups.length === 0) {
    return (
      <div className="aspect-square bg-black/45 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative">
        {defaultImage ? (
          <img src={defaultImage} alt={productName} className="w-full h-full object-contain" />
        ) : (
          <ShoppingBag className="w-12 h-12 text-gray-700" />
        )}
      </div>
    );
  }

  const activeMockup = sortedMockups[activeIndex];

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
      setActiveIndex(newIndex);
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
      setActiveIndex(newIndex);
    }
  };

  const rotateLeft = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev - 1 + sortedMockups.length) % sortedMockups.length);
  };

  const rotateRight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev + 1) % sortedMockups.length);
  };

  return (
    <div className="space-y-3 w-full">
      <div 
        className={`aspect-square bg-black/45 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative group select-none cursor-grab active:cursor-grabbing transition-all duration-300 ${
          isDragging ? "border-[#FF6D1F]/50 shadow-[0_0_20px_rgba(255,109,31,0.15)]" : ""
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUpOrLeave}
      >
        {/* Mockup Image View */}
        <img 
          src={activeMockup.url} 
          alt={activeMockup.title || `Mockup ${activeIndex + 1}`} 
          className="w-full h-full object-contain pointer-events-none transition-transform duration-200"
        />

        {/* 360 Badge Overlay */}
        <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md border border-white/10 rounded-full py-1 px-3 flex items-center gap-1.5 shadow-lg pointer-events-none">
          <RotateCw className="w-3 h-3 text-[#FF6D1F] animate-spin" style={{ animationDuration: "8s" }} />
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-gray-200">360° Spin View</span>
        </div>

        {/* Manual Arrow Controls (Hover State) */}
        {sortedMockups.length > 1 && (
          <>
            <button
              onClick={rotateLeft}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/95 text-white rounded-full flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md focus:outline-none"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={rotateRight}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/95 text-white rounded-full flex items-center justify-center border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md focus:outline-none"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Interactive Gesture Helper Text overlay */}
        <div className="absolute bottom-3 inset-x-0 mx-auto w-max bg-black/65 backdrop-blur-sm border border-white/5 rounded-full py-0.5 px-3 text-[10px] text-gray-400 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
          Swipe or drag horizontally to rotate
        </div>
      </div>

      {/* active view title and dots */}
      {sortedMockups.length > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] sm:text-[11px] font-semibold text-gray-400 capitalize bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
            {activeMockup.title || "Product View"}
          </span>
          <div className="flex gap-1.5">
            {sortedMockups.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex 
                    ? "bg-[#FF6D1F] w-3" 
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
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
}) => {
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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string>("");
  const [availableTechniques, setAvailableTechniques] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Load saved local selections or default to first options
  useEffect(() => {
    if (uniqueColors.length > 0 && selectedColors.length === 0) {
      setSelectedColors([uniqueColors[0].name]);
    }
    if (uniqueSizes.length > 0 && selectedSizes.length === 0) {
      setSelectedSizes(uniqueSizes);
    }
  }, [uniqueColors, uniqueSizes]);

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
          const data = await printfulAPI.getPrintFiles(selectedProduct.id);
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

  // Pricing calculations
  const variants = useMemo(() => {
    return selectedProduct?.variants?.filter((v: any) => selectedVariants.includes(v.id)) || [];
  }, [selectedProduct, selectedVariants]);

  const variantPrices = useMemo(() => {
    return variants.map((v: any) => parseFloat(v.price || 0)).filter((p: number) => p > 0);
  }, [variants]);

  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 20;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 20;
  const hasPriceRange = minPrice !== maxPrice;

  const markup = parseFloat(productForm.markupPercentage) || 0;
  const minSellingPrice = minPrice * (1 + markup / 100);
  const maxSellingPrice = maxPrice * (1 + markup / 100);
  const avgProfit = ((minSellingPrice + maxSellingPrice) / 2) - ((minPrice + maxPrice) / 2);

  // Debounced auto mockup preview generator
  useEffect(() => {
    if (designFiles.length === 0 || selectedVariants.length === 0) return;
    
    const timer = setTimeout(() => {
      onGeneratePreview();
    }, 4500); // Debounce to allow user to finish positioning changes
    
    return () => clearTimeout(timer);
  }, [designFiles, selectedVariants]);

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
      for (const file of validFiles) {
        await printfulAPI.uploadFileDirectly(file);
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
      filename: file.filename,
      url: file.file_url || file.thumbnail_url || "",
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
    const checks = {
      variants: selectedVariants.length > 0,
      designs: designFiles.length > 0,
      aspectRatio: aspectRatioIssues.length === 0,
      mockups: mockupUrls && mockupUrls.length > 0,
      details: productForm.name.trim().length > 0 && productForm.description.trim().length >= 20,
    };
    return {
      ...checks,
      allValid: Object.values(checks).every(Boolean),
    };
  }, [selectedVariants, designFiles, aspectRatioIssues, mockupUrls, productForm]);

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
    };
    return svgs[placementId.toLowerCase()] || <FrontSVG className="w-5 h-5" />;
  };

  // Track viewer modes (360 interactive vs grid of all mockups)
  const [mockupViewMode, setMockupViewMode] = useState<"360" | "grid">("360");

  return (
    <div className="bg-[#050505] min-h-screen text-white relative pt-[30px] md:pt-[40px]">
      {/* Sticky Header with Product Info & Continue Button - offset by navbar height + 10px spacing */}
      <div className="sticky top-[90px] md:top-[98px] z-40 bg-black/80 backdrop-blur-md border-b border-white/10 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm sm:text-lg md:text-xl font-bold font-clash text-white line-clamp-1">
              {selectedProduct?.title || selectedProduct?.name}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400">
              SKU: {selectedProduct?.model || selectedProduct?.id} | {selectedProduct?.type_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePublishSubmit}
              disabled={isPublishing || !validationSummary.allValid}
              className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs sm:text-sm px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-[0_4px_20px_rgba(255,109,31,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPublishing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Publishing...</span>
                </div>
              ) : (
                "Publish Product"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 lg:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: Main PDP Customizer Workspace */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          
          {/* Section 1: Product Information */}
          <div className="gradient-border-white-top p-5 sm:p-6 bg-gray-900/60 rounded-3xl backdrop-blur-sm border border-white/5">
            <div className="flex flex-col md:flex-row gap-5">
              <div className="w-full md:w-1/3 aspect-square relative bg-black/40 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                {selectedProduct?.image || (variants.length > 0 && variants[0]?.image) ? (
                  <img
                    src={selectedProduct?.image || variants[0]?.image}
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
                <div className="text-xs sm:text-sm text-gray-400 font-medium line-clamp-3">
                  {selectedProduct?.description || "High-quality custom creator merchandise product. Select colors and sizes, add designs on print areas, and preview your premium storefront ready mockup."}
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
                1. Choose Variants (Colors & Sizes)
              </h3>
              {openAccordions.variants ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.variants && (
              <div className="space-y-6 pt-3 animate-fadeIn">
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
                          className={`relative border-2 rounded-full px-4 py-2 flex items-center gap-2 transition-all duration-300 ${
                            isSelected ? "border-white scale-105" : "border-transparent hover:border-white/30"
                          }`}
                          style={{ backgroundColor: color.code }}
                        >
                          <span
                            className="text-xs font-semibold whitespace-nowrap"
                            style={{
                              color:
                                color.code === "#ffffff" || color.code === "#fff" || color.code.toLowerCase() === "#fafafa"
                                  ? "#000"
                                  : "#fff",
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
                          className={`border-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 ${
                            isSelected
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
                2. Design Upload & Placement
              </h3>
              {openAccordions.design ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.design && (
              <div className="space-y-6 pt-3 animate-fadeIn">
                {/* Placement Cards */}
                <div className="space-y-3">
                  <label className="text-xs sm:text-sm font-semibold text-gray-300">Choose Placement Target</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["front", "back", "sleeve_left", "sleeve_right"].map((placement) => {
                      const isActive = activePlacement === placement;
                      const hasAssigned = designFiles.find((d) => d.placement === placement);
                      return (
                        <div
                          key={placement}
                          onClick={() => setActivePlacement(placement)}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all flex flex-col items-center justify-center gap-2 h-28 relative ${
                            isActive
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
                  className={`border-2 border-dashed rounded-3xl p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 ${
                    isDragging
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
                  <label className="text-xs sm:text-sm font-semibold text-gray-300">
                    Your Uploaded designs ({uploadedFiles.length})
                  </label>
                  {uploadedFiles.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                      {uploadedFiles.slice(0, 12).map((file) => {
                        const isAssigned = selectedFileId === file.id;
                        return (
                          <div
                            key={file.id}
                            onClick={() => handleAddDesign(file)}
                            className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all bg-black/50 ${
                              isAssigned ? "border-[#FF6D1F]" : "border-white/10 hover:border-white/30"
                            }`}
                          >
                            <img
                              src={file.thumbnail_url || file.file_url}
                              alt={file.filename}
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
                    <p className="text-xs text-gray-500">No uploaded files yet. Upload a design above to customize.</p>
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
                3. Live Position Editor
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
                4. Live Product Mockups
              </h3>
              {openAccordions.mockups ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>

            {openAccordions.mockups && (
              <div className="space-y-6 pt-3 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs sm:text-sm text-gray-400">
                    Mockups regenerate automatically when designs are saved.
                  </p>
                  <Button
                    onClick={() => onGeneratePreview()}
                    disabled={isGeneratingPreview || designFiles.length === 0}
                    className="bg-white/5 hover:bg-white/10 text-white font-semibold text-xs py-2 px-3 border border-white/10 rounded-lg self-start sm:self-auto"
                  >
                    {isGeneratingPreview ? "Generating..." : "Regenerate Previews"}
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
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        mockupViewMode === "360"
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
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                        mockupViewMode === "grid"
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
                  ) : mockupUrls && mockupUrls.length > 0 ? (
                    mockupViewMode === "360" ? (
                      <div className="max-w-md mx-auto">
                        <Product360Viewer
                          mockupUrls={mockupUrls}
                          defaultImage={selectedProduct?.image || (variants.length > 0 ? variants[0]?.image : undefined)}
                          productName={selectedProduct?.title || selectedProduct?.name}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4">
                        {mockupUrls.slice(0, 4).map((m: any, index: number) => (
                          <div
                            key={index}
                            className="border border-white/10 rounded-2xl overflow-hidden bg-black/40 hover:shadow-[0_10px_30px_rgba(255,109,31,0.1)] transition-all duration-300"
                          >
                            <img src={m.url} alt={m.title || `Mockup ${index + 1}`} className="w-full h-auto" />
                            <div className="bg-gray-900/80 p-2 text-center text-[10px] sm:text-xs text-gray-400 border-t border-white/5">
                              {m.title || "Product View"}
                            </div>
                          </div>
                        ))}
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
                5. Storefront Listing Details
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
                    className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all ${
                      formErrors.name ? "border-red-500/50 bg-red-500/5" : "border-white/10"
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
                    className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all resize-none ${
                      formErrors.description ? "border-red-500/50 bg-red-500/5" : "border-white/10"
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
                    <select
                      value={productForm.category}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      className={`w-full px-4 py-3 bg-black/60 border rounded-xl text-sm text-white focus:outline-none focus:border-[#FF6D1F] focus:ring-1 focus:ring-[#FF6D1F] transition-all ${
                        formErrors.category ? "border-red-500/50 bg-red-500/5" : "border-white/10"
                      }`}
                    >
                      <option value="" disabled>Select category</option>
                      <option value="apparel">Apparel</option>
                      <option value="accessories">Accessories</option>
                      <option value="home-living">Home & Living</option>
                      <option value="stationery">Stationery</option>
                      <option value="bags">Bags</option>
                      <option value="other">Other</option>
                    </select>
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
                6. Customization Review Checklist
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
                    <div className={`p-1.5 rounded-full ${validationSummary.aspectRatio ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                      {validationSummary.aspectRatio ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-bold">Aspect Ratio Correct</div>
                      <div className="text-[10px] text-gray-500">
                        {validationSummary.aspectRatio ? "All placements pass backend validation" : `${aspectRatioIssues.length} aspect ratio issue(s) need fixing`}
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
                        {validationSummary.mockups ? `${mockupUrls.length} view mockups ready` : "No mockups generated yet"}
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
                mockupUrls={mockupUrls}
                defaultImage={selectedProduct?.image || (variants.length > 0 ? variants[0]?.image : undefined)}
                productName={selectedProduct?.title || selectedProduct?.name}
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

              {/* Pricing Calculator */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-300">Markup Percentage</span>
                  <span className="text-sm font-bold text-[#FF6D1F]">{markup}%</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={markup}
                    onChange={(e) => handleInputChange("markupPercentage", e.target.value)}
                    className="w-full accent-[#FF6D1F] bg-gray-800 rounded-lg appearance-none cursor-pointer h-2"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[20, 30, 40, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleInputChange("markupPercentage", v.toString())}
                      className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
                        markup === v
                          ? "border-[#FF6D1F] bg-[#FF6D1F] text-white"
                          : "border-white/10 bg-white/5 text-gray-400 hover:bg-white/10"
                      }`}
                    >
                      {v}%
                    </button>
                  ))}
                </div>

                <div className="bg-black/60 border border-white/5 p-4 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg Base Cost:</span>
                    <span className="font-semibold text-white">
                      {hasPriceRange ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}` : `$${minPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Retail Price:</span>
                    <span className="font-bold text-white text-sm">
                      {hasPriceRange ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}` : `$${minSellingPrice.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/15 pt-2">
                    <span className="text-gray-300">Estimated Profit:</span>
                    <span className="font-extrabold text-green-400 text-sm">
                      +${avgProfit.toFixed(2)}
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
        <Button
          onClick={handlePublishSubmit}
          disabled={isPublishing || !validationSummary.allValid}
          className="bg-[#FF6D1F] hover:bg-[#FF7A1A] text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
        >
          {isPublishing ? "Publishing..." : "Publish Product"}
        </Button>
      </div>
    </div>
  );
};

export default UnifiedCanvasPDP;
