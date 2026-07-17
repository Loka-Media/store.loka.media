/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";
import { printifyAPI } from "@/lib/api";
import { mockupAPI } from "@/lib/MockupAPI";
import { retryWithExponentialBackoff } from "@/lib/retryWithBackoff";
import CreatorProtectedRoute from "@/components/CreatorProtectedRoute";
import { useDebouncePreview } from "@/hooks/useDebouncePreview";

import UnifiedCanvasPDP from "@/components/canvas/UnifiedCanvasPDP";
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

const COLOR_MAP: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  blue: '#0000ff',
  green: '#008000',
  yellow: '#ffff00',
  navy: '#000080',
  grey: '#808080',
  gray: '#808080',
  orange: '#ffa500',
  pink: '#ffc0cb',
  purple: '#800080',
  brown: '#a52a2a',
  gold: '#ffd700',
  silver: '#c0c0c0',
  charcoal: '#36454f',
  heather: '#9aa0a6',
  royal: '#4169e1',
  forest: '#228b22',
  maroon: '#800000',
  sand: '#c2b280',
  olive: '#808000',
  cream: '#fffdd0',
};

function getColorCode(colorName: string): string {
  const name = colorName.toLowerCase();
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (name.includes(key)) return hex;
  }
  return '#cccccc';
}

function CanvasContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const blueprintId = searchParams.get("blueprintId") || searchParams.get("productId");

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [designFiles, setDesignFiles] = useState<DesignFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingFiles, setIsFetchingFiles] = useState(false);
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
  const previewGenerationRef = useRef<((designFiles?: any[]) => Promise<void>) | null>(null);

  const initializeCanvas = useCallback(async () => {
    if (isInitialized || hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    try {
      setLoading(true);

      // Check if blueprintId is provided in URL
      if (blueprintId) {
        try {
          // Fetch blueprint details
          console.log(`🔍 Fetching blueprint details for ${blueprintId}...`);
          const detailed = await printifyAPI.getBlueprintDetails(
            parseInt(blueprintId)
          );
          const product = detailed?.data || detailed;

          // Call GET /v1/catalog/blueprints/{blueprint_id}/print_providers.json
          console.log(`🔍 Fetching print providers dynamically for blueprint ${blueprintId}...`);
          const providers = await printifyAPI.getBlueprintProviders(blueprintId);
          product.providers = providers;

          // Select first print provider as default and fetch variants dynamically
          const defaultProviderId = providers[0]?.id;
          let variants = [];
          if (defaultProviderId) {
            console.log(`🔍 Fetching variants dynamically for blueprint ${blueprintId} and print provider ${defaultProviderId}...`);
            const variantsResponse = await printifyAPI.getBlueprintVariantsForProvider(blueprintId, defaultProviderId);
            const variantsData = variantsResponse?.data || variantsResponse;
            const rawVariants = variantsData?.variants || [];
            variants = rawVariants.map((v: any) => ({
              id: v.id,
              title: v.title,
              color: v.options?.color || 'Default',
              color_code: getColorCode(v.options?.color || ''),
              size: v.options?.size || 'OS',
              image: product.images?.[0] || '/placeholder-product.png',
              price: v.price || '15.00',
              is_available: true,
              placeholders: v.placeholders
            }));
            
            product.print_provider_id = defaultProviderId;
            product.printProviderId = defaultProviderId;
          }

          if (product) {
            console.log(`🔍 Processing ${variants?.length || 0} blueprint variants...`);

            // For Printify blueprints, all variants are available
            const availableVariants = variants?.filter((variant: any) => {
              return variant.is_available !== false;
            }) || variants || [];

            const originalCount = variants?.length || 0;
            const filteredCount = availableVariants?.length || 0;
            const filteredOut = originalCount - filteredCount;

            if (filteredOut > 0) {
              console.log(`📊 Variant filtering: ${filteredCount}/${originalCount} variants available (${filteredOut} filtered out)`);
            }

            const productWithVariants = { ...product, variants: availableVariants };
            setSelectedProduct(productWithVariants);

            // Compute printFiles from Printify variant placeholders
            if (availableVariants.length > 0) {
              const variant_printfiles = availableVariants.map((v: any) => {
                const placements: Record<string, number> = {};
                v.placeholders?.forEach((p: any) => {
                  const pos = p.position === 'left_sleeve' ? 'left' : p.position === 'right_sleeve' ? 'right' : p.position;
                  if (pos === 'left') {
                    placements['left'] = v.id * 10 + 3;
                    placements['sleeve_left'] = v.id * 10 + 3;
                  } else if (pos === 'right') {
                    placements['right'] = v.id * 10 + 4;
                    placements['sleeve_right'] = v.id * 10 + 4;
                  } else {
                    placements[pos] = v.id * 10 + (pos === 'front' ? 1 : pos === 'back' ? 2 : 5);
                  }
                });
                return {
                  variant_id: v.id,
                  placements
                };
              });

              const printfiles: any[] = [];
              availableVariants.forEach((v: any) => {
                v.placeholders?.forEach((p: any) => {
                  const pos = p.position === 'left_sleeve' ? 'left' : p.position === 'right_sleeve' ? 'right' : p.position;
                  const printfile_id = v.id * 10 + (pos === 'front' ? 1 : pos === 'back' ? 2 : pos === 'left' ? 3 : pos === 'right' ? 4 : 5);
                  if (!printfiles.some(pf => pf.printfile_id === printfile_id)) {
                    printfiles.push({
                      printfile_id,
                      width: p.width,
                      height: p.height
                    });
                  }
                });
              });

              const computedPrintFiles = {
                variant_printfiles,
                printfiles,
                available_techniques: ['DTG']
              };
              setPrintFiles(computedPrintFiles);
              console.log('computedPrintFiles from Printify placeholders:', computedPrintFiles);
            }
            localStorage.setItem(
              'selectedPrintifyProduct',
              JSON.stringify(productWithVariants)
            );

            // Check if there's saved product form data for this product
            const savedFormKey = `productForm_${blueprintId}`;
            const savedForm = localStorage.getItem(savedFormKey);

            if (savedForm) {
              // Use saved form data if it exists
              const parsedForm = JSON.parse(savedForm);
              setProductForm(parsedForm);
              console.log(`📝 Loaded saved product form for product ${blueprintId}`);
            } else {
              // Initialize with default Printful product data
              setProductForm({
                name: `Custom ${product.title || product.model}`,
                description: product.description || '',
                markupPercentage: '30',
                category: product.type_name || product.type || '',
                tags: []
              });
            }

            setStep("unified-editor");

            return;
          }
        } catch (error: any) {
          console.error("Failed to load product from URL:", error);
          
          // Handle 404 errors for unavailable blueprints
          if (error?.response?.status === 404) {
            const errorData = error?.response?.data;
            const message = errorData?.message || 'This product blueprint is no longer available in Printify catalog. Please select a different product.';
            
            toast.error(message, { duration: 5000 });
            router.push('/dashboard/creator/catalog');
            return;
          } else {
            toast.error('Failed to load product details. Please try again.');
          }
        }
      }

      // Fallback to localStorage
      const savedProduct = localStorage.getItem('selectedPrintifyProduct') ||
        localStorage.getItem('selectedPrintfulProduct'); // legacy key
      if (savedProduct) {
        const product = JSON.parse(savedProduct);
        if (!product.variants?.length) {
          const detailed = await printifyAPI.getBlueprintDetails(product.id);
          const variants = detailed?.data?.variants || [];
          if (variants?.length) {
            const updatedProduct = { ...product, variants };
            localStorage.setItem('selectedPrintifyProduct', JSON.stringify(updatedProduct));
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
  }, [blueprintId, isInitialized, router]);

  const fetchUploadedFiles = useCallback(async (page: number = 1) => {
    try {
      setIsFetchingFiles(true);
      const res = await printifyAPI.getImages({ limit: 12, page });
      // API typically returns data inside data, e.g. { data: { current_page, last_page, data: [...] } }
      const imagesData = res?.data || res;
      if (imagesData && Array.isArray(imagesData.data)) {
        setUploadedFiles(imagesData.data);
        setCurrentPage(imagesData.current_page || page);
        setTotalPages(imagesData.last_page || Math.ceil(imagesData.total / 12) || 1);
        // Save first page to local storage as fallback
        if (page === 1) {
          localStorage.setItem("uploaded_printify_images", JSON.stringify(imagesData.data));
        }
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("Failed to fetch files from API, using fallback:", error);
      const saved = localStorage.getItem("uploaded_printify_images");
      const files = saved ? JSON.parse(saved) : [];
      // Quick local pagination fallback
      setUploadedFiles(files.slice((page - 1) * 12, page * 12));
      setTotalPages(Math.ceil(files.length / 12) || 1);
      setCurrentPage(page);
    } finally {
      setIsFetchingFiles(false);
    }
  }, []);


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

  // Fetch files when entering unified-editor step to ensure they're available
  useEffect(() => {
    if (step === "unified-editor" && (user?.role === "creator" || user?.role === "admin")) {
      fetchUploadedFiles();
    }
  }, [step, user, fetchUploadedFiles]);

  // Autosave productForm to localStorage when it changes
  useEffect(() => {
    if (blueprintId && isInitialized) {
      const savedFormKey = `productForm_${blueprintId}`;
      localStorage.setItem(savedFormKey, JSON.stringify(productForm));
    }
  }, [productForm, blueprintId, isInitialized]);

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

  const handleProviderChange = async (providerId: number) => {
    if (!selectedProduct) return;
    try {
      setLoading(true);
      const toastId = toast.loading("Switching print provider and loading variants...");
      
      const response = await printifyAPI.getBlueprintVariantsForProvider(selectedProduct.id, providerId);
      const variantsData = response?.data || response;
      
      const rawVariants = variantsData?.variants || [];
      const updatedVariants = rawVariants.map((v: any) => ({
        id: v.id,
        title: v.title,
        color: v.options?.color || 'Default',
        color_code: getColorCode(v.options?.color || ''),
        size: v.options?.size || 'OS',
        image: selectedProduct.images?.[0] || '/placeholder-product.png',
        price: v.price || '15.00',
        is_available: true,
        placeholders: v.placeholders
      }));

      // Compute printFiles from variant placeholders for the new provider
      let computedPrintFiles = null;
      if (updatedVariants.length > 0) {
        const variant_printfiles = updatedVariants.map((v: any) => {
          const placements: Record<string, number> = {};
          v.placeholders?.forEach((p: any) => {
            const pos = p.position === 'left_sleeve' ? 'left' : p.position === 'right_sleeve' ? 'right' : p.position;
            if (pos === 'left') {
              placements['left'] = v.id * 10 + 3;
              placements['sleeve_left'] = v.id * 10 + 3;
            } else if (pos === 'right') {
              placements['right'] = v.id * 10 + 4;
              placements['sleeve_right'] = v.id * 10 + 4;
            } else {
              placements[pos] = v.id * 10 + (pos === 'front' ? 1 : pos === 'back' ? 2 : 5);
            }
          });
          return {
            variant_id: v.id,
            placements
          };
        });

        const printfiles: any[] = [];
        updatedVariants.forEach((v: any) => {
          v.placeholders?.forEach((p: any) => {
            const pos = p.position === 'left_sleeve' ? 'left' : p.position === 'right_sleeve' ? 'right' : p.position;
            const printfile_id = v.id * 10 + (pos === 'front' ? 1 : pos === 'back' ? 2 : pos === 'left' ? 3 : pos === 'right' ? 4 : 5);
            if (!printfiles.some(pf => pf.printfile_id === printfile_id)) {
              printfiles.push({
                printfile_id,
                width: p.width,
                height: p.height
              });
            }
          });
        });

        computedPrintFiles = {
          variant_printfiles,
          printfiles,
          available_techniques: ['DTG']
        };
      }

      setSelectedProduct((prev: any) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          variants: updatedVariants,
          print_provider_id: providerId,
          printProviderId: providerId
        };
        localStorage.setItem('selectedPrintifyProduct', JSON.stringify(updated));
        return updated;
      });

      if (computedPrintFiles) {
        setPrintFiles(computedPrintFiles);
      }
      
      // Clear selected variants and selections to avoid mismatch
      setSelectedVariants([]);
      
      toast.dismiss(toastId);
      toast.success("Print provider updated successfully!");
    } catch (err) {
      console.error("Failed to change provider:", err);
      toast.error("Failed to load variants for selected provider.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrintFilesLoaded = (printFilesData: any) => {
    setPrintFiles(printFilesData);
    console.log("Print files loaded:", printFilesData);
  };

  const generatePreview = useCallback(async (
    updatedDesignFiles?: typeof designFiles,
    _advancedOptions?: {
      technique?: string;
      optionGroups?: string[];
      options?: string[];
      lifelike?: boolean;
      width?: number;
    }
  ) => {
    if (!selectedProduct || !selectedVariants.length) {
      toast.error('Missing product or variants for mockup.');
      return;
    }

    const filesToUse = updatedDesignFiles || designFiles;
    if (!filesToUse || filesToUse.length === 0) {
      toast.error('Please add at least one design to the product before generating preview.');
      return;
    }

    let progressTimer: NodeJS.Timeout | undefined;

    try {
      setIsGeneratingMockup(true);
      let currentProgress = 0;
      setMockupStatus(`Generating Printify mockups... ${currentProgress}%`);
      setMockupUrls([]); // Clear previous mockups

      // Simulate progress for better UX
      progressTimer = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 8) + 2; // Increase by 2-9%
        if (currentProgress > 98) currentProgress = 98; // Cap at 98% until actual completion
        setMockupStatus(`Generating Printify mockups... ${currentProgress}%`);
      }, 800);

      const variantIds = selectedVariants.map((v: any) =>
        typeof v === 'number' ? v : v.id
      );

      const productData = {
        id: selectedProduct?.id,
        name: productForm.name.trim() || `Custom ${selectedProduct.title || selectedProduct.model}`,
        description: productForm.description.trim(),
        category: productForm.category,
        markupPercentage: parseFloat(productForm.markupPercentage),
        variants: variantIds,
        base_product: selectedProduct
      };

      console.log('🖼️ Calling Printify sync api to generate mockups for product (preview)...');
      const result = await printifyAPI.generatePreviewMockups(productData, filesToUse);

      if (result && result.success) {
        if (result.printify_product_id) {
          setSelectedProduct((prev: any) => {
            if (!prev) return prev;
            const updated = { ...prev, printify_id: result.printify_product_id };
            localStorage.setItem('selectedPrintifyProduct', JSON.stringify(updated));
            return updated;
          });
        }

        const formattedMockups = (result.mockups || []).map((m: any) => ({
          url: m.src || m.url || '',
          placement: m.position || m.placement || 'front',
          variant_ids: m.variantIds || m.variant_ids || [],
          title: m.label || m.title || '',
          option: m.position || m.placement || 'front',
          option_group: 'Printify Mockup',
        }));

        // Filter mockups to only those relevant to selected variants
        const filtered = variantIds.length > 0
          ? formattedMockups.filter((m: any) =>
              m.variant_ids.length === 0 ||
              m.variant_ids.some((vid: number) => variantIds.includes(vid))
            )
          : formattedMockups;

        setMockupUrls(filtered.length > 0 ? filtered : formattedMockups);
        setMockupStatus('Mockups loaded successfully!');
        toast.success('Preview mockups generated successfully!');
      } else {
        throw new Error(result?.message || 'Failed to generate preview');
      }
    } catch (error: any) {
      console.error('Mockup fetch failed:', error);
      setMockupStatus('Failed to load mockups.');
      toast.error('Failed to load product mockups. Please try again.');
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setIsGeneratingMockup(false);
    }
  }, [selectedProduct, selectedVariants, designFiles, productForm]);

  // Setup debounced preview generation
  const { debouncedGeneratePreview } = useDebouncePreview(generatePreview, 2000);

  // Handle going live to marketplace with product details
  const handleGoLiveToMarketplace = async (updatedProductForm?: typeof productForm) => {
    const isBlueprint = !selectedProduct?.printify_id;
    if (!isBlueprint && (!mockupUrls || mockupUrls.length === 0)) {
      toast.error("No mockups available. Please generate mockups first.");
      return;
    }

    if (isBlueprint && (!designFiles || designFiles.length === 0)) {
      toast.error("Please add at least one design to the product before publishing.");
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

      const result = await printifyAPI.storeMockupsPermanently(
        mockupUrls,
        productData,
        designFiles,
        mockupInputs,
        availabilityData
      );

      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (result.success) {
        localStorage.removeItem(`mockup_request_${selectedProduct.id}`);
        // Note: Publishing is handled server-side in the background during storeMockupsPermanently (sync route)
        if (blueprintId) {
          localStorage.removeItem(`productForm_${blueprintId}`);
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
          <UnifiedCanvasPDP
            selectedProduct={selectedProduct}
            selectedVariants={selectedVariants}
            setSelectedVariants={setSelectedVariants}
            designFiles={designFiles}
            setDesignFiles={setDesignFiles}
            uploadedFiles={uploadedFiles}
            printFiles={printFiles}
            onGeneratePreview={debouncedGeneratePreview}
            isGeneratingPreview={isGeneratingMockup}
            mockupUrls={mockupUrls}
            mockupStatus={mockupStatus}
            onPrintFilesLoaded={handlePrintFilesLoaded}
            onRefreshFiles={fetchUploadedFiles}
            productForm={productForm}
            setProductForm={setProductForm}
            onPublish={handleGoLiveToMarketplace}
            isPublishing={creating}
            onProviderChange={handleProviderChange}
            currentPage={currentPage}
            totalPages={totalPages}
            isFetchingFiles={isFetchingFiles}
          />
        )}
      </div>
      </div>
    </CreatorProtectedRoute>
  );
}
