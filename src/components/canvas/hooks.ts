import { useState, useEffect } from 'react';
import { printfulAPI } from '@/lib/api';
import { Product, DesignFile, PrintFilesData, AdvancedMockupOptions, EmbroideryOptions } from './types';
import { getUniqueSizes, getUniqueColors } from './utils';

export const useDesignEditorState = (selectedProduct: Product, designFiles?: DesignFile[]) => {
  // Initialize placements from designFiles if available
  const initialPlacements = designFiles && designFiles.length > 0
    ? [...new Set(designFiles.map(d => d.placement))]
    : [];
  const initialActivePlacement = initialPlacements.length > 0 ? initialPlacements[0] : "";
  const initialSelectedDesign = designFiles && designFiles.length > 0 ? designFiles[0] : null;

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [activePlacement, setActivePlacement] = useState<string>(initialActivePlacement);
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>(initialPlacements);
  const [selectedDesignFile, setSelectedDesignFile] = useState<DesignFile | null>(initialSelectedDesign);
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
        let retryCount = 0;
        const maxRetries = 3;
        const attemptedTechniques = new Set<string>();

        console.log(`🎯 Attempting to load print files for product ${selectedProduct.id} without technique parameter (letting API use default)`);

        try {
          // Try without technique parameter first (API will use default)
          printFilesResponse = await printfulAPI.getPrintFiles(selectedProduct.id);
          console.log(`✅ Successfully loaded print files with default technique`);
        } catch (error: any) {
          console.warn("Default technique attempt failed:", error);

          // CRITICAL FIX: Prevent infinite retry loops with max retries and tracking
          let loadSucceeded = false;

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

            // Try each allowed technique only once
            for (const technique of allowedTechniques) {
              if (retryCount >= maxRetries || attemptedTechniques.has(technique)) {
                break;
              }

              attemptedTechniques.add(technique);
              retryCount++;

              console.log(`Attempting technique #${retryCount}: ${technique}`);

              try {
                setSelectedTechnique?.(technique);
                printFilesResponse = await printfulAPI.getPrintFiles(selectedProduct.id, technique);
                console.log(`✅ Successfully loaded print files with technique: ${technique}`);
                loadSucceeded = true;
                break;
              } catch (techniqueError) {
                console.warn(`Technique ${technique} failed:`, techniqueError);
                // Continue to next technique
              }
            }

            if (!loadSucceeded) {
              throw new Error(`Failed to load print files after ${maxRetries} retries`);
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
    // CRITICAL FIX: Include all dependencies that affect the effect
  }, [selectedProduct?.id, uniqueSizes.length, uniqueColors.length, selectedSizes.length, selectedColors.length, setSelectedSizes, setSelectedColors]);

  // Show live preview when colors are selected
  useEffect(() => {
    if (selectedColors.length > 0) {
      setShowLivePreview(true);
    }
  }, [selectedColors]);

  // Update selected variants when size/color changes with availability validation
  useEffect(() => {
    if (!selectedProduct?.variants) return;

    const validateAndSetVariants = async () => {
      const filteredVariants = selectedProduct.variants?.filter(
        (variant) =>
          selectedSizes.includes(variant.size) &&
          selectedColors.includes(variant.color)
      );

      if (!filteredVariants || filteredVariants.length === 0) {
        setSelectedVariants([]);
        return;
      }

      // Extract variant IDs for availability check
      const variantIds = filteredVariants.map((v) => v.id);
      console.log(`🔍 Validating availability for ${variantIds.length} selected variants...`);

      try {
        // Check variant availability dynamically
        const variantsForCheck = variantIds.map((variantId: number) => ({
          variant_id: variantId,
          quantity: 1
        }));
        const availabilityResponse = await printfulAPI.checkVariantAvailability(variantsForCheck);
        
        if (availabilityResponse.result && availabilityResponse.result.variants) {
          // Create map of availability results
          const availabilityMap = new Map();
          availabilityResponse.result.variants.forEach((v: any) => {
            availabilityMap.set(v.variant_id, v);
          });
          
          // Filter out unavailable variants
          const availableVariants = filteredVariants.filter(variant => {
            const availabilityInfo = availabilityMap.get(variant.id);
            return availabilityInfo?.can_create_product !== false;
          });
          
          // Count filtered variants
          const originalCount = filteredVariants.length;
          const availableCount = availableVariants.length;
          const filteredOutCount = originalCount - availableCount;
          
          if (filteredOutCount > 0) {
            console.warn(`⚠️ ${filteredOutCount} variant${filteredOutCount > 1 ? 's' : ''} filtered out (discontinued/unavailable)`);
            
            // Show user-friendly notification
            const filteredVariantNames = filteredVariants
              .filter(variant => {
                const availabilityInfo = availabilityMap.get(variant.id);
                return availabilityInfo?.can_create_product === false;
              })
              .map(v => `${v.color} ${v.size}`)
              .join(', ');
              
            if (filteredVariantNames) {
              console.log(`Filtered out variants: ${filteredVariantNames}`);
            }
          }
          
          setSelectedVariants(availableVariants.map((v) => v.id));
          console.log(`✅ ${availableCount}/${originalCount} variants available for selection`);
        } else {
          // If availability check fails, log warning but allow variants
          console.warn('⚠️ Could not verify variant availability, proceeding with filtered variants');
          setSelectedVariants(variantIds);
        }
      } catch (error) {
        console.error('❌ Variant availability check failed:', error);
        // Fallback: allow variants but log the issue
        setSelectedVariants(variantIds);
      }
    };

    validateAndSetVariants();
  }, [selectedSizes, selectedColors, selectedProduct, setSelectedVariants]);
};