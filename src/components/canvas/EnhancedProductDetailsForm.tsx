'use client';

import { useState, useEffect } from 'react';
import {
  Save,
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
  ChevronLeft,
  Lightbulb,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import GradientTitle from '@/components/ui/GradientTitle';
import { Button } from '@/components/ui/button';

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
  onNext: (data?: {
    name: string;
    description: string;
    markupPercentage: string;
    category: string;
    tags?: string[];
  }) => void;
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

  // Calculate estimated pricing from actual variant data
  const selectedVariantIds = selectedVariants || [];
  const variants = selectedProduct?.variants?.filter((v: any) =>
    selectedVariantIds.includes(v.id)
  ) || [];

  // Get price range from selected variants
  const variantPrices = variants.map((v: any) => parseFloat(v.price || 0)).filter((p: number) => p > 0);
  const minPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 20;
  const maxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 20;
  const hasPriceRange = minPrice !== maxPrice;

  const markup = parseFloat(formData.markupPercentage) || 0;
  const minSellingPrice = minPrice * (1 + markup / 100);
  const maxSellingPrice = maxPrice * (1 + markup / 100);
  const avgProfit = ((minSellingPrice + maxSellingPrice) / 2) - ((minPrice + maxPrice) / 2);
  const avgSellingPrice = (minSellingPrice + maxSellingPrice) / 2;
  const profitMargin = ((avgProfit / avgSellingPrice) * 100).toFixed(1);

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

    // Pass the product data to onSave for state management
    onSave(productData);

    // Also pass the data to onNext to avoid state timing issues
    const formDataForNext = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      markupPercentage: formData.markupPercentage,
      category: formData.category,
      tags: formData.tags
    };
    onNext(formDataForNext);

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
    <div className="min-h-screen bg-black py-4 sm:py-8 px-3 sm:px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-4 sm:p-6 mb-4 sm:mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="mb-3 sm:mb-4 flex items-center gap-2 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-800 text-gray-200 border border-gray-700 rounded-lg font-bold hover:bg-gray-700 hover:border-gray-600 transition-all"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Back to Design</span>
              <span className="sm:hidden">Back</span>
            </button>
          )}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <GradientTitle
                text="Product Details"
                size="sm"
                className="text-2xl sm:text-4xl"
              />
              <p className="text-xs sm:text-sm text-gray-400 mt-2">
                Final step before publishing to marketplace!
              </p>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 px-4 py-2 rounded-lg whitespace-nowrap">
              <Check className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300">Almost Done!</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Product Preview Card */}
            <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-4 sm:p-6">
              <h3 className="text-base sm:text-xl font-extrabold text-white mb-3 sm:mb-4">
                Product Preview
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                {mockupUrls.slice(0, 4).map((mockup: any, index: number) => (
                  <div key={index} className="border border-gray-700 rounded-lg overflow-hidden hover:shadow-[0_10px_30px_rgba(255,133,27,0.2)] transition-all">
                    <img
                      src={mockup.url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                ))}
                {mockupUrls.length === 0 && (
                  <div className="col-span-2 md:col-span-4 bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-8 text-center">
                    <ImageIcon className="w-8 sm:w-12 h-8 sm:h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm text-gray-400">
                      No mockups generated yet
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Product Name */}
              <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-4 sm:p-6">
                <label className="block text-base sm:text-lg font-extrabold text-white mb-2 sm:mb-3 flex items-center gap-2">
                  <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all ${
                    errors.name ? 'border-orange-500/50 bg-orange-500/10' : ''
                  }`}
                  placeholder="E.g., Awesome Custom T-Shirt Design"
                  maxLength={100}
                />
                {errors.name && (
                  <div className="mt-2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="font-bold text-orange-300">{errors.name}</p>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  {formData.name.length}/100 characters
                </p>
              </div>

              {/* Description */}
              <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-4 sm:p-6">
                <label className="block text-base sm:text-lg font-extrabold text-white mb-2 sm:mb-3 flex items-center gap-2">
                  <FileText className="w-4 sm:w-5 h-4 sm:h-5" />
                  Product Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none ${
                    errors.description ? 'border-orange-500/50 bg-orange-500/10' : ''
                  }`}
                  placeholder="Describe your product... What makes it special? Who is it for? What materials are used?"
                  maxLength={500}
                />
                {errors.description && (
                  <div className="mt-2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm">
                    <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                    <p className="font-bold text-orange-300">{errors.description}</p>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-gray-400 mt-2">
                  {formData.description.length}/500 characters
                </p>
              </div>

              {/* Pricing Section */}
              <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                  <label className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                    <DollarSign className="w-4 sm:w-5 h-4 sm:h-5" />
                    Pricing & Profit *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPricingCalculator(!showPricingCalculator)}
                    className="text-sm text-orange-400 underline hover:text-orange-300"
                  >
                    {showPricingCalculator ? 'Hide' : 'Show'} Calculator
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Markup Percentage
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.markupPercentage}
                        onChange={(e) => handleInputChange('markupPercentage', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all pr-12 ${
                          errors.markupPercentage ? 'border-orange-500/50 bg-orange-500/10' : ''
                        }`}
                        min="0"
                        max="500"
                        step="5"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                        %
                      </span>
                    </div>
                    {errors.markupPercentage && (
                      <div className="mt-2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
                        <AlertCircle className="w-4 h-4 text-orange-400" />
                        <p className="text-sm font-bold text-orange-300">{errors.markupPercentage}</p>
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
                        className={`px-4 py-2 border border-gray-700 rounded-lg text-sm transition-all ${
                          formData.markupPercentage === value.toString()
                            ? 'bg-orange-500 text-white border-orange-500 shadow-[0_10px_30px_rgba(255,133,27,0.2)]'
                            : 'bg-gray-800 text-gray-200 hover:bg-gray-700 hover:border-gray-600'
                        }`}
                      >
                        {value}%
                      </button>
                    ))}
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Base Cost Range:</span>
                        <span className="text-white">
                          {hasPriceRange
                            ? `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`
                            : `$${minPrice.toFixed(2)}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Your Markup:</span>
                        <span className="text-green-400 font-medium">+{markup}%</span>
                      </div>
                      <div className="border-t border-orange-500/30 pt-2 flex justify-between">
                        <span className="text-white text-lg">Selling Price Range:</span>
                        <span className="text-orange-400 text-lg">
                          {hasPriceRange
                            ? `$${minSellingPrice.toFixed(2)} - $${maxSellingPrice.toFixed(2)}`
                            : `$${minSellingPrice.toFixed(2)}`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Avg. Profit per Item:</span>
                        <span className="text-green-400 font-medium">${avgProfit.toFixed(2)} ({profitMargin}%)</span>
                      </div>
                      {hasPriceRange && (
                        <div className="mt-3 pt-3 border-t border-orange-500/20">
                          <p className="text-xs text-gray-400 flex items-start gap-2">
                            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              Different sizes have different base costs. Your {markup}% markup is applied to each variant individually. Larger sizes (2XL-6XL) cost more and will be priced higher accordingly.
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Category */}
              <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-6">
                <label className="block text-lg font-extrabold text-white mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Category *
                </label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all appearance-none"
                  >
                    <option value="">Select a category</option>
                    <option value="apparel">Apparel</option>
                    <option value="accessories">Accessories</option>
                    <option value="home-living">Home & Living</option>
                    <option value="stationery">Stationery</option>
                    <option value="bags">Bags</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <ChevronLeft className="w-5 h-5 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-6">
                <label className="block text-lg font-extrabold text-white mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags (Optional)
                </label>
                <p className="text-sm text-gray-400 mb-3">
                  Add tags to help customers find your product
                </p>

                {/* Tag Input */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Type a tag and press Enter"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!tagInput.trim() || formData.tags.length >= 10}
                    className="px-3 sm:px-4 py-2 bg-orange-500 text-white border border-orange-600 rounded-lg hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Plus className="w-4 sm:w-5 h-4 sm:h-5" />
                  </button>
                </div>

                {/* Current Tags */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag) => (
                      <div
                        key={tag}
                        className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1"
                      >
                        <span className="text-orange-300 text-sm">{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:bg-orange-500/30 rounded-full p-1 transition-colors"
                        >
                          <X className="w-3 h-3 text-orange-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggested Tags */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">SUGGESTED:</p>
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
                          className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-300 hover:border-orange-500 hover:text-orange-400 transition-all"
                        >
                          + {tag}
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="w-full">
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="primary"
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 sm:h-6 w-5 sm:w-6 border-b-2 border-black" />
                      <span className="hidden sm:inline">Saving...</span>
                      <span className="sm:hidden">Save...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 sm:w-6 h-5 sm:h-6" />
                      <span className="hidden sm:inline">Save & Publish to Marketplace</span>
                      <span className="sm:hidden">Publish</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column - Summary & Tips */}
          <div className="space-y-4 sm:space-y-6">
            {/* Product Summary */}
            <div className="gradient-border-white-bottom rounded-lg bg-gray-900 p-4 sm:p-6">
              <h3 className="text-base sm:text-xl font-extrabold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 sm:w-6 h-5 sm:h-6" />
                Summary
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                  <span className="text-gray-400">Variants:</span>
                  <span className="text-white">{selectedVariants.length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                  <span className="text-gray-400">Designs:</span>
                  <span className="text-white">{designFiles.length}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-700">
                  <span className="text-gray-400">Mockups:</span>
                  <span className="text-white">{mockupUrls.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full" style={{ backgroundColor: '#FFEC1F' }}>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span className="text-black text-sm font-medium">Ready!</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
              <h4 className="text-lg text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5" />
                Pro Tips
              </h4>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Use keywords customers would search for</span>
                </li>
                <li className="flex items-start gap-3">
                  <DollarSign className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>30-50% markup is ideal for most products</span>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Detailed descriptions increase sales</span>
                </li>
                <li className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Tags improve discoverability</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>Check spelling before publishing and also for category dropdown options</span>
                </li>
              </ul>
            </div>

            {/* Pricing Guide */}
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
              <h4 className="text-lg text-white mb-3">
                Pricing Guide
              </h4>
              <div className="space-y-2 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Conservative:</span>
                  <span className="text-orange-400">20-30%</span>
                </div>
                <div className="flex justify-between">
                  <span>Standard:</span>
                  <span className="text-orange-400">30-50%</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium:</span>
                  <span className="text-orange-400">50-100%</span>
                </div>
                <div className="flex justify-between">
                  <span>Luxury:</span>
                  <span className="text-orange-400">100%+</span>
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
