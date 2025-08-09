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
  Plus,
  Settings,
  Layers,
  ChevronRight,
  ChevronDown,
  Upload,
  Save,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import AdvancedMockupOptions from "./AdvancedMockupOptions";
import ImageModal from "../ui/ImageModal";

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
  onRefreshFiles?: () => void; // Add callback to refresh files
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
  const [selectedOptionGroups, setSelectedOptionGroups] = useState<string[]>(
    []
  );
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [lifelikeEnabled, setLifelikeEnabled] = useState<boolean>(false);
  const [mockupWidth, setMockupWidth] = useState<number>(1000);
  const [showAdvancedOptions, setShowAdvancedOptions] =
    useState<boolean>(false);

  // Tab management state
  const [activeTab, setActiveTab] = useState<string>("variants");

  // Modal state for image viewing
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);

  // File upload and storage state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isStoringMockups, setIsStoringMockups] = useState<boolean>(false);

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
          {/* Variant Selection */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Product Variants
              </h3>
            </div>

            {/* Size Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-200 mb-3">
                Sizes
              </label>
              <div className="flex flex-wrap gap-3">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() =>
                      setSelectedSizes((prev) =>
                        prev.includes(size)
                          ? prev.filter((s) => s !== size)
                          : [...prev, size]
                      )
                    }
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                      selectedSizes.includes(size)
                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                        : "bg-black/80 text-gray-300 border border-gray-700 hover:border-orange-500/50 hover:text-orange-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-200 mb-3">
                Colors
              </label>
              <div className="grid grid-cols-2 gap-3">
                {uniqueColors.map(
                  (color: { name: string; code: string; image: string }) => (
                    <button
                      key={color.name}
                      onClick={() =>
                        setSelectedColors((prev) =>
                          prev.includes(color.name)
                            ? prev.filter((c) => c !== color.name)
                            : [...prev, color.name]
                        )
                      }
                      className={`p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                        selectedColors.includes(color.name)
                          ? "border-2 border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/25"
                          : "border border-gray-700 hover:border-gray-600 bg-black/80"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-3">
                        <div
                          className="w-6 h-6 rounded-full border-2 border-gray-500 shadow-sm"
                          style={{ backgroundColor: color.code }}
                        />
                        <span className="text-xs font-bold text-white">
                          {color.name}
                        </span>
                      </div>
                      <div className="w-full h-12 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                        <Image
                          src={color.image}
                          alt={color.name}
                          width={80}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Variants Summary */}
            {selectedVariants.length > 0 && (
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 border-2 border-green-500/30 rounded-2xl p-5 mb-6 backdrop-blur-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-300 font-bold">
                    {selectedVariants.length} variants selected
                  </span>
                  <span className="text-green-400 font-bold">
                    {selectedSizes.length} × {selectedColors.length}
                  </span>
                </div>
                {loadingPrintFiles && (
                  <div className="flex items-center space-x-3 text-orange-400 mt-4 bg-black/60 rounded-xl p-3 border border-orange-500/30">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                    <span className="text-sm font-bold">
                      Loading print files...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Placement Selection */}
          <div className="border-t border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Placements
              </h3>
            </div>
            <div className="space-y-3">
              {printFiles &&
                Object.entries(printFiles.available_placements).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActivePlacement(key)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 flex items-center justify-between transform hover:scale-105 ${
                        activePlacement === key
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25"
                          : "text-gray-300 hover:bg-black/60 border border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <span className="font-semibold">{label}</span>
                      {designFiles.some((df) => df.placement === key) && (
                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                      )}
                    </button>
                  )
                )}
            </div>
          </div>

          {/* Design Files */}
          {/* File Upload */}
          <div className="border-t border-gray-800 p-6 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Upload New Design
              </h3>
            </div>

            <div className="mb-3">
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
                className={`w-full flex items-center justify-center px-6 py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isUploading
                    ? "border-gray-700 bg-gray-800/50 cursor-not-allowed"
                    : "border-orange-500/50 hover:border-orange-500 hover:bg-orange-500/10 bg-black/60 backdrop-blur-sm shadow-lg"
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500 mr-3"></div>
                    <span className="text-sm font-bold text-gray-300">
                      Uploading to your library...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-orange-400 mr-3" />
                    <span className="text-sm font-bold text-orange-400">
                      Choose Image File
                    </span>
                  </>
                )}
              </label>
              <p className="text-xs text-gray-400 mt-2 font-medium">
                PNG, JPG up to 10MB • Stored permanently in your account
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Your Design Files ({uploadedFiles.length})
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative group">
                  <div className="aspect-square bg-black/60 rounded-2xl overflow-hidden border border-gray-700 shadow-lg">
                    <Image
                      src={file.thumbnail_url || file.file_url}
                      alt={file.filename}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  </div>
                  <button
                    onClick={() => handleAddDesign(file, activePlacement)}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center rounded-2xl"
                  >
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 rounded-xl shadow-lg">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                  </button>
                  <p className="text-xs text-gray-300 mt-2 truncate font-medium">
                    {file.filename}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

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

          {/* Live Preview Section */}
          <div className="border-t border-gray-800 bg-black/80 backdrop-blur-sm p-6 max-h-96 overflow-y-auto">
          {/* Position Controls */}
          {selectedDesignFile && activePrintFile && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl">
                  <Move className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Position Controls
                </h3>
              </div>

              <div className="space-y-6">
                {/* Size Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-3">
                      Width
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.width)}
                      onChange={(e) =>
                        updateDesignPosition(selectedDesignFile.id, {
                          width: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-600"
                      min="50"
                      max={activePrintFile.width}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-3">
                      Height
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.height)}
                      onChange={(e) =>
                        updateDesignPosition(selectedDesignFile.id, {
                          height: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-600"
                      min="50"
                      max={activePrintFile.height}
                    />
                  </div>
                </div>

                {/* Position Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-3">
                      Top
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.top)}
                      onChange={(e) =>
                        updateDesignPosition(selectedDesignFile.id, {
                          top: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-600"
                      min="0"
                      max={
                        activePrintFile.height -
                        selectedDesignFile.position.height
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-200 mb-3">
                      Left
                    </label>
                    <input
                      type="number"
                      value={Math.round(selectedDesignFile.position.left)}
                      onChange={(e) =>
                        updateDesignPosition(selectedDesignFile.id, {
                          left: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 text-sm font-bold text-white border-2 border-gray-700 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-black/80 backdrop-blur-sm transition-all duration-200 hover:border-gray-600"
                      min="0"
                      max={
                        activePrintFile.width -
                        selectedDesignFile.position.width
                      }
                    />
                  </div>
                </div>

                {/* Quick Position Presets */}
                <div>
                  <label className="block text-sm font-bold text-gray-200 mb-3">
                    Quick Position
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["top-left", "TL"],
                      ["top-center", "TC"],
                      ["top-right", "TR"],
                      ["center-left", "CL"],
                      ["center", "C"],
                      ["center-right", "CR"],
                      ["bottom-left", "BL"],
                      ["bottom-center", "BC"],
                      ["bottom-right", "BR"],
                    ].map(([position, label]) => (
                      <button
                        key={position}
                        onClick={() => {
                          const { width, height, area_width, area_height } =
                            selectedDesignFile.position;

                          let top = 0,
                            left = 0;

                          // Calculate vertical position
                          if (
                            position.includes("center") &&
                            !position.includes("top") &&
                            !position.includes("bottom")
                          ) {
                            top = (area_height - height) / 2;
                          } else if (position.includes("bottom")) {
                            top = area_height - height;
                          }
                          // top-* positions stay at top = 0

                          // Calculate horizontal position
                          if (
                            position.includes("center") &&
                            !position.includes("left") &&
                            !position.includes("right")
                          ) {
                            left = (area_width - width) / 2;
                          } else if (position.includes("right")) {
                            left = area_width - width;
                          }
                          // *-left positions stay at left = 0

                          updateDesignPosition(selectedDesignFile.id, {
                            top,
                            left,
                          });
                        }}
                        className="px-3 py-3 text-sm font-bold bg-black/80 border border-gray-700 rounded-xl hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 text-white hover:text-orange-400 transform hover:scale-105"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Mockup Options */}
          <div className="border-t border-gray-200 p-4">
            <button
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-all"
            >
              <div className="flex items-center">
                <Settings className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-semibold text-purple-900">
                  Advanced Mockup Options
                </span>
              </div>
              {showAdvancedOptions ? (
                <ChevronDown className="w-5 h-5 text-purple-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-purple-600" />
              )}
            </button>

            {showAdvancedOptions && (
              <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                <AdvancedMockupOptions
                  selectedProduct={selectedProduct}
                  selectedTechnique={selectedTechnique}
                  onTechniqueChange={setSelectedTechnique}
                  selectedOptionGroups={selectedOptionGroups}
                  onOptionGroupsChange={setSelectedOptionGroups}
                  selectedOptions={selectedOptions}
                  onOptionsChange={setSelectedOptions}
                  lifelikeEnabled={lifelikeEnabled}
                  onLifelikeChange={setLifelikeEnabled}
                  mockupWidth={mockupWidth}
                  onWidthChange={setMockupWidth}
                />
              </div>
            )}
          </div>

          {/* Live Preview */}
          <div className="border-t border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Live Preview
            </h3>

            <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
              {isGeneratingPreview ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-900">
                      Generating preview...
                    </p>
                    {mockupStatus && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800 font-medium leading-relaxed">
                          {mockupStatus}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : mockupUrls && mockupUrls.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-600 mb-3">
                      ✅ {mockupUrls.length} Mockup
                      {mockupUrls.length > 1 ? "s" : ""} Generated
                    </p>
                  </div>

                  {/* Organize mockups by placement and option group */}
                  <div className="space-y-6 max-h-96 overflow-y-auto">
                    {(() => {
                      // Group mockups by placement
                      const groupedByPlacement = mockupUrls.reduce(
                        (acc, mockup) => {
                          if (!acc[mockup.placement]) {
                            acc[mockup.placement] = [];
                          }
                          acc[mockup.placement].push(mockup);
                          return acc;
                        },
                        {} as Record<string, typeof mockupUrls>
                      );

                      return Object.entries(groupedByPlacement).map(
                        ([placement, placementMockups]) => (
                          <div
                            key={placement}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <h4 className="font-semibold text-gray-900 mb-3 text-center capitalize">
                              {placement} Placement ({placementMockups.length}{" "}
                              variation{placementMockups.length > 1 ? "s" : ""})
                            </h4>

                            {/* Grid of mockups for this placement */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {placementMockups.map((mockup, index) => {
                                const globalIndex = mockupUrls.findIndex(
                                  (m) => m.url === mockup.url
                                );
                                return (
                                  <div
                                    key={`${placement}-${index}`}
                                    className="text-center group"
                                  >
                                    <div
                                      className="relative cursor-pointer"
                                      onClick={() =>
                                        openImageModal(globalIndex)
                                      }
                                    >
                                      <Image
                                        src={mockup.url}
                                        alt={
                                          mockup.title ||
                                          `${mockup.placement} ${
                                            mockup.option || "preview"
                                          }`
                                        }
                                        width={280}
                                        height={280}
                                        className="mx-auto rounded-lg shadow-lg border-2 border-gray-300 transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:border-indigo-400"
                                      />

                                      {/* Click to view overlay */}
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                                        <div className="bg-white bg-opacity-90 px-4 py-2 rounded-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                          <p className="text-sm font-semibold text-gray-900">
                                            Click to view full size
                                          </p>
                                        </div>
                                      </div>

                                      {/* Option group badge */}
                                      {mockup.option_group && (
                                        <div className="absolute top-3 left-3 bg-indigo-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                                          {mockup.option_group}
                                        </div>
                                      )}

                                      {/* Placement badge */}
                                      <div className="absolute top-3 right-3 bg-black bg-opacity-80 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                                        {mockup.placement.toUpperCase()}
                                      </div>

                                      {/* Variant count badge */}
                                      {mockup.variant_ids &&
                                        mockup.variant_ids.length > 0 && (
                                          <div className="absolute bottom-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium shadow-lg">
                                            {mockup.variant_ids.length} variant
                                            {mockup.variant_ids.length > 1
                                              ? "s"
                                              : ""}
                                          </div>
                                        )}
                                    </div>

                                    {/* Mockup title and details */}
                                    <div className="mt-2 space-y-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {mockup.title ||
                                          `${
                                            mockup.placement
                                              .charAt(0)
                                              .toUpperCase() +
                                            mockup.placement.slice(1)
                                          } View`}
                                      </p>
                                      {mockup.option &&
                                        mockup.option !== "Main" && (
                                          <p className="text-xs text-gray-600">
                                            {mockup.option} Style
                                          </p>
                                        )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      );
                    })()}
                  </div>

                  {mockupStatus && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500">{mockupStatus}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Eye className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium text-gray-600">
                    Generate preview to see result
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Add designs and select variants first
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() =>
                onGeneratePreview({
                  technique: selectedTechnique,
                  optionGroups: selectedOptionGroups,
                  options: selectedOptions,
                  lifelike: lifelikeEnabled,
                  width: mockupWidth,
                })
              }
              disabled={
                designFiles.length === 0 ||
                selectedVariants.length === 0 ||
                isGeneratingPreview
              }
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border-2 border-green-600 hover:shadow-xl"
            >
              {isGeneratingPreview ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Preview...
                </span>
              ) : (
                <>
                  Generate Preview
                  {(selectedTechnique !== "DTG" ||
                    selectedOptionGroups.length > 0 ||
                    selectedOptions.length > 0 ||
                    lifelikeEnabled) && (
                    <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                      Advanced
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Finalize Button */}
            {mockupUrls && mockupUrls.length > 0 && (
              <button
                onClick={handleFinalizeMockups}
                className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-3 rounded-lg font-bold text-sm hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg border-2 border-emerald-600 hover:shadow-xl"
              >
                <span className="flex items-center justify-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Finalize Product
                  <ChevronRight className="w-4 h-4 ml-2" />
                </span>
              </button>
            )}
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
