"use client";

import { PrintfulProduct } from "@/lib/types";
import { ArrowLeft, CheckCircle, Save, Loader2 } from "lucide-react";
import Link from "next/link";

type Step =
  | "upload"
  | "design"
  | "variants"
  | "finalize"
  | "unified-editor"
  | "product-details";

interface StepIndicatorProps {
  step: Step;
}

const StepIndicator = ({ step }: StepIndicatorProps) => {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "design", label: "Design" },
    { key: "variants", label: "Variants" },
    { key: "finalize", label: "Finalize" },
  ];

  const getStepStatus = (stepKey: Step, currentStep: Step) => {
    const stepIndex = steps.findIndex((s) => s.key === stepKey);
    const currentIndex = steps.findIndex((s) => s.key === currentStep);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      {steps.map((stepItem, index) => {
        const status = getStepStatus(stepItem.key, step);

        return (
          <div key={stepItem.key} className="flex items-center">
            <div
              className={`flex items-center space-x-1 ${
                status === "current"
                  ? "text-indigo-600"
                  : status === "completed"
                  ? "text-green-600"
                  : "text-gray-400"
              }`}
            >
              {status === "completed" ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-current" />
              )}
              <span>{stepItem.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className="w-6 h-px bg-gray-300 ml-2" />
            )}
          </div>
        );
      })}
    </div>
  );
};

interface CanvasHeaderProps {
  selectedProduct?: PrintfulProduct | null;
  step: Step;
  creating: boolean;
  onCreateProduct: () => void;
}

const CanvasHeader = ({
  selectedProduct,
  step,
  creating,
  onCreateProduct,
}: CanvasHeaderProps) => {
  return (
    <div className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/creator/catalog"
              className="inline-flex items-center text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Catalog
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {selectedProduct
                  ? `Design ${selectedProduct.title || selectedProduct.model}`
                  : "Design Canvas"}
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Upload designs and create your custom product
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <StepIndicator step={step} />

            {step === "finalize" && (
              <button
                onClick={onCreateProduct}
                disabled={creating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Product
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasHeader;
