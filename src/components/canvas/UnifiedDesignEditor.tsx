/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Home,
  Upload,
  Type,
  Smile,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Scissors,
  PlayCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

// Import tab components
import ProductTabContent from "./tabs/ProductTabContent";
import UploadTabContent from "./tabs/UploadTabContent";
import TextTabContent from "./tabs/TextTabContent";
import ClipartTabContent from "./tabs/ClipartTabContent";
import DesignTabContent from "./tabs/DesignTabContent";
import EmbroideryTabContent from "./tabs/EmbroideryTabContent";
import AdvancedTabContent from "./tabs/AdvancedTabContent";
import DesignCanvasTab from "./DesignCanvasTab";
import PreviewTab from "./PreviewTab";
import ProductOverviewTab from "./ProductOverviewTab";
import PositionControlPanel from "./PositionControlPanel";

// Import types, hooks and utils
import {
  UnifiedDesignEditorProps,
  TabType,
  DesignFile,
  UploadedFile,
} from "./types";
import {
  useDesignEditorState,
  usePrintFilesLoader,
  useAutoSelectVariants
} from "./hooks";
import {
  getActivePrintFile,
  isEmbroideryProduct,
  applyQuickPosition,
  calculateAspectRatioAwareDimensions,
  validateDesignForPrintful,
  autoFixDesignForPrintful,
  validateOrderDesigns
} from "./utils";
import { printfulAPI } from "@/lib/api";

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
  const [childPanelOpen, setChildPanelOpen] = useState(false);
  const [childPanelContent, setChildPanelContent] = useState<string>("");
  const [selectedFileForPlacement, setSelectedFileForPlacement] = useState<UploadedFile | null>(null);
  const [showPlacementPanel, setShowPlacementPanel] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showPositionPanel, setShowPositionPanel] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);

  // Use custom hooks for state management
  const stateHook = useDesignEditorState(selectedProduct);
  const {
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
    setShowLivePreview,
    advancedOptions,
    setAdvancedOptions,
    embroideryOptions,
    setEmbroideryOptions,
    uniqueSizes,
    uniqueColors
  } = stateHook;

  // Check if this is an embroidery product
  const isEmbroideryProd = isEmbroideryProduct(selectedProduct, selectedTechnique);
  
  const embroideryProductOptions = (selectedProduct as any)?.options || [];

  // CRITICAL: Comprehensive pre-order validation system
  const validateBeforeOrderProcessing = (): boolean => {
    console.log("🔍 Starting comprehensive order validation...");
    
    // 1. Check if we have design files
    if (designFiles.length === 0) {
      toast.error("No designs added yet! Please add at least one design before proceeding.", {
        duration: 6000
      });
      return false;
    }

    // 2. Check if variants are selected
    if (selectedVariants.length === 0) {
      toast.error("No product variants selected! Please select at least one variant.", {
        duration: 6000
      });
      return false;
    }

    // 3. Comprehensive design validation
    const orderValidation = validateOrderDesigns(designFiles, printFiles, selectedVariants);
    
    if (!orderValidation.isValid) {
      console.error("❌ Order validation failed:", orderValidation.errors);
      toast.error(`Design validation failed: ${orderValidation.errors[0]}`, {
        duration: 8000
      });
      return false;
    }

    if (orderValidation.warnings.length > 0) {
      console.log("⚠️ Order validation warnings:", orderValidation.warnings);
      toast(`⚠️ Warning: ${orderValidation.warnings[0]}`, {
        icon: '⚠️',
        duration: 5000
      });
    }

    console.log(`✅ Order validation passed! ${orderValidation.validatedDesigns.length} designs are ready for Printful.`);
    return true;
  };

  // Enhanced preview generation with validation
  const handleValidatedPreviewGeneration = (advancedOptions?: any) => {
    console.log("🎯 Starting validated preview generation...");
    
    // CRITICAL: Always validate before proceeding
    if (!validateBeforeOrderProcessing()) {
      return;
    }

    // All validations passed - proceed with original preview generation
    console.log("✅ All validations passed, generating preview...");
    onGeneratePreview(advancedOptions);
  };
  
  // Parse thread color options for each placement
  const getThreadColorOptions = (placementKey: string) => {
    const option = embroideryProductOptions.find((opt: any) => 
      opt.id === `thread_colors_${placementKey}`
    );
    return option?.values || {};
  };

  // Use custom hooks for complex logic
  usePrintFilesLoader(
    selectedProduct,
    selectedVariants,
    printFilesLoaded,
    loadingPrintFiles,
    setLoadingPrintFiles,
    setPrintFilesLoaded,
    onPrintFilesLoaded,
    setSelectedTechnique
  );

  useAutoSelectVariants(
    selectedProduct,
    uniqueSizes,
    uniqueColors,
    selectedSizes,
    selectedColors,
    setSelectedSizes,
    setSelectedColors,
    setShowLivePreview,
    setSelectedVariants
  );

  // Handler functions
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const result = await printfulAPI.uploadFileDirectly(file);
      
      if (result.result) {
        toast.success("File uploaded successfully!");
        onRefreshFiles?.();
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDesign = async (file: UploadedFile, placement: string): Promise<void> => {
    const activePrintFile = getActivePrintFile(printFiles, selectedVariants, placement);
    if (!activePrintFile) {
      toast.error("No print file available for this placement");
      return;
    }

    // Calculate position offset for multiple designs on same placement
    const existingDesignsOnPlacement = designFiles.filter(df => df.placement === placement);
    const offsetMultiplier = existingDesignsOnPlacement.length;
    const baseOffset = 20;

    try {
      // SMART IMAGE ADAPTATION: Auto-adapt any image to work perfectly
      const imageUrl = file.file_url || file.thumbnail_url || '';
      const dimensionResult = await calculateAspectRatioAwareDimensions(
        imageUrl, 
        activePrintFile, 
        0.7, // Max 70% of print area for better visibility
        true // Enable smart adaptation
      );
      
      const { width: aspectAwareWidth, height: aspectAwareHeight, adapted } = dimensionResult;

      // Calculate position with slight offset for multiple designs
      const baseTop = (activePrintFile.height - aspectAwareHeight) / 2;
      const baseLeft = (activePrintFile.width - aspectAwareWidth) / 2;
      
      const newDesign: DesignFile = {
        id: Date.now() + offsetMultiplier, // Ensure unique IDs
        filename: file.filename,
        url: imageUrl,
        type: "design",
        placement,
        position: {
          area_width: activePrintFile.width,
          area_height: activePrintFile.height,
          width: aspectAwareWidth,
          height: aspectAwareHeight,
          top: Math.max(0, baseTop + (offsetMultiplier * baseOffset)),
          left: Math.max(0, baseLeft + (offsetMultiplier * baseOffset)),
          limit_to_print_area: true,
        },
      };

      // CRITICAL: Validate design against Printful requirements before adding
      const validation = validateDesignForPrintful(newDesign, activePrintFile, true);
      
      if (!validation.isValid) {
        // Auto-fix the design if possible
        console.log("⚠️ Design validation failed, attempting auto-fix:", validation.errors);
        const fixedDesign = autoFixDesignForPrintful(newDesign, activePrintFile);
        
        // Re-validate the fixed design
        const fixedValidation = validateDesignForPrintful(fixedDesign, activePrintFile, true);
        
        if (fixedValidation.isValid) {
          console.log("✅ Auto-fix successful");
          setDesignFiles([...designFiles, fixedDesign]);
          setSelectedDesignFile(fixedDesign);
          toast.success(`${file.filename} added with automatic corrections for Printful compatibility!`, {
            icon: '🔧',
            duration: 4000
          });
        } else {
          // Even auto-fix failed - this should be very rare
          console.error("❌ Auto-fix failed:", fixedValidation.errors);
          toast.error(`Unable to add ${file.filename}: ${fixedValidation.errors[0]}`, {
            duration: 6000
          });
          return;
        }
      } else {
        // Design is already valid
        console.log("✅ Design validation passed");
        setDesignFiles([...designFiles, newDesign]);
        setSelectedDesignFile(newDesign);
        
        if (validation.warnings.length > 0) {
          console.log("⚠️ Design warnings:", validation.warnings);
        }
        
        // Success message with smart adaptation info
        const totalCount = existingDesignsOnPlacement.length + 1;
        if (adapted) {
          toast.success(`${file.filename} auto-adapted to perfect ${placement} fit! 🎯`, {
            icon: '✨',
            duration: 4000
          });
        } else if (totalCount === 1) {
          toast.success(`${file.filename} added to ${placement}! ✅ Perfect fit`, {
            icon: '✨',
            duration: 3000
          });
        } else {
          toast.success(`${file.filename} added to ${placement}! (${totalCount} total)`, {
            duration: 3000
          });
        }
      }
    } catch (error) {
      console.error("Failed to calculate aspect-ratio aware dimensions:", error);
      
      // Fallback to safe default dimensions that maintain print area aspect ratio
      const safeWidth = activePrintFile.width * 0.6;
      const safeHeight = activePrintFile.height * 0.6;
      
      const baseTop = (activePrintFile.height - safeHeight) / 2;
      const baseLeft = (activePrintFile.width - safeWidth) / 2;
      
      const newDesign: DesignFile = {
        id: Date.now() + offsetMultiplier,
        filename: file.filename,
        url: file.file_url || file.thumbnail_url || '',
        type: "design",
        placement,
        position: {
          area_width: activePrintFile.width,
          area_height: activePrintFile.height,
          width: Math.round(safeWidth),
          height: Math.round(safeHeight),
          top: Math.max(0, baseTop + (offsetMultiplier * baseOffset)),
          left: Math.max(0, baseLeft + (offsetMultiplier * baseOffset)),
          limit_to_print_area: true,
        },
      };

      setDesignFiles([...designFiles, newDesign]);
      setSelectedDesignFile(newDesign);
      toast.success(`Design added to ${placement}! (Using safe dimensions)`);
    }
  };

  const handleAddTextToDesign = () => {
    if (!textContent.trim() || !activePlacement) return;

    const activePrintFile = getActivePrintFile(printFiles, selectedVariants, activePlacement);
    if (!activePrintFile) return;

    const dataUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(textContent.trim())}`;

    // Calculate text dimensions that maintain reasonable aspect ratio
    // Text typically has a wider aspect ratio than most print areas
    const textAspectRatio = 3.33; // Typical text width:height ratio (200:60)
    const printAreaAspectRatio = activePrintFile.width / activePrintFile.height;
    
    let textWidth: number;
    let textHeight: number;
    
    // Scale text to fit nicely within print area while maintaining readability
    if (textAspectRatio > printAreaAspectRatio) {
      // Text is wider than print area - constrain by width
      textWidth = Math.min(activePrintFile.width * 0.6, 300); // Max 300px width
      textHeight = textWidth / textAspectRatio;
    } else {
      // Print area is wider - constrain by a reasonable text height
      textHeight = Math.min(activePrintFile.height * 0.2, 80); // Max 80px height
      textWidth = textHeight * textAspectRatio;
    }

    // Ensure minimum readable size
    textWidth = Math.max(textWidth, 100);
    textHeight = Math.max(textHeight, 30);

    const newDesign: DesignFile = {
      id: Date.now(),
      filename: `${textContent.trim().substring(0, 20)}.txt`,
      url: dataUrl,
      type: "design",
      placement: activePlacement,
      position: {
        area_width: activePrintFile.width,
        area_height: activePrintFile.height,
        width: Math.round(textWidth),
        height: Math.round(textHeight),
        top: Math.round((activePrintFile.height - textHeight) / 2),
        left: Math.round((activePrintFile.width - textWidth) / 2),
        limit_to_print_area: true,
      },
    };

    setDesignFiles([...designFiles, newDesign]);
    setSelectedDesignFile(newDesign);
    setTextContent("");
    toast.success(`Text added to ${activePlacement}! ✨ Optimized for print compatibility`);
  };

  const handleTextImageCreated = async (imageUrl: string, filename: string) => {
    if (!activePlacement) {
      toast.error('Please select a placement first');
      return;
    }

    const activePrintFile = getActivePrintFile(printFiles, selectedVariants, activePlacement);
    if (!activePrintFile) return;

    // Calculate position offset for multiple designs on same placement
    const existingDesignsOnPlacement = designFiles.filter(df => df.placement === activePlacement);
    const offsetMultiplier = existingDesignsOnPlacement.length;
    const baseOffset = 20;

    try {
      // SMART TEXT ADAPTATION: Auto-adapt text to print area
      const dimensionResult = await calculateAspectRatioAwareDimensions(
        imageUrl, 
        activePrintFile, 
        0.6, // Max 60% of print area for text images
        true // Enable smart adaptation for text
      );
      
      const { width: aspectAwareWidth, height: aspectAwareHeight, adapted } = dimensionResult;

      // Calculate position with slight offset for multiple designs
      const baseTop = (activePrintFile.height - aspectAwareHeight) / 2;
      const baseLeft = (activePrintFile.width - aspectAwareWidth) / 2;

      const newDesign: DesignFile = {
        id: Date.now() + offsetMultiplier, // Ensure unique IDs
        filename,
        url: imageUrl,
        type: "design",
        placement: activePlacement,
        position: {
          area_width: activePrintFile.width,
          area_height: activePrintFile.height,
          width: aspectAwareWidth,
          height: aspectAwareHeight,
          top: Math.max(0, baseTop + (offsetMultiplier * baseOffset)),
          left: Math.max(0, baseLeft + (offsetMultiplier * baseOffset)),
          limit_to_print_area: true,
        },
      };

      // CRITICAL: Validate text design against Printful requirements
      const validation = validateDesignForPrintful(newDesign, activePrintFile, true);
      
      if (!validation.isValid) {
        console.log("⚠️ Text design validation failed, attempting auto-fix:", validation.errors);
        const fixedDesign = autoFixDesignForPrintful(newDesign, activePrintFile);
        const fixedValidation = validateDesignForPrintful(fixedDesign, activePrintFile, true);
        
        if (fixedValidation.isValid) {
          setDesignFiles([...designFiles, fixedDesign]);
          setSelectedDesignFile(fixedDesign);
          toast.success(`Text added to ${activePlacement} with automatic corrections!`, {
            icon: '🔧',
            duration: 4000
          });
        } else {
          toast.error(`Unable to add text: ${fixedValidation.errors[0]}`, {
            duration: 6000
          });
          return;
        }
      } else {
        setDesignFiles([...designFiles, newDesign]);
        setSelectedDesignFile(newDesign);
        
        if (adapted) {
          toast.success(`Text auto-adapted to perfect ${activePlacement} fit! 📝🎯`, {
            icon: '✨',
            duration: 4000
          });
        } else {
          toast.success(`Text added to ${activePlacement}! ✅ Perfect fit`, {
            icon: '📝',
            duration: 3000
          });
        }
      }
      
    } catch (error) {
      console.error("Failed to calculate aspect-ratio aware dimensions for text image:", error);
      
      // Fallback to typical text dimensions (wider than tall)
      const textWidth = Math.min(300, activePrintFile.width * 0.7);
      const textHeight = Math.min(80, textWidth / 4); // 4:1 aspect ratio for text
      
      const baseTop = (activePrintFile.height - textHeight) / 2;
      const baseLeft = (activePrintFile.width - textWidth) / 2;
      
      const newDesign: DesignFile = {
        id: Date.now() + offsetMultiplier,
        filename,
        url: imageUrl,
        type: "design",
        placement: activePlacement,
        position: {
          area_width: activePrintFile.width,
          area_height: activePrintFile.height,
          width: textWidth,
          height: textHeight,
          top: Math.max(0, baseTop + (offsetMultiplier * baseOffset)),
          left: Math.max(0, baseLeft + (offsetMultiplier * baseOffset)),
          limit_to_print_area: true,
        },
      };

      setDesignFiles([...designFiles, newDesign]);
      setSelectedDesignFile(newDesign);
      toast.success(`Text image added to ${activePlacement}! (Using safe text dimensions)`);
    }
  };

  const handleClipartImageCreated = async (imageUrl: string, filename: string) => {
    if (!activePlacement) {
      toast.error('Please select a placement first');
      return;
    }

    const activePrintFile = getActivePrintFile(printFiles, selectedVariants, activePlacement);
    if (!activePrintFile) return;

    // Calculate position offset for multiple designs on same placement
    const existingDesignsOnPlacement = designFiles.filter(df => df.placement === activePlacement);
    const offsetMultiplier = existingDesignsOnPlacement.length;
    const baseOffset = 20;

    try {
      // SMART CLIPART ADAPTATION: Auto-adapt clipart to print area
      const dimensionResult = await calculateAspectRatioAwareDimensions(
        imageUrl, 
        activePrintFile, 
        0.4, // Max 40% of print area for clipart (smaller than regular designs)
        true // Enable smart adaptation for clipart
      );
      
      const { width: aspectAwareWidth, height: aspectAwareHeight, adapted } = dimensionResult;

      // Calculate position with slight offset for multiple designs
      const baseTop = (activePrintFile.height - aspectAwareHeight) / 2;
      const baseLeft = (activePrintFile.width - aspectAwareWidth) / 2;

      const newDesign: DesignFile = {
        id: Date.now() + offsetMultiplier, // Ensure unique IDs
        filename,
        url: imageUrl,
        type: "design",
        placement: activePlacement,
        position: {
          area_width: activePrintFile.width,
          area_height: activePrintFile.height,
          width: aspectAwareWidth,
          height: aspectAwareHeight,
          top: Math.max(0, baseTop + (offsetMultiplier * baseOffset)),
          left: Math.max(0, baseLeft + (offsetMultiplier * baseOffset)),
          limit_to_print_area: true,
        },
      };

      // CRITICAL: Validate clipart design against Printful requirements
      const validation = validateDesignForPrintful(newDesign, activePrintFile, true);
      
      if (!validation.isValid) {
        console.log("⚠️ Clipart design validation failed, attempting auto-fix:", validation.errors);
        const fixedDesign = autoFixDesignForPrintful(newDesign, activePrintFile);
        const fixedValidation = validateDesignForPrintful(fixedDesign, activePrintFile, true);
        
        if (fixedValidation.isValid) {
          setDesignFiles([...designFiles, fixedDesign]);
          setSelectedDesignFile(fixedDesign);
          toast.success(`Clipart added to ${activePlacement} with automatic corrections!`, {
            icon: '🔧',
            duration: 4000
          });
        } else {
          toast.error(`Unable to add clipart: ${fixedValidation.errors[0]}`, {
            duration: 6000
          });
          return;
        }
      } else {
        setDesignFiles([...designFiles, newDesign]);
        setSelectedDesignFile(newDesign);
        
        if (adapted) {
          toast.success(`Clipart auto-adapted to perfect ${activePlacement} fit! 🎨🎯`, {
            icon: '✨',
            duration: 4000
          });
        } else {
          toast.success(`Clipart added to ${activePlacement}! ✅ Perfect fit`, {
            icon: '🎨',
            duration: 3000
          });
        }
      }
      
    } catch (error) {
      console.error("Failed to calculate aspect-ratio aware dimensions for clipart:", error);
      
      // Fallback to square dimensions that should work for most clipart
      const fallbackSize = Math.min(200, activePrintFile.width * 0.3, activePrintFile.height * 0.3);
      
      const baseTop = (activePrintFile.height - fallbackSize) / 2;
      const baseLeft = (activePrintFile.width - fallbackSize) / 2;
      
      const newDesign: DesignFile = {
        id: Date.now() + offsetMultiplier,
        filename,
        url: imageUrl,
        type: "design",
        placement: activePlacement,
        position: {
          area_width: activePrintFile.width,
          area_height: activePrintFile.height,
          width: fallbackSize,
          height: fallbackSize, // Square fallback
          top: Math.max(0, baseTop + (offsetMultiplier * baseOffset)),
          left: Math.max(0, baseLeft + (offsetMultiplier * baseOffset)),
          limit_to_print_area: true,
        },
      };

      setDesignFiles([...designFiles, newDesign]);
      setSelectedDesignFile(newDesign);
      toast.success(`Clipart added to ${activePlacement}! (Using safe square dimensions)`);
    }
  };

  const updateDesignPosition = (
    designId: number,
    updates: Partial<DesignFile["position"]>
  ) => {
    setDesignFiles(designFiles.map((df) =>
      df.id === designId
        ? {
            ...df,
            position: { ...df.position, ...updates },
          }
        : df
    ));

    const updatedDesign = designFiles.find((df) => df.id === designId);
    if (updatedDesign) {
      setSelectedDesignFile({ ...updatedDesign, position: { ...updatedDesign.position, ...updates } });
    }
  };


  const handlePlaceFileOnPlacement = async (placement: string) => {
    if (selectedFileForPlacement) {
      await handleAddDesign(selectedFileForPlacement, placement);
      setSelectedFileForPlacement(null);
      setShowPlacementPanel(false);
    }
  };

  const openChildPanel = (content: string) => {
    setChildPanelContent(content);
    setChildPanelOpen(true);
  };

  // Get placement tabs from print files
  const placementTabs = printFiles?.available_placements
    ? Object.entries(printFiles.available_placements).map(([key, label]) => ({
        id: key,
        label: label,
        hasDesign: designFiles.some(df => df.placement === key),
        isEmbroidery: isEmbroideryProd && key.includes("embroidery")
      }))
    : [];

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case "product":
        return (
          <ProductTabContent
            selectedProduct={selectedProduct}
            selectedTechnique={selectedTechnique}
            setSelectedTechnique={setSelectedTechnique}
            uniqueColors={uniqueColors}
            uniqueSizes={uniqueSizes}
            selectedColors={selectedColors}
            setSelectedColors={setSelectedColors}
            selectedSizes={selectedSizes}
            setSelectedSizes={setSelectedSizes}
            openChildPanel={openChildPanel}
          />
        );

      case "upload":
        return (
          <UploadTabContent
            uploadedFiles={uploadedFiles}
            handleFileUpload={handleFileUpload}
            isUploading={isUploading}
            onRefreshFiles={onRefreshFiles}
          />
        );

      case "text":
        return (
          <TextTabContent
            textContent={textContent}
            setTextContent={setTextContent}
            handleAddTextToDesign={handleAddTextToDesign}
            activePlacement={activePlacement}
            onTextImageCreated={handleTextImageCreated}
            userId={1}
          />
        );

      case "clipart":
        return (
          <ClipartTabContent 
            onClipartImageCreated={handleClipartImageCreated}
          />
        );

      case "placement":
        return (
          <DesignTabContent
            printFiles={printFiles}
            activePlacement={activePlacement}
            setActivePlacement={setActivePlacement}
            selectedPlacements={selectedPlacements}
            setSelectedPlacements={setSelectedPlacements}
            designFiles={designFiles}
            selectedDesignFile={selectedDesignFile}
            setSelectedDesignFile={setSelectedDesignFile}
            updateDesignPosition={updateDesignPosition}
            uploadedFiles={uploadedFiles}
            handleAddDesign={handleAddDesign}
            onShowPositionPanel={() => setShowPositionPanel(true)}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            applyQuickPosition={(position: string) => {
              const activePrintFile = getActivePrintFile(printFiles, selectedVariants, activePlacement);
              applyQuickPosition(position, selectedDesignFile, activePrintFile, (updatedDesign) => {
                setDesignFiles(designFiles.map(df => df.id === updatedDesign.id ? updatedDesign : df));
                setSelectedDesignFile(updatedDesign);
              });
            }}
          />
        );

      case "embroidery":
        return (
          <EmbroideryTabContent
            embroideryOptions={embroideryOptions}
            setEmbroideryOptions={setEmbroideryOptions}
            selectedTechnique={selectedTechnique}
            activePlacement={activePlacement}
            getThreadColorOptions={getThreadColorOptions}
          />
        );

      case "advanced":
        return (
          <AdvancedTabContent
            selectedProduct={selectedProduct}
            selectedTechnique={selectedTechnique}
            setSelectedTechnique={setSelectedTechnique}
            selectedOptionGroups={advancedOptions.optionGroups}
            setSelectedOptionGroups={(groups) => setAdvancedOptions({...advancedOptions, optionGroups: groups})}
            selectedOptions={advancedOptions.options}
            setSelectedOptions={(options) => setAdvancedOptions({...advancedOptions, options})}
            lifelikeEnabled={advancedOptions.lifelike}
            setLifelikeEnabled={(enabled) => setAdvancedOptions({...advancedOptions, lifelike: enabled})}
            mockupWidth={advancedOptions.width}
            setMockupWidth={(width) => setAdvancedOptions({...advancedOptions, width})}
          />
        );

      case "preview":
        return (
          <PreviewTab
            designFiles={designFiles}
            mockupUrls={mockupUrls}
            mockupStatus={mockupStatus}
            isGeneratingPreview={isGeneratingPreview}
            selectedTechnique={selectedTechnique}
            advancedOptions={advancedOptions}
            onGeneratePreview={handleValidatedPreviewGeneration}
          />
        );

      // Child panels
      default:
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">All Colors</h4>
            <div className="grid grid-cols-2 gap-3">
              {uniqueColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => {
                    setSelectedColors([color.name]);
                  }}
                  className={`w-16 h-16 rounded-lg border-2 transition-all flex flex-col items-center justify-center ${
                    selectedColors.includes(color.name)
                      ? "border-gray-900 scale-105"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{ backgroundColor: color.code }}
                  title={color.name}
                >
                  <span className="text-xs text-white mt-1 drop-shadow-md font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  // Define tab structure
  const baseTabs = [
    { id: "product" as TabType, label: "Product", icon: Home },
    { id: "upload" as TabType, label: "Upload", icon: Upload },
    { id: "placement" as TabType, label: "Design", icon: Zap },
    { id: "text" as TabType, label: "Text", icon: Type },
    { id: "clipart" as TabType, label: "Clipart", icon: Smile },
  ];

  const embroideryTab = isEmbroideryProd 
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
        <div className="w-80 border-r border-gray-800 bg-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {childPanelContent.charAt(0).toUpperCase() + childPanelContent.slice(1)}
            </h3>
            <button
              onClick={() => setChildPanelOpen(false)}
              className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {renderTabContent()}
          </div>
        </div>
      )}

      {/* Position Control Panel */}
      {(showPositionPanel || (activeTab === "placement" && selectedDesignFile)) && (
        <PositionControlPanel
          selectedDesignFile={selectedDesignFile}
          updateDesignPosition={updateDesignPosition}
          applyQuickPosition={(position: string) => {
            const activePrintFile = getActivePrintFile(printFiles, selectedVariants, activePlacement);
            applyQuickPosition(position, selectedDesignFile, activePrintFile, (updatedDesign) => {
              setDesignFiles(designFiles.map(df => df.id === updatedDesign.id ? updatedDesign : df));
              setSelectedDesignFile(updatedDesign);
            });
          }}
          onClose={() => setShowPositionPanel(false)}
          activePrintFile={getActivePrintFile(printFiles, selectedVariants, activePlacement)}
        />
      )}

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Main Content Based on Active Tab */}
        {activeTab === "placement" ? (
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
            updateDesignPosition={updateDesignPosition}
          />
        ) : activeTab === "preview" ? (
          <PreviewTab
            designFiles={designFiles}
            mockupUrls={mockupUrls}
            mockupStatus={mockupStatus}
            isGeneratingPreview={isGeneratingPreview}
            selectedTechnique={selectedTechnique}
            advancedOptions={advancedOptions}
            onGeneratePreview={handleValidatedPreviewGeneration}
          />
        ) : (
          <ProductOverviewTab
            selectedProduct={selectedProduct}
            selectedColors={selectedColors}
          />
        )}
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

      {/* Placement Panel */}
      {showPlacementPanel && selectedFileForPlacement && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md max-h-[90vh] overflow-y-auto m-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Choose Placement</h3>
              <button
                onClick={() => setShowPlacementPanel(false)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              {placementTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handlePlaceFileOnPlacement(tab.id)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <span>{tab.label}</span>
                  {tab.hasDesign && (
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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