'use client';

import { useState } from 'react';
import { Save, Package, DollarSign, FileText, Tag, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { RegionalAvailabilityPreview } from './RegionalAvailabilityPreview';

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
  }) => void;
  onNext: () => void;
  isLoading?: boolean;
  selectedProduct?: any;
  selectedVariants?: number[];
}

const ProductDetailsForm: React.FC<ProductDetailsFormProps> = ({
  initialData,
  onSave,
  onNext,
  isLoading = false,
  selectedProduct,
  selectedVariants = []
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    markupPercentage: initialData.markupPercentage || '30',
    category: initialData.category || 'apparel'
  });


  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Product name must be at least 3 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Product description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    const markup = parseFloat(formData.markupPercentage);
    if (isNaN(markup) || markup < 0 || markup > 500) {
      newErrors.markupPercentage = 'Markup must be between 0% and 500%';
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      markupPercentage: parseFloat(formData.markupPercentage),
      category: formData.category
    };

    onSave(productData);
    onNext();
    toast.success('Product details saved! Ready to go live.');
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="bg-black/90 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-gray-800">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
            <Package className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Product Details
          </h2>
        </div>
        <p className="text-gray-400 text-lg font-medium">
          Configure your product information before going live to the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            <FileText className="w-4 h-4 inline mr-2 text-orange-500" />
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-4 py-4 bg-black/80 border rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-500 font-medium backdrop-blur-sm transition-all duration-200 ${
              errors.name ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
            }`}
            placeholder="Enter a catchy product name..."
            maxLength={100}
          />
          {errors.name && <p className="text-red-400 text-sm mt-2">{errors.name}</p>}
          <p className="text-gray-500 text-sm mt-2">{formData.name.length}/100 characters</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            <FileText className="w-4 h-4 inline mr-2 text-orange-500" />
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={5}
            className={`w-full px-4 py-4 bg-black/80 border rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-500 font-medium backdrop-blur-sm transition-all duration-200 resize-none ${
              errors.description ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
            }`}
            placeholder="Describe your product, its features, and what makes it special..."
            maxLength={500}
          />
          {errors.description && <p className="text-red-400 text-sm mt-2">{errors.description}</p>}
          <p className="text-gray-500 text-sm mt-2">{formData.description.length}/500 characters</p>
        </div>

        {/* Markup Percentage */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            <DollarSign className="w-4 h-4 inline mr-2 text-orange-500" />
            Markup Percentage *
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.markupPercentage}
              onChange={(e) => handleInputChange('markupPercentage', e.target.value)}
              className={`w-full px-4 py-4 bg-black/80 border rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-gray-500 font-medium backdrop-blur-sm transition-all duration-200 pr-12 ${
                errors.markupPercentage ? 'border-red-500' : 'border-gray-700 hover:border-gray-600'
              }`}
              placeholder="30"
              min="0"
              max="500"
              step="1"
            />
            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-bold">%</span>
          </div>
          {errors.markupPercentage && <p className="text-red-400 text-sm mt-2">{errors.markupPercentage}</p>}
          <p className="text-gray-500 text-sm mt-2">
            Your profit margin on top of base product cost (recommended: 30-50%)
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            <Tag className="w-4 h-4 inline mr-2 text-orange-500" />
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-4 py-4 bg-black/80 border border-gray-700 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white font-medium backdrop-blur-sm transition-all duration-200 hover:border-gray-600"
          >
            <option value="apparel" className="bg-black text-white">Apparel</option>
            <option value="accessories" className="bg-black text-white">Accessories</option>
            <option value="home-living" className="bg-black text-white">Home & Living</option>
            <option value="stationery" className="bg-black text-white">Stationery</option>
            <option value="bags" className="bg-black text-white">Bags</option>
            <option value="other" className="bg-black text-white">Other</option>
          </select>
        </div>


        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center transform hover:scale-[1.02] shadow-lg hover:shadow-2xl hover:shadow-orange-500/25"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-3" />
                Save & Continue to Marketplace
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-8 p-6 bg-black/60 rounded-2xl border border-gray-800 backdrop-blur-sm">
        <h4 className="text-base font-bold text-orange-400 mb-4 flex items-center">
          <span className="mr-2">💡</span>
          Tips for Success
        </h4>
        <ul className="text-sm text-gray-300 space-y-2 font-medium">
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">•</span>
            Use descriptive, searchable product names
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">•</span>
            Include key features and benefits in description
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">•</span>
            Consider your target audience when setting markup
          </li>
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">•</span>
            Choose the most relevant category for better discoverability
          </li>
         
          <li className="flex items-start">
            <span className="text-orange-500 mr-2">•</span>
            Higher markup = more profit but consider competitive pricing
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ProductDetailsForm;