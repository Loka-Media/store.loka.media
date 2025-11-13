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
import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";

import UploadStep from "@/components/canvas/UploadStep";
import UnifiedDesignEditor from "@/components/canvas/UnifiedDesignEditor";
import EnhancedCanvasWizard from "@/components/canvas/EnhancedCanvasWizard";
import ProductDetailsForm from "@/components/canvas/ProductDetailsForm";
import EnhancedProductDetailsForm from "@/components/canvas/EnhancedProductDetailsForm";

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
  const useNewInterface = searchParams.get("new") === "true";

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
  const [useSimplifiedWizard, setUseSimplifiedWizard] = useState(useNewInterface !== undefined ? useNewInterface : true);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "",
    description: "",
    markupPercentage: "30",
    category: "",
    tags: []
  });

  const initializeCanvas = useCallback(async () => {
    try {
      setLoading(true);

      // Check if productId is provided in URL
      if (productId) {
        try {
          // First, check product availability
          console.log(`🔍 Checking availability for product ${productId}...`);
          const availabilityCheck = await printfulAPI.checkProductAvailability(parseInt(productId));
          
          if (!availabilityCheck.result.can_create_product) {
            toast.error(`❌ ${availabilityCheck.result.message}`);
            toast.error("Please select a different product from the catalog", {
              duration: 6000
            });
            router.push('/dashboard/creator/canvas');
            return;
          }
          
          // Show availability warnings if any
          if (availabilityCheck.result.warnings && availabilityCheck.result.warnings.length > 0) {
            availabilityCheck.result.warnings.forEach((warning: string) => {
              toast(`⚠️ ${warning}`, { 
                icon: '⚠️',
                duration: 4000
              });
            });
          }
          
          // If available, proceed to get product details
          const detailed = await printfulAPI.getProductDetails(
            parseInt(productId)
          );
          const product = detailed.result?.product || detailed.result;
          const variants =
            detailed.result?.variants || detailed.result?.product?.variants;

          if (product) {
            // Get all variant IDs for dynamic availability checking
            const allVariantIds = variants?.map((v: any) => v.id) || [];
            
            console.log(`🔍 Checking availability for ${allVariantIds.length} variants dynamically...`);
            
            let availableVariants = variants;
            
            try {
              // Check variant availability dynamically using API
              const variantCheck = await printfulAPI.checkVariantAvailability(allVariantIds);
              
              if (variantCheck.result && variantCheck.result.variants) {
                // Create a map of variant availability
                const availabilityMap = new Map();
                variantCheck.result.variants.forEach((v: any) => {
                  availabilityMap.set(v.variant_id, v);
                });
                
                // Filter variants based on API results
                availableVariants = variants?.filter((variant: any) => {
                  const availabilityInfo = availabilityMap.get(variant.id);
                  
                  // Check multiple conditions
                  const isInAvailabilityResults = availabilityCheck.result.available_variant_ids.includes(variant.id);
                  const canCreateFromAPI = availabilityInfo?.can_create_product !== false;
                  const variantCanCreate = variant.can_create_product !== false;
                  
                  const isAvailable = isInAvailabilityResults && canCreateFromAPI && variantCanCreate;
                  
                  if (!isAvailable && availabilityInfo) {
                    console.log(`⚠️ Filtering out variant ${variant.id} (${variant.name}): ${availabilityInfo.reason}`);
                  }
                  
                  return isAvailable;
                }) || variants;
                
                // Show summary of filtering
                const originalCount = variants?.length || 0;
                const filteredCount = availableVariants?.length || 0;
                const filteredOut = originalCount - filteredCount;
                
                if (filteredOut > 0) {
                  toast(`⚠️ ${filteredOut} variant${filteredOut > 1 ? 's' : ''} filtered out (discontinued/unavailable)`, {
                    icon: '⚠️',
                    duration: 4000
                  });
                  console.log(`📊 Variant filtering: ${filteredCount}/${originalCount} variants available`);
                }
                
              } else {
                console.warn('⚠️ Could not get dynamic variant availability, using basic filtering');
                // Fallback to basic filtering
                availableVariants = variants?.filter((variant: any) => 
                  availabilityCheck.result.available_variant_ids.includes(variant.id) &&
                  variant.can_create_product !== false
                ) || variants;
              }
              
            } catch (variantError) {
              console.error('⚠️ Dynamic variant check failed:', variantError);
              toast.error('Could not verify all variant availability. Some variants may be discontinued.');
              
              // Fallback to basic filtering
              availableVariants = variants?.filter((variant: any) => 
                availabilityCheck.result.available_variant_ids.includes(variant.id) &&
                variant.can_create_product !== false
              ) || variants;
            }

            const productWithVariants = { ...product, variants: availableVariants };
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
              tags: []
            });

            // Skip upload step and go directly to unified editor
            setStep("unified-editor");
            
            const availabilityStatus = availabilityCheck.result.status === 'available' 
              ? '✅ Product is fully available' 
              : `⚠️ Product is ${availabilityCheck.result.availability_details.availability_percentage}% available`;
            
            toast.success(`${availabilityStatus} - Start designing!`, {
              duration: 3000
            });

            // Wait a bit for auth to be ready, then fetch files
            setTimeout(() => {
              fetchUploadedFiles();
            }, 1000);
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

  if (!selectedProduct && !loading) {
    return (
      <CreatorProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-12 bg-white rounded-3xl border border-gray-200">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No product selected
          </h3>
          <p className="text-gray-600 mb-8 font-medium">
            Please select a product from the catalog first.
          </p>
          <Link
            href="/dashboard/creator/catalog"
            className="inline-flex items-center px-8 py-4 text-white bg-accent rounded-2xl font-bold transition-colors"
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


  // Handle going live to marketplace with product details
  const handleGoLiveToMarketplace = async () => {
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

      // FINAL VALIDATION: Ensure all selected variants are still available before publishing
      console.log("🔍 Performing final variant availability check before publishing...");
      toast.loading("Validating product variants...", { id: "final-validation" });
      
      try {
        const finalValidation = await printfulAPI.checkVariantAvailability(selectedVariants);
        
        if (finalValidation.result && finalValidation.result.variants) {
          const unavailableVariants = finalValidation.result.variants.filter(
            (v: any) => !v.can_create_product
          );
          
          if (unavailableVariants.length > 0) {
            toast.dismiss("final-validation");
            const unavailableNames = unavailableVariants.map((v: any) => 
              `Variant ID ${v.variant_id} (${v.reason})`
            ).join(', ');
            
            toast.error(
              `❌ Cannot publish: ${unavailableVariants.length} variant${unavailableVariants.length > 1 ? 's are' : ' is'} no longer available: ${unavailableNames}. Please refresh the page and reselect variants.`,
              { duration: 8000 }
            );
            console.error("❌ Final validation failed - unavailable variants:", unavailableVariants);
            return;
          }
        }
        
        toast.dismiss("final-validation");
        console.log("✅ Final validation passed - all variants available for publishing");
      } catch (validationError) {
        toast.dismiss("final-validation");
        console.warn("⚠️ Final validation check failed, proceeding with caution:", validationError);
        toast("⚠️ Could not verify all variants - proceeding with publication", { 
          icon: '⚠️',
          duration: 4000 
        });
      }

      const productData = {
        id: selectedProduct?.id,
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        category: productForm.category,
        markupPercentage: parseFloat(productForm.markupPercentage),
        variants: selectedVariants,
        base_product: selectedProduct
      };

      toast.loading("Publishing your product to marketplace...", {
        id: "marketplace",
      });

      const storedMockupInputs = localStorage.getItem(`mockup_request_${selectedProduct.id}`);
      const mockupInputs = storedMockupInputs ? JSON.parse(storedMockupInputs) : null;

      const result = await printfulAPI.storeMockupsPermanently(
        mockupUrls,
        productData,
        designFiles,
        mockupInputs
      );

      if (result.success) {
        localStorage.removeItem(`mockup_request_${selectedProduct.id}`);
      }

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
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      {/* <CanvasHeader
        selectedProduct={selectedProduct}
        step={step}
        creating={creating}
        onCreateProduct={() => {}}
      /> */}

      <div className="">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto" />
            <p className="mt-6 text-gray-600 text-lg font-medium">Loading design canvas...</p>
          </div>
        ) : (
          <>
            {/* Interface Toggle */}
            {step === "unified-editor" && (
              <div className="bg-gradient-to-r from-yellow-100 to-pink-100 border-4 border-black p-4 mb-4 mx-4 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-black text-lg">
                      {useSimplifiedWizard ? "🎨 New Simplified Interface (Recommended)" : "🔧 Classic Interface"}
                    </h3>
                    <p className="text-sm font-bold text-black/80 mt-1">
                      {useSimplifiedWizard
                        ? "Streamlined step-by-step workflow for faster product creation. Switch to classic if you prefer the advanced editor."
                        : "Advanced interface with full editor controls. Switch back to simplified for easier workflow."}
                    </p>
                  </div>
                  <button
                    onClick={() => setUseSimplifiedWizard(!useSimplifiedWizard)}
                    className="px-6 py-3 bg-black text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-sm whitespace-nowrap"
                  >
                    {useSimplifiedWizard ? "Try Classic" : "Back to New"}
                  </button>
                </div>
              </div>
            )}

            {step === "unified-editor" ? (
              useSimplifiedWizard ? (
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
              )
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
{/* 
                  {step === "design" && (
                    <DesignStep
                      uploadedFiles={uploadedFiles}
                      designFiles={designFiles}
                      onAddDesignFile={handleAddDesignFile}
                      onRemoveDesignFile={handleRemoveDesignFile}
                      onUpdateDesignPosition={updateDesignPosition}
                      onSetPresetPosition={setPresetPosition}
                      onPrevStep={() => {}}
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
                      onPrevStep={() => {}}
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
                      onPrevStep={() => {}}
                    />
                  )} */}

                  {step === "product-details" && (
                    <EnhancedProductDetailsForm
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
                          tags: data.tags || []
                        });
                      }}
                      onNext={handleGoLiveToMarketplace}
                      isLoading={creating}
                      selectedProduct={selectedProduct}
                      selectedVariants={selectedVariants}
                      mockupUrls={mockupUrls}
                      designFiles={designFiles}
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
    </CreatorProtectedRoute>
  );
}
