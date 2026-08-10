'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Ruler, ZoomIn, ZoomOut } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  category?: string;
  sizeGuideImageUrl?: string | null;
  availableSizes?: string[];
}

export interface SizeRow {
  size: string;
  widthImp?: string;
  widthMet?: string;
  heightImp?: string;
  heightMet?: string;
  lengthImp?: string;
  lengthMet?: string;
  sleeveImp?: string;
  sleeveMet?: string;
  depthImp?: string;
  depthMet?: string;
  extra?: string;
}

type CategoryType = 'drinkware' | 'homedecor' | 'footwear' | 'wallart' | 'accessories' | 'garment';

const getCategoryType = (productName: string, category?: string, sizes: string[] = []): CategoryType => {
  const name = productName.toLowerCase();
  const cat = (category || '').toLowerCase();
  const sizeStr = sizes.join(' ').toLowerCase();

  // 1. Drinkware (Mugs, Tumblers, Bottles, Cups, Glasses)
  if (
    cat.includes('mug') || cat.includes('drinkware') ||
    name.includes('mug') || name.includes('tumbler') || name.includes('bottle') ||
    name.includes('cup') || name.includes('glass') || name.includes('flask') ||
    sizeStr.includes('oz')
  ) {
    return 'drinkware';
  }

  // 2. Home Decor, Clocks, Pillows, Blankets, Towels, Mats, Aprons
  if (
    name.includes('clock') || name.includes('pillow') || name.includes('cushion') ||
    name.includes('blanket') || name.includes('towel') || name.includes('rug') ||
    name.includes('doormat') || name.includes('mat') || name.includes('apron') ||
    name.includes('candle') || name.includes('ornament') || name.includes('curtain') ||
    cat.includes('home') || cat.includes('decor') || cat.includes('living')
  ) {
    return 'homedecor';
  }

  // 3. Wall Art, Posters, Canvas, Prints
  if (
    cat.includes('poster') || cat.includes('canvas') || cat.includes('art') ||
    name.includes('poster') || name.includes('canvas') || name.includes('print') ||
    name.includes('wall art') || name.includes('tapestry')
  ) {
    return 'wallart';
  }

  // 4. Footwear (Shoes, Socks, Boots, Slippers)
  if (
    cat.includes('shoe') || cat.includes('sock') || cat.includes('footwear') ||
    name.includes('shoe') || name.includes('sneaker') || name.includes('sock') ||
    name.includes('boot') || name.includes('slipper') || name.includes('slide')
  ) {
    return 'footwear';
  }

  // 5. Tech & Accessories (Bags, Phone Cases, Mousepads, Stickers, Hats)
  if (
    cat.includes('accessory') || cat.includes('bag') || cat.includes('phone') ||
    name.includes('bag') || name.includes('backpack') || name.includes('tote') ||
    name.includes('pouch') || name.includes('phone') || name.includes('case') ||
    name.includes('hat') || name.includes('cap') || name.includes('beanie') ||
    name.includes('mouse') || name.includes('sticker') || name.includes('magnet') ||
    name.includes('sleeve') || name.includes('wallet')
  ) {
    return 'accessories';
  }

  // 6. Clothing / Apparel (Default)
  return 'garment';
};

