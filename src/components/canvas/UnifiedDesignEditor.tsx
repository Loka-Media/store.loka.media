/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { printfulAPI } from "@/lib/api";
import Image from "next/image";
import { Rnd } from "react-rnd";
import {
  Home,
  Upload,
  Type,
  Smile,
  Zap,
  Check,
  CloudUpload,
  X,
  Move,
  Settings,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Eye,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface PrintFile {
  printfile_id: number;
  width: number;
  height: number;
  dpi: number;
  fill_mode: string;
  can_rotate: boolean;
}

interface PrintFilesData {
  product_id: number;
  available_placements: Record<string, string>;
  printfiles: PrintFile[];
  variant_printfiles: Array<{
    variant_id: number;
    placements: Record<string, number>;
  }>;
  option_groups?: string[];
  options?: string[];
}

interface DesignFile {
  id: number;
  filename: string;
  url: any;
  type: "design";
  placement: string;
  position: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
    limit_to_print_area: boolean;
  };
}

interface Product {
  id: number;
  title: string;
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

interface UploadedFile {
  id: number;
  filename: string;
  thumbnail_url?: any;
  file_url?: any;
  [key: string]: unknown;
}

interface UnifiedDesignEditorProps {
  selectedProduct: Product;
  selectedVariants: number[];
  setSelectedVariants: (variants: number[]) => void;
  designFiles: DesignFile[];
  setDesignFiles: (files: DesignFile[]) => void;
  uploadedFiles: UploadedFile[];
  printFiles: PrintFilesData | null;
  onGeneratePreview: (advancedOptions?: {
    technique?: string;
    optionGroups?: string[];
    options?: string[];
    lifelike?: boolean;
    width?: number;
  }) => void;
  isGeneratingPreview: boolean;
  mockupUrls?: Array<{
    url: string;
    placement: string;
    variant_ids: number[];
    title?: string;
    option?: string;
    option_group?: string;
  }>;
  mockupStatus?: string;
  onNext?: () => void;
  onPrev?: () => void;
  onPrintFilesLoaded?: (printFiles: PrintFilesData) => void;
  onRefreshFiles?: () => void;
}

type TabType = "product" | "upload" | "text" | "clipart" | "placement" | "position" | "advanced";

const UnifiedDesignEditor: React.FC<UnifiedDesignEditorProps> = ({
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
  onNext,
  onPrev,
  onPrintFilesLoaded,
  onRefreshFiles,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("product");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activePlacement, setActivePlacement] = useState<string>("front");
  const [selectedDesignFile, setSelectedDesignFile] = useState<DesignFile | null>(null);
  const [loadingPrintFiles, setLoadingPrintFiles] = useState(false);
  const [printFilesLoaded, setPrintFilesLoaded] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string>("DTG printing");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>("");
  const [currentMockupIndex, setCurrentMockupIndex] = useState(0);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [childPanelOpen, setChildPanelOpen] = useState(false);
  const [childPanelContent, setChildPanelContent] = useState<string>("");
  
  // Advanced mockup options
  const [advancedOptions, setAdvancedOptions] = useState({
    width: 1600,
    lifelike: true,
    optionGroups: [] as string[],
    options: [] as string[],
  });

  // Get unique sizes and colors
  const uniqueSizes = [
    ...new Set(selectedProduct?.variants?.map((v) => v.size) || []),
  ];
  const colorMap = new Map();
  selectedProduct?.variants?.forEach((v) => {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, {
        name: v.color,
        code: v.color_code,
        image: v.image,
      });
    }
  });
  const uniqueColors = Array.from(colorMap.values());

  // Auto-select all sizes and first color on product load
  useEffect(() => {
    if (selectedProduct?.variants && uniqueSizes.length > 0 && selectedSizes.length === 0) {
      setSelectedSizes(uniqueSizes);
    }
    if (uniqueColors.length > 0 && selectedColors.length === 0) {
      setSelectedColors([uniqueColors[0].name]);
    }
  }, [selectedProduct, uniqueSizes, uniqueColors, selectedSizes.length, selectedColors.length]);

  // Show live preview when colors are selected
  useEffect(() => {
    if (selectedColors.length > 0) {
      setShowLivePreview(true);
    }
  }, [selectedColors]);

  // Update selected variants when size/color changes
  useEffect(() => {
    if (!selectedProduct?.variants) return;

    const filteredVariants = selectedProduct.variants.filter(
      (variant) =>
        selectedSizes.includes(variant.size) &&
        selectedColors.includes(variant.color)
    );

    setSelectedVariants(filteredVariants.map((v) => v.id));
  }, [selectedSizes, selectedColors, selectedProduct, setSelectedVariants]);

  // Auto-load print files when variants are selected with technique parameter
  useEffect(() => {
    const loadPrintFiles = async () => {
      if (
        selectedVariants.length === 0 ||
        !selectedProduct?.id ||
        printFilesLoaded ||
        loadingPrintFiles
      ) {
        return;
      }

      try {
        setLoadingPrintFiles(true);

        // Get the technique parameter for API call
        const techniqueParam = selectedTechnique === "DTG printing" ? "DTFILM" : selectedTechnique.toUpperCase();

        const printFilesResponse = await printfulAPI.getPrintFiles(
          selectedProduct.id,
          techniqueParam
        );

        if (printFilesResponse?.result) {
          onPrintFilesLoaded?.(printFilesResponse.result);
          setPrintFilesLoaded(true);
          toast.success("Print files loaded!");
        }
      } catch (error) {
        console.error("Failed to load print files:", error);
        toast.error("Failed to load print files");
      } finally {
        setLoadingPrintFiles(false);
      }
    };

    if (
      selectedVariants.length > 0 &&
      !printFilesLoaded &&
      !loadingPrintFiles
    ) {
      loadPrintFiles();
    }
  }, [
    selectedVariants.length,
    selectedProduct?.id,
    printFilesLoaded,
    loadingPrintFiles,
    selectedTechnique,
    onPrintFilesLoaded,
  ]);

  // Placement tabs configuration
  const placementTabs = printFiles
    ? Object.entries(printFiles.available_placements).map(([key, label]) => ({
        id: key,
        label: label,
        hasDesign: designFiles.some((df) => df.placement === key),
      }))
    : [];

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setIsUploading(true);
      const result = await printfulAPI.uploadFileDirectly(file);

      if (result.code === 200) {
        if (onRefreshFiles) {
          onRefreshFiles();
        }
        toast.success(`✅ File "${file.name}" uploaded successfully!`);
      } else {
        toast.error("Failed to upload file");
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle adding design to placement
  const handleAddDesign = (file: UploadedFile, placement: string): void => {
    const printFile = printFiles?.printfiles.find((pf) => {
      const variantPrintFile = printFiles.variant_printfiles.find((vp) =>
        selectedVariants.includes(vp.variant_id)
      );
      return (
        variantPrintFile &&
        pf.printfile_id === variantPrintFile.placements[placement]
      );
    });

    if (!printFile) {
      toast.error("No print file found for this placement");
      return;
    }

    const existingDesign = designFiles.find((df) => df.placement === placement);
    if (existingDesign) {
      toast.error(`${placement} already has a design`);
      return;
    }

    const defaultWidth = Math.min(printFile.width * 0.6, printFile.width);
    const defaultHeight = Math.min(printFile.height * 0.6, printFile.height);

    const newDesign: DesignFile = {
      id: Date.now(),
      filename: file.filename,
      url: file.thumbnail_url || file.file_url,
      type: "design",
      placement,
      position: {
        area_width: printFile.width,
        area_height: printFile.height,
        width: defaultWidth,
        height: defaultHeight,
        top: (printFile.height - defaultHeight) / 2,
        left: (printFile.width - defaultWidth) / 2,
        limit_to_print_area: true,
      },
    };

    setDesignFiles([...designFiles, newDesign]);
    setActivePlacement(placement);
    setSelectedDesignFile(newDesign);
    toast.success(`Design added to ${placement}`);
  };

  // Get active design for current placement
  const activeDesign = designFiles.find((df) => df.placement === activePlacement);

  // Get print file dimensions for active placement
  const getActivePrintFile = () => {
    if (!printFiles || selectedVariants.length === 0) return null;

    const variantPrintFile = printFiles.variant_printfiles.find((vp) =>
      selectedVariants.includes(vp.variant_id)
    );

    if (!variantPrintFile) return null;

    const printFileId = variantPrintFile.placements[activePlacement];
    return printFiles.printfiles.find((pf) => pf.printfile_id === printFileId);
  };

  const activePrintFile = getActivePrintFile();

  // Handle position updates
  const updateDesignPosition = (
    designId: number,
    updates: Partial<DesignFile["position"]>
  ): void => {
    setDesignFiles(
      designFiles.map((df) =>
        df.id === designId
          ? { ...df, position: { ...df.position, ...updates } }
          : df
      )
    );

    if (selectedDesignFile?.id === designId) {
      setSelectedDesignFile({
        ...selectedDesignFile,
        position: { ...selectedDesignFile.position, ...updates },
      });
    }
  };

  // Handle removing design
  const handleRemoveDesign = (designId: number) => {
    setDesignFiles(designFiles.filter((df) => df.id !== designId));
    if (selectedDesignFile?.id === designId) {
      setSelectedDesignFile(null);
    }
    toast.success("Design removed");
  };

  // Quick position presets
  const applyQuickPosition = (position: string) => {
    if (!activeDesign || !activePrintFile) return;

    const { width, height } = activeDesign.position;
    const { width: areaWidth, height: areaHeight } = activePrintFile;

    let newPosition = { ...activeDesign.position };

    switch (position) {
      case "center":
        newPosition.left = (areaWidth - width) / 2;
        newPosition.top = (areaHeight - height) / 2;
        break;
      case "top-left":
        newPosition.left = 0;
        newPosition.top = 0;
        break;
      case "top-center":
        newPosition.left = (areaWidth - width) / 2;
        newPosition.top = 0;
        break;
      case "top-right":
        newPosition.left = areaWidth - width;
        newPosition.top = 0;
        break;
      case "center-left":
        newPosition.left = 0;
        newPosition.top = (areaHeight - height) / 2;
        break;
      case "center-right":
        newPosition.left = areaWidth - width;
        newPosition.top = (areaHeight - height) / 2;
        break;
      case "bottom-left":
        newPosition.left = 0;
        newPosition.top = areaHeight - height;
        break;
      case "bottom-center":
        newPosition.left = (areaWidth - width) / 2;
        newPosition.top = areaHeight - height;
        break;
      case "bottom-right":
        newPosition.left = areaWidth - width;
        newPosition.top = areaHeight - height;
        break;
    }

    updateDesignPosition(activeDesign.id, newPosition);
    toast.success(`Design positioned to ${position.replace("-", " ")}`);
  };

  // Handle child panel opening
  const openChildPanel = (content: string) => {
    setChildPanelContent(content);
    setChildPanelOpen(true);
  };

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "product":
        return (
          <div className="space-y-4">
            {/* Technique Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Technique</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setSelectedTechnique("DTG printing")}
                  className={`p-3 border rounded-lg text-sm font-medium text-left transition-colors ${
                    selectedTechnique === "DTG printing"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                      <div className="w-4 h-4 bg-white rounded"></div>
                    </div>
                    <span>DTG Printing</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedTechnique("Embroidery")}
                  className={`p-3 border rounded-lg text-sm font-medium text-left transition-colors ${
                    selectedTechnique === "Embroidery"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                      <div className="w-4 h-4 bg-white rounded"></div>
                    </div>
                    <span>Embroidery</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Color</h3>
                <button
                  onClick={() => openChildPanel("colors")}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {uniqueColors.slice(0, 4).map((color: any) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColors([color.name]);
                    }}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      selectedColors.includes(color.name)
                        ? "border-gray-900 scale-110"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    style={{ backgroundColor: color.code }}
                    title={color.name}
                  >
                    {selectedColors.includes(color.name) && (
                      <Check className="w-4 h-4 text-white mx-auto drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Size</h3>
                <button
                  onClick={() => openChildPanel("sizes")}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View All
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {uniqueSizes.slice(0, 4).map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSizes(
                        selectedSizes.includes(size)
                          ? selectedSizes.filter((s) => s !== size)
                          : [...selectedSizes, size]
                      );
                    }}
                    className={`px-3 py-2 border rounded-lg text-sm font-medium transition-all ${
                      selectedSizes.includes(size)
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case "upload":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Upload Design</h3>
            
            {/* Upload Area */}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`w-full flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploading
                    ? "border-gray-300 bg-gray-50 cursor-not-allowed"
                    : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
                    <span className="text-sm text-gray-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-8 h-8 text-blue-500 mb-2" />
                    <span className="text-sm font-medium text-blue-600">Upload or drop</span>
                    <span className="text-sm text-gray-500">your design here</span>
                  </>
                )}
              </label>
            </div>

            {/* Uploaded Files Grid */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-medium text-gray-700">Your Files</h4>
                  <button
                    onClick={() => openChildPanel("files")}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {uploadedFiles.slice(0, 4).map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                        <Image
                          src={file.thumbnail_url || file.file_url}
                          alt={file.filename}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => handleAddDesign(file, activePlacement)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <span className="text-white text-xs font-medium">Add</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-1 truncate">{file.filename}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Add Text</h3>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Text Content</label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter your text here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm">
                  <option>12px</option>
                  <option>14px</option>
                  <option>16px</option>
                  <option>18px</option>
                  <option>20px</option>
                  <option>24px</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
                <select className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm">
                  <option>Normal</option>
                  <option>Bold</option>
                  <option>Light</option>
                </select>
              </div>
            </div>

            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Add Text to Design
            </button>
          </div>
        );

      case "clipart":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Clipart Library</h3>
            <div className="grid grid-cols-3 gap-2">
              {/* Placeholder clipart items */}
              {Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <Smile className="w-6 h-6 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        );

      case "placement":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Select Placement</h3>
            
            {placementTabs.length > 0 ? (
              <div className="space-y-2">
                {placementTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActivePlacement(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                      activePlacement === tab.id
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.hasDesign && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select product variants to see available placements</p>
            )}
          </div>
        );

      case "position":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Position Control</h3>
            
            {activeDesign ? (
              <>
                {/* Pixel Position Controls */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-700">Pixel Position</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">X (px)</label>
                      <input
                        type="number"
                        value={Math.round(activeDesign.position.left)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updateDesignPosition(activeDesign.id, { left: value });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min={0}
                        max={activePrintFile?.width || 2000}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Y (px)</label>
                      <input
                        type="number"
                        value={Math.round(activeDesign.position.top)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updateDesignPosition(activeDesign.id, { top: value });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min={0}
                        max={activePrintFile?.height || 2000}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Width (px)</label>
                      <input
                        type="number"
                        value={Math.round(activeDesign.position.width)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 50;
                          updateDesignPosition(activeDesign.id, { width: value });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min={50}
                        max={activePrintFile?.width || 2000}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Height (px)</label>
                      <input
                        type="number"
                        value={Math.round(activeDesign.position.height)}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 50;
                          updateDesignPosition(activeDesign.id, { height: value });
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min={50}
                        max={activePrintFile?.height || 2000}
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Position Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-700">Quick Position</h4>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      'top-left', 'top-center', 'top-right',
                      'center-left', 'center', 'center-right',
                      'bottom-left', 'bottom-center', 'bottom-right'
                    ].map((position) => (
                      <button
                        key={position}
                        onClick={() => applyQuickPosition(position)}
                        className="aspect-square border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
                        title={position.replace('-', ' ')}
                      >
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Alignment Controls */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-700">Alignment</h4>
                  <div className="flex gap-1">
                    <button
                      onClick={() => applyQuickPosition('center-left')}
                      className="flex-1 px-2 py-2 border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors"
                    >
                      <AlignLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyQuickPosition('center')}
                      className="flex-1 px-2 py-2 border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors"
                    >
                      <AlignCenter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => applyQuickPosition('center-right')}
                      className="flex-1 px-2 py-2 border border-gray-200 rounded-lg flex items-center justify-center hover:border-blue-500 transition-colors"
                    >
                      <AlignRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Add a design to see position controls</p>
            )}
          </div>
        );

      case "advanced":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Advanced Mockup Options</h3>
            
            {/* Width Control */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Width (px)</label>
              <select
                value={advancedOptions.width}
                onChange={(e) => setAdvancedOptions({...advancedOptions, width: parseInt(e.target.value)})}
                className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value={800}>800px</option>
                <option value={1200}>1200px</option>
                <option value={1600}>1600px (Default)</option>
                <option value={2000}>2000px</option>
              </select>
            </div>

            {/* Lifelike Option */}
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-700">Lifelike Mockup</label>
              <button
                onClick={() => setAdvancedOptions({...advancedOptions, lifelike: !advancedOptions.lifelike})}
                className={`w-12 h-6 rounded-full transition-colors ${
                  advancedOptions.lifelike ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  advancedOptions.lifelike ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </button>
            </div>

            {/* Option Groups */}
            {printFiles?.option_groups && printFiles.option_groups.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Mockup Variations</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {printFiles.option_groups.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={advancedOptions.optionGroups.includes(option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdvancedOptions({
                              ...advancedOptions,
                              optionGroups: [...advancedOptions.optionGroups, option]
                            });
                          } else {
                            setAdvancedOptions({
                              ...advancedOptions,
                              optionGroups: advancedOptions.optionGroups.filter(g => g !== option)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded mr-2"
                      />
                      <span className="text-xs text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Options */}
            {printFiles?.options && printFiles.options.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Additional Options</label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {printFiles.options.map((option) => (
                    <label key={option} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={advancedOptions.options.includes(option)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAdvancedOptions({
                              ...advancedOptions,
                              options: [...advancedOptions.options, option]
                            });
                          } else {
                            setAdvancedOptions({
                              ...advancedOptions,
                              options: advancedOptions.options.filter(o => o !== option)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded mr-2"
                      />
                      <span className="text-xs text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Render child panel content
  const renderChildPanelContent = () => {
    switch (childPanelContent) {
      case "colors":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">All Colors</h4>
            <div className="grid grid-cols-3 gap-3">
              {uniqueColors.map((color: any) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColors([color.name]);
                    setChildPanelOpen(false);
                  }}
                  className={`w-16 h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                    selectedColors.includes(color.name)
                      ? "border-gray-900 scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color.code }}
                  title={color.name}
                >
                  {selectedColors.includes(color.name) && (
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  )}
                  <span className="text-xs text-white mt-1 drop-shadow-md font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "sizes":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">All Sizes</h4>
            <div className="grid grid-cols-3 gap-2">
              {uniqueSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setSelectedSizes(
                      selectedSizes.includes(size)
                        ? selectedSizes.filter((s) => s !== size)
                        : [...selectedSizes, size]
                    );
                  }}
                  className={`px-4 py-3 border rounded-lg text-sm font-medium transition-all ${
                    selectedSizes.includes(size)
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        );

      case "files":
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">All Files</h4>
            <div className="grid grid-cols-2 gap-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={file.thumbnail_url || file.file_url}
                      alt={file.filename}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={() => {
                      handleAddDesign(file, activePlacement);
                      setChildPanelOpen(false);
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                  >
                    <span className="text-white text-sm font-medium">Add to {activePlacement}</span>
                  </button>
                  <p className="text-xs text-gray-500 mt-2 truncate">{file.filename}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const tabs = [
    { id: "product" as TabType, label: "Product", icon: Home },
    { id: "upload" as TabType, label: "Upload", icon: Upload },
    { id: "text" as TabType, label: "Text", icon: Type },
    { id: "clipart" as TabType, label: "Clipart", icon: Smile },
    { id: "placement" as TabType, label: "Placement", icon: Zap },
    { id: "position" as TabType, label: "Position", icon: Move },
    { id: "advanced" as TabType, label: "Advanced", icon: Settings },
  ];

  return (
    <div className="h-screen bg-white flex">
      {/* Main Left Panel - Fixed Width */}
      <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
        {/* Product Info Header */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {selectedProduct?.title || selectedProduct?.name}
          </h1>
          <div className="flex items-center mt-1 text-sm text-gray-600">
            <span>⭐ 4.5 • 2475 Reviews</span>
          </div>
        </div>

        {/* Tab Navigation - Vertical */}
        <div className="border-b border-gray-200 flex-shrink-0">
          <nav className="flex flex-col">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center py-3 px-4 text-sm font-medium transition-colors border-b border-gray-100 last:border-b-0 ${
                    activeTab === tab.id
                      ? "text-blue-600 border-l-4 border-l-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {renderTabContent()}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0 space-y-2">
          <button
            onClick={() => setShowPreviewSheet(true)}
            className="w-full px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            Live Preview
          </button>
          <button
            onClick={() => {
              if (designFiles.length > 0 && selectedVariants.length > 0) {
                onGeneratePreview({
                  technique: selectedTechnique,
                  lifelike: advancedOptions.lifelike,
                  width: advancedOptions.width,
                  optionGroups: advancedOptions.optionGroups,
                  options: advancedOptions.options,
                });
              } else {
                toast.error("Add designs and select variants first");
              }
            }}
            disabled={designFiles.length === 0 || selectedVariants.length === 0 || isGeneratingPreview}
            className="w-full px-6 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPreview ? "Generating..." : "Generate Mockup"}
          </button>
        </div>
      </div>

      {/* Child Panel - Expandable */}
      {childPanelOpen && (
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Options</h3>
            <button
              onClick={() => setChildPanelOpen(false)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {renderChildPanelContent()}
          </div>
        </div>
      )}

      {/* Right Panel - Flexible */}
      <div className="flex-1 flex flex-col">
        {/* Preview Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {mockupUrls && mockupUrls.length > 0 ? "Generated Mockups" : "Canvas Preview"}
            </h2>
            <div className="text-sm text-gray-500">
              {selectedVariants.length} variants selected
            </div>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex">
          {/* Live Preview Canvas */}
          {(!mockupUrls || mockupUrls.length === 0 || showLivePreview) && (
            <div className={`${mockupUrls && mockupUrls.length > 0 ? 'flex-1' : 'flex-1'} bg-gray-50 flex items-center justify-center p-6`}>
              {showLivePreview && activePrintFile ? (
                <div className="relative max-w-lg">
                  {/* Product Background */}
                  {selectedColors.length > 0 && (
                    <Image
                      src={
                        selectedProduct?.variants?.find((v) =>
                          selectedColors.includes(v.color)
                        )?.image || "/placeholder-product.jpg"
                      }
                      alt="Product"
                      width={500}
                      height={500}
                      className="w-auto h-auto max-h-[60vh] object-contain"
                    />
                  )}

                  {/* Design Overlay */}
                  {!activeDesign && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 border-2 border-dashed border-blue-400 rounded-full bg-blue-50/80 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <CloudUpload className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                          <p className="text-blue-600 text-xs">Add Design</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Design */}
                  {activeDesign && activePrintFile && (
                    <div className="absolute inset-0">
                      <Rnd
                        size={{
                          width: (activeDesign.position.width / activePrintFile.width) * 500,
                          height: (activeDesign.position.height / activePrintFile.height) * 500,
                        }}
                        position={{
                          x: (activeDesign.position.left / activePrintFile.width) * 500,
                          y: (activeDesign.position.top / activePrintFile.height) * 500,
                        }}
                        bounds="parent"
                        onDragStop={(_, d) => {
                          const newLeft = (d.x * activePrintFile.width) / 500;
                          const newTop = (d.y * activePrintFile.height) / 500;
                          updateDesignPosition(activeDesign.id, {
                            left: Math.max(0, Math.min(newLeft, activePrintFile.width - activeDesign.position.width)),
                            top: Math.max(0, Math.min(newTop, activePrintFile.height - activeDesign.position.height)),
                          });
                        }}
                        onResizeStop={(_, __, ref, ___, position) => {
                          const newWidth = (parseFloat(ref.style.width) * activePrintFile.width) / 500;
                          const newHeight = (parseFloat(ref.style.height) * activePrintFile.height) / 500;
                          const newLeft = (position.x * activePrintFile.width) / 500;
                          const newTop = (position.y * activePrintFile.height) / 500;

                          updateDesignPosition(activeDesign.id, {
                            width: Math.max(50, Math.min(newWidth, activePrintFile.width)),
                            height: Math.max(50, Math.min(newHeight, activePrintFile.height)),
                            left: Math.max(0, Math.min(newLeft, activePrintFile.width - newWidth)),
                            top: Math.max(0, Math.min(newTop, activePrintFile.height - newHeight)),
                          });
                        }}
                        className="border-2 border-blue-500 bg-blue-500/10 cursor-move"
                        enableResizing={{
                          top: true,
                          right: true,
                          bottom: true,
                          left: true,
                          topRight: true,
                          bottomRight: true,
                          bottomLeft: true,
                          topLeft: true,
                        }}
                      >
                        <Image
                          src={activeDesign.url}
                          alt={activeDesign.filename}
                          fill
                          className="object-contain pointer-events-none"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveDesign(activeDesign.id);
                          }}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Rnd>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <CloudUpload className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium">Select colors to see live preview</p>
                  <p className="text-sm">Choose a color to get started</p>
                </div>
              )}
            </div>
          )}

          {/* Generated Mockups Carousel */}
          {mockupUrls && mockupUrls.length > 0 && (
            <div className="flex-1 bg-white border-l border-gray-200 flex flex-col">
              {/* Carousel Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Generated Mockups</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMockupIndex(Math.max(0, currentMockupIndex - 1))}
                    disabled={currentMockupIndex === 0}
                    className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-500">
                    {currentMockupIndex + 1} / {mockupUrls.length}
                  </span>
                  <button
                    onClick={() => setCurrentMockupIndex(Math.min(mockupUrls.length - 1, currentMockupIndex + 1))}
                    disabled={currentMockupIndex === mockupUrls.length - 1}
                    className="p-1 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowLivePreview(!showLivePreview)}
                    className="ml-2 px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {showLivePreview ? 'Hide' : 'Show'} Live Preview
                  </button>
                </div>
              </div>

              {/* Main Mockup Display */}
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-2xl max-h-full">
                  <Image
                    src={mockupUrls[currentMockupIndex]?.url}
                    alt={mockupUrls[currentMockupIndex]?.title || "Mockup"}
                    width={600}
                    height={600}
                    className="w-auto h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              </div>

              {/* Mockup Info */}
              <div className="p-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">
                    {mockupUrls[currentMockupIndex]?.title || 
                     `${mockupUrls[currentMockupIndex]?.placement} - ${mockupUrls[currentMockupIndex]?.option}`}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {mockupUrls[currentMockupIndex]?.placement} • {mockupUrls[currentMockupIndex]?.variant_ids.length} variants
                  </p>
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2 overflow-x-auto">
                  {mockupUrls.map((mockup, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentMockupIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentMockupIndex
                          ? "border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Image
                        src={mockup.url}
                        alt={mockup.title || "Mockup"}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onPrev}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Step 2 of 3 - Design Editor
            </span>
          </div>

          <button
            onClick={onNext}
            disabled={designFiles.length === 0 || mockupUrls.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Product Details
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Preview Sheet */}
      {showPreviewSheet && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Live Preview</h3>
              <button
                onClick={() => setShowPreviewSheet(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-center">
              {showLivePreview && activePrintFile ? (
                <div className="relative">
                  {/* Product Background */}
                  {selectedColors.length > 0 && (
                    <Image
                      src={
                        selectedProduct?.variants?.find((v) =>
                          selectedColors.includes(v.color)
                        )?.image || "/placeholder-product.jpg"
                      }
                      alt="Product"
                      width={600}
                      height={600}
                      className="w-auto h-auto max-h-[70vh] object-contain"
                    />
                  )}

                  {/* Active Design */}
                  {activeDesign && activePrintFile && (
                    <div className="absolute inset-0">
                      <div
                        style={{
                          position: 'absolute',
                          left: (activeDesign.position.left / activePrintFile.width) * 600,
                          top: (activeDesign.position.top / activePrintFile.height) * 600,
                          width: (activeDesign.position.width / activePrintFile.width) * 600,
                          height: (activeDesign.position.height / activePrintFile.height) * 600,
                        }}
                      >
                        <Image
                          src={activeDesign.url}
                          alt={activeDesign.filename}
                          fill
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 p-12">
                  <CloudUpload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg">No preview available</p>
                  <p className="text-sm">Add a design to see preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedDesignEditor;