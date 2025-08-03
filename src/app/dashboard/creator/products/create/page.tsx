'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { printfulAPI, productAPI } from '@/lib/api';
import {
  ArrowLeft,
  Upload,
  Save,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { isEmbroideryProduct, getDefaultEmbroideryType } from '@/lib/printfulConstants';
import ThreadColorSelector from '@/components/printful/ThreadColorSelector';

interface SelectedPrintfulProduct {
  id: number;
  type: string;
  brand: string;
  model: string;
  image: string;
  variants: Array<{
    id: number;
    product_id: number;
    name: string;
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
  url: string;
  thumbnail_url: string;
  created: number;
}

interface ProductVariant {
  printfulVariantId: number;
  size: string;
  color: string;
  colorCode: string;
  cost: number;
  sku: string;
  imageUrl: string;
  selected: boolean;
  designFiles: Array<{
    fileId: number;
    type: string;
    url: string;
    threadColors?: string[];
  }>;
}

export default function CreateProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [selectedPrintfulProduct, setSelectedPrintfulProduct] = useState<SelectedPrintfulProduct | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [globalThreadColors, setGlobalThreadColors] = useState<string[]>(['#000000']); // Default to black
  const [isEmbroidery, setIsEmbroidery] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    markupPercentage: '30',
    category: '',
    tags: [] as string[],
    thumbnailUrl: '',
    images: [] as string[]
  });

  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    // Load selected Printful product from localStorage
    const savedProduct = localStorage.getItem('selectedPrintfulProduct');
    console.log('Product creation page - savedProduct:', savedProduct);
    if (savedProduct) {
      const product = JSON.parse(savedProduct);
      console.log('Product creation page - parsed product:', product);
      setSelectedPrintfulProduct(product);
      
      // Check if this is an embroidery product
      const isEmbroideryProd = isEmbroideryProduct(product);
      setIsEmbroidery(isEmbroideryProd);
      
      setFormData(prev => ({
        ...prev,
        name: `Custom ${product.model}`,
        category: product.type
      }));
      
      // Initialize variants
      const variants = product.variants?.map((variant: {
        id: number;
        price: string;
        size: string;
        color: string;
        color_code: string;
        image: string;
      }) => ({
        printfulVariantId: variant.id,
        size: variant.size,
        color: variant.color,
        colorCode: variant.color_code,
        cost: parseFloat(variant.price),
        sku: `${product.id}-${variant.id}`,
        imageUrl: variant.image,
        selected: true,
        designFiles: []
      })) || [];
      
      setProductVariants(variants);
    } else {
      console.log('Product creation page - no product found in localStorage');
    }

    fetchUploadedFiles();
  }, [user, router]);

  const fetchUploadedFiles = async () => {
    try {
      const response = await printfulAPI.getFiles();
      setUploadedFiles(response.result || []);
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
        // For demo purposes, create a temporary URL for the file
        // In production, upload to your cloud storage first and get the URL
        const demoImageUrl = `https://picsum.photos/800/800?random=${Date.now()}`;
        
        const fileData = {
          filename: file.name,
          url: demoImageUrl,
          type: 'default'
        };
        
        const response = await printfulAPI.uploadFile(fileData);
        if (response.result) {
          setUploadedFiles(prev => [...prev, response.result]);
          toast.success(`Uploaded ${file.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to upload files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleVariantToggle = (variantId: number) => {
    setProductVariants(prev => 
      prev.map(variant => 
        variant.printfulVariantId === variantId 
          ? { ...variant, selected: !variant.selected }
          : variant
      )
    );
  };

  const handleAddDesignFile = (variantId: number, file: UploadedFile) => {
    setProductVariants(prev => 
      prev.map(variant => 
        variant.printfulVariantId === variantId 
          ? { 
              ...variant, 
              designFiles: [...variant.designFiles, {
                fileId: file.id,
                type: isEmbroidery && selectedPrintfulProduct ? getDefaultEmbroideryType(selectedPrintfulProduct) : 'default',
                url: file.url,
                threadColors: isEmbroidery ? [...globalThreadColors] : undefined
              }]
            }
          : variant
      )
    );
  };

  const handleRemoveDesignFile = (variantId: number, fileId: number) => {
    setProductVariants(prev => 
      prev.map(variant => 
        variant.printfulVariantId === variantId 
          ? { 
              ...variant, 
              designFiles: variant.designFiles.filter(f => f.fileId !== fileId)
            }
          : variant
      )
    );
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const calculatePrice = (cost: number) => {
    const markup = parseFloat(formData.markupPercentage) || 0;
    const basePrice = parseFloat(formData.basePrice) || cost;
    return basePrice + (basePrice * markup / 100);
  };

  const handleCreateProduct = async () => {
    try {
      setCreating(true);

      // Validate form
      if (!formData.name.trim()) {
        toast.error('Product name is required');
        return;
      }

      const selectedVariants = productVariants.filter(v => v.selected);
      if (selectedVariants.length === 0) {
        toast.error('Please select at least one variant');
        return;
      }

      // First create sync product with Printful
      const syncProductData = {
        sync_product: {
          name: formData.name,
          thumbnail: selectedPrintfulProduct?.image || '',
          external_id: `marketplace_${Date.now()}`
        },
        sync_variants: selectedVariants.map(variant => ({
          variant_id: variant.printfulVariantId,
          retail_price: (variant.cost * (1 + (parseFloat(formData.markupPercentage) || 30) / 100)).toFixed(2),
          external_id: `var_${variant.printfulVariantId}_${Date.now()}`,
          files: variant.designFiles.map(file => ({
            url: file.url,
            type: file.type,
            position: {
              area_width: 1800,
              area_height: 2400,
              width: 1200,
              height: 1200,
              top: 600,
              left: 300,
              limit_to_print_area: true
            },
            ...(file.threadColors && file.threadColors.length > 0 && {
              options: [{
                id: 'thread_colors',
                value: file.threadColors
              }]
            })
          }))
        }))
      };

      const syncResponse = await printfulAPI.createSyncProduct(syncProductData);
      
      if (!syncResponse.result?.id) {
        throw new Error('Failed to create sync product');
      }

      // Then create platform product
      const productData = {
        name: formData.name,
        description: formData.description,
        basePrice: parseFloat(formData.basePrice) || selectedVariants[0].cost,
        markupPercentage: parseFloat(formData.markupPercentage) || 30,
        category: formData.category,
        tags: formData.tags,
        thumbnailUrl: formData.thumbnailUrl || selectedPrintfulProduct?.image,
        images: formData.images,
        printfulSyncProductId: syncResponse.result.id,
        variants: selectedVariants.map(variant => ({
          printfulVariantId: variant.printfulVariantId,
          size: variant.size,
          color: variant.color,
          colorCode: variant.colorCode,
          cost: variant.cost,
          sku: variant.sku,
          imageUrl: variant.imageUrl
        }))
      };

      await productAPI.createProduct(productData);
      
      toast.success('Product created successfully!');
      
      // Clear localStorage and redirect
      localStorage.removeItem('selectedPrintfulProduct');
      router.push('/dashboard/creator');
      
    } catch (error) {
      console.error('Failed to create product:', error);
      toast.error('Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  if (!selectedPrintfulProduct) {
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
                href="/dashboard/creator"
                className="inline-flex items-center text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create Product</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Create a custom product using {selectedPrintfulProduct.model}
                </p>
              </div>
            </div>
            
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Info Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="Describe your product"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.basePrice}
                      onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Markup (%)
                    </label>
                    <input
                      type="number"
                      value={formData.markupPercentage}
                      onChange={(e) => setFormData(prev => ({ ...prev, markupPercentage: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    placeholder="T-Shirts, Hoodies, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                      placeholder="Add a tag"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-800">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Design Files</h3>
              
              <div className="mb-4">
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        {uploading ? 'Uploading...' : 'Click to upload design files'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, PDF up to 10MB each
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="relative group">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={file.thumbnail_url || file.url}
                          alt={file.filename}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-600 truncate">{file.filename}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Thread Colors - Only show for embroidery products */}
            {isEmbroidery && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Embroidery Thread Colors</h3>
                <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-amber-800">
                        <strong>Embroidery Product Detected!</strong>
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        This product requires thread color selection for embroidery. Choose your preferred thread colors below.
                        These colors will be applied to all design files on this product.
                      </p>
                    </div>
                  </div>
                </div>
                
                <ThreadColorSelector
                  selectedColors={globalThreadColors}
                  onColorsChange={setGlobalThreadColors}
                  maxColors={5}
                  className="w-full"
                />
              </div>
            )}

            {/* Variants Selection */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Variants</h3>
              
              <div className="space-y-4">
                {productVariants.map((variant) => (
                  <div key={variant.printfulVariantId} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={variant.selected}
                        onChange={() => handleVariantToggle(variant.printfulVariantId)}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="w-12 h-12 relative">
                            <Image
                              src={variant.imageUrl || '/placeholder-product.png'}
                              alt={`${variant.size} ${variant.color}`}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {variant.size} - {variant.color}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Cost: ${variant.cost.toFixed(2)} | 
                              Price: ${calculatePrice(variant.cost).toFixed(2)}
                            </p>
                          </div>
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: variant.colorCode }}
                          ></div>
                        </div>

                        {variant.selected && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Design Files:</p>
                            <div className="space-y-2 mb-2">
                              {variant.designFiles.map((file) => (
                                <div key={file.fileId} className="bg-gray-50 p-3 rounded-lg border">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Design {file.fileId}</span>
                                    <button
                                      onClick={() => handleRemoveDesignFile(variant.printfulVariantId, file.fileId)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-1">
                                    Type: <span className="font-medium">{file.type}</span>
                                  </div>
                                  {file.threadColors && file.threadColors.length > 0 && (
                                    <div className="text-xs text-gray-600">
                                      <span className="font-medium">Thread Colors:</span>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {file.threadColors.map((color) => (
                                          <div key={color} className="flex items-center space-x-1">
                                            <div 
                                              className="w-3 h-3 rounded-full border border-gray-300"
                                              style={{ backgroundColor: color }}
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {uploadedFiles.slice(0, 3).map((file) => (
                                <button
                                  key={file.id}
                                  onClick={() => handleAddDesignFile(variant.printfulVariantId, file)}
                                  className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
                                >
                                  + Add {file.filename.slice(0, 10)}...
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Preview</h3>
              
              <div className="aspect-square relative bg-gray-100 rounded-lg overflow-hidden mb-4">
                <Image
                  src={selectedPrintfulProduct.image || '/placeholder-product.png'}
                  alt={selectedPrintfulProduct.model}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {formData.name || 'Product Name'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedPrintfulProduct.brand} - {selectedPrintfulProduct.model}
                  </p>
                </div>

                <div>
                  <p className="text-lg font-bold text-gray-900">
                    ${productVariants.filter(v => v.selected).length > 0 ? 
                      Math.min(...productVariants.filter(v => v.selected).map(v => calculatePrice(v.cost))).toFixed(2) : 
                      '0.00'
                    }
                    {productVariants.filter(v => v.selected).length > 1 && (
                      <span className="text-sm text-gray-500">
                        {' '}- ${Math.max(...productVariants.filter(v => v.selected).map(v => calculatePrice(v.cost))).toFixed(2)}
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">
                    {productVariants.filter(v => v.selected).length} variants selected
                  </p>
                  {isEmbroidery && (
                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                      <span className="mr-1">🧵</span>
                      Embroidery Product
                    </div>
                  )}
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                    {formData.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{formData.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}