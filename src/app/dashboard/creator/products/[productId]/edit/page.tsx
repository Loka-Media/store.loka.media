'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { productAPI } from '@/lib/api';
import { ArrowLeft, Save, Eye, X, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

interface MockupFile {
  url: string;
  type: string;
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
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

  const [mockupData, setMockupData] = useState({
    files: [] as MockupFile[],
    options: [] as Array<{ id: string; value: string }>
  });

  const [newTag, setNewTag] = useState('');

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
      const productData = response.product;
      
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

      // Set mockup data if available
      if (productData.mockup_generation_inputs) {
        setMockupData({
          files: productData.mockup_generation_inputs.files || [],
          options: productData.mockup_generation_inputs.options || []
        });
      }
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
        markupPercentage: parseFloat(formData.markupPercentage) || 0,
        mockupGenerationInputs: mockupData.files.length > 0 ? mockupData : null
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product not found</h1>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-6">
              <Link
                href="/dashboard/creator/products"
                className="inline-flex items-center text-gray-600 hover:text-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Products
              </Link>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit Product</h1>
                <p className="mt-1 text-base text-gray-600">
                  Update your product details and mockup
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}-${product.id}`}
                target="_blank"
                className="inline-flex items-center px-4 py-2 bg-white text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="Describe your product"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Base Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Markup Percentage
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.markupPercentage}
                  onChange={(e) => handleInputChange('markupPercentage', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
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
                <label className="block text-sm font-medium text-gray-900 mb-2">
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
                    <span className="ml-2 text-gray-900">Active</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={!formData.isActive}
                      onChange={() => handleInputChange('isActive', false)}
                      className="form-radio text-accent focus:ring-accent"
                    />
                    <span className="ml-2 text-gray-900">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tags</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-accent focus:border-accent transition-colors"
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
                      className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-900 text-sm rounded-full"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-gray-600 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mockup Information */}
          {mockupData.files.length > 0 && (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-6">Current Mockup</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockupData.files.map((file, index) => (
                  <div key={index} className="bg-gray-800/50 rounded-xl p-4">
                    <div className="aspect-square relative mb-2 rounded-lg overflow-hidden">
                      <Image
                        src={file.url}
                        alt={`Mockup ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="text-sm text-gray-400 text-center">
                      Type: {file.type}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> To update mockup images, you'll need to use the canvas editor or re-upload through the product creation flow.
                </p>
              </div>
            </div>
          )}

          {/* Product Variants */}
          {product.variants && product.variants.length > 0 && (
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl shadow-xl p-6 border border-gray-800">
              <h2 className="text-xl font-bold text-white mb-6">Product Variants</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-700">
                      <th className="pb-3 text-gray-300 font-medium">Variant</th>
                      <th className="pb-3 text-gray-300 font-medium">SKU</th>
                      <th className="pb-3 text-gray-300 font-medium">Current Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants.map((variant, index) => (
                      <tr key={variant.id} className="border-b border-gray-800">
                        <td className="py-3 text-white">{variant.title}</td>
                        <td className="py-3 text-gray-400">{variant.sku}</td>
                        <td className="py-3 text-white">${variant.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {formData.markupPercentage && (
                <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl">
                  <p className="text-yellow-300 text-sm">
                    <strong>Note:</strong> Updating markup percentage will recalculate all variant prices.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-accent text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}