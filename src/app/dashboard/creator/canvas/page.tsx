/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";
import { printfulAPI, productAPI } from "@/lib/api";
import { mockupAPI } from "@/lib/MockupAPI";

import CanvasHeader from "@/components/canvas/CanvasHeader";
import UploadStep from "@/components/canvas/UploadStep";
import DesignStep from "@/components/canvas/DesignStep";
import VariantsStep from "@/components/canvas/VariantsStep";
import FinalizeStep from "@/components/canvas/FinalizeStep";
import ProductPreview from "@/components/canvas/ProductPreview";

import {
  DesignFile,
  PrintfulProduct,
  ProductForm,
  PlacementPosition,
} from "@/lib/types"; // You should create these interfaces in a separate file if not already created

const DEFAULT_PRINT_AREAS = [
  { type: "front", area_width: 1800, area_height: 2400, dpi: 150 },
  { type: "back", area_width: 1800, area_height: 2400, dpi: 150 },
  { type: "sleeve_left", area_width: 800, area_height: 600, dpi: 150 },
  { type: "sleeve_right", area_width: 800, area_height: 600, dpi: 150 },
];

export default function CanvasPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CanvasContent />
    </Suspense>
  );
}

function CanvasContent() {
  const { user } = useAuth();
  const router = useRouter();

  const [selectedProduct, setSelectedProduct] =
    useState<PrintfulProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [designFiles, setDesignFiles] = useState<DesignFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<
    "upload" | "design" | "variants" | "finalize"
  >("upload");
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
  const [mockupUrl, setMockupUrl] = useState<string>("");
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    description: "",
    markupPercentage: "30",
    category: "",
    tags: [],
  });

  const initializeCanvas = useCallback(async () => {
    try {
      setLoading(true);
      const savedProduct = localStorage.getItem("selectedPrintfulProduct");
      if (savedProduct) {
        const product = JSON.parse(savedProduct);
        if (!product.variants?.length) {
          const detailed = await printfulAPI.getProductDetails(product.id);
          const variants =
            detailed.result?.variants || detailed.result?.product?.variants;
          if (variants?.length) {
            const updatedProduct = { ...product, variants };
            localStorage.setItem(
              "selectedPrintfulProduct",
              JSON.stringify(updatedProduct)
            );
            setSelectedProduct(updatedProduct);
          } else {
            setSelectedProduct(product);
          }
        } else {
          setSelectedProduct(product);
        }

        setProductForm({
          name: `Custom ${product.title || product.model}`,
          description: product.description || "",
          markupPercentage: "30",
          category: product.type_name || product.type,
          tags: [],
        });
      }

      await fetchUploadedFiles();
    } catch (error) {
      console.error("Canvas initialization failed:", error);
      toast.error("Failed to initialize canvas");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUploadedFiles = async () => {
    try {
      const response = await printfulAPI.getFiles();
      setUploadedFiles(response.files || []);
    } catch (err) {
      console.error("Fetching files failed:", err);
    }
  };

  const handleAddDesignFile = (file: any, placement: string = "front") => {
    const printArea = DEFAULT_PRINT_AREAS.find(
      (area) => area.type === placement
    );
    if (!printArea) return toast.error("Invalid placement");

    const defaultWidth = Math.min(printArea.area_width * 0.8, 1200);
    const defaultHeight = Math.min(printArea.area_height * 0.8, 1200);

    const designFile: DesignFile = {
      id: Date.now() + Math.random(),
      filename: file.filename,
      url: file.file_url,
      type: "design",
      placement,
      position: {
        area_width: printArea.area_width,
        area_height: printArea.area_height,
        width: defaultWidth,
        height: defaultHeight,
        top: (printArea.area_height - defaultHeight) / 2,
        left: (printArea.area_width - defaultWidth) / 2,
        limit_to_print_area: true,
      },
    };

    const exists = designFiles.find((f) => f.placement === placement);
    if (exists) {
      toast.error(`${placement} already has a design`);
      return;
    }

    setDesignFiles((prev) => [...prev, designFile]);
    toast.success(`Added design to ${placement}`);
  };

  const handleRemoveDesignFile = (fileId: number) => {
    setDesignFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const updateDesignPosition = (
    fileId: number,
    position: Partial<PlacementPosition>
  ) => {
    setDesignFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, position: { ...file.position, ...position } }
          : file
      )
    );
  };

  const setPresetPosition = (fileId: number, preset: string) => {
    const file = designFiles.find((f) => f.id === fileId);
    if (!file || !file.position) return;

    const { area_width, area_height, width, height } = file.position;
    const presets: Record<string, [number, number]> = {
      "top-left": [0, 0],
      "top-center": [0, (area_width - width) / 2],
      "top-right": [0, area_width - width],
      center: [(area_height - height) / 2, (area_width - width) / 2],
      "bottom-left": [area_height - height, 0],
      "bottom-center": [area_height - height, (area_width - width) / 2],
      "bottom-right": [area_height - height, area_width - width],
    };

    const [top, left] = presets[preset];
    updateDesignPosition(fileId, { top, left });
    toast.success(`Set position: ${preset}`);
  };

  const handleNextStep = () => {
    const steps = ["upload", "design", "variants", "finalize"] as const;
    const index = steps.indexOf(step);
    if (index < steps.length - 1) {
      setStep(steps[index + 1]);
    }
  };

  const handlePrevStep = () => {
    const steps = ["upload", "design", "variants", "finalize"] as const;
    const index = steps.indexOf(step);
    if (index > 0) {
      setStep(steps[index - 1]);
    }
  };

  useEffect(() => {
    if (user?.role === "creator" || user?.role === "admin") {
      initializeCanvas();
    }
  }, [user, initializeCanvas]);

  if (!user || (user.role !== "creator" && user.role !== "admin")) return null;

  if (!selectedProduct && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No product selected
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a product from the catalog first.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/creator/catalog"
              className="inline-flex items-center px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm text-sm font-medium"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const generateMockup = async () => {
    if (!selectedProduct || !designFiles.length || !selectedVariants.length) {
      toast.error("Missing product, design files, or variants.");
      return;
    }

    try {
      setIsGeneratingMockup(true);

      const variantIds = selectedVariants.map((v: any) =>
        typeof v === "number" ? v : v.id
      );

      const mockupUrl = await mockupAPI.generateProductMockup({
        variantIds,
        designFiles,
        format: "jpg", // or "png"
      });

      setMockupUrl(mockupUrl);
      toast.success("Mockup generated!");
    } catch (error) {
      console.error("Mockup generation failed:", error);
      toast.error("Failed to generate mockup.");
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CanvasHeader
        selectedProduct={selectedProduct}
        step={step}
        creating={creating}
        onCreateProduct={() => {}}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading design canvas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              {step === "upload" && (
                <UploadStep
                  uploadedFiles={uploadedFiles}
                  uploading={uploading}
                  setUploading={setUploading}
                  setUploadedFiles={setUploadedFiles}
                  onNextStep={handleNextStep}
                  printfulAPI={printfulAPI}
                />
              )}

              {step === "design" && (
                <DesignStep
                  uploadedFiles={uploadedFiles}
                  designFiles={designFiles}
                  onAddDesignFile={handleAddDesignFile}
                  onRemoveDesignFile={handleRemoveDesignFile}
                  onUpdateDesignPosition={updateDesignPosition}
                  onSetPresetPosition={setPresetPosition}
                  onPrevStep={handlePrevStep}
                  onNextStep={handleNextStep}
                />
              )}

              {step === "variants" && (
                <VariantsStep
                  selectedProduct={selectedProduct}
                  selectedVariants={selectedVariants}
                  setSelectedVariants={setSelectedVariants}
                  onPrevStep={handlePrevStep}
                  onNextStep={handleNextStep}
                />
              )}

              {step === "finalize" && (
                <FinalizeStep
                  productForm={productForm}
                  setProductForm={setProductForm}
                  selectedProduct={selectedProduct}
                  selectedVariants={selectedVariants}
                  designFiles={designFiles}
                  mockupUrl={mockupUrl}
                  onGenerateMockup={() => {
                    console.log("Generate mockup");
                    setIsGeneratingMockup(true);
                    generateMockup();
                    console.log("Mockup generated");
                    setIsGeneratingMockup(false);
                  }}
                  isGeneratingMockup={isGeneratingMockup}
                  onPrevStep={handlePrevStep}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <ProductPreview
                selectedProduct={selectedProduct}
                productForm={productForm}
                designFiles={designFiles}
                selectedVariants={selectedVariants}
                loading={loading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
