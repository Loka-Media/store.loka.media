'use client';

import { useState, useEffect } from 'react';
import {
  Save,
  Package,
  DollarSign,
  FileText,
  Tag,
  TrendingUp,
  Eye,
  Image as ImageIcon,
  Sparkles,
  Info,
  AlertCircle,
  Check,
  X,
  Plus,
  ChevronLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductDetailsFormProps {
  initialData: {
    name: string;
    description: string;
    markupPercentage: string;
    category: string;
  };
  onSave: (data: {
    name: string;
    description: string;
    markupPercentage: number;
    category: string;
    tags?: string[];
  }) => void;
  onNext: () => void;
  onBack?: () => void;
  isLoading?: boolean;
  selectedProduct?: any;
  selectedVariants?: number[];
  mockupUrls?: any[];
  designFiles?: any[];
}

const EnhancedProductDetailsForm: React.FC<ProductDetailsFormProps> = ({
  initialData,
  onSave,
  onNext,
  onBack,
  isLoading = false,
  selectedProduct,
  selectedVariants = [],
  mockupUrls = [],
  designFiles = []
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    markupPercentage: initialData.markupPercentage || '30',
    category: initialData.category || 'apparel',
    tags: [] as string[]
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPricingCalculator, setShowPricingCalculator] = useState(false);

  // Calculate estimated pricing
  const basePrice = selectedProduct?.price || 20;
  const markup = parseFloat(formData.markupPercentage) || 0;
  const sellingPrice = basePrice * (1 + markup / 100);
  const profit = sellingPrice - basePrice;
  const profitMargin = ((profit / sellingPrice) * 100).toFixed(1);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    const markupNum = parseFloat(formData.markupPercentage);
    if (isNaN(markupNum) || markupNum < 0 || markupNum > 500) {
      newErrors.markupPercentage = 'Markup must be between 0% and 500%';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors before continuing');
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      markupPercentage: parseFloat(formData.markupPercentage),
      category: formData.category,
      tags: formData.tags
    };

    onSave(productData);
    onNext();
    toast.success('Product details saved! Ready to go live! 🎉');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const suggestedTags = ['custom', 'unique', 'gift', 'personalized', 'trendy', 'design', 'art', 'style'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white border-4 border-black rounded-3xl p-6 mb-6 shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-4 flex items-center gap-2 px-4 py-2 bg-white text-black border-2 border-black rounded-xl font-extrabold hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Design
            </button>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-pink-400 border-4 border-black rounded-xl">
                <Package className="w-8 h-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-black">Product Details</h1>
                <p className="text-gray-700 font-bold">
                  Final step before publishing to marketplace!
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-green-200 border-2 border-black px-4 py-2 rounded-xl">
              <Check className="w-5 h-5 text-black" />
              <span className="font-extrabold text-black">Almost Done!</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Preview Card */}
            <div className="bg-white border-4 border-black rounded-2xl p-6">
              <h3 className="text-xl font-extrabold text-black mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6" />
                Product Preview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockupUrls.slice(0, 4).map((mockup: any, index: number) => (
                  <div key={index} className="border-2 border-black rounded-xl overflow-hidden hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all">
                    <img
                      src={mockup.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
                {mockupUrls.length === 0 && (
                  <div className="col-span-2 md:col-span-4 bg-gray-100 border-2 border-black rounded-xl p-8 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-600">
                      No mockups generated yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Product Name */}
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <label className="block text-lg font-extrabold text-black mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all ${
                    errors.name ? 'border-red-600 bg-red-50' : ''
                  }`}
                  placeholder="E.g., Awesome Custom T-Shirt Design"
                  maxLength={100}
                />
                {errors.name && (
                  <div className="mt-2 flex items-center gap-2 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-bold text-red-600">{errors.name}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600 font-bold mt-2">
                  {formData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <label className="block text-lg font-extrabold text-black mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Product Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={6}
                  className={`w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all resize-none ${
                    errors.description ? 'border-red-600 bg-red-50' : ''
                  }`}
                  placeholder="Describe your product... What makes it special? Who is it for? What materials are used?"
                  maxLength={500}
                />
                {errors.description && (
                  <div className="mt-2 flex items-center gap-2 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-bold text-red-600">{errors.description}</p>
                  </div>
                )}
                <p className="text-sm text-gray-600 font-bold mt-2">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Pricing Section */}
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-lg font-extrabold text-black flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Pricing & Profit *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPricingCalculator(!showPricingCalculator)}
                    className="text-sm font-extrabold text-purple-600 underline hover:text-purple-700"
                  >
                    {showPricingCalculator ? 'Hide' : 'Show'} Calculator
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Markup Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.markupPercentage}
                        onChange={(e) => handleInputChange('markupPercentage', e.target.value)}
                        className={`w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all pr-12 ${
                          errors.markupPercentage ? 'border-red-600 bg-red-50' : ''
                        }`}
                        min="0"
                        max="500"
                        step="5"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-extrabold text-lg">
                        %
                      </span>
                    </div>
                    {errors.markupPercentage && (
                      <div className="mt-2 flex items-center gap-2 bg-red-100 border-2 border-red-600 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <p className="text-sm font-bold text-red-600">{errors.markupPercentage}</p>
                      </div>
                    )}
                  </div>

                  {/* Quick Markup Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {[20, 30, 40, 50, 75, 100].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleInputChange('markupPercentage', value.toString())}
                        className={`px-4 py-2 border-2 border-black rounded-xl font-extrabold text-sm transition-all ${
                          formData.markupPercentage === value.toString()
                            ? 'bg-black text-white shadow-[4px_4px_0_0_rgba(0,0,0,1)]'
                            : 'bg-white text-black hover:bg-gray-100'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-gradient-to-r from-green-100 to-green-200 border-2 border-black rounded-xl p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-black">Base Cost:</span>
                        <span className="font-extrabold text-black">${basePrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-black">Your Markup:</span>
                        <span className="font-extrabold text-green-600">+{markup}%</span>
                      </div>
                      <div className="border-t-2 border-black pt-2 flex justify-between">
                        <span className="font-extrabold text-black text-lg">Selling Price:</span>
                        <span className="font-extrabold text-black text-lg">${sellingPrice.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold text-green-700">Your Profit:</span>
                        <span className="font-extrabold text-green-700">${profit.toFixed(2)} ({profitMargin}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <label className="block text-lg font-extrabold text-black mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-black rounded-xl font-bold text-black focus:outline-none focus:ring-4 focus:ring-yellow-300 transition-all"
                >
                  <option value="apparel">👕 Apparel</option>
                  <option value="accessories">👜 Accessories</option>
                  <option value="home-living">🏠 Home & Living</option>
                  <option value="stationery">📝 Stationery</option>
                  <option value="bags">🎒 Bags</option>
                  <option value="other">✨ Other</option>
                </select>
              </div>

              {/* Tags */}
              <div className="bg-white border-4 border-black rounded-2xl p-6">
                <label className="block text-lg font-extrabold text-black mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags (Optional)
                </label>
                <p className="text-sm font-bold text-gray-600 mb-3">
                  Add tags to help customers find your product
                </p>

                {/* Tag Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-4 py-2 bg-white border-2 border-black rounded-xl font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-300"
                    placeholder="Type a tag and press Enter"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || formData.tags.length >= 10}
                    className="px-4 py-2 bg-black text-white border-4 border-black rounded-xl font-extrabold hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>

                {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-2 bg-purple-200 border-2 border-black rounded-full px-3 py-1"
                      >
                        <span className="font-extrabold text-black text-sm">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-purple-300 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3 text-black" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Tags */}
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-2">SUGGESTED:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedTags
                      .filter(tag => !formData.tags.includes(tag))
                      .slice(0, 5)
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            if (formData.tags.length < 10) {
                              setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                            }
                          }}
                          className="px-3 py-1 bg-gray-100 border-2 border-gray-300 rounded-full text-xs font-extrabold text-gray-700 hover:border-black hover:bg-white transition-all"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-400 to-green-500 text-white py-4 px-6 rounded-xl font-extrabold text-lg border-4 border-black hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6" />
                    Save & Publish to Marketplace
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column - Summary & Tips */}
          <div className="space-y-6">
            {/* Product Summary */}
            <div className="bg-white border-4 border-black rounded-2xl p-6">
              <h3 className="text-xl font-extrabold text-black mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                  <span className="font-bold text-gray-700">Variants:</span>
                  <span className="font-extrabold text-black">{selectedVariants.length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                  <span className="font-bold text-gray-700">Designs:</span>
                  <span className="font-extrabold text-black">{designFiles.length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b-2 border-gray-200">
                  <span className="font-bold text-gray-700">Mockups:</span>
                  <span className="font-extrabold text-black">{mockupUrls.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-700">Status:</span>
                  <span className="inline-flex items-center gap-1 bg-yellow-300 border-2 border-black px-3 py-1 rounded-full">
                    <Sparkles className="w-4 h-4 text-black" />
                    <span className="font-extrabold text-black text-sm">Ready!</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-br from-yellow-200 to-pink-200 border-4 border-black rounded-2xl p-6">
              <h4 className="text-lg font-extrabold text-black mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Pro Tips
              </h4>
              <ul className="space-y-2 text-sm font-bold text-black">
                <li className="flex items-start gap-2">
                  <span className="text-black">💡</span>
                  <span>Use keywords customers would search for</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black">💰</span>
                  <span>30-50% markup is ideal for most products</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black">📝</span>
                  <span>Detailed descriptions increase sales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black">🏷️</span>
                  <span>Tags improve discoverability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black">✅</span>
                  <span>Check spelling before publishing</span>
                </li>
              </ul>
            </div>

            {/* Pricing Guide */}
            <div className="bg-green-100 border-4 border-green-600 rounded-2xl p-6">
              <h4 className="text-lg font-extrabold text-black mb-3">
                Pricing Guide
              </h4>
              <div className="space-y-2 text-sm font-bold text-black">
                <div className="flex justify-between">
                  <span>Conservative:</span>
                  <span className="font-extrabold">20-30%</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard:</span>
                  <span className="font-extrabold">30-50%</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium:</span>
                  <span className="font-extrabold">50-100%</span>
                </div>
                <div className="flex justify-between">
                  <span>Luxury:</span>
                  <span className="font-extrabold">100%+</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProductDetailsForm;
