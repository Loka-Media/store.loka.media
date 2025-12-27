/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Info,
  Sparkles,
  Upload as UploadIcon,
  Image as ImageIcon,
  Type,
  Smile,
  Eye,
  ShoppingBag,
  Palette,
  Ruler,
  HelpCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { UnifiedDesignEditorProps } from "./types";

// Import existing tab components (we'll reuse logic but simplify UI)
import { useDesignEditorState, usePrintFilesLoader, useAutoSelectVariants } from "./hooks";
import { getActivePrintFile } from "./utils";

interface WizardStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

const SimplifiedCanvasWizard: React.FC<UnifiedDesignEditorProps> = ({
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
    uniqueSizes,
    uniqueColors,
  } = stateHook;

  // Define wizard steps
  const steps: WizardStep[] = [
    {
      id: "variants",
      title: "Choose Your Product",
      description: "Select colors and sizes for your product",
      icon: ShoppingBag,
      completed: selectedVariants.length > 0,
    },
    {
      id: "design",
      title: "Add Your Design",
      description: "Upload or create your design",
      icon: Palette,
      completed: designFiles.length > 0,
    },
    {
      id: "position",
      title: "Position & Adjust",
      description: "Perfect your design placement",
      icon: Ruler,
      completed: designFiles.length > 0 && !!mockupUrls && mockupUrls.length > 0,
    },
    {
      id: "preview",
      title: "Preview & Publish",
      description: "Review and finalize your product",
      icon: Eye,
      completed: false,
    },
  ];

  const currentStepData = steps[currentStep - 1];
  const progress = (currentStep / steps.length) * 100;

  // Step 1: Variant Selection (Simplified)
  const renderVariantSelection = () => {
    return (
      <div className="space-y-8">
        {/* Header with help */}
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

        {/* Help panel */}
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

        {/* Color Selection */}
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
          {selectedColors.length === 0 && (
            <p className="mt-4 text-sm text-gray-600 font-bold">
              💡 Tip: Select at least one color to continue
            </p>
          )}
        </div>

        {/* Size Selection */}
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
          {selectedSizes.length === 0 && (
            <p className="mt-4 text-sm text-gray-600 font-bold">
              💡 Tip: Select at least one size to continue
            </p>
          )}
        </div>

        {/* Selection Summary */}
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
  };

  // Step 2: Design Upload (Simplified)
  const renderDesignUpload = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-black mb-2">Add Your Design</h2>
          <p className="text-gray-700 font-bold">
            Choose how you want to create your design
          </p>
        </div>

        {/* Quick Design Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Design */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-yellow-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
                <UploadIcon className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-extrabold text-black">Upload Image</h3>
            </div>
            <p className="text-gray-700 font-bold mb-4">
              Upload your own PNG, JPG, or SVG file
            </p>
            <input
              type="file"
              accept="image/*"
              className="w-full"
              onChange={(e) => {
                // Handle file upload
                toast.success("Image uploaded!");
              }}
            />
          </div>

          {/* Create Text */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-pink-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
                <Type className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-extrabold text-black">Add Text</h3>
            </div>
            <p className="text-gray-700 font-bold mb-4">
              Create text-based designs with fonts
            </p>
            <button className="w-full bg-black text-white py-3 px-6 rounded-xl font-extrabold border-4 border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
              Create Text Design
            </button>
          </div>

          {/* Use Clipart */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
                <ImageIcon className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-extrabold text-black">Browse Clipart</h3>
            </div>
            <p className="text-gray-700 font-bold mb-4">
              Choose from thousands of clipart images
            </p>
            <button className="w-full bg-black text-white py-3 px-6 rounded-xl font-extrabold border-4 border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
              Browse Library
            </button>
          </div>

          {/* Add Emoji */}
          <div className="bg-white border-4 border-black rounded-2xl p-6 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer group">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-300 border-2 border-black rounded-xl group-hover:scale-110 transition-transform">
                <Smile className="w-6 h-6 text-black" />
              </div>
              <h3 className="text-xl font-extrabold text-black">Add Emoji</h3>
            </div>
            <p className="text-gray-700 font-bold mb-4">
              Add fun emojis to your design
            </p>
            <button className="w-full bg-black text-white py-3 px-6 rounded-xl font-extrabold border-4 border-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
              Pick Emoji
            </button>
          </div>
        </div>

        {/* Your Designs */}
        {designFiles.length > 0 && (
          <div className="bg-white border-4 border-black rounded-2xl p-6">
            <h3 className="text-xl font-extrabold text-black mb-4">
              Your Designs ({designFiles.length})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {designFiles.map((design) => (
                <div
                  key={design.id}
                  className="bg-gray-100 border-2 border-black rounded-xl p-3"
                >
                  <div className="aspect-square bg-white border-2 border-black rounded-lg mb-2 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-xs font-bold text-black truncate">
                    {design.filename}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Step 3: Position & Adjust
  const renderPositioning = () => {
    return (
      <div className="border-4 border-black rounded-2xl bg-white p-6 space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-black mb-2">
            Position Your Design
          </h2>
          <p className="text-gray-700 font-bold">
            Adjust the placement and size of your design
          </p>
        </div>

        <div className="bg-yellow-100 border-4 border-yellow-600 rounded-2xl p-6">
          <p className="font-bold text-black">
            🎨 Drag and resize your design on the canvas. Click "Generate Preview" when
            you're happy with the placement!
          </p>
        </div>

        {/* This will render the actual canvas */}
        <div className="bg-white border-4 border-black rounded-2xl p-6">
          <p className="text-center text-gray-500 font-bold py-20">
            Design Canvas Will Appear Here
          </p>
        </div>

        <button
          onClick={() => onGeneratePreview()}
          disabled={isGeneratingPreview}
          className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-4 px-6 rounded-xl font-extrabold border-4 border-black hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 text-lg"
        >
          {isGeneratingPreview ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
              Generating Preview...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6" />
              Generate Preview
            </span>
          )}
        </button>
      </div>
    );
  };

  // Step 4: Preview & Publish
  const renderPreview = () => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-extrabold text-black mb-2">
            Preview & Publish
          </h2>
          <p className="text-gray-700 font-bold">
            Review your product and publish to marketplace
          </p>
        </div>

        {mockupUrls && mockupUrls.length > 0 ? (
          <div className="bg-white border-4 border-black rounded-2xl p-6">
            <h3 className="text-xl font-extrabold text-black mb-4">
              Your Product Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-6">
              {mockupUrls.slice(0, 4).map((mockup, index) => (
                <div key={index} className="border-2 border-black rounded-xl overflow-hidden">
                  <img
                    src={mockup.url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-100 border-4 border-yellow-600 rounded-2xl p-6 text-center">
            <p className="font-bold text-black">
              ⚠️ Please generate a preview in the previous step first
            </p>
          </div>
        )}

        <button
          onClick={onNext}
          disabled={!mockupUrls || mockupUrls.length === 0}
          className="w-full bg-green-500 text-white py-4 px-6 rounded-xl font-extrabold border-4 border-black hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 text-lg"
        >
          Continue to Product Details →
        </button>
      </div>
    );
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return selectedColors.length > 0 && selectedSizes.length > 0;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100">
      {/* Header with Progress */}
      <div className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Product Title */}
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
          {currentStep === 2 && renderDesignUpload()}
          {currentStep === 3 && renderPositioning()}
          {currentStep === 4 && renderPreview()}
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
              Complete & Continue
              <Check className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedCanvasWizard;
