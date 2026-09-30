/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/contexts/AuthContext";
import { printifyAPI, productAPI } from "@/lib/api";
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

function getPrintfilePosCode(posStr: string): number {
  const s = (posStr || '').toLowerCase().trim();
  if (s.includes('front')) return 1;
  if (s.includes('back')) return 2;
  if (s === 'left' || s.includes('left_sleeve') || s.includes('sleeve_left')) return 3;
  if (s === 'right' || s.includes('right_sleeve') || s.includes('sleeve_right')) return 4;
  if (s.includes('collar')) return 5;
  if (s.includes('neck') || s.includes('label')) return 6;
  if (s.includes('hood')) return 7;
  if (s.includes('pocket')) return 8;
  if (s.includes('waistband') || s.includes('cuff')) return 9;
  if (s.includes('leg_left') || s.includes('left_leg')) return 10;
  if (s.includes('leg_right') || s.includes('right_leg')) return 11;
  if (s.includes('wrap') || s.includes('all')) return 12;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return 100 + (Math.abs(hash) % 899);
}

function computePrintFilesFromVariants(variants: any[]) {
  if (!variants || variants.length === 0) return null;

  const variant_printfiles = variants.map((v: any) => {
    const placements: Record<string, number> = {};
    const placeholders = (v.placeholders && v.placeholders.length > 0)
      ? v.placeholders
      : [{ position: 'front', width: 4000, height: 4000 }];

    placeholders.forEach((p: any) => {
      const rawPos = (p.position || 'front').toLowerCase().trim();
      const code = getPrintfilePosCode(rawPos);
      const printfile_id = v.id * 1000 + code;

      // Assign exact raw position
      placements[rawPos] = printfile_id;

      // Also set aliases so any lookup variant works flawlessly
      if (rawPos === 'left' || rawPos === 'left_sleeve' || rawPos === 'sleeve_left') {
        placements['left'] = printfile_id;
        placements['sleeve_left'] = printfile_id;
        placements['left_sleeve'] = printfile_id;
      } else if (rawPos === 'right' || rawPos === 'right_sleeve' || rawPos === 'sleeve_right') {
        placements['right'] = printfile_id;
        placements['sleeve_right'] = printfile_id;
        placements['right_sleeve'] = printfile_id;
      } else if (rawPos.includes('collar')) {
        placements['collar'] = printfile_id;
      } else if (rawPos.includes('neck')) {
        placements['neck'] = printfile_id;
        placements['neck_inner'] = printfile_id;
        placements['inner_neck'] = printfile_id;
      }
    });

    if (Object.keys(placements).length === 0) {
      placements['front'] = v.id * 1000 + 1;
    }

    return {
      variant_id: v.id,
      placements
    };
  });

  const printfiles: any[] = [];
  variants.forEach((v: any) => {
    const placeholders = (v.placeholders && v.placeholders.length > 0)
      ? v.placeholders
      : [{ position: 'front', width: 4000, height: 4000 }];

    placeholders.forEach((p: any) => {
      const rawPos = (p.position || 'front').toLowerCase().trim();
      const code = getPrintfilePosCode(rawPos);
      const printfile_id = v.id * 1000 + code;

      if (!printfiles.some(pf => pf.printfile_id === printfile_id)) {
        printfiles.push({
          printfile_id,
          position: rawPos,
          width: p.width || 4000,
          height: p.height || 4000,
          dpi: p.dpi || 300
        });
      }
    });
  });

  if (printfiles.length === 0) {
    printfiles.push({
      printfile_id: 1,
      position: 'front',
      width: 4000,
      height: 4000,
      dpi: 300
    });
  }

  return {
    variant_printfiles,
    printfiles,
    available_techniques: ['DTG', 'AOP']
  };
}

function CanvasContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlBlueprintId = searchParams.get("blueprintId");
  const urlProductId = searchParams.get("productId");
  const blueprintId = urlBlueprintId;
  const [isEditing, setIsEditing] = useState<boolean>(!!urlProductId);
  const [editingProductId, setEditingProductId] = useState<string | null>(urlProductId);

  // Fast optimistic initial state from localStorage if available (instant 0ms render)
  const [selectedProduct, setSelectedProduct] = useState<any>(() => {
    if (typeof window !== "undefined" && urlBlueprintId) {
      try {
        const saved = localStorage.getItem("selectedPrintifyProduct") || localStorage.getItem("selectedPrintfulProduct");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(urlBlueprintId) && parsed.variants?.length > 0) {
            return parsed;
          }
        }
      } catch (_) {}
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined" && urlBlueprintId) {
      try {
        const saved = localStorage.getItem("selectedPrintifyProduct");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(urlBlueprintId) && parsed.variants?.length > 0) {
            return false;
          }
        }
      } catch (_) {}
    }
    return true;
  });
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

      let effectiveBlueprintId = urlBlueprintId;
      let existingProductData: any = null;

      // Handle Edit Mode: Fetch existing creator product if productId is in URL
      if (urlProductId) {
        try {
          console.log(`🔍 Fetching existing creator product ${urlProductId} for editing in canvas...`);
          const res = await productAPI.getCreatorProduct(urlProductId);
          existingProductData = res?.product || res;

          if (existingProductData) {
            setIsEditing(true);
            setEditingProductId(urlProductId);

            effectiveBlueprintId = existingProductData.printify_blueprint_id?.toString() ||
                                   existingProductData.printify_product_id?.toString() ||
                                   urlBlueprintId;

            setProductForm({
              name: existingProductData.name || "",
              description: existingProductData.description || "",
              markupPercentage: (existingProductData.markup_percentage || 30).toString(),
              category: existingProductData.category || "",
              tags: existingProductData.tags && existingProductData.tags.length > 0 ? existingProductData.tags : ["New"],
            });

            if (existingProductData.images && existingProductData.images.length > 0) {
              const formattedMockups = existingProductData.images.map((img: string, idx: number) => ({
                url: img,
                src: img,
                placement: idx === 0 ? "front" : idx === 1 ? "back" : "other",
                variant_ids: [],
                title: idx === 0 ? "Front View" : idx === 1 ? "Back View" : `View ${idx + 1}`,
                option: idx === 0 ? "front" : idx === 1 ? "back" : "other",
                option_group: "Production Mockup",
              }));
              setMockupUrls(formattedMockups);
              setMockupStatus("Mockups loaded successfully!");
            }
          }
        } catch (err) {
          console.error("Failed to load existing product for editing:", err);
          toast.error("Failed to load product details.");
        }
      }

      // Check if blueprintId is provided or derived from product
      if (effectiveBlueprintId) {
        try {
          // Fetch blueprint details
          console.log(`🔍 Fetching blueprint details for ${effectiveBlueprintId}...`);
          const detailed = await printifyAPI.getBlueprintDetails(
            parseInt(effectiveBlueprintId)
          );
          const product = detailed?.data || detailed;

          let providers = product.providers || [];
          if (!providers || providers.length === 0) {
            console.log(`🔍 Fetching print providers for blueprint ${effectiveBlueprintId}...`);
            providers = await printifyAPI.getBlueprintProviders(effectiveBlueprintId);
            product.providers = providers;
          }

          // Select print provider: if existing product has saved print provider and it exists in providers, use it
          const savedProviderId = existingProductData?.printify_print_provider_id;
          const defaultProviderId = (savedProviderId && providers.some((p: any) => p.id === savedProviderId))
            ? savedProviderId
            : (product.print_provider_id || product.printProviderId || providers[0]?.id);

          product.print_provider_id = defaultProviderId;
          product.printProviderId = defaultProviderId;

          let variants: any[] = [];

          // Fast-path: If getBlueprintDetails already provided variants for this provider, use them!
          if (product.variants && product.variants.length > 0 && (!savedProviderId || savedProviderId === product.print_provider_id)) {
            variants = product.variants;
          } else if (defaultProviderId) {
            const variantsResponse = await printifyAPI.getBlueprintVariantsForProvider(effectiveBlueprintId, defaultProviderId);
            const variantsData = variantsResponse?.data || variantsResponse;
            const rawVariants = variantsData?.variants || [];

            variants = rawVariants.map((v: any) => {
              const costVal = (product.cost || 'N/A');
              return {
                id: v.id,
                title: v.title,
                color: v.options?.color || 'Default',
                color_code: getColorCode(v.options?.color || ''),
                size: v.options?.size || 'OS',
                image: product.images?.[0] || '/placeholder-product.png',
                cost: costVal,
                price: costVal,
                premiumPrice: costVal,
                is_available: true,
                placeholders: v.placeholders
              };
            });
          }

          const allVariantCosts = variants
            .map((v: any) => parseFloat(v.cost))
            .filter((c: number) => !isNaN(c) && c > 0);
          const initialMinCost = allVariantCosts.length > 0 ? Math.min(...allVariantCosts).toFixed(2) : (product.cost || '0.00');

          product.cost = initialMinCost;
          product.price = initialMinCost;
          product.premiumPrice = initialMinCost;

          // Asynchronously fetch live provider pricing in the background without blocking canvas load
          if (effectiveBlueprintId && defaultProviderId) {
            fetch(`/api/printify/pricing/provider?blueprintId=${effectiveBlueprintId}&providerId=${defaultProviderId}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((livePricingData) => {
                if (!livePricingData?.variants || !Array.isArray(livePricingData.variants) || livePricingData.variants.length === 0) return;
                const liveCostMap: Record<number, number> = {};
                for (const v of livePricingData.variants) {
                  if (v.cost != null && v.cost > 0) {
                    liveCostMap[v.variantId] = v.cost;
                  }
                }
                if (Object.keys(liveCostMap).length === 0) return;

                setSelectedProduct((prev: any) => {
                  if (!prev || !prev.variants) return prev;
                  const updatedVariants = prev.variants.map((v: any) => {
                    if (liveCostMap[v.id] != null) {
                      const c = liveCostMap[v.id].toFixed(2);
                      return {
                        ...v,
                        cost: c,
                        price: c,
                        premiumPrice: c
                      };
                    }
                    return v;
                  });
                  const updatedCosts = updatedVariants
                    .map((v: any) => parseFloat(v.cost))
                    .filter((c: number) => !isNaN(c) && c > 0);
                  const resolvedMinCost = livePricingData.minCost != null
                    ? parseFloat(livePricingData.minCost).toFixed(2)
                    : (updatedCosts.length > 0 ? Math.min(...updatedCosts).toFixed(2) : prev.cost);

                  const updatedProduct = {
                    ...prev,
                    variants: updatedVariants,
                    cost: resolvedMinCost,
                    price: resolvedMinCost,
                    premiumPrice: resolvedMinCost
                  };
                  try {
                    localStorage.setItem('selectedPrintifyProduct', JSON.stringify(updatedProduct));
                  } catch (_) {}
                  return updatedProduct;
                });
              })
              .catch((err) => console.warn("Background pricing load notice:", err));
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
              // Pre-select variants: if editing, match existing product variants!
              if (existingProductData?.variants && existingProductData.variants.length > 0) {
                const existingVariantPrintifyIds = existingProductData.variants.map((v: any) => v.printify_variant_id || v.id);
                const matchedVariants = availableVariants.filter((v: any) =>
                  existingVariantPrintifyIds.includes(v.id) || existingVariantPrintifyIds.includes(v.printify_variant_id)
                );
                if (matchedVariants.length > 0) {
                  setSelectedVariants(matchedVariants.map((v: any) => v.id));
                } else {
                  setSelectedVariants(availableVariants.map((v: any) => v.id));
                }
              } else {
                setSelectedVariants(availableVariants.map((v: any) => v.id));
              }

              const computedPrintFiles = computePrintFilesFromVariants(availableVariants);
              if (computedPrintFiles) {
                setPrintFiles(computedPrintFiles);
                console.log('computedPrintFiles from Printify placeholders:', computedPrintFiles);
              }
            }

            if (!existingProductData) {
              localStorage.setItem(
                'selectedPrintifyProduct',
                JSON.stringify(productWithVariants)
              );

              // Check if there's saved product form data for this product
              const savedFormKey = `productForm_${effectiveBlueprintId}`;
              const savedForm = localStorage.getItem(savedFormKey);

              if (savedForm) {
                // Use saved form data if it exists
                const parsedForm = JSON.parse(savedForm);
                setProductForm(parsedForm);
                console.log(`📝 Loaded saved product form for product ${effectiveBlueprintId}`);
              } else {
                // Read source category from catalog navigation for auto-selection
                let sourceCategoryTitle = '';
                try {
                  const savedSourceCat = localStorage.getItem('sourceCatalogCategory');
                  if (savedSourceCat) {
                    const sourceCat = JSON.parse(savedSourceCat);
                    sourceCategoryTitle = sourceCat.title || '';
                  }
                } catch (e) { /* ignore parse errors */ }

                // Initialize with default Printful product data
                setProductForm({
                  name: `Custom ${product.title || product.model}`,
                  description: product.description || '',
                  markupPercentage: '30',
                  category: sourceCategoryTitle || product.type_name || product.type || '',
                  tags: []
                });
              }
            }

            setStep("unified-editor");

            return;
          }
        } catch (error: any) {
          console.error("Failed to load product from URL:", error);
          
          // Handle 404 errors for unavailable blueprints
          if (error?.response?.status === 404) {
            const errorData = error?.response?.data;
            const message = errorData?.message || 'This product blueprint is no longer available in the catalog. Please select a different product.';
            
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

        // Read source category from catalog navigation for auto-selection
        let sourceCategoryTitle = '';
        try {
          const savedSourceCat = localStorage.getItem('sourceCatalogCategory');
          if (savedSourceCat) {
            const sourceCat = JSON.parse(savedSourceCat);
            sourceCategoryTitle = sourceCat.title || '';
          }
        } catch (e) { /* ignore parse errors */ }

        setProductForm({
          name: `Custom ${product.title || product.model}`,
          description: product.description || "",
          markupPercentage: "30",
          category: sourceCategoryTitle || product.type_name || product.type,
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

  // NOTE: We do NOT call Printify API here.
  // Printify API returns ALL images for the entire Printify account regardless of which user uploaded them.
  // So we ONLY use user-scoped localStorage (`uploaded_printify_images_{userId}`) to isolate each creator's files.
  const fetchUploadedFiles = useCallback((page: number = 1) => {
    setIsFetchingFiles(true);
    try {
      const userId = user?.id;
      if (!userId) {
        setUploadedFiles([]);
        setTotalPages(1);
        setCurrentPage(1);
        return;
      }

      const userStorageKey = `uploaded_printify_images_${userId}`;
      const saved = localStorage.getItem(userStorageKey);
      const userFiles: any[] = saved ? JSON.parse(saved) : [];

      const paginated = userFiles.slice((page - 1) * 12, page * 12);
      setUploadedFiles(paginated);
      setCurrentPage(page);
      setTotalPages(Math.ceil(userFiles.length / 12) || 1);
    } catch (error) {
      console.error("Failed to load user files:", error);
      setUploadedFiles([]);
    } finally {
      setIsFetchingFiles(false);
    }
  }, [user?.id]);


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
    if (!isInitialized) {
      initializeCanvas();
    }
  }, [isInitialized, initializeCanvas]);

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
      const toastId = toast.loading("Switching print provider and loading variants...");
      
      // Fetch variant structure (fast ~150ms)
      const variantsResponse = await printifyAPI.getBlueprintVariantsForProvider(selectedProduct.id, providerId);

      const variantsData = variantsResponse?.data || variantsResponse;
      const rawVariants = variantsData?.variants || [];

      const updatedVariants = rawVariants.map((v: any) => {
        let costDollars: number | null = null;

        if (v.cost != null) {
          const num = typeof v.cost === 'string' ? parseFloat(v.cost) : v.cost;
          if (!isNaN(num) && num > 0) {
            costDollars = num > 100 ? num / 100 : num;
          }
        } else if (v.premiumPrice != null && v.premiumPrice !== 'N/A') {
          const num = parseFloat(v.premiumPrice);
          if (!isNaN(num) && num > 0) {
            costDollars = num > 100 ? num / 100 : num;
          }
        } else if (v.price != null && v.price !== 'N/A') {
          const num = parseFloat(v.price);
          if (!isNaN(num) && num > 0) {
            costDollars = num > 100 ? num / 100 : num;
          }
        }

        const costVal = costDollars !== null ? costDollars.toFixed(2) : 'N/A';

        return {
          id: v.id,
          title: v.title,
          color: v.options?.color || 'Default',
          color_code: getColorCode(v.options?.color || ''),
          size: v.options?.size || 'OS',
          image: selectedProduct.images?.[0] || '/placeholder-product.png',
          cost: costVal,
          price: costVal,
          premiumPrice: costVal,
          is_available: true,
          placeholders: v.placeholders
        };
      });

      // Compute minimum cost for new provider across updatedVariants
      const variantCosts = updatedVariants
        .map((v: any) => parseFloat(v.cost))
        .filter((c: number) => !isNaN(c) && c > 0);
      const providerMinCost = variantCosts.length > 0 ? Math.min(...variantCosts).toFixed(2) : selectedProduct.cost;

      // Compute printFiles from variant placeholders for the new provider
      const computedPrintFiles = computePrintFilesFromVariants(updatedVariants);

      setSelectedProduct((prev: any) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          variants: updatedVariants,
          cost: providerMinCost,
          premiumPrice: providerMinCost,
          price: providerMinCost,
          print_provider_id: providerId,
          printProviderId: providerId
        };
        localStorage.setItem('selectedPrintifyProduct', JSON.stringify(updated));
        return updated;
      });

      if (computedPrintFiles) {
        setPrintFiles(computedPrintFiles);
      }
      
      // Pre-select new provider variants so pricing summary and checklist are immediately active
      setSelectedVariants(updatedVariants.map((v: any) => v.id));
      
      toast.dismiss(toastId);
      toast.success("Print provider updated successfully!");

      // Asynchronously fetch live provider pricing in the background
      fetch(`/api/printify/pricing/provider?blueprintId=${selectedProduct.id}&providerId=${providerId}`)
        .then(r => (r.ok ? r.json() : null))
        .then(pricingResponse => {
          if (pricingResponse?.success && pricingResponse.variants?.length > 0) {
            const variantCostFromPricingAPI: Record<number, number> = {};
            for (const v of pricingResponse.variants) {
              if (v.cost != null && v.cost > 0) {
                variantCostFromPricingAPI[v.variantId] = v.cost;
              }
            }
            if (Object.keys(variantCostFromPricingAPI).length === 0) return;

            setSelectedProduct((prev: any) => {
              if (!prev || !prev.variants) return prev;
              const remappedVariants = prev.variants.map((v: any) => {
                if (variantCostFromPricingAPI[v.id] != null) {
                  const cost = variantCostFromPricingAPI[v.id].toFixed(2);
                  return { ...v, cost, price: cost, premiumPrice: cost };
                }
                return v;
              });
              const costs = remappedVariants.map((v: any) => parseFloat(v.cost)).filter((c: number) => !isNaN(c) && c > 0);
              const minCost = pricingResponse.minCost != null
                ? parseFloat(pricingResponse.minCost).toFixed(2)
                : costs.length > 0 ? Math.min(...costs).toFixed(2) : prev.cost;
              const updated = {
                ...prev,
                variants: remappedVariants,
                cost: minCost,
                price: minCost,
                premiumPrice: minCost
              };
              try {
                localStorage.setItem('selectedPrintifyProduct', JSON.stringify(updated));
              } catch (_) {}
              return updated;
            });
          }
        })
        .catch(err => console.warn("Background provider pricing update notice:", err));
    } catch (err) {
      console.error("Failed to change provider:", err);
      toast.error("Failed to load variants for selected provider.");
    }
  };

  const handlePrintFilesLoaded = (printFilesData: any) => {
    if (printFilesData?.variant_printfiles && printFilesData.variant_printfiles.length > 0) {
      setPrintFiles(printFilesData);
      console.log("Print files loaded:", printFilesData);
    }
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
    const formDataToUse = updatedProductForm || productForm;

    // Handle Edit Mode: Update existing product in database directly
    if (isEditing && editingProductId) {
      try {
        setCreating(true);
        toast.loading("Saving changes to database...", { id: "publishing-progress" });

        const imagesList = (mockupUrls && mockupUrls.length > 0)
          ? mockupUrls.map((m: any) => m.url || m.src || m.preview_url).filter(Boolean)
          : (selectedProduct?.images || []);

        const mainCoverUrl = imagesList[0] || selectedProduct?.thumbnail_url || selectedProduct?.thumbnailUrl || "";

        const finalPrice = (formDataToUse as any).price || (formDataToUse as any).base_price || 14.99;
        const markupVal = parseFloat(formDataToUse.markupPercentage) || 30;
        const updateData: any = {
          name: formDataToUse.name.trim(),
          description: formDataToUse.description.trim(),
          markupPercentage: markupVal,
          markup_percentage: markupVal,
          basePrice: finalPrice,
          base_price: finalPrice,
          price: finalPrice,
          selling_price: finalPrice,
          retail_price: finalPrice,
          min_price: (formDataToUse as any).min_price || finalPrice,
          max_price: (formDataToUse as any).max_price || finalPrice,
          minPrice: (formDataToUse as any).min_price || finalPrice,
          maxPrice: (formDataToUse as any).max_price || finalPrice,
          category: formDataToUse.category?.trim() || "",
          tags: (formDataToUse.tags && formDataToUse.tags.length > 0) ? formDataToUse.tags : ['New'],
          thumbnailUrl: mainCoverUrl,
          thumbnail_url: mainCoverUrl,
          images: imagesList,
          status: 'active',
          is_active: true,
          isActive: true,
          variantPrices: (formDataToUse as any).variantPrices || []
        };

        console.log(`💾 Updating product ${editingProductId} in database:`, updateData);

        // Direct sync with internal API route to ensure PostgreSQL product and variants are updated to .99 price
        try {
          await fetch('/api/products/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
            },
            body: JSON.stringify({
              productId: editingProductId,
              ...updateData
            })
          });
        } catch (syncErr) {
          console.warn('[Canvas] /api/products/update sync notice:', syncErr);
        }

        // Also call backend updateProduct API
        await productAPI.updateProduct(editingProductId, updateData);

        toast.dismiss("publishing-progress");
        toast.success(`"${formDataToUse.name}" updated successfully!`, { duration: 4000 });

        setTimeout(() => {
          router.push("/dashboard/creator/products");
        }, 1200);
        return;
      } catch (err: any) {
        console.error("Failed to update product in database:", err);
        toast.dismiss("publishing-progress");
        const errMsg = err?.response?.data?.error || err?.response?.data?.message || "Failed to update product in database";
        toast.error(errMsg, { duration: 6000 });
        return;
      } finally {
        setCreating(false);
      }
    }

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

      const finalPublishPrice = (formDataToUse as any).price || (formDataToUse as any).base_price;
      const pubMarkupVal = parseFloat(formDataToUse.markupPercentage) || 30;
      const productData = {
        id: selectedProduct?.id,
        name: formDataToUse.name.trim(),
        description: formDataToUse.description.trim(),
        category: formDataToUse.category,
        tags: (formDataToUse.tags && formDataToUse.tags.length > 0) ? formDataToUse.tags : ['New'],
        markupPercentage: pubMarkupVal,
        markup_percentage: pubMarkupVal,
        price: finalPublishPrice,
        selling_price: finalPublishPrice,
        retail_price: finalPublishPrice,
        base_price: finalPublishPrice,
        basePrice: finalPublishPrice,
        min_price: (formDataToUse as any).min_price || finalPublishPrice,
        max_price: (formDataToUse as any).max_price || finalPublishPrice,
        minPrice: (formDataToUse as any).min_price || finalPublishPrice,
        maxPrice: (formDataToUse as any).max_price || finalPublishPrice,
        variants: selectedVariants,
        variantPrices: (formDataToUse as any).variantPrices || [],
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
        const createdId = result.product_id || result.productId;
        if (createdId) {
          try {
            await fetch('/api/products/update', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
              },
              body: JSON.stringify({
                productId: createdId,
                ...productData
              })
            });
          } catch (syncErr) {
            console.warn('[Canvas Publish] Post-publish sync notice:', syncErr);
          }
        }

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
            setMockupUrls={setMockupUrls}
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
            isEditing={isEditing}
          />
        )}
      </div>
      </div>
    </CreatorProtectedRoute>
  );
}
