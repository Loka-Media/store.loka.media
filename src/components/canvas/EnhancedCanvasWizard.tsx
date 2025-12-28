/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  ScanEye,
  ShoppingBag,
  Palette,
  ImageUpscale,
  HelpCircle,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { UnifiedDesignEditorProps, UploadedFile } from "./types";
import { printfulAPI } from "@/lib/api";
import { aspectRatioValidation } from "@/utils/aspectRatioValidation";

// Import components
import { useDesignEditorState, usePrintFilesLoader } from "./hooks";
import {
  getActivePrintFile,
  calculateAspectRatioAwareDimensions,
} from "./utils";
import VisualPlacementSelector from "./VisualPlacementSelector";
import QuickDesignTools from "./QuickDesignTools";
import DesignCanvasTab from "./DesignCanvasTab";
import EnhancedStepper from "./EnhancedStepper";
import PrintingTechniqueSelector from "./PrintingTechniqueSelector";
import { RegionalAvailabilityPreview } from "./RegionalAvailabilityPreview";

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
  const [aspectRatioIssues, setAspectRatioIssues] = useState<any[]>([]);
  const [showAllPreviews, setShowAllPreviews] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<
    number | string | undefined
  >();
  const [selectedTechnique, setSelectedTechnique] = useState<string>("");
  const [availableTechniques, setAvailableTechniques] = useState<string[]>([]);
  const [loadingTechniques, setLoadingTechniques] = useState(false);

  // Use existing hooks
  const stateHook = useDesignEditorState(selectedProduct, designFiles);
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
    if (
      selectedColors.length > 0 &&
      selectedSizes.length > 0 &&
      selectedProduct?.variants
    ) {
      const variantIds = selectedProduct.variants
        .filter(
          (v: any) =>
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

  // Load available techniques for the product
  useEffect(() => {
    const loadAvailableTechniques = async () => {
      if (!selectedProduct?.id) {
        setAvailableTechniques([]);
        return;
      }

      try {
        setLoadingTechniques(true);
        const data = await printfulAPI.getPrintFiles(selectedProduct.id);

        if (data?.result?.available_techniques && Array.isArray(data.result.available_techniques)) {
          const techniques = data.result.available_techniques;
          setAvailableTechniques(techniques);

          // Set default technique if current selection is not available
          if (techniques.length > 0 && (!selectedTechnique || !techniques.includes(selectedTechnique))) {
            setSelectedTechnique(techniques[0]);
          }
        } else {
          // Fallback to common techniques
          const fallbackTechniques = ['DTG', 'DTFILM'];
          setAvailableTechniques(fallbackTechniques);

          if (!selectedTechnique || !fallbackTechniques.includes(selectedTechnique)) {
            setSelectedTechnique(fallbackTechniques[0]);
          }
        }
      } catch (error) {
        console.error('Failed to load available techniques:', error);
        // Fallback
        const fallbackTechniques = ['DTG'];
        setAvailableTechniques(fallbackTechniques);

        if (!selectedTechnique || !fallbackTechniques.includes(selectedTechnique)) {
          setSelectedTechnique(fallbackTechniques[0]);
        }
      } finally {
        setLoadingTechniques(false);
      }
    };

    loadAvailableTechniques();
  }, [selectedProduct?.id, selectedTechnique]);

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
      icon: ImageUpscale,
      completed:
        designFiles.length > 0 && !!mockupUrls && mockupUrls.length > 0,
    },
    {
      id: "review",
      title: "Review & Continue",
      description: "Finalize product",
      icon: ScanEye,
      completed: false,
    },
  ];

  const progress = (currentStep / steps.length) * 100;

  // Design tool handlers
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

    const activePrintFile = getActivePrintFile(
      printFiles,
      selectedVariants,
      targetPlacement
    );
    if (!activePrintFile) {
      toast.error("No print file available for this placement");
      return;
    }

    setActivePlacement(targetPlacement);
    if (!selectedPlacements.includes(targetPlacement)) {
      setSelectedPlacements([...selectedPlacements, targetPlacement]);
    }

    // Track the selected file
    setSelectedFileId(file.id);

    // Remove any existing designs on this placement (only one design per placement allowed)
    const designsWithoutCurrentPlacement = designFiles.filter(
      (df) => df.placement !== targetPlacement
    );

    try {
      const imageUrl = file.file_url || file.thumbnail_url || "";
      const dimensionResult = await calculateAspectRatioAwareDimensions(
        imageUrl,
        activePrintFile,
        0.7,
        true
      );

      const { width: aspectAwareWidth, height: aspectAwareHeight } =
        dimensionResult;

      const baseTop = (activePrintFile.height - aspectAwareHeight) / 2;
      const baseLeft = (activePrintFile.width - aspectAwareWidth) / 2;

      const newDesign: any = {
        id: Date.now(),
        filename: file.filename,
        url: imageUrl,
        type: "design",
        placement: targetPlacement,
        position: {
          area_width: activePrintFile.width,
          area_height: activePrintFile.height,
          width: aspectAwareWidth,
          height: aspectAwareHeight,
          top: Math.max(0, baseTop),
          left: Math.max(0, baseLeft),
          limit_to_print_area: true,
        },
      };

      setDesignFiles([...designsWithoutCurrentPlacement, newDesign]);
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
    const criticalIssues = aspectRatioIssues.filter((issue) =>
      issue.message.includes("🚫 CRITICAL")
    );

    if (criticalIssues.length === 0) {
      toast("All designs already have correct aspect ratios!", { icon: "✅" });
      return;
    }

    const loadingToast = toast.loading(
      `Fixing ${criticalIssues.length} aspect ratio issue${
        criticalIssues.length > 1 ? "s" : ""
      }...`
    );

    try {
      let fixedCount = 0;

      for (const issue of criticalIssues) {
        const design = designFiles.find((d) => d.id === issue.designId);
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
        toast.success(
          `✅ Fixed ${fixedCount} aspect ratio issue${
            fixedCount > 1 ? "s" : ""
          }! All designs are now Printful compatible.`,
          {
            duration: 4000,
          }
        );
      } else {
        toast("No issues could be fixed automatically.", { icon: "⚠️" });
      }
    } catch (error) {
      console.error("Failed to auto-fix aspect ratios:", error);
      toast.dismiss(loadingToast);
      toast.error(
        "Failed to fix aspect ratios. Please try manually adjusting dimensions."
      );
    }
  };

  const updateDesignPosition = (designId: number, updates: any) => {
    setDesignFiles(
      designFiles.map((df) =>
        df.id === designId
          ? { ...df, position: { ...df.position, ...updates } }
          : df
      )
    );

    const updatedDesign = designFiles.find((df) => df.id === designId);
    if (updatedDesign) {
      setSelectedDesignFile({
        ...updatedDesign,
        position: { ...updatedDesign.position, ...updates },
      });
    }
  };

  const designsByPlacement = designFiles.reduce<Record<string, number>>(
    (acc, design) => {
      acc[design.placement] = (acc[design.placement] || 0) + 1;
      return acc;
    },
    {}
  );

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
          <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white mb-2">
            Choose Your Product Variants
          </div>
          <p className="text-gray-400">
            Select the colors and sizes you want to offer
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-all"
        >
          <HelpCircle className="w-6 h-6 text-orange-400" />
        </button>
      </div>

      {showHelp && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3">
            <Info className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0 mt-1" />
            <div>
              <div className="font-bold text-white mb-2 text-sm sm:text-base">Quick Tips</div>
              <ul className="space-y-1 text-xs sm:text-sm text-gray-400">
                <li>• Select popular colors for better sales</li>
                <li>• Include all sizes for maximum reach</li>
                <li>• You can always add more variants later</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="gradient-border-white-top rounded-lg p-3 sm:p-6 bg-gray-800">
        <div className="text-base sm:text-lg md:text-xl text-white mb-2 sm:mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
          Select Colors
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-4">
          {uniqueColors.map((color) => {
            const isSelected = selectedColors.includes(color.name);
            return (
              <button
                key={color.name}
                onClick={() => {
                  if (isSelected) {
                    setSelectedColors(
                      selectedColors.filter((c) => c !== color.name)
                    );
                  } else {
                    setSelectedColors([...selectedColors, color.name]);
                  }
                }}
                className="relative transition-all border-2 border-white rounded-full px-3 sm:px-6 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
                style={{ backgroundColor: color.code }}
              >
                <span
                  className="text-sm font-medium whitespace-nowrap"
                  style={{
                    color:
                      color.code === "#ffffff" || color.code === "#fff"
                        ? "#000"
                        : "#fff",
                  }}
                >
                  {color.name}
                </span>
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 flex items-center justify-center border-2 border-white">
                    <Check className="w-4 h-4 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="gradient-border-white-bottom rounded-lg p-3 sm:p-6 bg-gray-800">
        <div className="text-base sm:text-lg md:text-xl text-white mb-2 sm:mb-4 flex items-center gap-2">
          <ImageUpscale className="w-5 h-5 sm:w-6 sm:h-6" />
          Select Sizes
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
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
                className={`relative transition-all border-2 rounded-full px-3 sm:px-6 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium min-w-fit ${
                  isSelected
                    ? "border-white text-white"
                    : "border-gray-500 text-gray-300 hover:border-white"
                }`}
                style={{ backgroundColor: "#191919" }}
              >
                {size}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 flex items-center justify-center border-2 border-white">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {(selectedColors.length > 0 || selectedSizes.length > 0) && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-6">
          <div className="font-extrabold text-white mb-2 text-sm sm:text-base">Your Selection</div>
          <p className="text-xs sm:text-sm text-gray-300">
            {selectedColors.length} color
            {selectedColors.length !== 1 ? "s" : ""} × {selectedSizes.length}{" "}
            size{selectedSizes.length !== 1 ? "s" : ""} ={" "}
            <span className="text-lg sm:text-2xl font-extrabold text-orange-400">
              {selectedColors.length * selectedSizes.length}
            </span>{" "}
            total variants
          </p>
        </div>
      )}

      <PrintingTechniqueSelector
        selectedTechnique={selectedTechnique}
        onTechniqueChange={setSelectedTechnique}
        availableTechniques={availableTechniques}
        loading={loadingTechniques}
      />

      {selectedProduct && selectedProduct.variants && (
        <RegionalAvailabilityPreview
          selectedProduct={selectedProduct as any}
          selectedVariants={selectedVariants}
        />
      )}
    </div>
  );

  const renderDesignStep = () => (
    <div className="space-y-8">
      <div>
        <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white mb-2">
          Add Your Design
        </div>
        <p className="text-gray-400">Choose a placement and add your design</p>
      </div>

      {printFiles?.available_placements && (
        <VisualPlacementSelector
          availablePlacements={printFiles.available_placements}
          selectedPlacement={activePlacement}
          onSelectPlacement={(placement) => {
            setActivePlacement(placement);
            // Show the design for this placement if it exists
            const designForPlacement = designFiles.find(
              (df) => df.placement === placement
            );
            if (designForPlacement) {
              setSelectedDesignFile(designForPlacement);
              setSelectedFileId(designForPlacement.id);
            }
          }}
          designsByPlacement={designsByPlacement}
        />
      )}

      <QuickDesignTools
        onSelectExistingFile={(file) => handleAddDesign(file)}
        onDeleteFile={handleDeleteFile}
        uploadedFiles={uploadedFiles}
        selectedFileId={selectedFileId}
      />
    </div>
  );

  const renderPositioningStep = () => (
    <div className="gradient-border-white-top rounded-lg bg-gray-900 p-4 sm:p-6 space-y-6">
      <div>
        <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white mb-2">
          Position Your Design
        </div>
        <p className="text-gray-400">Adjust placement and generate preview</p>
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
          activePrintFile={getActivePrintFile(
            printFiles,
            selectedVariants,
            activePlacement
          )}
          updateDesignPosition={updateDesignPosition}
          onAspectRatioIssues={setAspectRatioIssues}
          aspectRatioIssues={aspectRatioIssues}
        />
      ) : (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 sm:p-8 text-center">
          <p className="font-bold text-xs sm:text-sm text-gray-300">
            ⚠️ Please add a design in the previous step first
          </p>
        </div>
      )}

      <Button
        onClick={() => onGeneratePreview()}
        disabled={isGeneratingPreview || aspectRatioIssues.length > 0}
        variant="primary"
        className="w-full text-xs sm:text-lg flex items-center justify-center gap-2"
      >
        {isGeneratingPreview ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-white" />
            Generating Preview...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            Generate Preview
          </>
        )}
      </Button>

      {mockupStatus && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-2 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-300">{mockupStatus}</p>
        </div>
      )}

      {mockupUrls && mockupUrls.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="bg-orange-500/20 border border-orange-500 rounded-full p-1 sm:p-2">
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-base sm:text-lg md:text-xl font-semibold text-white">
                Preview Generated!
              </div>
              <p className="text-xs sm:text-sm text-gray-400">
                What would you like to do next?
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-gray-600 transition-all"
            >
              <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
              Add More Designs
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-orange-500/20 border border-orange-500/50 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-all"
            >
              <ScanEye className="w-4 h-4 sm:w-5 sm:h-5" />
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
        <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-white mb-2">
          Review Your Product
        </div>
        <p className="text-gray-400">
          Check everything looks good before continuing
        </p>
      </div>

      {/* Design Summary */}
      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-6">
        <div className="text-base sm:text-lg md:text-xl text-white mb-2 sm:mb-4">
          Your Designs ({designFiles.length})
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
          {Object.entries(designsByPlacement).map(([placement, count]) => (
            <div
              key={placement}
              className="bg-gray-800 border border-gray-700 rounded-lg p-2 sm:p-3 text-center"
            >
              <p className="text-white text-xs sm:text-sm mb-1">
                {printFiles?.available_placements?.[placement] || placement}
              </p>
              <p className="text-xs text-gray-400">
                {count} design{count !== 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setCurrentStep(2)}
          className="mt-2 sm:mt-4 w-full flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-gray-600 transition-all"
        >
          <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
          Add More Designs to Other Placements
        </button>
      </div>

      {mockupUrls && mockupUrls.length > 0 ? (
        <div className="gradient-border-white-bottom rounded-lg p-2 sm:p-6 bg-gray-800">
          <div className="text-sm sm:text-lg md:text-xl text-white mb-2 sm:mb-4">
            Product Previews ({mockupUrls.length})
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 gap-2 sm:gap-6">
            {(showAllPreviews ? mockupUrls : mockupUrls.slice(0, 4)).map(
              (mockup: any, index: number) => (
                <div
                  key={index}
                  className="border border-gray-700 rounded-lg overflow-hidden"
                >
                  <img
                    src={mockup.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-auto"
                  />
                  {mockup.title && (
                    <div className="bg-gray-700 border-t border-gray-600 p-1 sm:p-2">
                      <p className="text-xs text-gray-200 line-clamp-1">
                        {mockup.title}
                      </p>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
          {mockupUrls.length > 4 && (
            <button
              onClick={() => setShowAllPreviews(!showAllPreviews)}
              className="text-xs sm:text-sm text-orange-400 mt-2 sm:mt-4 mx-auto block px-2 sm:px-6 py-1 sm:py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-all"
            >
              {showAllPreviews
                ? "Show Less"
                : `+ ${mockupUrls.length - 4} more preview${
                    mockupUrls.length - 4 !== 1 ? "s" : ""
                  }`}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-6 text-center">
          <p className="text-xs sm:text-sm text-gray-300">
            ⚠️ Please generate a preview in the previous step
          </p>
          <button
            onClick={() => setCurrentStep(3)}
            className="mt-2 sm:mt-4 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-bold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
          >
            Go Back to Generate Preview
          </button>
        </div>
      )}

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 sm:p-6">
        <div className="text-white mb-2 sm:mb-3 text-sm sm:text-base">Summary</div>
        <ul className="space-y-1 sm:space-y-2 text-gray-300 text-xs sm:text-sm">
          <li>✅ {selectedVariants.length} variants selected</li>
          <li>
            ✅ {designFiles.length} design{designFiles.length !== 1 ? "s" : ""}{" "}
            added
          </li>
          <li>
            ✅ {mockupUrls?.length || 0} preview
            {mockupUrls?.length !== 1 ? "s" : ""} generated
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      {/* Header with Progress */}
      <div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-6">
          <div className="mb-3 sm:mb-6 mt-2 sm:mt-6">
            <div className="text-lg sm:text-2xl font-extrabold text-white">
              {selectedProduct?.title || selectedProduct?.name}
            </div>
            <p className="text-xs sm:text-sm text-gray-400">Create your custom product</p>
          </div>

          {/* Enhanced Stepper */}
          <EnhancedStepper
            steps={steps}
            currentStep={currentStep}
            onStepClick={(stepNumber) => {
              // Allow clicking on completed steps or current step
              if (
                steps[stepNumber - 1].completed ||
                stepNumber === currentStep
              ) {
                setCurrentStep(stepNumber);
              }
            }}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="rounded-xl sm:rounded-2xl p-4 sm:p-8">
          {currentStep === 1 && renderVariantSelection()}
          {currentStep === 2 && renderDesignStep()}
          {currentStep === 3 && renderPositioningStep()}
          {currentStep === 4 && renderReviewStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-4 sm:mt-8 flex flex-row items-center justify-between gap-2 sm:gap-4">
          <Button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            variant="tertiary"
            className="flex gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base rounded-lg whitespace-nowrap"
          >
            <ChevronLeft className="w-3 h-3 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Back</span>
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={() => canGoNext() && setCurrentStep(currentStep + 1)}
              disabled={!canGoNext()}
              variant="primary"
              className="flex gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base rounded-lg whitespace-nowrap"
            >
              <span className="hidden sm:inline">Next Step</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-5 sm:h-5" />
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canGoNext()}
              variant="primary"
              className="flex gap-2 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-base rounded-lg whitespace-nowrap"
            >
              <span className="hidden sm:inline">Continue to Product Details</span>
              <span className="sm:hidden">Continue</span>
              <Check className="w-3 h-3 sm:w-5 sm:h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedCanvasWizard;
