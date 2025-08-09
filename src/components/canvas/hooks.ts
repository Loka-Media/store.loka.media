import { useState, useEffect } from 'react';
import { printfulAPI } from '@/lib/api';
import { Product, DesignFile, PrintFilesData, AdvancedMockupOptions, EmbroideryOptions } from './types';
import { getUniqueSizes, getUniqueColors } from './utils';

export const useDesignEditorState = (selectedProduct: Product) => {
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
  const [selectedFileForPlacement, setSelectedFileForPlacement] = useState<any | null>(null);
  const [showPlacementPanel, setShowPlacementPanel] = useState(false);

  // Advanced mockup options
  const [advancedOptions, setAdvancedOptions] = useState<AdvancedMockupOptions>({
    width: 1600,
    lifelike: true,
    optionGroups: [] as string[],
    options: [] as string[],
  });

  // Embroidery-specific options
  const [embroideryOptions, setEmbroideryOptions] = useState<EmbroideryOptions>({
    thread_colors_chest_left: [] as string[],
    thread_colors_wrist_left: [] as string[],
    thread_colors_wrist_right: [] as string[],
    notes: ""
  });

  const uniqueSizes = getUniqueSizes(selectedProduct);
  const uniqueColors = getUniqueColors(selectedProduct);

  return {
    selectedSizes,
    setSelectedSizes,
    selectedColors,
    setSelectedColors,
    activePlacement,
    setActivePlacement,
    selectedPlacements,
    setSelectedPlacements,
    selectedDesignFile,
    setSelectedDesignFile,
    loadingPrintFiles,
    setLoadingPrintFiles,
    printFilesLoaded,
    setPrintFilesLoaded,
    selectedTechnique,
    setSelectedTechnique,
    isUploading,
    setIsUploading,
    textContent,
    setTextContent,
    currentMockupIndex,
    setCurrentMockupIndex,
    showLivePreview,
    setShowLivePreview,
    showAdvancedOptions,
    setShowAdvancedOptions,
    childPanelOpen,
    setChildPanelOpen,
    childPanelContent,
    setChildPanelContent,
    selectedFileForPlacement,
    setSelectedFileForPlacement,
    showPlacementPanel,
    setShowPlacementPanel,
    advancedOptions,
    setAdvancedOptions,
    embroideryOptions,
    setEmbroideryOptions,
    uniqueSizes,
    uniqueColors
  };
};

export const usePrintFilesLoader = (
  selectedProduct: Product,
  selectedVariants: number[],
  printFilesLoaded: boolean,
  loadingPrintFiles: boolean,
  setLoadingPrintFiles: (loading: boolean) => void,
  setPrintFilesLoaded: (loaded: boolean) => void,
  onPrintFilesLoaded?: (printFiles: PrintFilesData) => void,
  setSelectedTechnique?: (technique: string) => void
) => {
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
          const allowedTechniquesMatch = errorMessage.match(/Allowed values?:\\s*([A-Z,\\s]+)/i);
          if (allowedTechniquesMatch) {
            const allowedTechniques = allowedTechniquesMatch[1]
              .split(',')
              .map((t: string) => t.trim())
              .filter((t: string) => t);
            
            console.log("Parsed allowed techniques:", allowedTechniques);
            
            if (allowedTechniques.length > 0) {
              const fallbackTechnique = allowedTechniques[0];
              console.log("Retrying with fallback technique:", fallbackTechnique);
              
              try {
                setSelectedTechnique?.(fallbackTechnique);
                printFilesResponse = await printfulAPI.getPrintFiles(selectedProduct.id, fallbackTechnique);
                console.log(`✅ Successfully loaded print files with technique: ${fallbackTechnique}`);
              } catch (fallbackError) {
                console.error("Fallback technique also failed:", fallbackError);
                throw fallbackError;
              }
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }

        console.log("Print files response:", printFilesResponse);

        if (printFilesResponse?.result) {
          setPrintFilesLoaded(true);
          onPrintFilesLoaded?.(printFilesResponse.result);
        }
      } catch (error) {
        console.error("Failed to load print files:", error);
      } finally {
        setLoadingPrintFiles(false);
      }
    };

    loadPrintFiles();
  }, [selectedVariants, selectedProduct?.id, printFilesLoaded, loadingPrintFiles]);
};

export const useAutoSelectVariants = (
  selectedProduct: Product,
  uniqueSizes: string[],
  uniqueColors: any[],
  selectedSizes: string[],
  selectedColors: string[],
  setSelectedSizes: (sizes: string[]) => void,
  setSelectedColors: (colors: string[]) => void,
  setShowLivePreview: (show: boolean) => void,
  setSelectedVariants: (variants: number[]) => void
) => {
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
};