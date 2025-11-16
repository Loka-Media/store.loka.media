/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  Eye,
  ShoppingBag,
  Palette,
  Ruler,
  HelpCircle,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { UnifiedDesignEditorProps, UploadedFile } from "./types";
import { printfulAPI } from "@/lib/api";
import { aspectRatioValidation } from "@/utils/aspectRatioValidation";

// Import components
import { useDesignEditorState, usePrintFilesLoader, useAutoSelectVariants } from "./hooks";
import { getActivePrintFile, calculateAspectRatioAwareDimensions } from "./utils";
import VisualPlacementSelector from "./VisualPlacementSelector";
import QuickDesignTools from "./QuickDesignTools";
import DesignCanvasTab from "./DesignCanvasTab";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

const EnhancedCanvasWizard: React.FC<UnifiedDesignEditorProps> = ({
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
  const [currentStep, setCurrentStep] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aspectRatioIssues, setAspectRatioIssues] = useState<any[]>([]);
  const [showAllPreviews, setShowAllPreviews] = useState(false);

  // Use existing hooks
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
    uniqueSizes,
    uniqueColors,
  } = stateHook;

  // Auto-select variants when colors/sizes change
  useEffect(() => {
    if (selectedColors.length > 0 && selectedSizes.length > 0 && selectedProduct?.variants) {
      const variantIds = selectedProduct.variants
        .filter((v: any) =>
          selectedColors.includes(v.color) && selectedSizes.includes(v.size)
        )
        .map((v: any) => v.id);
      setSelectedVariants(variantIds);
    }
  }, [selectedColors, selectedSizes, selectedProduct, setSelectedVariants]);

  // Load print files
  usePrintFilesLoader(
    selectedProduct,
    selectedVariants,
    false,
    false,
    () => {},
    () => {},
    onPrintFilesLoaded,
    () => {}
  );

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: "variants",
      title: "Choose Variants",
      description: "Select colors and sizes",
      icon: ShoppingBag,
      completed: selectedVariants.length > 0,
    },
    {
      id: "design",
      title: "Add Design",
      description: "Upload or create",
      icon: Palette,
      completed: designFiles.length > 0,
    },
    {
      id: "position",
      title: "Position & Preview",
      description: "Perfect placement",
      icon: Ruler,
      completed: designFiles.length > 0 && !!mockupUrls && mockupUrls.length > 0,
    },
    {
      id: "review",
      title: "Review & Continue",
      description: "Finalize product",
      icon: Eye,
      completed: false,
    },
  ];

  const progress = (currentStep / steps.length) * 100;

  // Design tool handlers
  const handleUploadImage = async (file: File) => {
    try {
      setIsUploading(true);
      const result = await printfulAPI.uploadFileDirectly(file);

      if (result.result) {
        toast.success("File uploaded successfully!");
        onRefreshFiles?.();

        // Auto-add to first placement if available
        if (printFiles?.available_placements) {
          const placements = Object.keys(printFiles.available_placements);
          if (placements.length > 0) {
            const firstPlacement = placements[0];
            await handleAddDesign(result.result, firstPlacement);
          }
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDesign = async (file: UploadedFile, placement?: string) => {
    let targetPlacement = placement || activePlacement;
    if (!targetPlacement && printFiles?.available_placements) {
      const availablePlacements = Object.keys(printFiles.available_placements);
      targetPlacement = availablePlacements[0];
    }

    if (!targetPlacement) {
      toast.error("No placements available for this product");
      return;
    }

    const activePrintFile = getActivePrintFile(printFiles, selectedVariants, targetPlacement);
    if (!activePrintFile) {
      toast.error("No print file available for this placement");
      return;
    }

    setActivePlacement(targetPlacement);
    if (!selectedPlacements.includes(targetPlacement)) {
      setSelectedPlacements([...selectedPlacements, targetPlacement]);
    }

    const existingDesignsOnPlacement = designFiles.filter(df => df.placement === targetPlacement);
    const offsetMultiplier = existingDesignsOnPlacement.length;
    const baseOffset = 20;

    try {
      const imageUrl = file.file_url || file.thumbnail_url || '';
      const dimensionResult = await calculateAspectRatioAwareDimensions(
        imageUrl,
        activePrintFile,
        0.7,
        true
      );

      const { width: aspectAwareWidth, height: aspectAwareHeight } = dimensionResult;

      const baseTop = (activePrintFile.height - aspectAwareHeight) / 2;
      const baseLeft = (activePrintFile.width - aspectAwareWidth) / 2;

      const newDesign: any = {
        id: Date.now() + offsetMultiplier,
        filename: file.filename,
        url: imageUrl,
        type: "design",
        placement: targetPlacement,
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

      setDesignFiles([...designFiles, newDesign]);
      setSelectedDesignFile(newDesign);
      toast.success(`Design added to ${targetPlacement}!`);
    } catch (error) {
      console.error("Failed to add design:", error);
      toast.error("Failed to add design");
    }
  };

  const handleDeleteFile = async (fileId: number | string) => {
    try {
      await printfulAPI.deleteFile(fileId);
      toast.success("File deleted successfully");

      // Refresh the files list
      if (onRefreshFiles) {
        await onRefreshFiles();
      }
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast.error("Failed to delete file. Please try again.");
      throw error;
    }
  };

  const autoFixAspectRatios = async () => {
    const criticalIssues = aspectRatioIssues.filter(issue =>
      issue.message.includes('🚫 CRITICAL')
    );

    if (criticalIssues.length === 0) {
      toast("All designs already have correct aspect ratios!", { icon: "✅" });
      return;
    }

    const loadingToast = toast.loading(`Fixing ${criticalIssues.length} aspect ratio issue${criticalIssues.length > 1 ? 's' : ''}...`);

    try {
      let fixedCount = 0;

      for (const issue of criticalIssues) {
        const design = designFiles.find(d => d.id === issue.designId);
        if (!design) continue;

        // Get corrected dimensions from validation
        const result = await aspectRatioValidation(
          design.url,
          design.position.width,
          design.position.height,
          0.5
        );

        if (!result.isValid && result.correctedDimensions) {
          // Update the design with corrected dimensions
          updateDesignPosition(design.id, {
            width: result.correctedDimensions.width,
            height: result.correctedDimensions.height,
          });
          fixedCount++;
        }
      }

      toast.dismiss(loadingToast);

      if (fixedCount > 0) {
        toast.success(`✅ Fixed ${fixedCount} aspect ratio issue${fixedCount > 1 ? 's' : ''}! All designs are now Printful compatible.`, {
          duration: 4000,
        });
      } else {
        toast("No issues could be fixed automatically.", { icon: "⚠️" });
      }
    } catch (error) {
      console.error("Failed to auto-fix aspect ratios:", error);
      toast.dismiss(loadingToast);
      toast.error("Failed to fix aspect ratios. Please try manually adjusting dimensions.");
    }
  };

  const updateDesignPosition = (designId: number, updates: any) => {
    setDesignFiles(designFiles.map((df) =>
      df.id === designId
        ? { ...df, position: { ...df.position, ...updates } }
        : df
    ));

    const updatedDesign = designFiles.find((df) => df.id === designId);
    if (updatedDesign) {
      setSelectedDesignFile({ ...updatedDesign, position: { ...updatedDesign.position, ...updates } });
    }
  };

  const designsByPlacement = designFiles.reduce<Record<string, number>>((acc, design) => {
    acc[design.placement] = (acc[design.placement] || 0) + 1;
    return acc;
  }, {});

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return selectedVariants.length > 0;
      case 2:
        return designFiles.length > 0;
      case 3:
        return mockupUrls && mockupUrls.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  // Step renderers
  const renderVariantSelection = () => (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-black mb-2">
            Choose Your Product Variants
          </h2>
          <p className="text-gray-700 font-bold">
            Select the colors and sizes you want to offer
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-3 bg-yellow-200 border-2 border-black rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
        >
          <HelpCircle className="w-6 h-6 text-black" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-yellow-100 border-4 border-black rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Info className="w-6 h-6 text-black flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-extrabold text-black mb-2">Quick Tips</h3>
              <ul className="space-y-1 text-sm font-bold text-black">
                <li>• Select popular colors for better sales</li>
                <li>• Include all sizes for maximum reach</li>
                <li>• You can always add more variants later</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white border-4 border-black rounded-2xl p-6">
        <h3 className="text-xl font-extrabold text-black mb-4 flex items-center gap-2">
          <Palette className="w-6 h-6" />
          Select Colors
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {uniqueColors.map((color) => {
            const isSelected = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                onClick={() => {
                  if (isSelected) {
                    setSelectedColors(selectedColors.filter((c) => c !== color.name));
                  } else {
                    setSelectedColors([...selectedColors, color.name]);
                  }
                }}
                className={`relative group transition-all ${
                  isSelected
                    ? "border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
                    : "border-2 border-gray-300 hover:border-black"
                } rounded-xl p-3 flex flex-col items-center gap-2`}
              >
                <div
                  className="w-16 h-16 rounded-lg border-2 border-black"
                  style={{ backgroundColor: color.code }}
                />
                <span className="text-xs font-extrabold text-black text-center">
                  {color.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-green-400 border-2 border-black rounded-full p-1">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border-4 border-black rounded-2xl p-6">
        <h3 className="text-xl font-extrabold text-black mb-4 flex items-center gap-2">
          <Ruler className="w-6 h-6" />
          Select Sizes
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {uniqueSizes.map((size) => {
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
                className={`relative transition-all ${
                  isSelected
                    ? "bg-black text-white border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                    : "bg-white text-black border-2 border-gray-300 hover:border-black"
                } rounded-xl p-4 font-extrabold text-lg`}
              >
                {size}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-green-400 border-2 border-black rounded-full p-1">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {(selectedColors.length > 0 || selectedSizes.length > 0) && (
        <div className="bg-green-100 border-4 border-green-600 rounded-2xl p-6">
          <h3 className="font-extrabold text-black mb-2">Your Selection</h3>
          <p className="text-black font-bold">
            {selectedColors.length} color{selectedColors.length !== 1 ? "s" : ""} ×{" "}
            {selectedSizes.length} size{selectedSizes.length !== 1 ? "s" : ""} ={" "}
            <span className="text-2xl font-extrabold">
              {selectedColors.length * selectedSizes.length}
            </span>{" "}
            total variants
          </p>
        </div>
      )}
    </div>
  );

  const renderDesignStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-black mb-2">Add Your Design</h2>
        <p className="text-gray-700 font-bold">
          Choose a placement and add your design
        </p>
      </div>

      {printFiles?.available_placements && (
        <VisualPlacementSelector
          availablePlacements={printFiles.available_placements}
          selectedPlacement={activePlacement}
          onSelectPlacement={setActivePlacement}
          designsByPlacement={designsByPlacement}
        />
      )}

      <QuickDesignTools
        onUploadImage={handleUploadImage}
        onCreateText={() => toast("Text tool coming soon!")}
        onBrowseClipart={() => toast("Clipart browser coming soon!")}
        onAddEmoji={() => toast("Emoji picker coming soon!")}
        onSelectExistingFile={(file) => handleAddDesign(file)}
        onDeleteFile={handleDeleteFile}
        uploadedFiles={uploadedFiles}
        isUploading={isUploading}
      />
    </div>
  );

  const renderPositioningStep = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-extrabold text-black mb-2">
          Position Your Design
        </h2>
        <p className="text-gray-700 font-bold">
          Adjust placement and generate preview
        </p>
      </div>

      {designFiles.length > 0 ? (
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
          onAspectRatioIssues={setAspectRatioIssues}
          aspectRatioIssues={aspectRatioIssues}
        />
      ) : (
        <div className="bg-yellow-100 border-4 border-yellow-600 rounded-2xl p-8 text-center">
          <p className="font-bold text-black">
            ⚠️ Please add a design in the previous step first
          </p>
        </div>
      )}

      {/* Auto-fix aspect ratio button - only show if there are critical issues */}
      {aspectRatioIssues.filter(issue => issue.message.includes('🚫 CRITICAL')).length > 0 && (
        <button
          onClick={autoFixAspectRatios}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-4 px-6 rounded-xl font-extrabold border-4 border-black hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg flex items-center justify-center gap-2"
        >
          <Zap className="w-6 h-6" />
          Auto-Fix Aspect Ratios ({aspectRatioIssues.filter(issue => issue.message.includes('🚫 CRITICAL')).length} issue{aspectRatioIssues.filter(issue => issue.message.includes('🚫 CRITICAL')).length !== 1 ? 's' : ''})
        </button>
      )}

      <button
        onClick={() => onGeneratePreview()}
        disabled={isGeneratingPreview || aspectRatioIssues.length > 0}
        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 px-6 rounded-xl font-extrabold border-4 border-black hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 text-lg flex items-center justify-center gap-2"
      >
        {isGeneratingPreview ? (
          <>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
            Generating Preview...
          </>
        ) : (
          <>
            <Sparkles className="w-6 h-6" />
            Generate Preview
          </>
        )}
      </button>

      {mockupStatus && (
        <div className="bg-blue-100 border-2 border-black rounded-xl p-4">
          <p className="text-sm font-bold text-black">{mockupStatus}</p>
        </div>
      )}

      {mockupUrls && mockupUrls.length > 0 && (
        <div className="bg-gradient-to-br from-green-100 to-teal-100 border-4 border-black rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-400 border-2 border-black rounded-full p-2">
              <Check className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-black">Preview Generated!</h3>
              <p className="text-sm font-bold text-gray-700">What would you like to do next?</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              <Palette className="w-5 h-5" />
              Add More Designs
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-400 to-emerald-400 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              <Eye className="w-5 h-5" />
              Review & Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderReviewStep = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-black mb-2">
          Review Your Product
        </h2>
        <p className="text-gray-700 font-bold">
          Check everything looks good before continuing
        </p>
      </div>

      {/* Design Summary */}
      <div className="bg-gradient-to-br from-yellow-100 to-pink-100 border-4 border-black rounded-2xl p-6">
        <h3 className="text-xl font-extrabold text-black mb-4">
          Your Designs ({designFiles.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(designsByPlacement).map(([placement, count]) => (
            <div key={placement} className="bg-white border-2 border-black rounded-xl p-3 text-center">
              <p className="font-extrabold text-black text-sm mb-1">
                {printFiles?.available_placements?.[placement] || placement}
              </p>
              <p className="text-xs font-bold text-gray-700">
                {count} design{count !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setCurrentStep(2)}
          className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-400 to-blue-400 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
        >
          <Palette className="w-5 h-5" />
          Add More Designs to Other Placements
        </button>
      </div>

      {mockupUrls && mockupUrls.length > 0 ? (
        <div className="bg-white border-4 border-black rounded-2xl p-6">
          <h3 className="text-xl font-extrabold text-black mb-4">
            Product Previews ({mockupUrls.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(showAllPreviews ? mockupUrls : mockupUrls.slice(0, 4)).map((mockup: any, index: number) => (
              <div key={index} className="border-2 border-black rounded-xl overflow-hidden">
                <img
                  src={mockup.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-auto"
                />
                {mockup.title && (
                  <div className="bg-gray-100 border-t-2 border-black p-2">
                    <p className="text-xs font-bold text-black">{mockup.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {mockupUrls.length > 4 && (
            <button
              onClick={() => setShowAllPreviews(!showAllPreviews)}
              className="text-sm font-bold text-black mt-4 mx-auto block px-6 py-2 bg-gradient-to-r from-yellow-200 to-pink-200 border-2 border-black rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
            >
              {showAllPreviews
                ? "Show Less"
                : `+ ${mockupUrls.length - 4} more preview${mockupUrls.length - 4 !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-yellow-100 border-4 border-yellow-600 rounded-2xl p-6 text-center">
          <p className="font-bold text-black">
            ⚠️ Please generate a preview in the previous step
          </p>
          <button
            onClick={() => setCurrentStep(3)}
            className="mt-4 px-6 py-3 bg-orange-400 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
          >
            Go Back to Generate Preview
          </button>
        </div>
      )}

      <div className="bg-green-100 border-4 border-green-600 rounded-2xl p-6">
        <h3 className="font-extrabold text-black mb-3">Summary</h3>
        <ul className="space-y-2 text-black font-bold">
          <li>✅ {selectedVariants.length} variants selected</li>
          <li>✅ {designFiles.length} design{designFiles.length !== 1 ? "s" : ""} added</li>
          <li>✅ {mockupUrls?.length || 0} preview{mockupUrls?.length !== 1 ? "s" : ""} generated</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {/* Header with Progress */}
      <div className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-black">
              {selectedProduct?.title || selectedProduct?.name}
            </h1>
            <p className="text-gray-600 font-bold">Create your custom product</p>
          </div>

          {/* Progress Bar */}
          <div className="relative">
            <div className="overflow-hidden h-4 bg-gray-200 border-2 border-black rounded-full">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
              />
            </div>
            <div className="flex justify-between mt-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = currentStep === index + 1;
                const isCompleted = step.completed;

                return (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center gap-2 ${
                      isActive ? "scale-110" : ""
                    } transition-transform`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full border-4 border-black flex items-center justify-center ${
                        isCompleted
                          ? "bg-green-400"
                          : isActive
                          ? "bg-yellow-300"
                          : "bg-gray-200"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-6 h-6 text-black" />
                      ) : (
                        <StepIcon className="w-6 h-6 text-black" />
                      )}
                    </div>
                    <span
                      className={`text-xs font-extrabold text-black text-center hidden sm:block ${
                        isActive ? "underline" : ""
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border-4 border-black rounded-3xl p-8 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
          {currentStep === 1 && renderVariantSelection()}
          {currentStep === 2 && renderDesignStep()}
          {currentStep === 3 && renderPositioningStep()}
          {currentStep === 4 && renderReviewStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 bg-white text-black border-4 border-black rounded-xl font-extrabold hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={() => canGoNext() && setCurrentStep(currentStep + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-3 bg-black text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Step
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={onNext}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Product Details
              <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCanvasWizard;
