/*disable-eslint*/
'use client';

'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { printfulAPI, productAPI } from '@/lib/api';
import { 
  ArrowLeft, 
  Palette, 
  AlertCircle,
  Upload,
  Save,
  Trash2,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function CanvasPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CanvasContent />
    </Suspense>
  );
}

interface SelectedPrintfulProduct {
  id: number;
  type: string;
  type_name: string;
  brand: string;
  model: string;
  title: string;
  image: string;
  variant_count: number;
  description?: string;
  variants?: Array<{
    id: number;
    size: string;
    color: string;
    color_code: string;
    image: string;
    price: string;
    in_stock: boolean;
  }>;
}

interface UploadedFile {
  id: number;
  filename: string;
  file_url: string;
  thumbnail_url?: string;
  printful_file_id?: number;
  upload_status: string;
  created_at: string;
}

interface DesignFile {
  id: number;
  filename: string;
  url: string;
  type: string;
  placement: 'front' | 'back' | 'sleeve_left' | 'sleeve_right';
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
    limit_to_print_area: boolean;
  };
}

interface PrintArea {
  type: 'front' | 'back' | 'sleeve_left' | 'sleeve_right';
  area_width: number;
  area_height: number;
  dpi: number;
}

function CanvasContent() {
  const { user } = useAuth();
  const router = useRouter();
  // const searchParams = useSearchParams();
  // const productId = searchParams.get('productId'); // Not currently used but may be needed for future features
  
  const [selectedProduct, setSelectedProduct] = useState<SelectedPrintfulProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [designFiles, setDesignFiles] = useState<DesignFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [step, setStep] = useState<'upload' | 'design' | 'variants' | 'finalize'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [addingFromUrl, setAddingFromUrl] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<number[]>([]);
  
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    markupPercentage: '30',
    category: '',
    tags: [] as string[]
  });

  // Default print areas for t-shirts (these should come from Printful API in production)
  const printAreas: PrintArea[] = [
    { type: 'front', area_width: 1800, area_height: 2400, dpi: 150 },
    { type: 'back', area_width: 1800, area_height: 2400, dpi: 150 },
    { type: 'sleeve_left', area_width: 800, area_height: 600, dpi: 150 },
    { type: 'sleeve_right', area_width: 800, area_height: 600, dpi: 150 }
  ];

  const initializeCanvas = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load selected product from localStorage
      const savedProduct = localStorage.getItem('selectedPrintfulProduct');
      if (savedProduct) {
        const product = JSON.parse(savedProduct);
        console.log('Loaded product from localStorage:', product);
        
        // If the product doesn't have variants, fetch detailed product info from Printful
        if (!product.variants || product.variants.length === 0) {
          console.log('Product has no variants, fetching detailed info...');
          try {
            const detailedProduct = await printfulAPI.getProductDetails(product.id);
            console.log('Detailed product from Printful:', detailedProduct);
            console.log('Variants path check (product.variants):', detailedProduct.result?.product?.variants);
            console.log('Variants path check (direct variants):', detailedProduct.result?.variants);
            
            // Try both possible paths for variants
            const variants = detailedProduct.result?.variants || detailedProduct.result?.product?.variants;
            if (variants && Array.isArray(variants) && variants.length > 0) {
              // Update the product with variants
              const updatedProduct = {
                ...product,
                variants: variants
              };
              console.log('✅ Successfully updated product with', variants.length, 'variants');
              console.log('First variant sample:', variants[0]);
              console.log('Updated product object:', updatedProduct);
              
              // Update localStorage with the new product data including variants
              localStorage.setItem('selectedPrintfulProduct', JSON.stringify(updatedProduct));
              
              setSelectedProduct(updatedProduct);
              
              // Force a small delay to ensure state is updated
              setTimeout(() => {
                console.log('State update check - selectedProduct variants:', updatedProduct.variants?.length);
              }, 100);
            } else {
              setSelectedProduct(product);
              console.warn('❌ No variants found in detailed product info');
              console.log('Available keys in result:', Object.keys(detailedProduct.result || {}));
              console.log('Available keys in result.product:', Object.keys(detailedProduct.result?.product || {}));
            }
          } catch (variantError) {
            console.error('Failed to fetch product variants:', variantError);
            setSelectedProduct(product);
            toast.error('Warning: Could not load product variants');
          }
        } else {
          setSelectedProduct(product);
          console.log('Product already has variants:', product.variants.length);
        }
        
        setProductForm({
          name: `Custom ${product.title || product.model}`,
          description: product.description || '',
          markupPercentage: '30',
          category: product.type_name || product.type,
          tags: []
        });
      }
      
      // Fetch user's uploaded files
      await fetchUploadedFiles();
    } catch (error) {
      console.error('Failed to initialize canvas:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize design canvas';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const fetchUploadedFiles = async () => {
    try {
      const response = await printfulAPI.getFiles();
      setUploadedFiles(response.files || []);
    } catch (error) {
      console.error('Failed to fetch files:', error);
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      for (const file of files) {
        // For demo purposes, we'll use a public image hosting service
        // In production, you should upload to your own cloud storage (AWS S3, Cloudinary, etc.)
        
        // Using a more realistic image URL from a public CDN
        const demoImageUrl = `https://picsum.photos/800/800?random=${Date.now()}`;
        
        console.log('Uploading file:', file.name, 'with URL:', demoImageUrl);
        
        // Upload to Printful through backend
        const printfulResponse = await printfulAPI.uploadFile({
          filename: file.name,
          url: demoImageUrl,
          type: 'default'
        });
        
        console.log('Printful response:', printfulResponse);
        
        if (printfulResponse.result || printfulResponse.note) {
          const newFile = {
            id: printfulResponse.result?.id || (Date.now() + Math.random()),
            filename: file.name,
            file_url: printfulResponse.result?.url || demoImageUrl,
            thumbnail_url: printfulResponse.result?.thumbnail_url || demoImageUrl,
            printful_file_id: printfulResponse.result?.id,
            upload_status: 'completed',
            created_at: new Date().toISOString()
          };
          
          setUploadedFiles(prev => [...prev, newFile]);
          
          if (printfulResponse.note) {
            toast.success(`${file.name} uploaded (Demo mode)`);
          } else {
            toast.success(`Uploaded ${file.name} to Printful`);
          }
        } else {
          throw new Error('No result from upload');
        }
      }
      
      // Move to design step after successful upload
      if (files.length > 0) {
        setTimeout(() => setStep('design'), 1000);
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload files';
      toast.error(`Failed to upload files: ${errorMessage}`);
    } finally {
      setUploading(false);
    }
  };
  
  const handleAddFromUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter a valid image URL');
      return;
    }

    setAddingFromUrl(true);
    
    try {
      // Validate URL format
      const url = new URL(imageUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new Error('Please use HTTP or HTTPS URLs only');
      }

      console.log('Adding image from URL:', imageUrl);
      
      // Generate a filename from the URL
      const filename = url.pathname.split('/').pop() || `image_${Date.now()}.jpg`;
      
      const uploadData = {
        filename: filename,
        url: imageUrl,
        type: 'default'
      };
      
      console.log('Sending upload data:', uploadData);
      
      // Upload to Printful through backend
      const printfulResponse = await printfulAPI.uploadFile(uploadData);
      
      console.log('Printful response:', printfulResponse);
      
      if (printfulResponse.result || printfulResponse.note) {
        const newFile = {
          id: printfulResponse.result?.id || (Date.now() + Math.random()),
          filename: filename,
          file_url: printfulResponse.result?.url || imageUrl,
          thumbnail_url: printfulResponse.result?.thumbnail_url || imageUrl,
          printful_file_id: printfulResponse.result?.id,
          upload_status: 'completed',
          created_at: new Date().toISOString()
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
        setImageUrl(''); // Clear the input
        
        if (printfulResponse.note) {
          toast.success(`Image added from URL (Demo mode)`);
        } else {
          toast.success(`Added image from URL to Printful`);
        }
        
        // Move to design step if this is the first file
        if (uploadedFiles.length === 0) {
          setTimeout(() => setStep('design'), 1000);
        }
      } else {
        throw new Error('No result from upload');
      }
    } catch (error) {
      console.error('Failed to add image from URL:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add image from URL';
      toast.error(errorMessage);
    } finally {
      setAddingFromUrl(false);
    }
  };
  
  const handleAddDesignFile = (file: UploadedFile, placement: string = 'front') => {
    const placementType = placement as 'front' | 'back' | 'sleeve_left' | 'sleeve_right';
    const printArea = printAreas.find(area => area.type === placementType);
    
    if (!printArea) {
      toast.error('Invalid placement type');
      return;
    }

    // Check if this placement already has a design
    const existingDesign = designFiles.find(design => design.placement === placementType);
    if (existingDesign) {
      toast.error(`${placementType} placement already has a design. Remove it first.`);
      return;
    }

    // Default positioning - centered in print area
    const defaultWidth = Math.min(printArea.area_width * 0.8, 1200); // 80% of area width or max 1200px
    const defaultHeight = Math.min(printArea.area_height * 0.8, 1200); // Keep aspect ratio consideration
    
    const designFile: DesignFile = {
      id: Date.now() + Math.random(), // Unique ID for this placement
      filename: file.filename,
      url: file.file_url,
      type: 'design',
      placement: placementType,
      position: {
        area_width: printArea.area_width,
        area_height: printArea.area_height,
        width: defaultWidth,
        height: defaultHeight,
        top: (printArea.area_height - defaultHeight) / 2, // Center vertically
        left: (printArea.area_width - defaultWidth) / 2, // Center horizontally
        limit_to_print_area: true
      }
    };
    
    setDesignFiles(prev => [...prev, designFile]);
    toast.success(`Added ${file.filename} to ${placementType} with default positioning`);
  };
  
  const handleRemoveDesignFile = (fileId: number) => {
    setDesignFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const updateDesignPosition = (fileId: number, positionUpdate: Partial<DesignFile['position']>) => {
    setDesignFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, position: { ...file.position!, ...positionUpdate } }
        : file
    ));
  };

  const setPresetPosition = (fileId: number, preset: 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right') => {
    const file = designFiles.find(f => f.id === fileId);
    if (!file || !file.position) return;

    const { area_width, area_height, width, height } = file.position;
    let top = 0, left = 0;

    switch (preset) {
      case 'top-left':
        top = 0;
        left = 0;
        break;
      case 'top-center':
        top = 0;
        left = (area_width - width) / 2;
        break;
      case 'top-right':
        top = 0;
        left = area_width - width;
        break;
      case 'center':
        top = (area_height - height) / 2;
        left = (area_width - width) / 2;
        break;
      case 'bottom-left':
        top = area_height - height;
        left = 0;
        break;
      case 'bottom-center':
        top = area_height - height;
        left = (area_width - width) / 2;
        break;
      case 'bottom-right':
        top = area_height - height;
        left = area_width - width;
        break;
    }

    updateDesignPosition(fileId, { top, left });
    toast.success(`Positioned design at ${preset.replace('-', ' ')}`);
  };

  // Prepare design files for Printful Orders API format
  const preparePrintfulFiles = () => {
    return designFiles.map(file => ({
      type: file.placement === 'front' ? 'default' : file.placement, // Printful uses 'default' for front
      url: file.url,
      position: file.position ? {
        area_width: file.position.area_width,
        area_height: file.position.area_height,
        width: file.position.width,
        height: file.position.height,
        top: file.position.top,
        left: file.position.left,
        limit_to_print_area: file.position.limit_to_print_area
      } : undefined
    }));
  };

  // Generate order item structure for future Orders API implementation
  const generateOrderItem = (variantId: number, quantity: number = 1) => {
    const printfulFiles = preparePrintfulFiles();
    
    return {
      variant_id: variantId,
      quantity: quantity,
      files: printfulFiles,
      // This structure is ready for Printful Orders API
      retail_price: productForm.markupPercentage ? 
        (selectedProduct?.variants?.find(v => v.id === variantId)?.price ? 
          (parseFloat(selectedProduct.variants.find(v => v.id === variantId)!.price) * (1 + parseFloat(productForm.markupPercentage) / 100)).toFixed(2) 
          : undefined) 
        : undefined
    };
  };

  // Preview order structure for debugging/testing
  const previewOrderStructure = () => {
    if (selectedVariants.length === 0 || designFiles.length === 0) {
      toast.error('Please select variants and add designs first');
      return;
    }

    const orderItems = selectedVariants.map(variantId => generateOrderItem(variantId, 1));
    
    const orderStructure = {
      recipient: {
        name: "Test Customer",
        address1: "123 Test Street",
        city: "Test City",
        state_code: "CA",
        country_code: "US",
        zip: "90210"
      },
      items: orderItems,
      retail_costs: {
        currency: "USD",
        subtotal: orderItems.reduce((sum, item) => 
          sum + parseFloat(item.retail_price || "0"), 0
        ).toFixed(2),
        discount: "0.00",
        shipping: "0.00",
        tax: "0.00"
      }
    };

    console.log('🚀 Order Structure for Printful Orders API:', JSON.stringify(orderStructure, null, 2));
    toast.success('Order structure logged to console');
  };
  
  const handleCreateProduct = async () => {
    try {
      setCreating(true);
      
      if (!selectedProduct) {
        toast.error('No product selected');
        return;
      }
      
      if (designFiles.length === 0) {
        toast.error('Please add at least one design file');
        return;
      }
      
      if (!productForm.name.trim()) {
        toast.error('Product name is required');
        return;
      }
      
      console.log('Creating product with data:', {
        selectedProduct,
        designFiles,
        productForm
      });
      
      // Get the user-selected variants to create sync variants
      if (selectedVariants.length === 0) {
        toast.error('Please select at least one variant to create the product');
        return;
      }
      
      // Filter selected product variants to only include user-selected ones
      const variantsToUse = selectedProduct.variants?.filter(v => selectedVariants.includes(v.id)) || [];
      
      if (variantsToUse.length === 0) {
        // Try to fetch variants one more time before failing
        console.log('No variants found, making final attempt to fetch them...');
        try {
          const detailedProduct = await printfulAPI.getProductDetails(selectedProduct.id);
          console.log('Retry fetch - detailed product:', detailedProduct);
          const variants = detailedProduct.result?.variants || detailedProduct.result?.product?.variants || [];
          
          if (variants.length > 0) {
            console.log('Found variants on retry:', variants.length);
            // Update the selected product with variants
            const updatedProduct = { ...selectedProduct, variants };
            setSelectedProduct(updatedProduct);
            // Update variantsToUse for this request
            variantsToUse.splice(0, variantsToUse.length, ...variants.filter((v: { id: number }) => selectedVariants.includes(v.id)));
          } else {
            throw new Error(`No product variants available for product ${selectedProduct.id}. This product may not support customization or may be discontinued.`);
          }
        } catch (fetchError) {
          console.error('Failed to fetch variants on retry:', fetchError);
          throw new Error(`Unable to load product variants. Please try selecting a different product from the catalog.`);
        }
      }
      
      if (designFiles.length === 0) {
        throw new Error('Please add at least one design file before creating the product.');
      }
      
      // Create sync product with Printful using proper API format
      const syncProductData = {
        sync_product: {
          name: productForm.name,
          thumbnail: selectedProduct.image,
          external_id: `marketplace_${Date.now()}`
        },
        sync_variants: variantsToUse.map(variant => {
          const markup = parseFloat(productForm.markupPercentage) || 30;
          const retailPrice = parseFloat(variant.price) * (1 + markup / 100);
          return {
            variant_id: variant.id,
            retail_price: retailPrice.toFixed(2),
            external_id: `var_${variant.id}_${Date.now()}`,
            files: designFiles.map(file => ({
              url: file.url,
              type: file.placement === 'front' ? 'default' : file.placement,
              position: file.position ? {
                area_width: file.position.area_width,
                area_height: file.position.area_height,
                width: file.position.width,
                height: file.position.height,
                top: file.position.top,
                left: file.position.left,
                limit_to_print_area: file.position.limit_to_print_area
              } : undefined
            }))
          };
        })
      };
      
      console.log('Sync product data:', JSON.stringify(syncProductData, null, 2));
      
      const syncResponse = await printfulAPI.createSyncProduct(syncProductData);
      
      console.log('Sync response:', syncResponse);
      
      if (!syncResponse.result?.id) {
        throw new Error(`Failed to create sync product: ${syncResponse.error || 'Unknown error'}`);
      }
      
      // Calculate base price as average cost of selected variants
      const avgCost = variantsToUse.reduce((sum, v) => sum + parseFloat(v.price), 0) / variantsToUse.length;
      const markup = parseFloat(productForm.markupPercentage) || 30;
      
      // Create product in your marketplace
      const productData = {
        name: productForm.name,
        description: productForm.description,
        basePrice: avgCost,
        markupPercentage: markup,
        category: productForm.category,
        tags: productForm.tags,
        thumbnailUrl: selectedProduct.image,
        images: [selectedProduct.image],
        printfulSyncProductId: syncResponse.result.id,
        variants: variantsToUse.map(variant => ({
          printfulVariantId: variant.id,
          size: variant.size,
          color: variant.color,
          colorCode: variant.color_code,
          cost: parseFloat(variant.price),
          sku: `${selectedProduct.id}-${variant.id}`,
          imageUrl: variant.image
        }))
      };
      
      console.log('Creating marketplace product:', productData);
      
      await productAPI.createProduct(productData);
      
      toast.success('Product created successfully and published to marketplace!');
      
      // Clear localStorage and redirect
      localStorage.removeItem('selectedPrintfulProduct');
      router.push('/dashboard/creator/products');
      
    } catch (error) {
      console.error('Failed to create product:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create product';
      toast.error(`Failed to create product: ${errorMessage}`);
    } finally {
      setCreating(false);
    }
  };

  // Debug effect to monitor selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      console.log('selectedProduct state changed:', {
        id: selectedProduct.id,
        title: selectedProduct.title,
        variantCount: selectedProduct.variants?.length || 0,
        hasVariants: !!selectedProduct.variants,
        variants: selectedProduct.variants
      });
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      return;
    }
    
    initializeCanvas();
  }, [user, initializeCanvas]);

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  if (!selectedProduct && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No product selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Please select a product from the catalog first
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/creator/catalog"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Browse Catalog
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                  {selectedProduct ? `Design ${selectedProduct.title || selectedProduct.model}` : 'Design Canvas'}
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Upload designs and create your custom product
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Step indicator */}
              <div className="flex items-center space-x-2 text-sm">
                <div className={`flex items-center space-x-1 ${step === 'upload' ? 'text-indigo-600' : ['design', 'variants', 'finalize'].includes(step) ? 'text-green-600' : 'text-gray-400'}`}>
                  {['design', 'variants', 'finalize'].includes(step) ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                  <span>Upload</span>
                </div>
                <div className="w-6 h-px bg-gray-300" />
                <div className={`flex items-center space-x-1 ${step === 'design' ? 'text-indigo-600' : ['variants', 'finalize'].includes(step) ? 'text-green-600' : 'text-gray-400'}`}>
                  {['variants', 'finalize'].includes(step) ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                  <span>Design</span>
                </div>
                <div className="w-6 h-px bg-gray-300" />
                <div className={`flex items-center space-x-1 ${step === 'variants' ? 'text-indigo-600' : step === 'finalize' ? 'text-green-600' : 'text-gray-400'}`}>
                  {step === 'finalize' ? <CheckCircle className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                  <span>Variants</span>
                </div>
                <div className="w-6 h-px bg-gray-300" />
                <div className={`flex items-center space-x-1 ${step === 'finalize' ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className="w-4 h-4 rounded-full border-2 border-current" />
                  <span>Finalize</span>
                </div>
              </div>
              
              {step === 'finalize' && (
                <button
                  onClick={handleCreateProduct}
                  disabled={creating}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading design canvas...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {step === 'upload' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Design Files</h3>
                  
                  <div className="mb-6">
                    <label className="block">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <p className="text-lg text-gray-600">
                            {uploading ? 'Uploading...' : 'Drop your design files here or click to browse'}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            PNG, JPG, PDF up to 10MB each • Recommended: 300 DPI, RGB color mode
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.pdf,.ai,.psd,.eps"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  
                  {/* URL Upload Section */}
                  <div className="mb-6">
                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Or add image from URL</h4>
                      <div className="flex space-x-3">
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                          disabled={addingFromUrl}
                        />
                        <button
                          onClick={handleAddFromUrl}
                          disabled={addingFromUrl || !imageUrl.trim()}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {addingFromUrl ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Adding...
                            </>
                          ) : (
                            'Add Image'
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Enter a direct link to an image (JPG, PNG, etc.) that&apos;s publicly accessible
                      </p>
                    </div>
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Files</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {uploadedFiles.map((file) => (
                          <div key={file.id} className="group relative">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                              {file.thumbnail_url ? (
                                <Image
                                  src={file.thumbnail_url}
                                  alt={file.filename}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Palette className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="mt-2 text-xs text-gray-600 truncate">{file.filename}</p>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                ✓
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => setStep('design')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          Continue to Design
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {step === 'design' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Arrange Your Designs</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Available Files</h4>
                    {uploadedFiles.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <Palette className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">No files uploaded yet</p>
                        <button
                          onClick={() => setStep('upload')}
                          className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          Go back to upload files
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        {uploadedFiles.map((file) => (
                          <>
                          <div key={file.id} className="group relative">
                            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500">
                              {file.thumbnail_url ? (
                                <Image
                                  src={file.thumbnail_url}
                                  alt={file.filename}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Palette className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-600 truncate">{file.filename}</p>
                            
                          </div>
                          <div className="mt-2 flex space-x-1">
                              <button
                                onClick={() => handleAddDesignFile(file, 'front')}
                                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                              >
                                + Front
                              </button>
                              <button
                                onClick={() => handleAddDesignFile(file, 'back')}
                                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                              >
                                + Back
                              </button>
                            </div></>
                          
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Design Layout</h4>
                    {designFiles.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">No designs added to layout yet</p>
                        <p className="text-xs text-gray-500">Click the &quot;+ Front&quot; or &quot;+ Back&quot; buttons above to add designs</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {designFiles.map((file) => (
                          <div key={`${file.id}-${file.placement}`} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                                  <Image
                                    src={file.url}
                                    alt={file.filename}
                                    width={48}
                                    height={48}
                                    className="object-cover"
                                  />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{file.filename}</p>
                                  <p className="text-xs text-gray-600 capitalize">{file.placement} placement</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveDesignFile(file.id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Position Controls */}
                            {file.position && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <h5 className="text-xs font-medium text-gray-700 mb-2">Position Controls</h5>
                                
                                {/* Preset Positions */}
                                <div className="mb-3">
                                  <p className="text-xs text-black mb-1">Quick Position:</p>
                                  <div className="grid grid-cols-3 gap-1">
                                    {[
                                      ['top-left', 'TL'], ['top-center', 'TC'], ['top-right', 'TR'],
                                      ['center', 'Center'], ['bottom-left', 'BL'], ['bottom-center', 'BC'], ['bottom-right', 'BR']
                                    ].map(([preset, label]) => (
                                      <button
                                        key={preset}
                                        onClick={() => setPresetPosition(file.id, preset as 'top-left' | 'top-center' | 'top-right' | 'center' | 'bottom-left' | 'bottom-center' | 'bottom-right')}
                                        className="text-black text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100"
                                      >
                                        {preset === 'center' ? label : label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                
                                {/* Size Controls */}
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <div>
                                    <label className="text-xs text-black">Width (px)</label>
                                    <input
                                      type="number"
                                      value={Math.round(file.position.width)}
                                      onChange={(e) => updateDesignPosition(file.id, { width: parseInt(e.target.value) || 0 })}
                                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
                                      min="50"
                                      max={file.position.area_width}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-black">Height (px)</label>
                                    <input
                                      type="number"
                                      value={Math.round(file.position.height)}
                                      onChange={(e) => updateDesignPosition(file.id, { height: parseInt(e.target.value) || 0 })}
                                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
                                      min="50"
                                      max={file.position.area_height}
                                    />
                                  </div>
                                </div>
                                
                                {/* Position Controls */}
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-black">Top (px)</label>
                                    <input
                                      type="number"
                                      value={Math.round(file.position.top)}
                                      onChange={(e) => updateDesignPosition(file.id, { top: parseInt(e.target.value) || 0 })}
                                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
                                      min="0"
                                      max={file.position.area_height - file.position.height}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-black">Left (px)</label>
                                    <input
                                      type="number"
                                      value={Math.round(file.position.left)}
                                      onChange={(e) => updateDesignPosition(file.id, { left: parseInt(e.target.value) || 0 })}
                                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 text-black"
                                      min="0"
                                      max={file.position.area_width - file.position.width}
                                    />
                                  </div>
                                </div>
                                
                                <div className="mt-2 text-xs text-gray-500">
                                  Print area: {file.position.area_width}×{file.position.area_height}px
                                </div>
                                
                                {/* Visual Position Preview */}
                                <div className="mt-3">
                                  <p className="text-xs text-gray-600 mb-1">Position Preview:</p>
                                  <div 
                                    className="relative bg-gray-200 border border-gray-300 rounded"
                                    style={{ 
                                      width: '120px', 
                                      height: '160px' // Roughly 3:4 aspect ratio like print area
                                    }}
                                  >
                                    <div
                                      className="absolute bg-indigo-500 opacity-70 border border-indigo-600 rounded-sm"
                                      style={{
                                        width: `${(file.position.width / file.position.area_width) * 120}px`,
                                        height: `${(file.position.height / file.position.area_height) * 160}px`,
                                        top: `${(file.position.top / file.position.area_height) * 160}px`,
                                        left: `${(file.position.left / file.position.area_width) * 120}px`
                                      }}
                                    >
                                      <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">DESIGN</span>
                                      </div>
                                    </div>
                                    <div className="absolute bottom-1 left-1 text-xs text-gray-500 bg-white px-1 rounded">
                                      {file.placement.toUpperCase()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <button
                      onClick={previewOrderStructure}
                      disabled={designFiles.length === 0}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      Preview Order Structure
                    </button>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setStep('upload')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Back
                      </button>
                      <button
                        onClick={() => setStep('variants')}
                        disabled={designFiles.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {designFiles.length === 0 ? 'Add Designs First' : 'Select Variants'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {step === 'variants' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Select Product Variants</h3>
                  <p className="text-sm text-gray-600 mb-6">
                    Choose which sizes and colors you want to offer for your product. Each variant will use your design files.
                  </p>
                  
                  {selectedProduct && selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => {
                              if (selectedVariants.length === selectedProduct.variants!.length) {
                                setSelectedVariants([]);
                              } else {
                                setSelectedVariants(selectedProduct.variants!.map(v => v.id));
                              }
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            {selectedVariants.length === selectedProduct.variants.length ? 'Deselect All' : 'Select All'}
                          </button>
                          <span className="text-sm text-gray-500">
                            {selectedVariants.length} of {selectedProduct.variants.length} variants selected
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedVariants.length > 0 && (
                            <div>
                              Avg. cost: ${(selectedProduct.variants!
                                .filter(v => selectedVariants.includes(v.id))
                                .reduce((sum, v) => sum + parseFloat(v.price), 0) / selectedVariants.length
                              ).toFixed(2)} per variant
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                        {selectedProduct.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className={`border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedVariants.includes(variant.id)
                                ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setSelectedVariants(prev => 
                                prev.includes(variant.id)
                                  ? prev.filter(id => id !== variant.id)
                                  : [...prev, variant.id]
                              );
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <div
                                  className="w-4 h-4 rounded border-2 flex items-center justify-center"
                                  style={{ borderColor: selectedVariants.includes(variant.id) ? '#6366f1' : '#d1d5db' }}
                                >
                                  {selectedVariants.includes(variant.id) && (
                                    <div className="w-2 h-2 bg-indigo-600 rounded"></div>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {variant.size}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                <div>Cost: ${variant.price}</div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-2">
                              <div
                                className="w-6 h-6 rounded-full border border-gray-300"
                                style={{ backgroundColor: variant.color_code }}
                                title={variant.color}
                              ></div>
                              <span className="text-sm text-gray-600">{variant.color}</span>
                            </div>
                            
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>Production: {variant.in_stock ? '✅ In Stock' : '❌ Out of Stock'}</div>
                            </div>
                            
                            <div className="mt-2">
                              <div className="w-full h-20 bg-gray-100 rounded overflow-hidden relative">
                                <Image
                                  src={variant.image}
                                  alt={`${variant.color} ${variant.size}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {selectedVariants.length > 0 && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">Selected Variants Summary</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Total variants:</span>
                              <span className="ml-2 font-medium">{selectedVariants.length}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Avg. cost:</span>
                              <span className="ml-2 font-medium">
                                ${(selectedProduct.variants!
                                  .filter(v => selectedVariants.includes(v.id))
                                  .reduce((sum, v) => sum + parseFloat(v.price), 0) / selectedVariants.length
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            You&apos;ll set your markup percentage in the next step to determine final selling prices.
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          onClick={() => setStep('design')}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          Back to Design
                        </button>
                        <button
                          onClick={() => setStep('finalize')}
                          disabled={selectedVariants.length === 0}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {selectedVariants.length === 0 ? 'Select Variants First' : `Continue with ${selectedVariants.length} Variants`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Variants Available</h3>
                      <p className="text-gray-600 mb-4">
                        This product doesn&apos;t have any variants loaded. Please go back and select a different product.
                      </p>
                      <button
                        onClick={() => setStep('design')}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Back to Design
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {step === 'finalize' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="Enter product name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="Describe your product"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Markup Percentage (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        value={productForm.markupPercentage}
                        onChange={(e) => setProductForm(prev => ({ ...prev, markupPercentage: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This markup will be added to each variant&apos;s Printful cost to determine your selling price.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      onClick={() => setStep('variants')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Back to Variants
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Sidebar - Product Preview */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Product Preview</h3>
                
                {selectedProduct && (
                  <div>
                    <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <Image
                        src={selectedProduct.image}
                        alt={selectedProduct.title || selectedProduct.model}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {productForm.name || selectedProduct.title || selectedProduct.model}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {selectedProduct.brand} - {selectedProduct.type_name || selectedProduct.type}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">
                          Design Files: {designFiles.length}
                        </p>
                        <p className="text-sm text-gray-600">
                          Available Variants: {selectedProduct.variants?.length || 0} / {selectedProduct.variant_count || 'Unknown'}
                        </p>
                        {loading && (
                          <p className="text-xs text-blue-600 mt-1">
                            🔄 Loading variants...
                          </p>
                        )}
                        {!loading && (!selectedProduct.variants || selectedProduct.variants.length === 0) && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ No variants loaded - product creation may fail
                          </p>
                        )}
                        {!loading && selectedProduct.variants && selectedProduct.variants.length > 0 && (
                          <div>
                            <p className="text-xs text-green-600 mt-1">
                              ✅ {selectedProduct.variants.length} variants loaded successfully
                            </p>
                            {selectedVariants.length > 0 && (
                              <p className="text-xs text-indigo-600 mt-1">
                                🎯 {selectedVariants.length} variants selected for product
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {step === 'finalize' && selectedVariants.length > 0 && productForm.markupPercentage && (
                        <div>
                          {(() => {
                            const selectedVariantData = selectedProduct?.variants?.filter(v => selectedVariants.includes(v.id)) || [];
                            const markup = parseFloat(productForm.markupPercentage) / 100;
                            const prices = selectedVariantData.map(v => parseFloat(v.price) * (1 + markup));
                            const minPrice = Math.min(...prices);
                            const maxPrice = Math.max(...prices);
                            
                            return (
                              <div>
                                <p className="text-lg font-bold text-gray-900">
                                  {minPrice === maxPrice 
                                    ? `$${minPrice.toFixed(2)}`
                                    : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
                                  }
                                </p>
                                <p className="text-xs text-gray-500">
                                  Printful cost + {productForm.markupPercentage}% markup
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tips and Information */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h4 className="text-lg font-medium text-blue-900 mb-4">Printful Integration Guide</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <h5 className="font-medium mb-2">File Requirements:</h5>
              <ul className="space-y-1">
                <li>• 300 DPI resolution minimum</li>
                <li>• RGB color mode preferred</li>
                <li>• PNG/JPG for raster images</li>
                <li>• Maximum file size: 50MB</li>
                <li>• Files are uploaded to Printful&apos;s servers</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Design Placement:</h5>
              <ul className="space-y-1">
                <li>• Front: Main design area (default)</li>
                <li>• Back: Large secondary design</li>
                <li>• Multiple files per variant supported</li>
                <li>• Each placement has specific dimensions</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Product Creation:</h5>
              <ul className="space-y-1">
                <li>• Creates Printful Sync Product</li>
                <li>• Syncs with marketplace catalog</li>
                <li>• Supports multiple variants</li>
                <li>• Automatic order fulfillment</li>
              </ul>
            </div>
          </div>
        </div>
        
        {step === 'upload' && (
          <div className="mt-6 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Demo Mode Notice</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This is a demo implementation. In production, you should:</p>
                    <ul className="mt-1 ml-4 list-disc">
                      <li>Upload files to your own cloud storage (AWS S3, Cloudinary, etc.)</li>
                      <li>Provide actual image URLs to Printful</li>
                      <li>Implement proper file validation and processing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Example Image URLs for Testing</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>You can test with these example URLs:</p>
                    <ul className="mt-1 ml-4 list-disc font-mono text-xs">
                      <li>https://picsum.photos/800/800?random=1</li>
                      <li>https://via.placeholder.com/800x800/FF6B6B/FFFFFF?text=Design</li>
                      <li>https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=800&fit=crop</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}