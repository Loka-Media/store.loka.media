/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { printfulAPI } from "@/lib/api";
import Image from "next/image";
import { Rnd } from "react-rnd";
import {
  Palette,
  Move,
  ZoomIn,
  ZoomOut,
  Eye,
  Trash2,
  Settings,
  Layers,
  ChevronRight,
  Upload,
} from "lucide-react";
import toast from "react-hot-toast";
import ImageModal from "../ui/ImageModal";

// Tab Content Components
import VariantsTabContent from "./tabs/VariantsTabContent";
import PlacementsTabContent from "./tabs/PlacementsTabContent";
import UploadTabContent from "./tabs/UploadTabContent";
import PositionTabContent from "./tabs/PositionTabContent";
import AdvancedTabContent from "./tabs/AdvancedTabContent";
import GenerateTabContent from "./tabs/GenerateTabContent";

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
  onNext: () => void;
  onPrev: () => void;
  onPrintFilesLoaded?: (printFiles: PrintFilesData) => void;
  onRefreshFiles?: () => void;
}

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
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activePlacement, setActivePlacement] = useState<string>("front");
  const [selectedDesignFile, setSelectedDesignFile] =
    useState<DesignFile | null>(null);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [loadingPrintFiles, setLoadingPrintFiles] = useState(false);
  const [printFilesLoaded, setPrintFilesLoaded] = useState(false);

  // Advanced mockup options state
  const [selectedTechnique, setSelectedTechnique] = useState<string>("");
  const [selectedOptionGroups, setSelectedOptionGroups] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [lifelikeEnabled, setLifelikeEnabled] = useState<boolean>(false);
  const [mockupWidth, setMockupWidth] = useState<number>(1000);

  // Tab management state
  const [activeTab, setActiveTab] = useState<string>("variants");

  // Modal state for image viewing
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);

  // File upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);

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
      setSelectedSizes(uniqueSizes); // Select all sizes
    }
    if (uniqueColors.length > 0 && selectedColors.length === 0) {
      setSelectedColors([uniqueColors[0].name]); // Select first color
    }
  }, [selectedProduct, uniqueSizes, uniqueColors, selectedSizes.length, selectedColors.length]);

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

  // Auto-load print files when variants are selected and switch to placements tab
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

        // Get print files using the API
        const printFilesResponse = await printfulAPI.getPrintFiles(
          selectedProduct.id
        );

        if (printFilesResponse?.result) {
          onPrintFilesLoaded?.(printFilesResponse.result);
          setPrintFilesLoaded(true);
          setActiveTab("placements"); // Auto switch to placements tab
          toast.success("Print files loaded! Now select placements.");
        } else {
          console.warn("No print files data received");
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
    onPrintFilesLoaded,
  ]);

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
    setActiveTab("position"); // Switch to position tab
    toast.success(`Design added to ${placement}`);
  };

  // Handle removing design
  const handleRemoveDesign = (designId: number) => {
    setDesignFiles(designFiles.filter((df) => df.id !== designId));
    if (selectedDesignFile?.id === designId) {
      setSelectedDesignFile(null);
    }
    toast.success("Design removed");
  };

  // Handle position updates
  const updateDesignPosition = (
    designId: number,
    updates: Partial<DesignFile["position"]>
  ): void => {
    console.log("Updating design position:", designId, updates);

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

  // Get active design for current placement
  const activeDesign = designFiles.find(
    (df) => df.placement === activePlacement
  );

  // Handle modal opening
  const openImageModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    setIsModalOpen(true);
  };

  // Handle file upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setIsUploading(true);
      const result = await printfulAPI.uploadFileDirectly(file);

      if (result.code === 200) {
        // Refresh uploaded files list
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

  // Handle finalize mockups (go to product details step)
  const handleFinalizeMockups = () => {
    if (!mockupUrls || mockupUrls.length === 0) {
      toast.error("No mockups to finalize. Generate mockups first.");
      return;
    }

    toast.success("Mockups ready! Now add your product details.");
    onNext(); // Go to product details step
  };

  // Tab configuration
  const tabs = [
    { id: "variants", label: "Product Setup", icon: Settings, disabled: false },
    { id: "placements", label: "Placements", icon: Layers, disabled: selectedVariants.length === 0 },
    { id: "upload", label: "Upload Design", icon: Upload, disabled: !printFiles },
    { id: "position", label: "Position Control", icon: Move, disabled: designFiles.length === 0 },
    { id: "advanced", label: "Advanced Options", icon: Settings, disabled: designFiles.length === 0 },
    { id: "generate", label: "Generate Mockup", icon: Eye, disabled: designFiles.length === 0 || selectedVariants.length === 0 },
  ];

  // Handle select all sizes
  const handleSelectAllSizes = () => {
    if (selectedSizes.length === uniqueSizes.length) {
      setSelectedSizes([]); // Deselect all if all are selected
    } else {
      setSelectedSizes(uniqueSizes); // Select all
    }
  };

  return (
    <div className="bg-black/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6 border-b border-orange-400/30">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Palette className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Professional Design Editor
            </h2>
            <p className="text-orange-100 text-lg font-medium">
              Create your custom product design with advanced tools
            </p>
          </div>
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="bg-black/60 px-8 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <div
            className={`flex items-center ${
              uploadedFiles.length > 0 ? "text-green-400" : "text-gray-500"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl mr-3 flex items-center justify-center text-sm font-bold ${
                uploadedFiles.length > 0
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              }`}
            >
              1
            </div>
            <div>
              <p className="font-semibold">Upload & Design</p>
              <p className="text-xs opacity-80">
                {uploadedFiles.length > 0 ? `${uploadedFiles.length} files` : "Add your designs"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600" />
          <div
            className={`flex items-center ${
              mockupUrls && mockupUrls.length > 0
                ? "text-green-400"
                : "text-gray-500"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl mr-3 flex items-center justify-center text-sm font-bold ${
                mockupUrls && mockupUrls.length > 0
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-700 text-gray-500 border border-gray-600"
              }`}
            >
              2
            </div>
            <div>
              <p className="font-semibold">Generate Mockups</p>
              <p className="text-xs opacity-80">
                {mockupUrls && mockupUrls.length > 0 ? `${mockupUrls.length} mockups` : "Preview results"}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-600" />
          <div className="flex items-center text-gray-500">
            <div className="w-8 h-8 rounded-xl mr-3 flex items-center justify-center text-sm font-bold bg-gray-700 text-gray-500 border border-gray-600">
              3
            </div>
            <div>
              <p className="font-semibold">Finalize & Go Live</p>
              <p className="text-xs opacity-80">Publish product</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[900px]">
        {/* Left Sidebar - Tab Navigation & Controls */}
        <div className="w-96 border-r border-gray-800 bg-black/80 backdrop-blur-sm flex flex-col">
          {/* Tab Navigation */}
          <div className="border-b border-gray-800 p-4">
            <div className="flex flex-col space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => !tab.disabled && setActiveTab(tab.id)}
                    disabled={tab.disabled}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 ${
                      activeTab === tab.id
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg"
                        : tab.disabled
                        ? "text-gray-600 cursor-not-allowed"
                        : "text-gray-300 hover:bg-gray-800/50 hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold">{tab.label}</span>
                    {tab.disabled && (
                      <span className="ml-auto text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded-full">
                        Locked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "variants" && (
              <VariantsTabContent
                uniqueSizes={uniqueSizes}
                selectedSizes={selectedSizes}
                setSelectedSizes={setSelectedSizes}
                handleSelectAllSizes={handleSelectAllSizes}
                uniqueColors={uniqueColors}
                selectedColors={selectedColors}
                setSelectedColors={setSelectedColors}
                selectedVariants={selectedVariants}
                loadingPrintFiles={loadingPrintFiles}
              />
            )}

            {activeTab === "placements" && (
              <PlacementsTabContent
                printFiles={printFiles}
                activePlacement={activePlacement}
                setActivePlacement={setActivePlacement}
                designFiles={designFiles}
              />
            )}

            {activeTab === "upload" && (
              <UploadTabContent
                uploadedFiles={uploadedFiles}
                activePlacement={activePlacement}
                handleAddDesign={handleAddDesign}
                handleFileUpload={handleFileUpload}
                isUploading={isUploading}
              />
            )}

            {activeTab === "position" && selectedDesignFile && activePrintFile && (
              <PositionTabContent
                selectedDesignFile={selectedDesignFile}
                activePrintFile={activePrintFile}
                updateDesignPosition={updateDesignPosition}
              />
            )}

            {activeTab === "advanced" && (
              <AdvancedTabContent
                selectedProduct={selectedProduct}
                selectedTechnique={selectedTechnique}
                setSelectedTechnique={setSelectedTechnique}
                selectedOptionGroups={selectedOptionGroups}
                setSelectedOptionGroups={setSelectedOptionGroups}
                selectedOptions={selectedOptions}
                setSelectedOptions={setSelectedOptions}
                lifelikeEnabled={lifelikeEnabled}
                setLifelikeEnabled={setLifelikeEnabled}
                mockupWidth={mockupWidth}
                setMockupWidth={setMockupWidth}
              />
            )}

            {activeTab === "generate" && (
              <GenerateTabContent
                onGeneratePreview={onGeneratePreview}
                selectedTechnique={selectedTechnique}
                selectedOptionGroups={selectedOptionGroups}
                selectedOptions={selectedOptions}
                lifelikeEnabled={lifelikeEnabled}
                mockupWidth={mockupWidth}
                designFiles={designFiles}
                selectedVariants={selectedVariants}
                isGeneratingPreview={isGeneratingPreview}
                mockupUrls={mockupUrls}
                mockupStatus={mockupStatus}
                onNext={handleFinalizeMockups}
              />
            )}
          </div>
        </div>

        {/* Right Side - Canvas & Preview */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Area */}
          <div className="flex-1 bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
            {/* Zoom Controls */}
            <div className="absolute top-6 left-6 z-10 flex space-x-3">
              <button
                onClick={() => setCanvasZoom(Math.min(200, canvasZoom + 10))}
                className="p-3 bg-black/80 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-orange-500/50 group"
              >
                <ZoomIn className="w-5 h-5 text-gray-300 group-hover:text-orange-400" />
              </button>
              <button
                onClick={() => setCanvasZoom(Math.max(50, canvasZoom - 10))}
                className="p-3 bg-black/80 backdrop-blur-sm rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700 hover:border-orange-500/50 group"
              >
                <ZoomOut className="w-5 h-5 text-gray-300 group-hover:text-orange-400" />
              </button>
              <span className="px-4 py-3 bg-black/80 backdrop-blur-sm rounded-xl shadow-xl text-sm font-bold text-white border border-gray-700">
                {canvasZoom}%
              </span>
            </div>

            {/* Canvas Area */}
            <div className="flex items-center justify-center h-full p-10">
              {activePrintFile ? (
                <div className="relative">
                  {/* Print Area Label */}
                  <div className="absolute -top-10 left-0 bg-black/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700">
                    <p className="text-sm font-bold text-white">
                      {activePlacement.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {activePrintFile.width}×{activePrintFile.height}px
                    </p>
                  </div>
                  
                  <div
                    className="relative bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border-2 border-dashed border-orange-500/50 hover:border-orange-500 transition-all duration-300"
                    style={{
                      width: (activePrintFile.width / 4) * (canvasZoom / 100),
                      height: (activePrintFile.height / 4) * (canvasZoom / 100),
                    }}
                  >
                    {/* Design on Canvas with Drag & Resize */}
                    {activeDesign && activePrintFile && (
                      <Rnd
                        size={{
                          width:
                            (activeDesign.position.width / 4) * (canvasZoom / 100),
                          height:
                            (activeDesign.position.height / 4) * (canvasZoom / 100),
                        }}
                        position={{
                          x: (activeDesign.position.left / 4) * (canvasZoom / 100),
                          y: (activeDesign.position.top / 4) * (canvasZoom / 100),
                        }}
                        bounds="parent"
                        onDragStop={(e, d) => {
                          const newLeft = (d.x * 4) / (canvasZoom / 100);
                          const newTop = (d.y * 4) / (canvasZoom / 100);
                          updateDesignPosition(activeDesign.id, {
                            left: Math.max(
                              0,
                              Math.min(
                                newLeft,
                                activePrintFile.width - activeDesign.position.width
                              )
                            ),
                            top: Math.max(
                              0,
                              Math.min(
                                newTop,
                                activePrintFile.height -
                                  activeDesign.position.height
                              )
                            ),
                          });
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          const newWidth =
                            (parseFloat(ref.style.width) * 4) / (canvasZoom / 100);
                          const newHeight =
                            (parseFloat(ref.style.height) * 4) / (canvasZoom / 100);
                          const newLeft = (position.x * 4) / (canvasZoom / 100);
                          const newTop = (position.y * 4) / (canvasZoom / 100);

                          updateDesignPosition(activeDesign.id, {
                            width: Math.max(
                              50,
                              Math.min(newWidth, activePrintFile.width)
                            ),
                            height: Math.max(
                              50,
                              Math.min(newHeight, activePrintFile.height)
                            ),
                            left: Math.max(
                              0,
                              Math.min(newLeft, activePrintFile.width - newWidth)
                            ),
                            top: Math.max(
                              0,
                              Math.min(newTop, activePrintFile.height - newHeight)
                            ),
                          });
                        }}
                        onClick={() => setSelectedDesignFile(activeDesign)}
                        className={`border-2 ${
                          selectedDesignFile?.id === activeDesign.id
                            ? "border-indigo-500"
                            : "border-gray-300"
                        } bg-indigo-500 bg-opacity-10 cursor-move relative`}
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
                        resizeHandleStyles={{
                          topRight: {
                            background: "#4f46e5",
                            width: "8px",
                            height: "8px",
                          },
                          topLeft: {
                            background: "#4f46e5",
                            width: "8px",
                            height: "8px",
                          },
                          bottomRight: {
                            background: "#4f46e5",
                            width: "8px",
                            height: "8px",
                          },
                          bottomLeft: {
                            background: "#4f46e5",
                            width: "8px",
                            height: "8px",
                          },
                          top: { background: "#4f46e5", height: "8px" },
                          right: { background: "#4f46e5", width: "8px" },
                          bottom: { background: "#4f46e5", height: "8px" },
                          left: { background: "#4f46e5", width: "8px" },
                        }}
                      >
                        <div className="w-full h-full relative">
                          <Image
                            src={activeDesign.url}
                            alt={activeDesign.filename}
                            fill
                            className="object-contain pointer-events-none"
                          />
                          {selectedDesignFile?.id === activeDesign.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveDesign(activeDesign.id);
                              }}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg z-10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </Rnd>
                    )}

                    {/* Drop Zone */}
                    {!activeDesign && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-600">
                        <div className="text-center animate-pulse">
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Palette className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-lg font-bold text-gray-800">Drop design here</p>
                          <p className="text-sm text-gray-600 mt-1">or select from your files</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Palette className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-xl font-bold text-gray-300 mb-2">Select variants to see design canvas</p>
                  <p className="text-gray-500">Choose sizes and colors first</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-800 px-8 py-6 bg-black/80 backdrop-blur-sm">
        <div className="flex justify-between items-center">
          <button
            onClick={onPrev}
            className="px-8 py-4 border-2 border-gray-700 text-gray-300 font-bold rounded-2xl hover:bg-gray-800/50 hover:border-gray-600 hover:text-white transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
          >
            ← Back
          </button>

          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {designFiles.length} designs • {selectedVariants.length} variants
            </p>
            <p className="text-sm text-gray-400 mt-1 font-medium">
              Ready to continue when both are selected
            </p>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {mockupUrls && mockupUrls.length > 0 && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={mockupUrls}
          initialIndex={modalImageIndex}
        />
      )}
    </div>
  );
};

export default UnifiedDesignEditor;