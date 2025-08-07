'use client';

import { useState } from 'react';
import { Save, Package, DollarSign, FileText, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import RegionalSelector, { RegionalSettings } from '../ui/RegionalSelector';

interface ProductDetailsFormProps {
  initialData: {
    name: string;
    description: string;
    markupPercentage: string;
    category: string;
    regionalSettings?: RegionalSettings;
  };
  selectedProduct?: {
    dynamic_regional_data?: {
      regional_availability?: Record<string, {
        available: boolean;
        variant_count: number;
        total_variants: number;
        coverage_percentage: number;
      }>;
      recommended_regions?: string[];
      recommended_primary_region?: string;
    };
  };
  onSave: (data: {
    name: string;
    description: string;
    markupPercentage: number;
    category: string;
    regionalSettings: RegionalSettings;
  }) => void;
  onNext: () => void;
  isLoading?: boolean;
}

const ProductDetailsForm: React.FC<ProductDetailsFormProps> = ({
  initialData,
  selectedProduct,
  onSave,
  onNext,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    description: initialData.description || '',
    markupPercentage: initialData.markupPercentage || '30',
    category: initialData.category || 'apparel'
  });

  const [regionalSettings, setRegionalSettings] = useState<RegionalSettings>(
    initialData.regionalSettings || {
      targetRegions: ['US'],
      primaryRegion: 'US',
      restrictToRegions: true
    }
  );

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

    // Validate regional settings
    if (regionalSettings.targetRegions.length === 0) {
      newErrors.regionalSettings = 'Please select at least one region for product availability';
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
      category: formData.category,
      regionalSettings
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Product Details
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Configure your product information before going live to the marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter a catchy product name..."
            maxLength={100}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          <p className="text-gray-500 text-xs mt-1">{formData.name.length}/100 characters</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-1" />
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your product, its features, and what makes it special..."
            maxLength={500}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          <p className="text-gray-500 text-xs mt-1">{formData.description.length}/500 characters</p>
        </div>

        {/* Markup Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="w-4 h-4 inline mr-1" />
            Markup Percentage *
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.markupPercentage}
              onChange={(e) => handleInputChange('markupPercentage', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                errors.markupPercentage ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="30"
              min="0"
              max="500"
              step="1"
            />
            <span className="absolute right-3 top-2 text-gray-500">%</span>
          </div>
          {errors.markupPercentage && <p className="text-red-500 text-xs mt-1">{errors.markupPercentage}</p>}
          <p className="text-gray-500 text-xs mt-1">
            Your profit margin on top of base product cost (recommended: 30-50%)
          </p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="apparel">Apparel</option>
            <option value="accessories">Accessories</option>
            <option value="home-living">Home & Living</option>
            <option value="stationery">Stationery</option>
            <option value="bags">Bags</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Regional Settings */}
        <div>
          <RegionalSelector
            value={regionalSettings}
            onChange={setRegionalSettings}
            showAdvanced={true}
            productData={selectedProduct?.dynamic_regional_data}
          />
          {errors.regionalSettings && (
            <p className="text-red-500 text-xs mt-2">{errors.regionalSettings}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Continue to Marketplace
              </>
            )}
          </button>
        </div>
      </form>

      {/* Tips */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Success</h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Use descriptive, searchable product names</li>
          <li>• Include key features and benefits in description</li>
          <li>• Consider your target audience when setting markup</li>
          <li>• Choose the most relevant category for better discoverability</li>
          <li>• Select regions based on your target market and shipping preferences</li>
          <li>• More regions = wider reach but consider shipping costs and times</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductDetailsForm;