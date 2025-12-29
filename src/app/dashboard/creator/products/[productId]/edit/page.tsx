'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { productAPI } from '@/lib/api';
import { ArrowLeft, Save, Eye, X, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import GradientTitle from '@/components/ui/GradientTitle';
import { Button } from '@/components/ui/button';

interface Product {
  id: number;
  name: string;
  description: string;
  base_price: number;
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
    sku: string;
    printful_variant_id: string;
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
      const response = await productAPI.getProduct(productId);
      const productData = response;
      
      console.log('Product data:', productData);
      setProduct(productData);
      setFormData({
        name: productData.name || '',
        description: productData.description || '',
        basePrice: productData.base_price?.toString() || '',
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

    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      setSaving(true);

      const updateData = {
        ...formData,
        basePrice: parseFloat(formData.basePrice) || 0,
        markupPercentage: parseFloat(formData.markupPercentage) || 0
      };

      await productAPI.updateProduct(productId, updateData);

      toast.success('Product updated successfully!');
      router.push('/dashboard/creator/products');
    } catch (error) {
      console.error('Failed to update product:', error);
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-white/60 text-lg">Loading product...</p>
        </div>
      </div>
    );
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
                target="_blank"
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
                  Base Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Markup Percentage
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.markupPercentage}
                  onChange={(e) => handleInputChange('markupPercentage', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                >
                  <option value="">Select Category</option>
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Hoodies">Hoodies</option>
                  <option value="Mugs">Mugs</option>
                  <option value="Posters">Posters</option>
                  <option value="Stickers">Stickers</option>
                  <option value="Phone Cases">Phone Cases</option>
                </select>
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
          <div className="bg-white/5 rounded-lg sm:rounded-xl shadow-xl p-3 sm:p-4 md:p-6 border border-white/10 backdrop-blur-sm">
            <div className="text-base sm:text-lg md:text-xl font-bold text-white mb-3 sm:mb-6">Product Images</div>

            {formData.images.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Main Image */}
                <div className="relative">
                  <div className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10 relative">
                    <Image
                      src={formData.images[selectedImageIndex]}
                      alt="Selected product image"
                      width={600}
                      height={600}
                      className="w-full h-full object-cover"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-product.svg';
                      }}
                    />

                    {/* Image Counter */}
                    {formData.images.length > 1 && (
                      <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg">
                        <span className="text-white font-medium text-xs sm:text-sm">
                          {selectedImageIndex + 1} / {formData.images.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Thumbnail Carousel */}
                {formData.images.length > 1 && (
                  <div className="relative group">
                    <div className="overflow-x-auto scrollbar-hide" data-carousel-container>
                      <div className="flex gap-2 sm:gap-3 pb-2">
                        {formData.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border transition-all ${
                              selectedImageIndex === index
                                ? 'border-white/40 ring-2 ring-white/20'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`Product view ${index + 1}`}
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                              unoptimized
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.svg';
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Left Arrow */}
                    <button
                      onClick={() => {
                        const container = document.querySelector('[data-carousel-container]');
                        if (container) {
                          container.scrollBy({ left: -100, behavior: 'smooth' });
                        }
                      }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Right Arrow */}
                    <button
                      onClick={() => {
                        const container = document.querySelector('[data-carousel-container]');
                        if (container) {
                          container.scrollBy({ left: 100, behavior: 'smooth' });
                        }
                      }}
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-white/5 rounded-lg border border-white/10">
                <p className="text-white/60 mb-3">No product images available</p>
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
                      <th className="pb-2 sm:pb-3 text-white/70 font-medium">SKU</th>
                      <th className="pb-2 sm:pb-3 text-white/70 font-medium">Current Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant, index) => (
                      <tr key={variant.id} className="border-b border-white/10">
                        <td className="py-2 sm:py-3 text-white">{variant.title}</td>
                        <td className="py-2 sm:py-3 text-white/60">{variant.sku}</td>
                        <td className="py-2 sm:py-3 text-white">${(typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price || 0).toFixed(2)}</td>
                      </tr>
                    ))}
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
          <div className="flex justify-end pt-2 sm:pt-4">
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