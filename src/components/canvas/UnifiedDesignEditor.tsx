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
  Scissors,
  PlayCircle,
  Edit2,
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

type TabType = "product" | "upload" | "text" | "clipart" | "placement" | "embroidery" | "advanced" | "preview";

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
  const [activePlacement, setActivePlacement] = useState<string>("");
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);
  const [selectedDesignFile, setSelectedDesignFile] = useState<DesignFile | null>(null);
  const [loadingPrintFiles, setLoadingPrintFiles] = useState(false);
  const [printFilesLoaded, setPrintFilesLoaded] = useState(false);
  const [selectedTechnique, setSelectedTechnique] = useState<string>("DTG printing");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [textContent, setTextContent] = useState<string>("");
  const [currentMockupIndex, setCurrentMockupIndex] = useState(0);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [childPanelOpen, setChildPanelOpen] = useState(false);
  const [childPanelContent, setChildPanelContent] = useState<string>("");
  const [selectedFileForPlacement, setSelectedFileForPlacement] = useState<UploadedFile | null>(null);
  const [showPlacementPanel, setShowPlacementPanel] = useState(false);
  
  // Advanced mockup options
  const [advancedOptions, setAdvancedOptions] = useState({
    width: 1600,
    lifelike: true,
    optionGroups: [] as string[],
    options: [] as string[],
  });

  // Embroidery-specific options
  const [embroideryOptions, setEmbroideryOptions] = useState({
    thread_colors_chest_left: [] as string[],
    thread_colors_wrist_left: [] as string[],
    thread_colors_wrist_right: [] as string[],
    notes: ""
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

  // Check if this is an embroidery product and extract embroidery options
  const isEmbroideryProduct = selectedProduct?.type === "EMBROIDERY" || 
                             selectedTechnique?.toLowerCase().includes("embroidery");
  
  const embroideryProductOptions = selectedProduct?.options || [];
  
  // Parse thread color options for each placement
  const getThreadColorOptions = (placementKey: string) => {
    const option = embroideryProductOptions.find((opt: any) => 
      opt.id === `thread_colors_${placementKey}`
    );
    return option?.values || {};
  };
  
  const threadColors = {
    chest_left: getThreadColorOptions('chest_left'),
    wrist_left: getThreadColorOptions('wrist_left'), 
    wrist_right: getThreadColorOptions('wrist_right'),
  };

  // Auto-select all sizes and first color on product load
  useEffect(() => {
    if (selectedProduct?.variants && uniqueSizes.length > 0 && selectedSizes.length === 0) {
      setSelectedSizes(uniqueSizes);
    }
    if (uniqueColors.length > 0 && selectedColors.length === 0) {
      setSelectedColors([uniqueColors[0].name]);
    }
  }, [selectedProduct, uniqueSizes, uniqueColors, selectedSizes.length, selectedColors.length]);

  // Refresh files when component mounts or onRefreshFiles is called
  useEffect(() => {
    if (onRefreshFiles && uploadedFiles.length === 0) {
      onRefreshFiles();
    }
  }, [onRefreshFiles, uploadedFiles.length]);

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

        let printFilesResponse;

        console.log(`🎯 Attempting to load print files for product ${selectedProduct.id} without technique parameter (letting API use default)`);

        try {
          // Try without technique parameter first (API will use default)
          printFilesResponse = await printfulAPI.getPrintFiles(selectedProduct.id);
          console.log(`✅ Successfully loaded print files with default technique`);
        } catch (error: any) {
          console.warn("Default technique attempt failed:", error);
          
          // Check if error contains allowed techniques - handle multiple error structures
          const errorData = error?.response?.data || error?.data || {};
          const errorMessage = errorData.result || errorData.error?.message || error.message || '';
          console.log("Full error data:", errorData);
          console.log("Parsed error message:", errorMessage);
          
          // Parse allowed techniques from error message
          const allowedTechniquesMatch = errorMessage.match(/Allowed values?:\s*([A-Z,\s]+)/i);
          if (allowedTechniquesMatch) {
            const allowedTechniques = allowedTechniquesMatch[1]
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t);
            
            console.log("Parsed allowed techniques:", allowedTechniques);
            
            if (allowedTechniques.length > 0) {
              const fallbackTechnique = allowedTechniques[0];
              console.log("Retrying with fallback technique:", fallbackTechnique);
              
              // Update the selected technique in the UI with proper mapping
              const displayTechnique = fallbackTechnique === "DTG" ? "DTG printing" : 
                                     fallbackTechnique === "DTFILM" ? "DTFILM printing" : 
                                     fallbackTechnique === "EMBROIDERY" ? "Embroidery" :
                                     fallbackTechnique;
              setSelectedTechnique(displayTechnique);
              
              // Show user-friendly message about the technique change
              toast(`This product requires ${displayTechnique} technique`);
              
              try {
                printFilesResponse = await printfulAPI.getPrintFiles(
                  selectedProduct.id,
                  fallbackTechnique
                );
              } catch (fallbackError) {
                console.error("Fallback technique also failed:", fallbackError);
                throw fallbackError;
              }
            } else {
              throw error;
            }
          } else {
            throw error; // throw original error if can't parse allowed techniques
          }
        }

        if (printFilesResponse?.result) {
          onPrintFilesLoaded?.(printFilesResponse.result);
          setPrintFilesLoaded(true);
          
          toast.success("Print files loaded!");
        } else {
          throw new Error("No valid print files response received");
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

  // Placement tabs configuration - handle both standard and embroidery placements
  const placementTabs = printFiles
    ? Object.entries(printFiles.available_placements).map(([key, label]) => ({
        id: key,
        label: label,
        hasDesign: designFiles.some((df) => df.placement === key),
        isEmbroidery: key.startsWith('embroidery_'),
      }))
    : [];

  // Auto-set active placement when print files are loaded
  useEffect(() => {
    if (placementTabs.length > 0 && !activePlacement) {
      const firstPlacement = placementTabs[0].id;
      console.log(`🎯 Setting default active placement to: ${firstPlacement}`);
      setActivePlacement(firstPlacement);
    }
  }, [placementTabs.length, activePlacement]);

  // Update selectedDesignFile when activePlacement changes
  useEffect(() => {
    if (activePlacement) {
      const designForPlacement = designFiles.find(df => df.placement === activePlacement);
      if (designForPlacement && designForPlacement !== selectedDesignFile) {
        setSelectedDesignFile(designForPlacement);
        console.log("🔄 Updated selectedDesignFile for active placement:", activePlacement, designForPlacement);
      }
    } else {
      if (selectedDesignFile) {
        setSelectedDesignFile(null);
        console.log("🔄 Cleared selectedDesignFile - no active placement");
      }
    }
  }, [activePlacement, designFiles, selectedDesignFile]);

  // Handle adding design to specific placement (DEPRECATED - using placement panel workflow now)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddDesignToPlacement = (file: any, placement: string) => {
    // Check if design already exists for this placement
    const existingDesign = designFiles.find(df => df.url === file.url && df.placement === placement);
    
    if (existingDesign) {
      toast("Design already added to this placement");
      return;
    }

    // Get the print file for this placement
    const printFile = printFiles?.printfiles?.[0]; // Use first printfile as default
    if (!printFile) {
      toast.error("Print files not loaded yet");
      return;
    }

    // Create new design file
    const newDesignFile: DesignFile = {
      id: file.id,
      filename: file.filename,
      url: file.url,
      type: "design",
      placement: placement,
      position: {
        area_width: printFile.width,
        area_height: printFile.height,
        width: Math.min(printFile.width * 0.8, 300), // 80% of print area or max 300px
        height: Math.min(printFile.height * 0.8, 300),
        top: printFile.height * 0.1, // Center vertically with 10% margin
        left: printFile.width * 0.1, // Center horizontally with 10% margin
        limit_to_print_area: true,
      }
    };

    setDesignFiles((prev: DesignFile[]) => [...prev, newDesignFile]);
    toast.success(`Design added to ${placementTabs.find(p => p.id === placement)?.label}`);
  };

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

  // Handle removing design file
  const handleRemoveDesignFile = (design: DesignFile) => {
    setDesignFiles(designFiles.filter((df) => df.id !== design.id));
    if (selectedDesignFile?.id === design.id) {
      setSelectedDesignFile(null);
    }
    toast.success("Design removed");
  };

  // Handle adding text to design
  const handleAddTextToDesign = () => {
    if (!textContent.trim() || !activePlacement) {
      toast.error("Please enter text and select a placement");
      return;
    }

    const printFile = printFiles?.printfiles?.[0]; // Use first printfile as default
    if (!printFile) {
      toast.error("Print files not loaded yet");
      return;
    }

    // Create new text design file
    const textDesignFile: DesignFile = {
      id: Date.now(),
      filename: `text-${Date.now()}.txt`,
      url: `data:text/plain;charset=utf-8,${encodeURIComponent(textContent)}`, // Data URL for text
      type: "design",
      placement: activePlacement,
      position: {
        area_width: printFile.width,
        area_height: printFile.height,
        width: Math.min(printFile.width * 0.6, 400), // 60% of print area or max 400px
        height: Math.min(printFile.height * 0.2, 100), // 20% of print area or max 100px
        top: printFile.height * 0.4, // Center vertically
        left: printFile.width * 0.2, // Center horizontally with 20% margin
        limit_to_print_area: true,
      }
    };

    setDesignFiles((prev: DesignFile[]) => [...prev, textDesignFile]);
    setSelectedDesignFile(textDesignFile);
    setTextContent(""); // Clear text input
    toast.success(`Text added to ${placementTabs.find(p => p.id === activePlacement)?.label}`);
  };

  // Handle file preview - adds directly to canvas for positioning (DEPRECATED - using placement panel workflow now)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFilePreview = (file: UploadedFile) => {
    if (!activePlacement) {
      toast.error("Please select a placement first");
      return;
    }

    // Remove existing preview if any
    setDesignFiles((prev: DesignFile[]) => prev.filter((df: DesignFile) => df.id !== -1));

    const printFile = printFiles?.printfiles?.[0]; // Use first printfile as default
    if (!printFile) {
      toast.error("Print files not loaded yet");
      return;
    }

    // Create temporary design file for preview that can be positioned
    const previewDesign: DesignFile = {
      id: -1, // Negative ID to indicate it's a preview
      filename: file.filename,
      url: file.thumbnail_url || file.url,
      type: "design",
      placement: activePlacement,
      position: {
        area_width: printFile.width,
        area_height: printFile.height,
        width: Math.min(printFile.width * 0.4, 250), // 40% of print area or max 250px
        height: Math.min(printFile.height * 0.4, 250),
        top: printFile.height * 0.3, // Center vertically with 30% margin
        left: printFile.width * 0.3, // Center horizontally with 30% margin
        limit_to_print_area: true,
      }
    };

    // Add preview to design files and select it for positioning
    setDesignFiles((prev: DesignFile[]) => [...prev, previewDesign]);
    setSelectedDesignFile(previewDesign);
    toast.success("Position and resize the preview, then click 'Add' to make it permanent");
  };

  // Convert preview to permanent design
  const handleMakePreviewPermanent = () => {
    const previewDesign = designFiles.find(df => df.id === -1);
    if (!previewDesign) {
      toast.error("No preview found");
      return;
    }

    // Create permanent design with new ID
    const permanentDesign: DesignFile = {
      ...previewDesign,
      id: Date.now(), // Give it a proper ID
    };

    // Replace preview with permanent design
    setDesignFiles((prev: DesignFile[]) => prev.map((df: DesignFile) => df.id === -1 ? permanentDesign : df));
    setSelectedDesignFile(permanentDesign);
    toast.success("Design added permanently!");
  };

  // Handle selecting a file for placement
  const handleSelectFileForPlacement = (file: UploadedFile) => {
    setSelectedFileForPlacement(file);
    setShowPlacementPanel(true);
    toast.success("Select a placement for your design");
  };

  // DEPRECATED: Handle placing file on specific placement from right panel
  // This function is no longer used - replaced by handleTogglePlacementSelection
  const handlePlaceFileOnPlacement = (placement: string) => {
    console.log("⚠️ DEPRECATED handlePlaceFileOnPlacement called - redirecting to toggle function");
    // Redirect to the new function to avoid duplicates
    if (!selectedPlacements.includes(placement)) {
      handleTogglePlacementSelection(placement);
    } else {
      // If already selected, just switch to it
      handleSetActivePlacement(placement);
    }
  };

  // Handle multiple placement selection
  const handleTogglePlacementSelection = (placement: string) => {
    console.log("🔄 handleTogglePlacementSelection called with:", placement);
    if (!selectedFileForPlacement) {
      console.log("❌ No selectedFileForPlacement, returning early");
      return;
    }

    setSelectedPlacements(prev => {
      const isCurrentlySelected = prev.includes(placement);
      let updatedPlacements;
      
      if (isCurrentlySelected) {
        // Remove placement
        updatedPlacements = prev.filter(p => p !== placement);
        // Remove the design file for this placement
        setDesignFiles(prevFiles => prevFiles.filter(df => df.placement !== placement));
        console.log("➖ Removed placement:", placement);
        toast.success(`Removed from ${placementTabs.find(p => p.id === placement)?.label}`);
      } else {
        // Add placement
        updatedPlacements = [...prev, placement];
        
        // Create design for this placement (ensure no duplicates)
        const printFile = printFiles?.printfiles?.[0];
        if (printFile) {
          const previewDesign: DesignFile = {
            id: Date.now() + Math.random(), // Unique ID for each placement
            filename: selectedFileForPlacement.filename,
            url: selectedFileForPlacement.thumbnail_url || selectedFileForPlacement.url,
            type: "design",
            placement: placement,
            position: {
              area_width: printFile.width,
              area_height: printFile.height,
              width: Math.min(printFile.width * 0.4, 250),
              height: Math.min(printFile.height * 0.4, 250),
              left: Math.max(0, (printFile.width - Math.min(printFile.width * 0.4, 250)) / 2),
              top: Math.max(0, (printFile.height - Math.min(printFile.height * 0.4, 250)) / 2),
              limit_to_print_area: true,
            },
          };
          
          // Remove any existing designs for this placement before adding new one
          setDesignFiles((prev: DesignFile[]) => [
            ...prev.filter((df: DesignFile) => df.placement !== placement),
            previewDesign
          ]);
          console.log("➕ Added placement:", placement, "with design:", previewDesign);
          toast.success(`Added to ${placementTabs.find(p => p.id === placement)?.label}`);
        }
      }
      
      console.log("🎯 Updated selected placements:", updatedPlacements);
      return updatedPlacements;
    });
    
    // Set the clicked placement as active and switch to placement tab
    if (!selectedPlacements.includes(placement)) {
      // If we just added this placement, make it active
      setActivePlacement(placement);
      
      // Set selectedDesignFile to the design for this placement
      const designForPlacement = designFiles.find(df => df.placement === placement);
      if (designForPlacement) {
        setSelectedDesignFile(designForPlacement);
        console.log("🎯 Set selectedDesignFile for new active placement:", placement);
      }
    } else if (selectedPlacements.length === 1 && selectedPlacements[0] === placement) {
      // If we're removing the last placement, clear active placement and selectedDesignFile
      setActivePlacement("");
      setSelectedDesignFile(null);
    } else if (activePlacement === placement && selectedPlacements.length > 1) {
      // If we're removing the active placement but have others, switch to first remaining
      const remainingPlacements = selectedPlacements.filter(p => p !== placement);
      const newActivePlacement = remainingPlacements[0];
      setActivePlacement(newActivePlacement);
      
      // Set selectedDesignFile to the new active placement's design
      const designForPlacement = designFiles.find(df => df.placement === newActivePlacement);
      if (designForPlacement) {
        setSelectedDesignFile(designForPlacement);
        console.log("🎯 Set selectedDesignFile for new active placement:", newActivePlacement);
      }
    }
    
    setActiveTab("placement");
  };

  // Switch active placement for editing (without toggling selection)
  const handleSetActivePlacement = (placement: string) => {
    if (selectedPlacements.includes(placement)) {
      setActivePlacement(placement);
      
      // Set selectedDesignFile to the design for this placement
      const designForPlacement = designFiles.find(df => df.placement === placement);
      if (designForPlacement) {
        setSelectedDesignFile(designForPlacement);
        console.log("🎯 Set selectedDesignFile for placement:", placement, designForPlacement);
      }
      
      setActiveTab("placement");
      console.log("🎯 Switched to active placement:", placement);
    }
  };

  // Calculate canvas dimensions based on product print file
  const getCanvasDimensions = () => {
    const printFile = activePrintFile;
    if (!printFile) {
      return { width: 400, height: 400 }; // Default square
    }

    const { width, height } = printFile;
    const aspectRatio = width / height;
    
    // Set smaller canvas size to match product shape better
    const maxWidth = 400;
    const maxHeight = 400;
    
    let canvasWidth, canvasHeight;
    
    if (aspectRatio > 1) {
      // Landscape (wider than tall)
      canvasWidth = Math.min(maxWidth, 400);
      canvasHeight = canvasWidth / aspectRatio;
    } else {
      // Portrait or square (taller than wide or equal)
      canvasHeight = Math.min(maxHeight, 400);
      canvasWidth = canvasHeight * aspectRatio;
    }
    
    // Ensure minimum size but smaller than before
    canvasWidth = Math.max(canvasWidth, 250);
    canvasHeight = Math.max(canvasHeight, 250);
    
    return {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight),
      aspectRatio,
      printWidth: width,
      printHeight: height
    };
  };

  // Quick position presets
  const applyQuickPosition = (position: string) => {
    // Use selectedDesignFile if available (from placement panel), otherwise use activeDesign
    const designToPosition = selectedDesignFile || activeDesign;
    if (!designToPosition || !activePrintFile) return;

    const { width, height } = designToPosition.position;
    const { width: areaWidth, height: areaHeight } = activePrintFile;

    let newPosition = { ...designToPosition.position };

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

    updateDesignPosition(designToPosition.id, newPosition);
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
              <h3 className="text-sm font-semibold text-white mb-2">Technique</h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setSelectedTechnique("DTG printing")}
                  className={`p-3 border rounded-lg text-sm font-medium text-left transition-colors ${
                    selectedTechnique === "DTG printing"
                      ? "border-orange-500 bg-orange-900/20 text-white"
                      : "border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-200"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center mr-3">
                      <div className="w-4 h-4 bg-white rounded"></div>
                    </div>
                    <span className="text-current">DTG Printing</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedTechnique("DTFILM printing")}
                  className={`p-3 border rounded-lg text-sm font-medium text-left transition-colors ${
                    selectedTechnique === "DTFILM printing"
                      ? "border-gray-900 bg-gray-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                      <div className="w-4 h-4 bg-white rounded"></div>
                    </div>
                    <span>DTFILM Printing</span>
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
                      <div 
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                        onClick={() => handleSelectFileForPlacement(file)}
                      >
                        <Image
                          src={file.thumbnail_url || file.url}
                          alt={file.filename}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        onClick={() => handleSelectFileForPlacement(file)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                      >
                        <span className="text-white text-xs font-medium">Select</span>
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

            <button 
              onClick={handleAddTextToDesign}
              disabled={!textContent.trim() || !activePlacement}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
            <h3 className="text-sm font-semibold text-white">Design Studio</h3>
            
            {/* Placement Selection */}
            {placementTabs.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700">Choose Placement</h4>
                {placementTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleSetActivePlacement(tab.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg text-sm font-medium transition-colors ${
                      activePlacement === tab.id
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center">
                      {tab.isEmbroidery && (
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-2" title="Embroidery placement"></div>
                      )}
                      <span>{tab.label}</span>
                    </div>
                    {tab.hasDesign && (
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Select product variants to see available placements</p>
            )}

            {/* File Selection for Current Placement */}
            {activePlacement && uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700">Add Design to {placementTabs.find(p => p.id === activePlacement)?.label}</h4>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((file) => {
                    const isAssigned = designFiles.some(df => df.url === file.url && df.placement === activePlacement);
                    
                    return (
                      <button
                        key={file.id}
                        onClick={() => handleSelectFileForPlacement(file)}
                        className={`relative border-2 rounded-lg p-2 transition-all ${
                          isAssigned
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-blue-300"
                        }`}
                      >
                        <div 
                          className="aspect-square bg-gray-100 rounded mb-1 overflow-hidden cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectFileForPlacement(file);
                          }}
                        >
                          <img
                            src={file.url}
                            alt={file.filename}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-gray-600 truncate">{file.filename}</p>
                        
                        {isAssigned && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Current Placement Designs */}
            {activePlacement && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-700">
                  Designs on {placementTabs.find(p => p.id === activePlacement)?.label}
                </h4>
                {(() => {
                  const placementDesigns = designFiles.filter(df => df.placement === activePlacement);
                  
                  if (placementDesigns.length === 0) {
                    return <p className="text-xs text-gray-500">No designs added to this placement yet</p>;
                  }
                  
                  return (
                    <div className="space-y-2">
                      {placementDesigns.map((design, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-gray-200 rounded overflow-hidden mr-2">
                              <img
                                src={design.url}
                                alt={design.filename}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-gray-700 truncate">{design.filename}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveDesignFile(design)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        );


      case "embroidery":
        if (!isEmbroideryProduct) {
          return (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Embroidery Options</h3>
              <p className="text-sm text-gray-500">This product doesn't support embroidery customization.</p>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Embroidery Customization</h3>
            
            {/* Thread Colors for each placement */}
            {Object.entries(threadColors).map(([placement, colors]) => {
              const hasColors = Object.keys(colors).length > 0;
              const placementName = placement.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
              
              if (!hasColors) return null;
              
              return (
                <div key={placement} className="space-y-3">
                  <h4 className="text-xs font-medium text-gray-700">{placementName} Thread Colors</h4>
                  <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                    {Object.entries(colors).map(([colorCode, colorName]: [string, any]) => (
                      <button
                        key={colorCode}
                        onClick={() => {
                          const optionKey = `thread_colors_${placement}` as keyof typeof embroideryOptions;
                          const currentColors = embroideryOptions[optionKey] as string[];
                          const isSelected = currentColors.includes(colorCode);
                          
                          setEmbroideryOptions({
                            ...embroideryOptions,
                            [optionKey]: isSelected 
                              ? currentColors.filter(c => c !== colorCode)
                              : [...currentColors, colorCode]
                          });
                        }}
                        className={`w-8 h-8 rounded border-2 transition-all relative ${
                          (embroideryOptions[`thread_colors_${placement}` as keyof typeof embroideryOptions] as string[]).includes(colorCode)
                            ? "border-gray-900 scale-110"
                            : "border-gray-200 hover:border-gray-400"
                        }`}
                        style={{ backgroundColor: colorCode }}
                        title={`${colorName} (${colorCode})`}
                      >
                        {(embroideryOptions[`thread_colors_${placement}` as keyof typeof embroideryOptions] as string[]).includes(colorCode) && (
                          <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow-md" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Selected: {(embroideryOptions[`thread_colors_${placement}` as keyof typeof embroideryOptions] as string[]).length} colors
                  </div>
                </div>
              );
            })}
            
            {/* Embroidery Notes */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">Special Instructions</label>
              <textarea
                value={embroideryOptions.notes}
                onChange={(e) => setEmbroideryOptions({...embroideryOptions, notes: e.target.value})}
                placeholder="Add any special embroidery instructions..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <div className="text-xs text-gray-500">
                Optional: Include thread brand preferences, stitch density, or other requirements
              </div>
            </div>

            {/* Embroidery Summary */}
            <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
              <div className="text-xs font-medium text-purple-700 mb-2">Customization Summary</div>
              <div className="space-y-1 text-xs text-purple-600">
                {Object.entries(embroideryOptions).map(([key, value]) => {
                  if (key === 'notes') {
                    return value ? (
                      <div key={key}>Notes: {(value as string).substring(0, 50)}...</div>
                    ) : null;
                  }
                  
                  const colors = value as string[];
                  if (colors.length === 0) return null;
                  
                  return (
                    <div key={key}>
                      {key.replace('thread_colors_', '').replace('_', ' ')}: {colors.length} colors
                    </div>
                  );
                })}
                {!Object.values(embroideryOptions).some(v => Array.isArray(v) ? v.length > 0 : v) && (
                  <div className="text-gray-500">No customizations selected</div>
                )}
              </div>
            </div>
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

      case "preview":
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">Final Preview</h3>
            
            {/* Generate Mockup Button */}
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
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {isGeneratingPreview ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Mockup...
                </div>
              ) : (
                "Generate Mockup"
              )}
            </button>

            {/* Mockup Status */}
            {mockupStatus && (
              <div className="p-3 bg-gray-800 border border-gray-700 rounded-lg">
                <p className="text-sm text-gray-300">{mockupStatus}</p>
              </div>
            )}

            {/* Requirements Check */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-400">Requirements</h4>
              <div className="space-y-1 text-xs">
                <div className={`flex items-center ${designFiles.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${designFiles.length > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {designFiles.length > 0 ? 'Designs added' : 'No designs added'}
                </div>
                <div className={`flex items-center ${selectedVariants.length > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  <div className={`w-2 h-2 rounded-full mr-2 ${selectedVariants.length > 0 ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  {selectedVariants.length > 0 ? `${selectedVariants.length} variants selected` : 'No variants selected'}
                </div>
              </div>
            </div>

            {/* Design Summary */}
            {designFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-gray-400">Design Summary</h4>
                <div className="space-y-2">
                  {Object.entries(
                    designFiles.reduce((acc, design) => {
                      if (!acc[design.placement]) acc[design.placement] = [];
                      acc[design.placement].push(design);
                      return acc;
                    }, {} as Record<string, typeof designFiles>)
                  ).map(([placement, designs]) => (
                    <div key={placement} className="p-2 bg-gray-800 rounded border border-gray-700">
                      <div className="text-xs text-gray-300 font-medium">{placement}</div>
                      <div className="text-xs text-gray-500">{designs.length} design(s)</div>
                    </div>
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
                      handleSelectFileForPlacement(file);
                      setChildPanelOpen(false);
                    }}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center"
                  >
                    <span className="text-white text-sm font-medium">Select File</span>
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

  const baseTabs = [
    { id: "product" as TabType, label: "Product", icon: Home },
    { id: "upload" as TabType, label: "Upload", icon: Upload },
    { id: "text" as TabType, label: "Text", icon: Type },
    { id: "clipart" as TabType, label: "Clipart", icon: Smile },
    { id: "placement" as TabType, label: "Design", icon: Zap }, // Combined placement + position
  ];

  // Add embroidery tab only for embroidery products
  const embroideryTab = isEmbroideryProduct 
    ? { id: "embroidery" as TabType, label: "Embroidery", icon: Scissors }
    : null;

  const advancedTab = { id: "advanced" as TabType, label: "Advanced", icon: Settings };
  const previewTab = { id: "preview" as TabType, label: "Preview", icon: PlayCircle };

  const tabs = embroideryTab 
    ? [...baseTabs, embroideryTab, advancedTab, previewTab]
    : [...baseTabs, advancedTab, previewTab];

  return (
    <div className="h-screen bg-black flex">
      {/* Main Sidebar - Tab Icons */}
      <div className="w-20 border-r border-gray-800 bg-gray-900 flex flex-col">
        {/* Product Info Header - Compact */}
        <div className="p-2 border-b border-gray-800 flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">
              {selectedProduct?.title?.substring(0, 2) || "PR"}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex-1 py-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full p-3 flex flex-col items-center justify-center transition-all duration-200 group relative ${
                  isActive
                    ? "bg-orange-500 text-white shadow-lg"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
                title={tab.label}
              >
                <IconComponent className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
                
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-orange-600 rounded-l-full"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Sidebar - Tab Content */}
      <div className="w-80 border-r border-gray-800 bg-gray-900 flex flex-col">
        {/* Product Info Header */}
        <div className="p-4 border-b border-gray-800 flex-shrink-0">
          <h1 className="text-lg font-semibold text-white truncate">
            {selectedProduct?.title || selectedProduct?.name}
          </h1>
          <div className="flex items-center mt-1 text-sm text-gray-400">
            <span>⭐ 4.5 • 2475 Reviews</span>
          </div>
        </div>

        {/* Current Tab Header */}
        <div className="border-b border-gray-800 flex-shrink-0 px-4 py-2">
          <div className="flex items-center">
            {(() => {
              const currentTab = tabs.find(t => t.id === activeTab);
              const IconComponent = currentTab?.icon;
              return (
                <>
                  {IconComponent && <IconComponent className="w-4 h-4 mr-2 text-orange-500" />}
                  <h2 className="text-sm font-semibold text-white">
                    {currentTab?.label || 'Tab Content'}
                  </h2>
                </>
              );
            })()}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {renderTabContent()}
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-gray-800 p-4 flex-shrink-0">
          <button
            onClick={() => {
              // Switch to design tab for seamless workflow
              if (activeTab === "product") {
                setActiveTab("placement");
              }
            }}
            className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-colors shadow-lg"
          >
            Start Designing
          </button>
        </div>
      </div>

      {/* Child Panel - Expandable */}
      {childPanelOpen && (
        <div className="w-80 border-r border-gray-800 bg-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-white">Options</h3>
            <button
              onClick={() => setChildPanelOpen(false)}
              className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {renderChildPanelContent()}
          </div>
        </div>
      )}

      {/* Placement Panel - Appears when file is selected */}
      {showPlacementPanel && selectedFileForPlacement && (
        <div className="w-80 border-r border-gray-800 bg-gradient-to-b from-gray-800 to-gray-900 flex flex-col max-h-screen">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/90 backdrop-blur-sm">
            <h3 className="font-bold text-white flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Design Placement
            </h3>
            <button
              onClick={() => {
                setShowPlacementPanel(false);
                setSelectedFileForPlacement(null);
              }}
              className="p-1.5 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            <div className="p-4 space-y-6">
              {/* 1. Selected File Preview */}
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/30">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Selected Design
                </h4>
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-gray-600 rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={selectedFileForPlacement.thumbnail_url || selectedFileForPlacement.url}
                      alt={selectedFileForPlacement.filename}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {selectedFileForPlacement.filename}
                    </p>
                    <p className="text-xs text-gray-400">
                      {Math.round((selectedFileForPlacement.file_size as number) / 1024)}KB
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Placement Selection */}
              <div className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/30">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center">
                    <Move className="w-4 h-4 mr-2" />
                    Choose Placement
                    {selectedPlacements.length > 0 && (
                      <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded-full shadow-lg">
                        {selectedPlacements.length} selected
                      </span>
                    )}
                  </h4>
                  {placementTabs.length > 0 && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          if (selectedPlacements.length === placementTabs.length) {
                            // Clear all
                            setSelectedPlacements([]);
                            setActivePlacement("");
                            setDesignFiles((prev: DesignFile[]) => prev.filter((df: DesignFile) => !placementTabs.some(tab => tab.id === df.placement)));
                            toast.success("Cleared all placements");
                          } else {
                            // Select all
                            const allPlacements = placementTabs.map(tab => tab.id);
                            setSelectedPlacements(allPlacements);
                            // Set first placement as active
                            setActivePlacement(allPlacements[0]);
                            
                            // Create designs for all placements
                            const printFile = printFiles?.printfiles?.[0];
                            if (printFile && selectedFileForPlacement) {
                              const newDesigns = allPlacements.map(placement => ({
                                id: Date.now() + Math.random() + Math.random(),
                                filename: selectedFileForPlacement.filename,
                                url: selectedFileForPlacement.thumbnail_url || selectedFileForPlacement.url,
                                type: "design" as const,
                                placement: placement,
                                position: {
                                  area_width: printFile.width,
                                  area_height: printFile.height,
                                  width: Math.min(printFile.width * 0.4, 250),
                                  height: Math.min(printFile.height * 0.4, 250),
                                  left: Math.max(0, (printFile.width - Math.min(printFile.width * 0.4, 250)) / 2),
                                  top: Math.max(0, (printFile.height - Math.min(printFile.height * 0.4, 250)) / 2),
                                  limit_to_print_area: true,
                                },
                              }));
                              
                              // Remove existing designs for these placements and add new ones (prevent duplicates)
                              setDesignFiles((prev: DesignFile[]) => [...prev.filter((df: DesignFile) => !allPlacements.includes(df.placement || "")), ...newDesigns]);
                              toast.success("Selected all placements");
                            }
                          }
                          setActiveTab("placement");
                        }}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-300 hover:text-white rounded transition-colors"
                      >
                        {selectedPlacements.length === placementTabs.length ? "Clear All" : "Select All"}
                      </button>
                    </div>
                  )}
                </div>
                {placementTabs.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2">
                    {placementTabs.map((tab) => {
                      const isSelected = selectedPlacements.includes(tab.id);
                      const isActive = activePlacement === tab.id;
                      
                      return (
                        <div key={tab.id} className="flex gap-2">
                          {/* Main placement button */}
                          <button
                            onClick={() => handleTogglePlacementSelection(tab.id)}
                            className={`flex-1 flex items-center justify-between px-4 py-3 border rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                              isActive
                                ? 'bg-gradient-to-r from-green-600/40 to-blue-600/40 border-green-500 text-white shadow-lg shadow-green-500/20'
                                : isSelected
                                ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border-blue-500 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-orange-500 hover:bg-orange-900/20 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center">
                              {/* Checkbox indicator */}
                              <div className={`w-4 h-4 border-2 rounded mr-3 flex items-center justify-center transition-all duration-200 ${
                                isSelected 
                                  ? isActive 
                                    ? 'bg-green-500 border-green-500' 
                                    : 'bg-blue-500 border-blue-500'
                                  : 'border-gray-500 bg-transparent'
                              }`}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              {tab.isEmbroidery && (
                                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2 shadow-lg" title="Embroidery placement"></div>
                              )}
                              <span className="font-medium">{tab.label}</span>
                              {isActive && (
                                <span className="ml-2 text-xs bg-green-600 px-2 py-0.5 rounded-full shadow-lg">
                                  EDITING
                                </span>
                              )}
                            </div>
                            <div className="flex items-center">
                              {tab.hasDesign && (
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 shadow-lg" title="Has existing design"></div>
                              )}
                              {isSelected ? (
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                  isActive ? 'bg-green-500' : 'bg-blue-500'
                                }`}>
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              ) : (
                                <ChevronRight className="w-4 h-4 opacity-60" />
                              )}
                            </div>
                          </button>
                          
                          {/* Edit button for selected placements */}
                          {isSelected && !isActive && (
                            <button
                              onClick={() => handleSetActivePlacement(tab.id)}
                              className="px-3 py-3 bg-green-600 hover:bg-green-700 border border-green-500 rounded-lg text-white text-xs font-medium transition-colors shadow-lg"
                              title="Edit this placement"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">No placements available</p>
                )}
              </div>

              {/* 3. Position Controls - Shows when design is placed */}
              {selectedDesignFile && (
                <div className="bg-gradient-to-br from-green-900/30 to-blue-900/30 rounded-xl p-4 border border-green-500/30 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white flex items-center">
                      <Settings className="w-4 h-4 mr-2" />
                      Design Controls
                      {activePlacement && (
                        <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded-full shadow-lg">
                          {placementTabs.find(p => p.id === activePlacement)?.label || activePlacement}
                        </span>
                      )}
                    </h4>
                    {/* Make preview permanent button */}
                    {selectedDesignFile.id === -1 && (
                      <button
                        onClick={handleMakePreviewPermanent}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 text-white text-xs rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-lg font-medium"
                      >
                        Add Permanently
                      </button>
                    )}
                  </div>
                
                {/* Professional Design Controls Section */}
                <div className="space-y-6">
                  {/* Pixel Position Controls */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center mb-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                      <h5 className="text-sm font-semibold text-white">Pixel Position</h5>
                    </div>
                    <div className="space-y-3">
                      {/* Position Controls */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">X Position</label>
                          <input
                            type="number"
                            value={Math.round(selectedDesignFile.position.left)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              updateDesignPosition(selectedDesignFile.id, { left: value });
                            }}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            min={0}
                            max={activePrintFile?.width || 2000}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">Y Position</label>
                          <input
                            type="number"
                            value={Math.round(selectedDesignFile.position.top)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              updateDesignPosition(selectedDesignFile.id, { top: value });
                            }}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            min={0}
                            max={activePrintFile?.height || 2000}
                          />
                        </div>
                      </div>
                      
                      {/* Size Controls */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">Width</label>
                          <input
                            type="number"
                            value={Math.round(selectedDesignFile.position.width)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 50;
                              updateDesignPosition(selectedDesignFile.id, { width: value });
                            }}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            min={50}
                            max={activePrintFile?.width || 2000}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-300 mb-2">Height</label>
                          <input
                            type="number"
                            value={Math.round(selectedDesignFile.position.height)}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 50;
                              updateDesignPosition(selectedDesignFile.id, { height: value });
                            }}
                            className="w-full px-3 py-2 border border-gray-600 rounded-lg text-sm bg-gray-700 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                            min={50}
                            max={activePrintFile?.height || 2000}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Position Grid */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center mb-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                      <h5 className="text-sm font-semibold text-white">Quick Position</h5>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        'top-left', 'top-center', 'top-right',
                        'center-left', 'center', 'center-right',
                        'bottom-left', 'bottom-center', 'bottom-right'
                      ].map((position) => (
                        <button
                          key={position}
                          onClick={() => applyQuickPosition(position)}
                          className="aspect-square border border-gray-600 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-blue-900/30 transition-all duration-200 group"
                          title={position.replace('-', ' ')}
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full group-hover:scale-125 transition-transform"></div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alignment Controls */}
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
                    <div className="flex items-center mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <h5 className="text-sm font-semibold text-white">Alignment Controls</h5>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => applyQuickPosition('center-left')}
                        className="px-3 py-3 border border-gray-600 rounded-lg flex items-center justify-center hover:border-green-500 hover:bg-green-900/30 transition-all duration-200 group"
                        title="Align Left"
                      >
                        <AlignLeft className="w-4 h-4 text-gray-300 group-hover:text-green-400" />
                      </button>
                      <button
                        onClick={() => applyQuickPosition('center')}
                        className="px-3 py-3 border border-gray-600 rounded-lg flex items-center justify-center hover:border-green-500 hover:bg-green-900/30 transition-all duration-200 group"
                        title="Align Center"
                      >
                        <AlignCenter className="w-4 h-4 text-gray-300 group-hover:text-green-400" />
                      </button>
                      <button
                        onClick={() => applyQuickPosition('center-right')}
                        className="px-3 py-3 border border-gray-600 rounded-lg flex items-center justify-center hover:border-green-500 hover:bg-green-900/30 transition-all duration-200 group"
                        title="Align Right"
                      >
                        <AlignRight className="w-4 h-4 text-gray-300 group-hover:text-green-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      )}

      {/* Right Panel - Flexible */}
      <div className="flex-1 flex flex-col bg-black">
        {/* Preview Header */}
        <div className="bg-gray-900 border-b border-gray-800 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              {activeTab === "product" ? "Product Overview" :
               activeTab === "placement" ? "Design Canvas" :
               activeTab === "preview" ? "Final Mockups" : "Canvas Preview"}
            </h2>
            <div className="text-sm text-gray-400">
              {selectedVariants.length} variants selected
            </div>
          </div>
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex">
          {/* Screen 1: Product Overview */}
          {activeTab === "product" && (
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-6">
              {selectedColors.length > 0 ? (
                <div className="max-w-2xl">
                  <Image
                    src={
                      selectedProduct?.variants?.find((v) =>
                        selectedColors.includes(v.color)
                      )?.image || "/placeholder-product.jpg"
                    }
                    alt="Product"
                    width={600}
                    height={600}
                    className="w-auto h-auto max-h-[70vh] object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Home className="w-8 h-8" />
                  </div>
                  <p>Select product variants to see preview</p>
                </div>
              )}
            </div>
          )}

          {/* Screen 2: Design Canvas */}
          {activeTab === "placement" && (
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-6">
              <div className="w-full max-w-4xl">
                {(() => {
                  const canvasDims = getCanvasDimensions();
                  return (
                    <>
                      {/* Design Canvas Area */}
                      <div className="bg-white rounded-xl border-2 border-gray-300 relative shadow-2xl overflow-hidden" style={{
                        width: `${canvasDims.width}px`,
                        height: `${canvasDims.height}px`,
                        margin: '0 auto',
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6)'
                      }}>
                  {designFiles.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                          <Zap className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-lg font-medium mb-2 text-gray-700">Product Canvas</p>
                        <p className="text-sm text-gray-500">Select a file to add your design</p>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Design elements container */}
                  <div className="absolute inset-0 w-full h-full">
                      {/* Design elements will appear here */}
                      {designFiles.filter((design) => design.placement === activePlacement).map((design) => {
                        // Scale design to fit in dynamic canvas
                        const canvasWidth = canvasDims.width;
                        const canvasHeight = canvasDims.height;
                        const printFile = activePrintFile;
                        
                        // Calculate scaling factor to fit print file in canvas
                        const scaleX = printFile ? canvasWidth / printFile.width : 0.5;
                        const scaleY = printFile ? canvasHeight / printFile.height : 0.5;
                        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down
                        
                        const scaledSize = {
                          width: design.position.width * scale,
                          height: design.position.height * scale
                        };
                        
                        const scaledPosition = {
                          x: design.position.left * scale,
                          y: design.position.top * scale
                        };
                        
                        return (
                          <Rnd
                            key={design.id}
                            size={scaledSize}
                            position={scaledPosition}
                            onDragStop={(_e, data) => {
                              updateDesignPosition(design.id, {
                                left: data.x / scale,
                                top: data.y / scale
                              });
                            }}
                            onResizeStop={(_e, _direction, ref, _delta, position) => {
                              updateDesignPosition(design.id, {
                                width: parseInt(ref.style.width) / scale,
                                height: parseInt(ref.style.height) / scale,
                                left: position.x / scale,
                                top: position.y / scale
                              });
                            }}
                            bounds="parent"
                            minWidth={30}
                            minHeight={30}
                            className={`border rounded ${
                              selectedDesignFile?.id === design.id 
                                ? "border-orange-500 border-2" 
                                : "border-orange-500/50"
                            } ${design.id === -1 ? 'bg-blue-100/20' : 'bg-white/10'}`}
                            onClick={() => setSelectedDesignFile(design)}
                          >
                          {design.filename.endsWith('.txt') ? (
                            // Render text
                            <div className="w-full h-full flex items-center justify-center p-2 text-gray-900 font-semibold text-center overflow-hidden">
                              {decodeURIComponent(design.url.split(',')[1] || '')}
                            </div>
                          ) : (
                            // Render image
                            <img
                              src={design.url}
                              alt={design.filename}
                              className="w-full h-full object-contain"
                              draggable={false}
                            />
                          )}
                            <div className="absolute -top-6 left-0 text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                              {design.placement} {design.id === -1 && '(Preview)'}
                            </div>
                            {/* Remove button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Remove the design from this placement
                                setDesignFiles((prev: DesignFile[]) => prev.filter((df: DesignFile) => df.id !== design.id));
                                
                                // Remove placement from selected placements
                                setSelectedPlacements(prevPlacements => prevPlacements.filter(p => p !== design.placement));
                                
                                // Clear active placement and selectedDesignFile if this was the active one
                                if (activePlacement === design.placement) {
                                  const remainingPlacements = selectedPlacements.filter(p => p !== design.placement);
                                  if (remainingPlacements.length > 0) {
                                    setActivePlacement(remainingPlacements[0]);
                                  } else {
                                    setActivePlacement("");
                                    setSelectedDesignFile(null);
                                  }
                                }
                                
                                toast.success(`Removed design from ${design.placement}`);
                              }}
                              className="absolute -top-6 -right-2 w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center text-xs transition-colors shadow-lg"
                              title="Remove from placement"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Rnd>
                        );
                      })}
                  </div>
                </div>
                
                {/* Canvas Controls */}
                <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <div>Canvas Size: {canvasDims.width} x {canvasDims.height}</div>
                  <div>•</div>
                  <div>Active Placement: {activePlacement || "None"}</div>
                  <div>•</div>
                  <div>Designs: {designFiles.length}</div>
                </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Screen 3: Final Mockups */}
          {activeTab === "preview" && (
            <div className="flex-1 bg-gray-900 min-h-screen">
              {/* Preview Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Mockup Preview</h2>
                    <p className="text-gray-400 text-sm">Generate and review your product mockups</p>
                  </div>
                  
                  {/* Generate Preview Button */}
                  <button
                    onClick={() => onGeneratePreview({
                      technique: selectedTechnique,
                      lifelike: advancedOptions.lifelike,
                      width: advancedOptions.width,
                      optionGroups: advancedOptions.optionGroups,
                      options: advancedOptions.options,
                    })}
                    disabled={isGeneratingPreview || designFiles.length === 0}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    {isGeneratingPreview ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-5 h-5" />
                        Generate Preview
                      </>
                    )}
                  </button>
                </div>
                
                {/* Generation Status */}
                {isGeneratingPreview && mockupStatus && (
                  <div className="mt-4 p-4 bg-orange-900/20 border border-orange-500/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      <span className="text-orange-300 text-sm font-medium">{mockupStatus}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Preview Content */}
              <div className="flex-1 p-6">
                {mockupUrls && mockupUrls.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockupUrls.map((mockup, index) => (
                      <div key={index} className="bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                        <div className="aspect-square bg-gray-700 flex items-center justify-center">
                          <Image
                            src={mockup.url}
                            alt={mockup.title || `Mockup ${index + 1}`}
                            width={400}
                            height={400}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-white font-semibold text-sm mb-1">
                            {mockup.title || `Mockup ${index + 1}`}
                          </h3>
                          <p className="text-gray-400 text-xs">
                            {mockup.placement} • {mockup.variant_ids?.length || 1} variants
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <PlayCircle className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">No Mockups Generated</h3>
                      <p className="text-gray-400 mb-6">
                        {designFiles.length === 0 
                          ? "Add designs from the Upload tab, then return here to generate mockups."
                          : "Click 'Generate Preview' to create product mockups with your designs."
                        }
                      </p>
                      {designFiles.length > 0 && (
                        <button
                          onClick={() => onGeneratePreview({
                            technique: selectedTechnique,
                            lifelike: advancedOptions.lifelike,
                            width: advancedOptions.width,
                            optionGroups: advancedOptions.optionGroups,
                            options: advancedOptions.options,
                          })}
                          disabled={isGeneratingPreview}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isGeneratingPreview ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <PlayCircle className="w-4 h-4" />
                              Generate Preview
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onPrev}
            className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 hover:text-white transition-colors font-medium"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Step 2 of 3 - Design Editor
            </span>
          </div>

          <button
            onClick={onNext}
            disabled={designFiles.length === 0 || (mockupUrls?.length === 0)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Product Details
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Advanced Options Modal */}
      {showAdvancedOptions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-2xl max-h-[90vh] overflow-y-auto m-4 border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Advanced Options</h3>
              <button
                onClick={() => setShowAdvancedOptions(false)}
                className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Mockup technique selection, lifelike options, etc. */}
              <div className="text-center text-gray-400 p-8">
                <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-lg text-white mb-2">Advanced Options</p>
                <p className="text-sm">Configure mockup generation settings</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedDesignEditor;