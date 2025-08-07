/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";
import { printfulAPI } from "@/lib/api";
import { mockupAPI } from "@/lib/MockupAPI";

import CanvasHeader from "@/components/canvas/CanvasHeader";
import UploadStep from "@/components/canvas/UploadStep";
import DesignStep from "@/components/canvas/DesignStep";
import VariantsStep from "@/components/canvas/VariantsStep";
import FinalizeStep from "@/components/canvas/FinalizeStep";
import ProductPreview from "@/components/canvas/ProductPreview";
import UnifiedDesignEditor from "@/components/canvas/UnifiedDesignEditor";
import ProductDetailsForm from "@/components/canvas/ProductDetailsForm";

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
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [designFiles, setDesignFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<
    | "upload"
    | "design"
    | "variants"
    | "finalize"
    | "unified-editor"
    | "product-details"
  >("upload");
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
  const [mockupUrls, setMockupUrls] = useState<any>([]);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [mockupStatus, setMockupStatus] = useState<string>("");
  const [printFiles, setPrintFiles] = useState<any>(null);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    description: "",
    markupPercentage: "30",
    category: "",
    tags: [],
    regionalSettings: {
      targetRegions: ["US"],
      primaryRegion: "US",
      restrictToRegions: true
    }
  });

  const initializeCanvas = useCallback(async () => {
    try {
      setLoading(true);

      // Check if productId is provided in URL
      if (productId) {
        try {
          const detailed = await printfulAPI.getProductDetails(
            parseInt(productId)
          );
          const product = detailed.result?.product || detailed.result;
          const variants =
            detailed.result?.variants || detailed.result?.product?.variants;

          if (product) {
            const productWithVariants = { ...product, variants };
            setSelectedProduct(productWithVariants);
            localStorage.setItem(
              "selectedPrintfulProduct",
              JSON.stringify(productWithVariants)
            );

            setProductForm({
              name: `Custom ${product.title || product.model}`,
              description: product.description || "",
              markupPercentage: "30",
              category: product.type_name || product.type,
              tags: [],
              regionalSettings: {
                targetRegions: ["US"],
                primaryRegion: "US",
                restrictToRegions: true
              }
            });

            // Start with clean upload step - no demo files
            setStep("upload");
            toast.success(
              "Product loaded! Start by uploading your design files."
            );

            // Wait a bit for auth to be ready, then fetch files
            setTimeout(() => {
              fetchUploadedFiles();
            }, 1000);
            return;
          }
        } catch (error) {
          console.error("Failed to load product from URL:", error);
          toast.error("Failed to load product from URL");
        }
      }

      // Fallback to localStorage
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
          regionalSettings: {
            targetRegions: ["US"],
            primaryRegion: "US",
            restrictToRegions: true
          }
        });
      }

      // Wait a bit for auth to be ready, then fetch files
      setTimeout(() => {
        fetchUploadedFiles();
      }, 1000);
    } catch (error) {
      console.error("Canvas initialization failed:", error);
      toast.error("Failed to initialize canvas");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchUploadedFiles = async () => {
    // Check if user is authenticated first
    if (!user || (user.role !== "creator" && user.role !== "admin")) {
      console.log("User not authenticated, skipping file fetch");
      setUploadedFiles([]);
      return;
    }

    try {
      const response = await printfulAPI.getFiles();
      console.log("Fetched files response:", response);
      // Use the correct response format from our updated API
      setUploadedFiles(response.result || []);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        console.log("Authentication required for file access");
        // Don't show error for auth issues, just set empty array
      } else {
        console.error("Fetching files failed:", err);
      }
      // Set empty array on error
      setUploadedFiles([]);
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
    const steps = ["upload", "unified-editor", "product-details"] as const;
    const index = steps.indexOf(step as any);
    if (index < steps.length - 1) {
      setStep(steps[index + 1]);
    }
  };

  const handlePrevStep = () => {
    const steps = ["upload", "unified-editor", "product-details"] as const;
    const index = steps.indexOf(step as any);
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

  const handlePrintFilesLoaded = (printFilesData: any) => {
    setPrintFiles(printFilesData);
    console.log("Print files loaded:", printFilesData);
  };

  const generatePreview = async (advancedOptions?: {
    technique?: string;
    optionGroups?: string[];
    options?: string[];
    lifelike?: boolean;
    width?: number;
  }) => {
    if (!selectedProduct || !designFiles.length || !selectedVariants.length) {
      toast.error("Missing product, design files, or variants for mockup.");
      return;
    }

    if (designFiles.some((file) => !file.url)) {
      toast.error("One or more design files are missing an image URL.");
      return;
    }

    try {
      setIsGeneratingMockup(true);
      setMockupStatus("Preparing mockup generation...");
      setMockupUrls([]); // Clear previous mockups

      const variantIds = selectedVariants.map((v: any) =>
        typeof v === "number" ? v : v.id
      );

      if (variantIds.length === 0 || variantIds.some((id) => !id)) {
        toast.error("No valid variant IDs selected for the mockup.");
        setIsGeneratingMockup(false);
        setMockupStatus("");
        return;
      }

      // Prepare advanced mockup options
      const mockupOptions: any = {
        productId: selectedProduct.id,
        variantIds: variantIds.slice(0, 3), // Use first 3 variants for preview
        designFiles,
        format: "jpg" as const,
        onStatusUpdate: (status: string, attempts: number) => {
          setMockupStatus(status);
          console.log(`Mockup status update: ${status} (attempt ${attempts})`);
        },
      };

      // Add advanced options if provided
      if (advancedOptions) {
        if (advancedOptions.width) {
          mockupOptions.width = advancedOptions.width;
        }

        if (
          advancedOptions.lifelike !== undefined ||
          advancedOptions.technique
        ) {
          mockupOptions.productOptions = {};
          if (advancedOptions.lifelike !== undefined) {
            mockupOptions.productOptions.lifelike = advancedOptions.lifelike;
          }
        }

        if (
          advancedOptions.optionGroups &&
          advancedOptions.optionGroups.length > 0
        ) {
          mockupOptions.optionGroups = advancedOptions.optionGroups;
        }

        if (advancedOptions.options && advancedOptions.options.length > 0) {
          mockupOptions.options = advancedOptions.options;
        }

        // Log advanced options being used
        console.log("Using advanced mockup options:", {
          technique: advancedOptions.technique,
          optionGroups: advancedOptions.optionGroups,
          options: advancedOptions.options,
          lifelike: advancedOptions.lifelike,
          width: advancedOptions.width,
        });
      }

      const mockupUrls = await mockupAPI.generateProductMockup(mockupOptions);

      setMockupUrls(mockupUrls);
      setMockupStatus("Mockup completed successfully!");
      toast.success("Preview generated successfully!");
    } catch (error: any) {
      console.error("Preview generation failed:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error.message ||
        "Failed to generate preview.";
      setMockupStatus(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  const generateMockup = async () => {
    if (!selectedProduct || !designFiles.length || !selectedVariants.length) {
      toast.error("Missing product, design files, or variants for mockup.");
      return;
    }

    if (designFiles.some((file) => !file.url)) {
      toast.error("One or more design files are missing an image URL.");
      return;
    }

    try {
      setIsGeneratingMockup(true);
      setMockupStatus("Preparing final mockup generation...");
      setMockupUrls([]); // Clear previous mockups

      const variantIds = selectedVariants.map((v: any) =>
        typeof v === "number" ? v : v.id
      );

      if (variantIds.length === 0 || variantIds.some((id) => !id)) {
        toast.error("No valid variant IDs selected for the mockup.");
        setIsGeneratingMockup(false);
        setMockupStatus("");
        return;
      }

      const mockupUrls = await mockupAPI.generateProductMockup({
        productId: selectedProduct.id,
        variantIds,
        designFiles,
        format: "jpg",
        onStatusUpdate: (status: string, attempts: number) => {
          setMockupStatus(status);
          console.log(
            `Final mockup status update: ${status} (attempt ${attempts})`
          );
        },
      });

      setMockupUrls(mockupUrls);
      setMockupStatus("Final mockup completed successfully!");
      toast.success("Mockup generated successfully!");
    } catch (error: any) {
      console.error("Mockup generation failed:", error);
      const errorMessage =
        error?.response?.data?.error ||
        error.message ||
        "Failed to generate mockup.";
      setMockupStatus(`Error: ${errorMessage}`);
      toast.error(errorMessage);
    } finally {
      setIsGeneratingMockup(false);
    }
  };

  // Handle going live to marketplace with product details
  const handleGoLiveToMarketplace = async () => {
    if (!mockupUrls || mockupUrls.length === 0) {
      toast.error("No mockups available. Please generate mockups first.");
      return;
    }

    try {
      setCreating(true);

      const productData = {
        id: selectedProduct?.id,
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category,
        markupPercentage: parseFloat(productForm.markupPercentage),
        variants: selectedVariants,
        base_product: selectedProduct,
        regionalSettings: productForm.regionalSettings
      };

      toast.loading("Publishing your product to marketplace...", {
        id: "marketplace",
      });

      const result = await printfulAPI.storeMockupsPermanently(
        mockupUrls,
        productData
      );

      toast.dismiss("marketplace");

      if (result.success && result.marketplace_ready) {
        toast.success(`🎉 "${productForm.name}" is now live in marketplace!`, {
          duration: 6000,
        });

        // Show success details
        setTimeout(() => {
          toast.success(
            `✅ ${result.storage_stats.total_stored} product images stored permanently`,
            {
              duration: 4000,
            }
          );
        }, 1000);

        // Clear current session and redirect
        setTimeout(() => {
          toast.success("🚀 Product published successfully! Redirecting...", {
            duration: 3000,
          });

          // Reset form and redirect to products page
          setMockupUrls([]);
          setDesignFiles([]);
          setStep("upload");
          window.location.href = "/dashboard/creator/products";
        }, 3000);
      } else {
        toast.error(
          `Failed to publish product: ${
            result.details || result.error || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Marketplace error:", error);
      toast.dismiss("marketplace");
      toast.error("Failed to publish to marketplace");
    } finally {
      setCreating(false);
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
          <>
            {step === "unified-editor" ? (
              <UnifiedDesignEditor
                selectedProduct={selectedProduct}
                selectedVariants={selectedVariants}
                setSelectedVariants={setSelectedVariants}
                designFiles={designFiles}
                setDesignFiles={setDesignFiles}
                uploadedFiles={uploadedFiles}
                printFiles={printFiles}
                onGeneratePreview={generatePreview}
                isGeneratingPreview={isGeneratingMockup}
                mockupUrls={mockupUrls}
                mockupStatus={mockupStatus}
                onNext={handleNextStep}
                onPrev={handlePrevStep}
                onPrintFilesLoaded={handlePrintFilesLoaded}
                onRefreshFiles={fetchUploadedFiles}
              />
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
                      printFiles={printFiles}
                      onGeneratePreview={generatePreview}
                      isGeneratingPreview={isGeneratingMockup}
                    />
                  )}

                  {step === "variants" && (
                    <VariantsStep
                      selectedProduct={selectedProduct}
                      selectedVariants={selectedVariants}
                      setSelectedVariants={setSelectedVariants}
                      onPrevStep={handlePrevStep}
                      onNextStep={handleNextStep}
                      onPrintFilesLoaded={handlePrintFilesLoaded}
                    />
                  )}

                  {step === "finalize" && (
                    <FinalizeStep
                      productForm={productForm}
                      setProductForm={setProductForm}
                      selectedProduct={selectedProduct}
                      selectedVariants={selectedVariants}
                      designFiles={designFiles}
                      mockupUrl={mockupUrls}
                      onGenerateMockup={generateMockup}
                      isGeneratingMockup={isGeneratingMockup}
                      onPrevStep={handlePrevStep}
                    />
                  )}

                  {step === "product-details" && (
                    <ProductDetailsForm
                      initialData={{
                        name: productForm.name,
                        description: productForm.description,
                        markupPercentage: productForm.markupPercentage,
                        category: productForm.category,
                      }}
                      onSave={(data) => {
                        setProductForm({
                          ...productForm,
                          name: data.name,
                          description: data.description,
                          markupPercentage: data.markupPercentage.toString(),
                          category: data.category,
                        });
                      }}
                      onNext={handleGoLiveToMarketplace}
                      isLoading={creating}
                    />
                  )}
                </div>

                {/* <div className="lg:col-span-1">
                  <ProductPreview
                    selectedProduct={selectedProduct}
                    productForm={productForm}
                    designFiles={designFiles}
                    selectedVariants={selectedVariants}
                    loading={loading}
                    mockupUrl={mockupUrls}
                    isGeneratingMockup={isGeneratingMockup}
                  />
                </div> */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