const getDefaultCategoryRows = (categoryType: CategoryType): SizeRow[] => {
  if (categoryType === 'drinkware') {
    return [
      { size: '11 oz', heightImp: '3.75', heightMet: '9.5', widthImp: '3.15', widthMet: '8.0', extra: '325 ml' },
      { size: '12 oz', heightImp: '4.00', heightMet: '10.2', widthImp: '3.50', widthMet: '8.9', extra: '350 ml' },
      { size: '15 oz', heightImp: '4.73', heightMet: '12.0', widthImp: '3.35', widthMet: '8.5', extra: '440 ml' },
      { size: '20 oz', heightImp: '6.80', heightMet: '17.3', widthImp: '3.40', widthMet: '8.6', extra: '590 ml' },
      { size: '30 oz', heightImp: '7.80', heightMet: '19.8', widthImp: '4.00', widthMet: '10.2', extra: '880 ml' },
    ];
  }

  if (categoryType === 'homedecor') {
    return [
      { size: '10"', widthImp: '10.0', widthMet: '25.4', heightImp: '10.0', heightMet: '25.4', depthImp: '1.75', depthMet: '4.4' },
      { size: '12"', widthImp: '12.0', widthMet: '30.5', heightImp: '12.0', heightMet: '30.5', depthImp: '1.75', depthMet: '4.4' },
      { size: '14" x 14"', widthImp: '14.0', widthMet: '35.6', heightImp: '14.0', heightMet: '35.6', depthImp: '3.00', depthMet: '7.6' },
      { size: '16" x 16"', widthImp: '16.0', widthMet: '40.6', heightImp: '16.0', heightMet: '40.6', depthImp: '3.00', depthMet: '7.6' },
      { size: '18" x 18"', widthImp: '18.0', widthMet: '45.7', heightImp: '18.0', heightMet: '45.7', depthImp: '3.00', depthMet: '7.6' },
    ];
  }

  if (categoryType === 'wallart') {
    return [
      { size: '8" x 10"', heightImp: '10.0', heightMet: '25.4', widthImp: '8.0', widthMet: '20.3', extra: '4:5 Ratio' },
      { size: '11" x 14"', heightImp: '14.0', heightMet: '35.6', widthImp: '11.0', widthMet: '27.9', extra: '4:5 Ratio' },
      { size: '12" x 18"', heightImp: '18.0', heightMet: '45.7', widthImp: '12.0', widthMet: '30.5', extra: '2:3 Ratio' },
      { size: '16" x 20"', heightImp: '20.0', heightMet: '50.8', widthImp: '16.0', widthMet: '40.6', extra: '4:5 Ratio' },
      { size: '18" x 24"', heightImp: '24.0', heightMet: '61.0', widthImp: '18.0', widthMet: '45.7', extra: '3:4 Ratio' },
      { size: '24" x 36"', heightImp: '36.0', heightMet: '91.4', widthImp: '24.0', widthMet: '61.0', extra: '2:3 Ratio' },
    ];
  }

  if (categoryType === 'footwear') {
    return [
      { size: 'US 6 / S', heightImp: '9.4', heightMet: '24.0', widthImp: 'EU 38', widthMet: 'UK 5.5', extra: '9.4 in' },
      { size: 'US 7 / M', heightImp: '9.8', heightMet: '25.0', widthImp: 'EU 39.5', widthMet: 'UK 6.5', extra: '9.8 in' },
      { size: 'US 8 / L', heightImp: '10.2', heightMet: '26.0', widthImp: 'EU 41', widthMet: 'UK 7.5', extra: '10.2 in' },
      { size: 'US 9', heightImp: '10.6', heightMet: '27.0', widthImp: 'EU 42.5', widthMet: 'UK 8.5', extra: '10.6 in' },
      { size: 'US 10', heightImp: '11.0', heightMet: '28.0', widthImp: 'EU 44', widthMet: 'UK 9.5', extra: '11.0 in' },
      { size: 'US 11', heightImp: '11.4', heightMet: '29.0', widthImp: 'EU 45', widthMet: 'UK 10.5', extra: '11.4 in' },
      { size: 'US 12', heightImp: '11.8', heightMet: '30.0', widthImp: 'EU 46', widthMet: 'UK 11.5', extra: '11.8 in' },
    ];
  }

  if (categoryType === 'accessories') {
    return [
      { size: 'One Size', widthImp: '12.0', heightImp: '15.0', depthImp: '4.0', widthMet: '30.5', heightMet: '38.1', depthMet: '10.2' },
      { size: 'Small', widthImp: '10.0', heightImp: '12.0', depthImp: '3.0', widthMet: '25.4', heightMet: '30.5', depthMet: '7.6' },
      { size: 'Medium', widthImp: '14.0', heightImp: '16.0', depthImp: '5.0', widthMet: '35.6', heightMet: '40.6', depthMet: '12.7' },
      { size: 'Large', widthImp: '18.0', heightImp: '20.0', depthImp: '6.0', widthMet: '45.7', heightMet: '50.8', depthMet: '15.2' },
    ];
  }

  // Garment
  return [
    { size: 'XS', widthImp: '17.5', lengthImp: '27.0', sleeveImp: '7.1', widthMet: '44.4', lengthMet: '68.6', sleeveMet: '18.0' },
    { size: 'S', widthImp: '19.0', lengthImp: '28.0', sleeveImp: '7.5', widthMet: '48.3', lengthMet: '71.1', sleeveMet: '19.0' },
    { size: 'M', widthImp: '20.5', lengthImp: '29.0', sleeveImp: '7.8', widthMet: '52.1', lengthMet: '73.7', sleeveMet: '20.0' },
    { size: 'L', widthImp: '22.0', lengthImp: '30.0', sleeveImp: '8.3', widthMet: '55.9', lengthMet: '76.2', sleeveMet: '21.0' },
    { size: 'XL', widthImp: '24.0', lengthImp: '31.0', sleeveImp: '8.7', widthMet: '61.0', lengthMet: '78.8', sleeveMet: '22.0' },
    { size: '2XL', widthImp: '26.0', lengthImp: '32.0', sleeveImp: '9.1', widthMet: '66.1', lengthMet: '81.3', sleeveMet: '23.0' },
    { size: '3XL', widthImp: '28.0', lengthImp: '33.0', sleeveImp: '9.5', widthMet: '71.1', lengthMet: '83.8', sleeveMet: '24.0' },
    { size: '4XL', widthImp: '30.0', lengthImp: '34.0', sleeveImp: '9.8', widthMet: '76.2', lengthMet: '86.4', sleeveMet: '25.0' },
    { size: '5XL', widthImp: '32.0', lengthImp: '35.0', sleeveImp: '10.1', widthMet: '81.3', lengthMet: '88.9', sleeveMet: '26.0' },
  ];
};

