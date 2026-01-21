/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";
import { printfulAPI } from "@/lib/api";
import { mockupAPI } from "@/lib/MockupAPI";
import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";

import EnhancedCanvasWizard from "@/components/canvas/EnhancedCanvasWizard";
import EnhancedProductDetailsForm from "@/components/canvas/EnhancedProductDetailsForm";
import CreativeLoader from "@/components/CreativeLoader";

import {
  DesignFile,
  ProductForm,
} from "@/lib/types";


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
  const [designFiles, setDesignFiles] = useState<DesignFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<
    | "upload"
    | "unified-editor"
    | "product-details"
  >("upload");
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
  const [mockupUrls, setMockupUrls] = useState<any>([]);
  const [isGeneratingMockup, setIsGeneratingMockup] = useState(false);
  const [mockupStatus, setMockupStatus] = useState<string>("");
  const [printFiles, setPrintFiles] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    description: "",
    markupPercentage: "30",
    category: "",
    tags: []
  });

  const hasInitializedRef = useRef(false);

  const initializeCanvas = useCallback(async () => {
    if (isInitialized || hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    try {
      setLoading(true);

      // Check if productId is provided in URL
      if (productId) {
        try {
          // First, check product availability
          console.log(`🔍 Checking availability for product ${productId}...`);
          const availabilityCheck = await printfulAPI.checkProductAvailability(parseInt(productId));
          
          if (!availabilityCheck.result.can_create_product) {
            toast.error(`${availabilityCheck.result.message}. Please select a different product.`, {
              duration: 6000
            });
            router.push('/dashboard/creator/canvas');
            return;
          }

          if (availabilityCheck.result.warnings && availabilityCheck.result.warnings.length > 0) {
            console.warn('Product availability warnings:', availabilityCheck.result.warnings);
          }
          
          // If available, proceed to get product details
          const detailed = await printfulAPI.getProductDetails(
            parseInt(productId)
          );
          const product = detailed.result?.product || detailed.result;
          const variants =
            detailed.result?.variants || detailed.result?.product?.variants;

          if (product) {
            // Filter variants based on catalog data (no API call needed)
            console.log(`🔍 Filtering ${variants?.length || 0} variants from catalog...`);

            const availableVariants = variants?.filter((variant: any) => {
              const isInAvailabilityResults = availabilityCheck.result.available_variant_ids.includes(variant.id);
              const variantCanCreate = variant.can_create_product !== false;
              const isAvailable = isInAvailabilityResults && variantCanCreate;

              if (!isAvailable) {
                console.log(`⚠️ Filtering out variant ${variant.id} (${variant.name}): not available`);
              }

              return isAvailable;
            }) || variants;

            const originalCount = variants?.length || 0;
            const filteredCount = availableVariants?.length || 0;
            const filteredOut = originalCount - filteredCount;

            if (filteredOut > 0) {
              console.log(`📊 Variant filtering: ${filteredCount}/${originalCount} variants available (${filteredOut} filtered out)`);
            }

            const productWithVariants = { ...product, variants: availableVariants };
            setSelectedProduct(productWithVariants);
            localStorage.setItem(
              "selectedPrintfulProduct",
              JSON.stringify(productWithVariants)
            );

            // Check if there's saved product form data for this product
            const savedFormKey = `productForm_${productId}`;
            const savedForm = localStorage.getItem(savedFormKey);

            if (savedForm) {
              // Use saved form data if it exists
              const parsedForm = JSON.parse(savedForm);
              setProductForm(parsedForm);
              console.log(`📝 Loaded saved product form for product ${productId}`);
            } else {
              // Initialize with default Printful product data
              setProductForm({
                name: `Custom ${product.title || product.model}`,
                description: product.description || "",
                markupPercentage: "30",
                category: product.type_name || product.type,
                tags: []
              });
            }

            setStep("unified-editor");

            return;
          }
        } catch (error: any) {
          console.error("Failed to load product from URL:", error);
          
          // Handle 404 errors for deprecated products
          if (error?.response?.status === 404) {
            const errorData = error?.response?.data;
            const message = errorData?.message || "This product is no longer available in Printful catalog. Please select a different product.";
            
            toast.error(message, { duration: 5000 });
            router.push("/dashboard/creator/catalog");
            return;
          } else {
            toast.error("Failed to load product details. Please try again.");
          }
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
          tags: []
        });
      }
    } catch (error) {
      console.error("Canvas initialization failed:", error);
      toast.error("Failed to initialize canvas");
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [productId, isInitialized, router]);

  const fetchUploadedFiles = useCallback(async () => {
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
  }, [user]);


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
    if ((user?.role === "creator" || user?.role === "admin") && !isInitialized) {
      initializeCanvas();
    }
  }, [user, isInitialized, initializeCanvas]);

  useEffect(() => {
    if ((user?.role === "creator" || user?.role === "admin") && isInitialized && uploadedFiles.length === 0) {
      const timer = setTimeout(() => {
        fetchUploadedFiles();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, isInitialized, uploadedFiles.length, fetchUploadedFiles]);

  if (!selectedProduct && !loading) {
    return (
      <CreatorProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center p-12 gradient-border-white-top rounded-3xl bg-gray-900">
          <div className="w-16 h-16 bg-orange-500/20 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-orange-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            No product selected
          </h3>
          <p className="text-gray-400 mb-8 font-medium">
            Please select a product from the catalog first.
          </p>
          <Link
            href="/dashboard/creator/catalog"
            className="inline-flex items-center px-8 py-4 text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-2xl font-bold transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
          >
            Browse Catalog
          </Link>
        </div>
        </div>
      </CreatorProtectedRoute>
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
    if (!selectedProduct || !selectedVariants.length) {
      toast.error("Missing product or variants for mockup.");
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

      // Debug logging to identify the mismatch
      console.log("=== MOCKUP DEBUG INFO ===");
      console.log("Selected Product ID:", selectedProduct.id);
      console.log("Selected Product:", selectedProduct);
      console.log("Selected Variant IDs:", variantIds);
      console.log("Available Product Variants:", selectedProduct.variants);
      console.log("Design Files:", designFiles);
      console.log("advancedOptions", advancedOptions);

      // Validate that variant IDs actually belong to this product
      const validVariantIds = variantIds.filter((variantId: number) =>
        selectedProduct.variants?.some((v: any) => v.id === variantId)
      );

      console.log("Valid Variant IDs (filtered):", validVariantIds);

      if (validVariantIds.length === 0) {
        toast.error(
          "No valid variants found for this product. Please reselect variants."
        );
        setIsGeneratingMockup(false);
        setMockupStatus("");
        return;
      }

      // COMPOSITE IMAGE CREATION for multiple designs per placement
      setMockupStatus("Processing multiple designs per placement...");
      console.log("🎨 Processing designs for mockup generation...");
      console.log("🔧 printFiles state:", printFiles);
      
      let finalDesignFiles = [...designFiles];
      
      // Check if we have multiple designs per placement that need compositing
      const designsByPlacement = designFiles.reduce<Record<string, typeof designFiles>>((acc, design) => {
        if (!acc[design.placement]) acc[design.placement] = [];
        acc[design.placement].push(design);
        return acc;
      }, {});
      
      const needsCompositing = Object.values(designsByPlacement).some(designs => designs.length > 1);
      
      console.log('🔍 COMPOSITING DECISION:');
      console.log('  needsCompositing:', needsCompositing);
      console.log('  printFiles available:', !!printFiles);
      console.log('  designsByPlacement:', designsByPlacement);
      
      // Debug: Log the composite decision logic
      Object.values(designsByPlacement).forEach((designs, index) => {
        console.log(`  Placement ${index + 1}: ${designs.length} designs - ${designs.length > 1 ? 'NEEDS COMPOSITE' : 'single design'}`);
      });
      
      if (!needsCompositing) {
        console.log('🚫 COMPOSITING SKIPPED - No placements have multiple designs');
      }
      if (!printFiles) {
        console.log('🚫 COMPOSITING SKIPPED - printFiles is null/undefined');
      }
      
      if (needsCompositing && printFiles) {
        try {
          setMockupStatus("Creating composite images for multiple designs...");
          console.log("🔧 Multiple designs detected, creating composite images...");
          console.log(`Input designs for compositing:`, designFiles.map(d => ({placement: d.placement, filename: d.filename, url: d.url.substring(0, 60)})));
          
          // Import the composite image creator
          const { createCompositeImagesForPlacements } = await import('../../../../utils/imageComposer');
          
          // Create composite images for placements with multiple designs
          const compositeDesigns = await createCompositeImagesForPlacements(
            designFiles.filter(file => file.placement && file.url),
            printFiles
          );
          
          console.log(`✅ Composite creation complete: ${designFiles.length} original → ${compositeDesigns.length} final designs`);
          
          // CRITICAL VALIDATION: Ensure compositeDesigns is valid
          if (!compositeDesigns || compositeDesigns.length === 0) {
            throw new Error('Composite creation returned empty result');
          }
          
          // Validate that we actually have composite designs (not fallback individual designs)
          const hasActualComposites = Object.values(designsByPlacement).some(designs => 
            designs.length > 1 && compositeDesigns.some(comp => 
              comp.placement === designs[0].placement && comp.url !== designs[0].url
            )
          );
          
          if (!hasActualComposites) {
            console.warn('⚠️ WARNING: No actual composite images were created - all were fallbacks');
          }
          
          // CRITICAL: Make sure we're using the composite designs
          finalDesignFiles = compositeDesigns;
          
          // Update the design state with composite designs for future operations (async)
          setDesignFiles(compositeDesigns);
          
          console.log('🎯 COMPOSITE RESULTS - finalDesignFiles updated with:');
          finalDesignFiles.forEach((design, index) => {
            console.log(`  COMPOSITE ${index + 1}: ${design.placement} - ${design.filename} - ${design.url}`);
          });
          
        } catch (error) {
          console.error("❌ COMPOSITE CREATION FAILED:", error);
          console.error("❌ Error type:", typeof error);
          console.error("❌ Error message:", error instanceof Error ? error.message : String(error));
          console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
          console.error("❌ Failed with designFiles count:", designFiles.length);
          console.error("❌ Failed with printFiles:", printFiles);
          
          setMockupStatus("Composite creation failed, using individual designs...");
          // Continue with original design files
          finalDesignFiles = [...designFiles];
          
          console.log('💥 FALLBACK - Using original designs:');
          finalDesignFiles.forEach((design, index) => {
            console.log(`  FALLBACK ${index + 1}: ${design.placement} - ${design.filename} - ${design.url}`);
          });
        }
      } else {
        console.log('ℹ️  No compositing needed - using original designs as-is');
        if (!needsCompositing) {
          console.log('   Reason: needsCompositing = false');
          console.log('   designsByPlacement:', Object.keys(designsByPlacement).map(placement => `${placement}: ${designsByPlacement[placement].length} designs`));
        }
        if (!printFiles) {
          console.log('   Reason: printFiles not available');
        }
      }
      
      console.log(`📸 Final design files for mockup: ${finalDesignFiles.length} designs`);
      finalDesignFiles.forEach((design, index) => {
        console.log(`  ${index + 1}. ${design.placement}: ${design.filename} - ${design.url.substring(0, 60)}...`);
      });

      // Prepare advanced mockup options
      const mockupOptions: any = {
        productId: selectedProduct.id,
        variantIds: validVariantIds.slice(0, 3), // Use first 3 valid variants for preview
        designFiles: finalDesignFiles, // CRITICAL: Use finalDesignFiles (composite if created, original if not)
        format: "jpg" as const,
        onStatusUpdate: (status: string, attempts: number) => {
          setMockupStatus(status);
          console.log(`Mockup status update: ${status} (attempt ${attempts})`);
        },
      };

      // Add advanced options if provided, but be conservative with filters
      if (advancedOptions) {
        // Always set a reasonable width
        mockupOptions.width = advancedOptions.width || 1600;

        // Set product options (lifelike rendering)
        mockupOptions.productOptions = {
          lifelike:
            advancedOptions.lifelike !== undefined
              ? advancedOptions.lifelike
              : true,
        };

        // IMPORTANT: Only add option filters if user explicitly selected specific ones
        // Having ALL options selected is more restrictive than having NONE selected
        const hasSpecificOptionGroups =
          advancedOptions.optionGroups &&
          advancedOptions.optionGroups.length > 0 &&
          advancedOptions.optionGroups.length < 4; // Less than all 4 option groups

        const hasSpecificOptions =
          advancedOptions.options &&
          advancedOptions.options.length > 0 &&
          advancedOptions.options.length < 6; // Less than all 6 options

        if (hasSpecificOptionGroups) {
          mockupOptions.optionGroups = advancedOptions.optionGroups;
          console.log(
            "✅ Adding selective option groups filter:",
            advancedOptions.optionGroups
          );
        } else {
          console.log("⭕ Skipping option groups filter (allowing all styles)");
        }

        if (hasSpecificOptions) {
          mockupOptions.options = advancedOptions.options;
          console.log(
            "✅ Adding selective options filter:",
            advancedOptions.options
          );
        } else {
          console.log("⭕ Skipping options filter (allowing all options)");
        }

        // Debug: Log what we're sending to the API
        console.log("🔍 Advanced Options Debug:", {
          provided: {
            technique: advancedOptions.technique,
            optionGroups: advancedOptions.optionGroups,
            options: advancedOptions.options,
            lifelike: advancedOptions.lifelike,
            width: advancedOptions.width,
          },
          sending: {
            width: mockupOptions.width,
            productOptions: mockupOptions.productOptions,
            optionGroups: mockupOptions.optionGroups,
            options: mockupOptions.options,
          },
        });
      }
      console.log("🔍 Mockup Options Debug:", mockupOptions);

      // CRITICAL DEBUG: Log what we're actually sending to the mockup API
      console.log('🚀 FINAL CHECK - About to send to mockupAPI.generateProductMockup:');
      console.log('mockupOptions.designFiles length:', mockupOptions.designFiles?.length);
      console.log('mockupOptions.designFiles full data:', JSON.stringify(mockupOptions.designFiles, null, 2));
      
      if (mockupOptions.designFiles) {
        mockupOptions.designFiles.forEach((design: any, index: number) => {
          console.log(`  FINAL DESIGN ${index + 1}: ${design.placement} - ${design.filename} - ${design.url}`);
        });
        
        // Count designs per placement to detect if compositing worked
        const placementCount = mockupOptions.designFiles.reduce((acc: any, design: any) => {
          acc[design.placement] = (acc[design.placement] || 0) + 1;
          return acc;
        }, {});
        console.log('🔢 CRITICAL CHECK - Designs per placement in mockupOptions:', placementCount);
        
        // If we still have multiple designs per placement, something went wrong
        Object.entries(placementCount).forEach(([placement, count]) => {
          if ((count as number) > 1) {
            console.error(`🚨 CRITICAL ERROR: Still have ${count} designs for placement '${placement}' - composite creation failed!`);
          }
        });
      } else {
        console.error('🚨 CRITICAL ERROR: mockupOptions.designFiles is undefined!');
      }

      const mockupUrls = await mockupAPI.generateProductMockup({
        ...mockupOptions,
        printFiles
      });

      setMockupUrls(mockupUrls);
      setMockupStatus("Mockup generated successfully!");
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


  // Handle going live to marketplace with product details
  const handleGoLiveToMarketplace = async (updatedProductForm?: typeof productForm) => {
    if (!mockupUrls || mockupUrls.length === 0) {
      toast.error("No mockups available. Please generate mockups first.");
      return;
    }

    if (!selectedVariants || selectedVariants.length === 0) {
      toast.error("No variants selected. Please select at least one size/color combination.");
      return;
    }

    try {
      setCreating(true);

      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };

      window.addEventListener('beforeunload', handleBeforeUnload);

      const formDataToUse = updatedProductForm || productForm;

      console.log('📝 Product form data being used for publishing:', {
        name: formDataToUse.name,
        description: formDataToUse.description,
        source: updatedProductForm ? 'from form submission (fresh)' : 'from state (may be stale)'
      });

      toast.loading("Step 1/3: Validating product variants...", { id: "publishing-progress" });

      try {
        const unavailableVariants = selectedVariants.filter((variantId: number) => {
          const variant = selectedProduct.variants?.find((v: any) => v.id === variantId);
          return variant && variant.can_create_product === false;
        });

        if (unavailableVariants.length > 0) {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          toast.dismiss("publishing-progress");
          toast.error(
            `Cannot publish: ${unavailableVariants.length} variant${unavailableVariants.length > 1 ? 's are' : ' is'} no longer available. Please refresh the page and reselect variants.`,
            { duration: 8000 }
          );
          console.error("Final validation failed - unavailable variants:", unavailableVariants);
          return;
        }

        console.log("Validation passed - all variants available for publishing");
      } catch (validationError) {
        console.warn("Final validation check failed, proceeding with caution:", validationError);
      }

      const productData = {
        id: selectedProduct?.id,
        name: formDataToUse.name.trim(),
        description: formDataToUse.description.trim(),
        category: formDataToUse.category,
        markupPercentage: parseFloat(formDataToUse.markupPercentage),
        variants: selectedVariants,
        base_product: selectedProduct
      };

      toast.loading("Step 2/3: Uploading product images to marketplace...", {
        id: "publishing-progress",
      });

      const storedMockupInputs = localStorage.getItem(`mockup_request_${selectedProduct.id}`);
      const mockupInputs = storedMockupInputs ? JSON.parse(storedMockupInputs) : null;

      const availabilityData = selectedVariants
        .map((variantId: number) => {
          const variant = selectedProduct.variants?.find((v: any) => v.id === variantId);
          if (variant) {
            return {
              variant_id: variant.id,
              availability_regions: variant.availability_regions || {},
              availability_status: variant.availability_status || []
            };
          }
          return null;
        })
        .filter((v: any) => v !== null);

      console.log('📊 Extracted availability data from catalog:', availabilityData.length, 'variants');
      if (availabilityData.length > 0) {
        console.log('📊 Sample availability:', availabilityData[0]);
      }

      toast.loading("Step 3/3: Publishing to marketplace... Please do not refresh or navigate away!", {
        id: "publishing-progress",
      });

      const result = await printfulAPI.storeMockupsPermanently(
        mockupUrls,
        productData,
        designFiles,
        mockupInputs,
        availabilityData
      );

      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (result.success) {
        localStorage.removeItem(`mockup_request_${selectedProduct.id}`);
        if (productId) {
          localStorage.removeItem(`productForm_${productId}`);
          console.log(`🗑️ Cleared product form for product ${productId} after publishing`);
        }
      }

      toast.dismiss("publishing-progress");

      if (result.success && result.marketplace_ready) {
        toast.success(`"${formDataToUse.name}" is now live in the marketplace!`, {
          duration: 4000,
        });

        setTimeout(() => {
          setMockupUrls([]);
          setDesignFiles([]);
          window.location.href = "/dashboard/creator/products";
        }, 2000);
      } else {
        toast.error(
          `Failed to publish product: ${
            result.details || result.error || "Unknown error"
          }`,
          { duration: 6000 }
        );
      }
    } catch (error) {
      console.error("Marketplace error:", error);
      toast.dismiss("publishing-progress");
      toast.error("Failed to publish to marketplace. Please try again.", { duration: 6000 });
    } finally {
      setCreating(false);
    }
  };

  return (
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-black">
      {/* <CanvasHeader
        selectedProduct={selectedProduct}
        step={step}
        creating={creating}
        onCreateProduct={() => {}}
      /> */}

      <div className="">
        {loading ? (
          <CreativeLoader variant="design" message="Loading design canvas..." />
        ) : (
          <>
            {step === "unified-editor" ? (
              <EnhancedCanvasWizard
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
              <>
                {step === "product-details" && (
                  <EnhancedProductDetailsForm
                    initialData={{
                      name: productForm.name,
                      description: productForm.description,
                      markupPercentage: productForm.markupPercentage,
                      category: productForm.category,
                    }}
                    onSave={(data) => {
                      const updatedForm = {
                        ...productForm,
                        name: data.name,
                        description: data.description,
                        markupPercentage: data.markupPercentage.toString(),
                        category: data.category,
                        tags: data.tags || []
                      };
                      setProductForm(updatedForm);

                      // Persist to localStorage for this product
                      if (productId) {
                        const savedFormKey = `productForm_${productId}`;
                        localStorage.setItem(savedFormKey, JSON.stringify(updatedForm));
                        console.log(`💾 Saved product form for product ${productId}`);
                      }
                    }}
                    onNext={(formData) => {
                      // Use the form data passed from the form component
                      // This ensures we use the user's latest edits
                      if (formData) {
                        handleGoLiveToMarketplace(formData as ProductForm);
                      } else {
                        handleGoLiveToMarketplace();
                      }
                    }}
                    onBack={handlePrevStep}
                    isLoading={creating}
                    selectedProduct={selectedProduct}
                    selectedVariants={selectedVariants}
                    mockupUrls={mockupUrls}
                    designFiles={designFiles}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
      </div>
    </CreatorProtectedRoute>
  );
}
