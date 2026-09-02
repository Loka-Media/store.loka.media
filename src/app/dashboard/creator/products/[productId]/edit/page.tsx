'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { productAPI, printifyAPI } from '@/lib/api';
import { ArrowLeft, Save, Eye, X, Plus, ChevronLeft, ChevronRight, Trash2, Star, GripVertical, UploadCloud, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import GradientTitle from '@/components/ui/GradientTitle';
import { Button } from '@/components/ui/button';
import CreativeLoader from '@/components/CreativeLoader';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  validateProductName,
  validateProductDescription,
  validateProductCategory,
  validateMarkupPercentage
} from '@/lib/validators/product';

interface Product {
  id: number;
  name: string;
  description: string;
  base_price: number;
  markup_percentage: number;
  min_base_cost: number;
  max_base_cost: number;
  min_price: number;
  max_price: number;
  category: string;
  tags: string[];
  thumbnail_url: string;
  images: string[];
  status: string;
  mockup_generation_inputs: any;
  variants: Array<{
    id: number;
    title: string;
    price: number;
    base_cost: number;
    sku: string;
    printful_variant_id: string;
    printful_availability_regions?: string[] | null;
    printful_availability_status?: Array<{
      region: string;
      status: string;
    }> | null;
  }>;
}


export default function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productId, setProductId] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    markupPercentage: '',
    category: '',
    tags: [] as string[],
    thumbnailUrl: '',
    images: [] as string[],
    isActive: true
  });


  const [newTag, setNewTag] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [carouselScroll, setCarouselScroll] = useState(0);
  const [isUploadingCustomImage, setIsUploadingCustomImage] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reorder helper
  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= formData.images.length || toIndex < 0 || toIndex >= formData.images.length) return;
    const updated = [...formData.images];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, movedItem);

    setFormData(prev => ({ ...prev, images: updated, thumbnailUrl: updated[0] }));
    if (selectedImageIndex === fromIndex) {
      setSelectedImageIndex(toIndex);
    }
    toast.success("Image order updated!", { id: "edit-reorder-toast" });
  };

  // Set Cover Image (#1) helper
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    handleMoveImage(index, 0);
    setSelectedImageIndex(0);
    toast.success("Set as main cover thumbnail!");
  };

  // Delete image helper
  const handleRemoveImage = (indexToRemove: number) => {
    if (formData.images.length <= 1) {
      toast.error("Product must have at least 1 image.");
      return;
    }
    const updated = formData.images.filter((_, i) => i !== indexToRemove);
    setFormData(prev => ({
      ...prev,
      images: updated,
      thumbnailUrl: updated[0] || ''
    }));
    if (selectedImageIndex >= updated.length) {
      setSelectedImageIndex(Math.max(0, updated.length - 1));
    }
    toast.success("Image removed.");
  };

  // Custom image upload handler
  const handleCustomImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingCustomImage(true);
    const toastId = toast.loading(`Uploading ${files.length} custom image(s)...`);

    try {
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        const localDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        let finalUrl = localDataUrl;
        try {
          const uploadRes = await printifyAPI.uploadFileDirectly(file);
          const remoteUrl = uploadRes?.src || uploadRes?.preview_url || uploadRes?.url || uploadRes?.data?.src || uploadRes?.data?.preview_url;
          if (remoteUrl) {
            finalUrl = remoteUrl;
          }
        } catch (err) {
          console.warn("Direct image upload warning, using local preview:", err);
        }
        newUrls.push(finalUrl);
      }

      const updated = [...formData.images, ...newUrls];
      setFormData(prev => ({
        ...prev,
        images: updated,
        thumbnailUrl: updated[0]
      }));
      toast.success(`${files.length} custom image(s) uploaded!`, { id: toastId });
    } catch (err) {
      console.error("Custom image upload error:", err);
      toast.error("Failed to upload image.", { id: toastId });
    } finally {
      setIsUploadingCustomImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // HTML5 Drag and Drop handlers for Image Reordering
  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleImageDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      handleMoveImage(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  const handleImageDragEnd = () => {
    setDraggedIndex(null);
  };

  useEffect(() => {
    params.then((resolvedParams) => {
      setProductId(resolvedParams.productId);
    });
  }, [params]);

  useEffect(() => {
    if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
      router.push('/');
      return;
    }
    
    if (productId) {
      fetchProduct();
    }
  }, [user, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getCreatorProduct(productId);
      const productData = response.product || response;

      setProduct(productData);
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        basePrice: productData.min_base_cost?.toString() || productData.base_price?.toString() || '',
        markupPercentage: productData.markup_percentage?.toString() || '0',
        category: productData.category || '',
        tags: productData.tags || [],
        thumbnailUrl: productData.thumbnail_url || '',
        images: productData.images || [],
        isActive: productData.status === 'active'
      });

    } catch (error) {
      console.error('Failed to fetch product:', error);
      toast.error('Failed to load product');
      router.push('/dashboard/creator/products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameValidation = validateProductName(formData.name.trim());
    if (nameValidation !== true) {
      toast.error(nameValidation);
      return;
    }

    const descValidation = validateProductDescription(formData.description.trim());
    if (descValidation !== true) {
      toast.error(descValidation);
      return;
    }

    const categoryValidation = validateProductCategory(formData.category.trim());
    if (categoryValidation !== true) {
      toast.error(categoryValidation);
      return;
    }

    const markupValue = parseFloat(formData.markupPercentage);
    const markupValidation = validateMarkupPercentage(markupValue);
    if (markupValidation !== true) {
      toast.error(markupValidation);
      return;
    }

    if (!formData.images || formData.images.length === 0) {
      toast.error("Product must have at least 1 image.");
      return;
    }

    try {
      setSaving(true);

      const mainCoverUrl = formData.images[0] || formData.thumbnailUrl;

      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        markupPercentage: markupValue,
        category: formData.category.trim(),
        tags: formData.tags,
        thumbnailUrl: mainCoverUrl,
        thumbnail_url: mainCoverUrl,
        images: formData.images,
        status: formData.isActive ? 'active' : 'inactive',
        is_active: formData.isActive,
        isActive: formData.isActive
      };

      await productAPI.updateProduct(productId, updateData);

      toast.success('Product updated successfully!');
      router.push('/dashboard/creator/products');
    } catch (error: any) {
      console.error('Failed to update product:', error);
      const errorMessage = error?.response?.data?.error || error?.response?.data?.details?.[0]?.msg || 'Failed to update product';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  if (loading) {
    return <CreativeLoader variant="product" message="Loading product..." />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Product not found</h1>
          <Link
            href="/dashboard/creator/products"
            className="text-accent hover:text-accent/80"
          >
            Return to products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/50 border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 sm:py-6 gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-6 min-w-0">
              <Link
                href="/dashboard/creator/products"
                className="inline-flex items-center text-white/70 hover:text-white transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 mr-1 sm:mr-2" />
                <span className="text-xs sm:text-sm">Back</span>
              </Link>
              <div className="min-w-0">
                <GradientTitle text="Edit Product" size="sm" className="sm:text-5xl lg:text-6xl" />
                <p className="mt-1 text-xs sm:text-sm text-white/60 line-clamp-1">
                  Update your product details
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.id}`}
                className="inline-flex items-center px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg sm:rounded-xl transition-colors text-xs sm:text-sm"
              >
                <Eye className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Preview</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 md:space-y-8">
          {/* Basic Information */}
          <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10 backdrop-blur-sm">
            <div className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-6">Basic Information</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="Describe your product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Printify Base Price (PBC) <span className="text-white/50 text-xs">(Standard wholesale catalog cost)</span>
                </label>
                <input
                  type="text"
                  value={`$${parseFloat(formData.basePrice || '0').toFixed(2)}`}
                  readOnly
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/70 cursor-not-allowed"
                  title="This is the standard wholesale catalog cost from Printify"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Printify Premium Pricing (PPP) <span className="text-white/50 text-xs">(23% discount wholesale cost)</span>
                </label>
                <input
                  type="text"
                  value={`$${(parseFloat(formData.basePrice || '0') * 0.77).toFixed(2)}`}
                  readOnly
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white/70 cursor-not-allowed"
                  title="This is the discounted Printify Premium cost"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Markup Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={formData.markupPercentage}
                    onChange={(e) => handleInputChange('markupPercentage', e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                    placeholder="0"
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">%</span>
                </div>
                <p className="mt-1 text-xs text-white/50">Your profit margin on top of base cost</p>
              </div>

              {product && formData.basePrice && formData.markupPercentage && (
                <div className="md:col-span-2">
                  <div className="p-4 bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/30 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/70 mb-1">Calculated Selling Price</p>
                        <p className="text-2xl font-bold text-white">
                          ${(parseFloat(formData.basePrice) * (1 + parseFloat(formData.markupPercentage) / 100)).toFixed(2)}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          ${parseFloat(formData.basePrice).toFixed(2)} + {formData.markupPercentage}% markup
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-white/70 mb-1">Your Profit</p>
                        <p className="text-xl font-bold text-green-400">
                          ${(parseFloat(formData.basePrice) * (parseFloat(formData.markupPercentage) / 100)).toFixed(2)}
                        </p>
                        <p className="text-xs text-white/50 mt-1">per sale</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Category
                </label>
                <Select
                  value={formData.category || "placeholder"}
                  onValueChange={(val) => handleInputChange('category', val === "placeholder" ? "" : val)}
                >
                  <SelectTrigger className="w-full h-[50px] bg-white/10 border-white/20 rounded-xl">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="placeholder" disabled>Select Category</SelectItem>
                    <SelectItem value="T-Shirts">T-Shirts</SelectItem>
                    <SelectItem value="Hoodies">Hoodies</SelectItem>
                    <SelectItem value="Mugs">Mugs</SelectItem>
                    <SelectItem value="Posters">Posters</SelectItem>
                    <SelectItem value="Stickers">Stickers</SelectItem>
                    <SelectItem value="Phone Cases">Phone Cases</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Status
                </label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={formData.isActive}
                      onChange={() => handleInputChange('isActive', true)}
                      className="form-radio text-accent focus:ring-accent"
                    />
                    <span className="ml-2 text-white/90">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={!formData.isActive}
                      onChange={() => handleInputChange('isActive', false)}
                      className="form-radio text-accent focus:ring-accent"
                    />
                    <span className="ml-2 text-white/90">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white/5 rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10 backdrop-blur-sm">
            <div className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-6">Tags</div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex gap-2 sm:space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="Add a tag"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-3 bg-accent text-white rounded-xl transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-white/10 text-white text-sm rounded-full border border-white/20"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-white/60 hover:text-red-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-white/5 rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-6 border border-white/10 backdrop-blur-sm space-y-4 sm:space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <div className="text-base sm:text-lg md:text-xl font-bold text-white">Product Gallery & Reorder</div>
                <p className="text-xs text-white/60 mt-0.5">
                  Upload new photos, drag cards or use arrows to change sequence. <strong>Image #1 (★ COVER)</strong> is the storefront main thumbnail.
                </p>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleCustomImageUpload}
                className="hidden"
              />

              {/* Upload Custom Image Button */}
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingCustomImage}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
              >
                {isUploadingCustomImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload Custom Photo</span>
                  </>
                )}
              </Button>
            </div>

            {formData.images.length > 0 ? (
              <div className="space-y-6">
                {/* Main Preview Container */}
                <div className="relative max-w-md mx-auto aspect-square overflow-hidden rounded-2xl bg-black/60 border border-white/15 p-4 flex items-center justify-center">
                  <Image
                    src={formData.images[selectedImageIndex] || formData.images[0]}
                    alt="Selected product image"
                    width={600}
                    height={600}
                    className="w-full h-full object-contain"
                    unoptimized
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.svg';
                    }}
                  />

                  {/* Badge on main preview */}
                  <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-orange-400">
                      {selectedImageIndex === 0 ? "★ COVER THUMBNAIL (#1)" : `IMAGE #${selectedImageIndex + 1}`}
                    </span>
                  </div>

                  {/* Counter */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1 rounded-lg">
                    <span className="text-white/80 font-mono text-xs">
                      {selectedImageIndex + 1} / {formData.images.length}
                    </span>
                  </div>
                </div>

                {/* Reorderable Thumbnails Grid */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span className="font-semibold">All Product Images ({formData.images.length})</span>
                    <span className="text-[11px] text-white/40">Drag images or use arrow controls</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {formData.images.map((image, index) => {
                      const isCover = index === 0;
                      const isSelected = selectedImageIndex === index;

                      return (
                        <div
                          key={index}
                          draggable
                          onDragStart={(e) => handleImageDragStart(e, index)}
                          onDragOver={(e) => handleImageDragOver(e, index)}
                          onDrop={(e) => handleImageDrop(e, index)}
                          onDragEnd={handleImageDragEnd}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`group relative rounded-xl border p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                            draggedIndex === index
                              ? "opacity-40 border-dashed border-orange-500 bg-orange-500/10"
                              : isSelected
                              ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30"
                              : isCover
                              ? "border-amber-500/60 bg-white/5"
                              : "border-white/10 bg-black/40 hover:border-white/20"
                          }`}
                        >
                          {/* Header Controls */}
                          <div className="flex items-center justify-between gap-1 mb-2 z-10">
                            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                              isCover ? "bg-orange-500 text-white" : "bg-white/10 text-white/70"
                            }`}>
                              {isCover ? "★ COVER" : `#${index + 1}`}
                            </span>

                            <div className="flex items-center gap-0.5 bg-black/80 rounded-lg p-0.5 border border-white/10">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveImage(index, index - 1); }}
                                disabled={index === 0}
                                title="Move Earlier"
                                className="p-1 text-white/50 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 rounded"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveImage(index, index + 1); }}
                                disabled={index === formData.images.length - 1}
                                title="Move Later"
                                className="p-1 text-white/50 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/10 rounded"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                              {!isCover && (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleSetAsCover(index); }}
                                  title="Set as Main Cover (#1)"
                                  className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 rounded"
                                >
                                  <Star className="w-3 h-3 fill-amber-400" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(index); }}
                                title="Delete Image"
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Thumbnail Image */}
                          <div className="aspect-square relative overflow-hidden rounded-lg bg-black/40 flex items-center justify-center">
                            <Image
                              src={image}
                              alt={`Product view ${index + 1}`}
                              width={150}
                              height={150}
                              className="w-full h-full object-contain pointer-events-none transition-transform group-hover:scale-105"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.svg';
                              }}
                            />
                          </div>

                          {/* Footer Drag Handle */}
                          <div className="flex items-center justify-between text-[10px] text-white/40 mt-1.5 px-1">
                            <span className="truncate">View {index + 1}</span>
                            <GripVertical className="w-3 h-3 text-white/40 cursor-grab" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-xl border border-white/10 space-y-3">
                <p className="text-white/60">No product images available</p>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                >
                  <UploadCloud className="w-4 h-4 mr-1.5" />
                  Upload Custom Photo
                </Button>
              </div>
            )}
          </div>

          {/* Product Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="bg-white/5 rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-6 border border-white/10 backdrop-blur-sm">
              <div className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-6">Product Variants</div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="text-left border-b border-white/20">
                      <th className="pb-2 sm:pb-3 text-white/70 font-medium">Variant</th>
                      <th className="pb-2 sm:pb-3 text-white/70 font-medium">PBC (Base)</th>
                      <th className="pb-2 sm:pb-3 text-white/70 font-medium">PPP (Premium)</th>
                      <th className="pb-2 sm:pb-3 text-white/70 font-medium">Selling Price</th>
                      <th className="pb-2 sm:pb-3 text-white/70 font-medium">Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant) => {
                      const baseCost = typeof variant.base_cost === 'string' ? parseFloat(variant.base_cost) : variant.base_cost || 0;
                      const pppCost = baseCost * 0.77;
                      const markupVal = parseFloat(formData.markupPercentage) || 0;
                      const sellingPrice = baseCost * (1 + markupVal / 100);
                      const profit = sellingPrice - baseCost;

                      return (
                        <tr key={variant.id} className="border-b border-white/10">
                          <td className="py-2 sm:py-3 text-white">{variant.title}</td>
                          <td className="py-2 sm:py-3 text-white/60">${baseCost.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 text-white/60">${pppCost.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 text-white font-medium">${sellingPrice.toFixed(2)}</td>
                          <td className="py-2 sm:py-3 text-green-400 font-medium">${profit.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {formData.markupPercentage && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl">
                  <p className="text-yellow-300 text-xs sm:text-sm">
                    <strong>Note:</strong> Updating markup percentage will recalculate all variant prices.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-center pt-2 sm:pt-4">
            <Button
              type="submit"
              disabled={saving}
              variant="primary"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}