const generateDynamicRows = (categoryType: CategoryType, availableSizes: string[]): SizeRow[] => {
  if (!availableSizes || availableSizes.length === 0) {
    return getDefaultCategoryRows(categoryType);
  }

  return availableSizes.map(size => {
    const sLower = size.toLowerCase().trim();

    if (categoryType === 'drinkware') {
      if (sLower.includes('11')) return { size, heightImp: '3.75', heightMet: '9.5', widthImp: '3.15', widthMet: '8.0', extra: '325 ml' };
      if (sLower.includes('12')) return { size, heightImp: '4.00', heightMet: '10.2', widthImp: '3.50', widthMet: '8.9', extra: '350 ml' };
      if (sLower.includes('15')) return { size, heightImp: '4.73', heightMet: '12.0', widthImp: '3.35', widthMet: '8.5', extra: '440 ml' };
      if (sLower.includes('20')) return { size, heightImp: '6.80', heightMet: '17.3', widthImp: '3.40', widthMet: '8.6', extra: '590 ml' };
      if (sLower.includes('30')) return { size, heightImp: '7.80', heightMet: '19.8', widthImp: '4.00', widthMet: '10.2', extra: '880 ml' };
      return { size, heightImp: '4.50', heightMet: '11.4', widthImp: '3.50', widthMet: '8.9', extra: 'Standard' };
    }

    if (categoryType === 'homedecor') {
      const numbers = size.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const w = parseInt(numbers[0]);
        const h = parseInt(numbers[1]);
        return {
          size,
          widthImp: `${w}.0`,
          widthMet: `${(w * 2.54).toFixed(1)}`,
          heightImp: `${h}.0`,
          heightMet: `${(h * 2.54).toFixed(1)}`,
          depthImp: '1.75',
          depthMet: '4.4'
        };
      }
      if (numbers && numbers.length === 1) {
        const dim = parseInt(numbers[0]);
        return {
          size,
          widthImp: `${dim}.0`,
          widthMet: `${(dim * 2.54).toFixed(1)}`,
          heightImp: `${dim}.0`,
          heightMet: `${(dim * 2.54).toFixed(1)}`,
          depthImp: '1.75',
          depthMet: '4.4'
        };
      }
      return { size, widthImp: '12.0', widthMet: '30.5', heightImp: '12.0', heightMet: '30.5', depthImp: '1.75', depthMet: '4.4' };
    }

    if (categoryType === 'wallart') {
      const numbers = size.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const w = parseInt(numbers[0]);
        const h = parseInt(numbers[1]);
        return {
          size,
          widthImp: `${w}.0`,
          widthMet: `${(w * 2.54).toFixed(1)}`,
          heightImp: `${h}.0`,
          heightMet: `${(h * 2.54).toFixed(1)}`,
          extra: `${w}:${h}`
        };
      }
      return { size, widthImp: '12.0', widthMet: '30.5', heightImp: '18.0', heightMet: '45.7', extra: 'Standard' };
    }

    if (categoryType === 'footwear') {
      if (sLower.includes('6')) return { size, heightImp: '9.4', heightMet: '24.0', widthImp: 'EU 38', widthMet: 'UK 5.5' };
      if (sLower.includes('7')) return { size, heightImp: '9.8', heightMet: '25.0', widthImp: 'EU 39.5', widthMet: 'UK 6.5' };
      if (sLower.includes('8')) return { size, heightImp: '10.2', heightMet: '26.0', widthImp: 'EU 41', widthMet: 'UK 7.5' };
      if (sLower.includes('9')) return { size, heightImp: '10.6', heightMet: '27.0', widthImp: 'EU 42.5', widthMet: 'UK 8.5' };
      if (sLower.includes('10')) return { size, heightImp: '11.0', heightMet: '28.0', widthImp: 'EU 44', widthMet: 'UK 9.5' };
      if (sLower.includes('11')) return { size, heightImp: '11.4', heightMet: '29.0', widthImp: 'EU 45', widthMet: 'UK 10.5' };
      if (sLower.includes('12')) return { size, heightImp: '11.8', heightMet: '30.0', widthImp: 'EU 46', widthMet: 'UK 11.5' };
      return { size, heightImp: '10.0', heightMet: '25.4', widthImp: 'EU 40', widthMet: 'UK 7.0' };
    }

    if (categoryType === 'accessories') {
      const numbers = size.match(/\d+/g);
      if (numbers && numbers.length >= 2) {
        const w = parseInt(numbers[0]);
        const h = parseInt(numbers[1]);
        return {
          size,
          widthImp: `${w}.0`,
          widthMet: `${(w * 2.54).toFixed(1)}`,
          heightImp: `${h}.0`,
          heightMet: `${(h * 2.54).toFixed(1)}`,
          depthImp: '2.5',
          depthMet: '6.4'
        };
      }
      return { size, widthImp: '12.0', widthMet: '30.5', heightImp: '15.0', heightMet: '38.1', depthImp: '4.0', depthMet: '10.2' };
    }

    // Default Garment
    if (sLower === 'xs') return { size: 'XS', widthImp: '17.5', lengthImp: '27.0', sleeveImp: '7.1', widthMet: '44.4', lengthMet: '68.6', sleeveMet: '18.0' };
    if (sLower === 's') return { size: 'S', widthImp: '19.0', lengthImp: '28.0', sleeveImp: '7.5', widthMet: '48.3', lengthMet: '71.1', sleeveMet: '19.0' };
    if (sLower === 'm') return { size: 'M', widthImp: '20.5', lengthImp: '29.0', sleeveImp: '7.8', widthMet: '52.1', lengthMet: '73.7', sleeveMet: '20.0' };
    if (sLower === 'l') return { size: 'L', widthImp: '22.0', lengthImp: '30.0', sleeveImp: '8.3', widthMet: '55.9', lengthMet: '76.2', sleeveMet: '21.0' };
    if (sLower === 'xl') return { size: 'XL', widthImp: '24.0', lengthImp: '31.0', sleeveImp: '8.7', widthMet: '61.0', lengthMet: '78.8', sleeveMet: '22.0' };
    if (sLower === '2xl' || sLower === 'xxl') return { size: '2XL', widthImp: '26.0', lengthImp: '32.0', sleeveImp: '9.1', widthMet: '66.1', lengthMet: '81.3', sleeveMet: '23.0' };
    if (sLower === '3xl' || sLower === 'xxxl') return { size: '3XL', widthImp: '28.0', lengthImp: '33.0', sleeveImp: '9.5', widthMet: '71.1', lengthMet: '83.8', sleeveMet: '24.0' };
    if (sLower === '4xl') return { size: '4XL', widthImp: '30.0', lengthImp: '34.0', sleeveImp: '9.8', widthMet: '76.2', lengthMet: '86.4', sleeveMet: '25.0' };
    if (sLower === '5xl') return { size: '5XL', widthImp: '32.0', lengthImp: '35.0', sleeveImp: '10.1', widthMet: '81.3', lengthMet: '88.9', sleeveMet: '26.0' };

    return { size, widthImp: '20.0', lengthImp: '29.0', sleeveImp: '8.0', widthMet: '50.8', lengthMet: '73.7', sleeveMet: '20.3' };
  });
};

export function SizeGuideModal({
  isOpen,
  onClose,
  productName,
  category,
  sizeGuideImageUrl,
  availableSizes = [],
}: SizeGuideModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [unit, setUnit] = useState<'imperial' | 'metric'>('imperial');
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formattedImageUrl = sizeGuideImageUrl?.startsWith('//')
    ? `https:${sizeGuideImageUrl}`
    : sizeGuideImageUrl;

  const categoryType = getCategoryType(productName, category, availableSizes);
  const rows = generateDynamicRows(categoryType, availableSizes);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">Size Guide</h2>
              <p className="text-xs text-gray-400 truncate max-w-xs sm:max-w-md">{productName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {formattedImageUrl && (
              <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('chart')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'chart' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Size Chart
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`px-3 py-1 rounded-md transition-all ${
                    activeTab === 'table' ? 'bg-white text-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Table
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all ml-2"
              title="Close Size Guide"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {formattedImageUrl && activeTab === 'chart' ? (
            /* Main Image View */
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl bg-white p-2 border border-white/10 flex items-center justify-center min-h-[300px]">
                <Image
                  src={formattedImageUrl}
                  alt={`${productName} Size Guide`}
                  width={900}
                  height={900}
                  className={`w-full h-auto object-contain transition-transform duration-300 ${
                    isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
                  }`}
                  unoptimized
                  onClick={() => setIsZoomed(!isZoomed)}
                />
                
                <button
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium border border-white/20 flex items-center gap-1.5 hover:bg-black transition-all"
                >
                  {isZoomed ? (
                    <>
                      <ZoomOut className="w-3.5 h-3.5" /> Zoom Out
                    </>
                  ) : (
                    <>
                      <ZoomIn className="w-3.5 h-3.5" /> Zoom In
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Category-Specific Table View */
            <div className="space-y-4">
              {/* Unit Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-200">
                  {categoryType === 'drinkware' && 'Drinkware Dimensions & Volume'}
                  {categoryType === 'homedecor' && 'Home & Living Specifications'}
                  {categoryType === 'footwear' && 'Footwear & Shoe Measurements'}
                  {categoryType === 'wallart' && 'Poster & Canvas Print Dimensions'}
                  {categoryType === 'accessories' && 'Product Specifications'}
                  {categoryType === 'garment' && 'Garment Measurements'}
                </span>
                <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5 text-xs font-medium">
                  <button
                    onClick={() => setUnit('imperial')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      unit === 'imperial' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Imperial (inches)
                  </button>
                  <button
                    onClick={() => setUnit('metric')}
                    className={`px-3 py-1 rounded-md transition-all ${
                      unit === 'metric' ? 'bg-orange-500 text-white shadow' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Metric (cm)
                  </button>
                </div>
              </div>

              {/* Table rendering based on Category */}
              <div className="overflow-x-auto border border-white/10 rounded-xl bg-white/5">
                {categoryType === 'drinkware' && (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-white/10 text-gray-300 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Size / Capacity</th>
                        <th className="py-3 px-4">Height</th>
                        <th className="py-3 px-4">Diameter (Top)</th>
                        <th className="py-3 px-4">Fluid Volume</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {rows.map((item) => (
                        <tr key={item.size} className="hover:bg-white/5 transition-colors bg-orange-500/10 text-white font-medium">
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            {item.size}
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          </td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.heightImp} in` : `${item.heightMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.widthImp} in` : `${item.widthMet} cm`}</td>
                          <td className="py-2.5 px-4">{item.extra || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {categoryType === 'homedecor' && (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-white/10 text-gray-300 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Size / Option</th>
                        <th className="py-3 px-4">Width / Diameter</th>
                        <th className="py-3 px-4">Height</th>
                        <th className="py-3 px-4">Depth / Thickness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {rows.map((item) => (
                        <tr key={item.size} className="hover:bg-white/5 transition-colors bg-orange-500/10 text-white font-medium">
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            {item.size}
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          </td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.widthImp} in` : `${item.widthMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.heightImp} in` : `${item.heightMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.depthImp} in` : `${item.depthMet} cm`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {categoryType === 'footwear' && (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-white/10 text-gray-300 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Foot Length</th>
                        <th className="py-3 px-4">EU Equivalent</th>
                        <th className="py-3 px-4">UK Equivalent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {rows.map((item) => (
                        <tr key={item.size} className="hover:bg-white/5 transition-colors bg-orange-500/10 text-white font-medium">
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            {item.size}
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          </td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.heightImp} in` : `${item.heightMet} cm`}</td>
                          <td className="py-2.5 px-4">{item.widthImp}</td>
                          <td className="py-2.5 px-4">{item.widthMet}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {categoryType === 'wallart' && (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-white/10 text-gray-300 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Width</th>
                        <th className="py-3 px-4">Height</th>
                        <th className="py-3 px-4">Aspect Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {rows.map((item) => (
                        <tr key={item.size} className="hover:bg-white/5 transition-colors bg-orange-500/10 text-white font-medium">
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            {item.size}
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          </td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.widthImp} in` : `${item.widthMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.heightImp} in` : `${item.heightMet} cm`}</td>
                          <td className="py-2.5 px-4">{item.extra || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {categoryType === 'accessories' && (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-white/10 text-gray-300 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Width</th>
                        <th className="py-3 px-4">Height</th>
                        <th className="py-3 px-4">Depth</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {rows.map((item) => (
                        <tr key={item.size} className="hover:bg-white/5 transition-colors bg-orange-500/10 text-white font-medium">
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            {item.size}
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          </td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.widthImp} in` : `${item.widthMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.heightImp} in` : `${item.heightMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.depthImp} in` : `${item.depthMet} cm`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {categoryType === 'garment' && (
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-white/10 text-gray-300 font-semibold border-b border-white/10">
                      <tr>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Width</th>
                        <th className="py-3 px-4">Length</th>
                        <th className="py-3 px-4">Sleeve length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-200">
                      {rows.map((item) => (
                        <tr key={item.size} className="hover:bg-white/5 transition-colors bg-orange-500/10 text-white font-medium">
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            {item.size}
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                          </td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.widthImp} in` : `${item.widthMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.lengthImp} in` : `${item.lengthMet} cm`}</td>
                          <td className="py-2.5 px-4">{unit === 'imperial' ? `${item.sleeveImp} in` : `${item.sleeveMet} cm`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Measurements Advice / Helper note */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-gray-300 space-y-1.5">
            <p className="font-semibold text-white">How to measure:</p>
            {categoryType === 'drinkware' && (
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-300">Height:</strong> Measured vertically from flat base to top rim.</li>
                <li><strong className="text-gray-300">Diameter:</strong> Outer diameter across top opening rim.</li>
                <li><strong className="text-gray-300">Fluid Volume:</strong> Standard liquid volume capacity.</li>
              </ul>
            )}
            {categoryType === 'homedecor' && (
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-300">Width / Diameter:</strong> Outer face dimension across product.</li>
                <li><strong className="text-gray-300">Height:</strong> Vertical display height dimension.</li>
                <li><strong className="text-gray-300">Depth:</strong> Frame or cushion thickness from wall/surface.</li>
              </ul>
            )}
            {categoryType === 'footwear' && (
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-300">Foot Length:</strong> Measured from back of heel to longest toe while standing flat.</li>
              </ul>
            )}
            {categoryType === 'wallart' && (
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-300">Dimensions:</strong> Standard poster & canvas print dimensions for standard frame sizing.</li>
              </ul>
            )}
            {categoryType === 'accessories' && (
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-300">Dimensions:</strong> Overall physical outer dimensions when laid flat or unfilled.</li>
              </ul>
            )}
            {categoryType === 'garment' && (
              <ul className="list-disc list-inside space-y-1 text-gray-400">
                <li><strong className="text-gray-300">Width:</strong> Measured across chest 1 inch below armhole when laid flat.</li>
                <li><strong className="text-gray-300">Length:</strong> Measured from highest point of shoulder to bottom hem.</li>
                <li><strong className="text-gray-300">Sleeve:</strong> Measured from center back neck to sleeve hem.</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
