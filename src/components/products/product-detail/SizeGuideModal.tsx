'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Ruler, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  sizeGuideImageUrl?: string | null;
  availableSizes?: string[];
}

export function SizeGuideModal({
  isOpen,
  onClose,
  productName,
  sizeGuideImageUrl,
  availableSizes = [],
}: SizeGuideModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [unit, setUnit] = useState<'imperial' | 'metric'>('imperial');
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  // Handle escape key
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

  // Fallback measurements data if image is missing or user switches to table view
  const defaultMeasurements = [
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
            /* Table View */
            <div className="space-y-4">
              {/* Unit Switcher */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-200">Garment Measurements</span>
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

              {/* Responsive Table */}
              <div className="overflow-x-auto border border-white/10 rounded-xl bg-white/5">
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
                    {defaultMeasurements.map((item) => {
                      const isSelectedSize = availableSizes.includes(item.size);
                      return (
                        <tr
                          key={item.size}
                          className={`hover:bg-white/5 transition-colors ${
                            isSelectedSize ? 'bg-orange-500/10 text-white font-medium' : ''
                          }`}
                        >
                          <td className="py-2.5 px-4 font-bold text-white flex items-center gap-2">
                            {item.size}
                            {isSelectedSize && (
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {unit === 'imperial' ? `${item.widthImp} in` : `${item.widthMet} cm`}
                          </td>
                          <td className="py-2.5 px-4">
                            {unit === 'imperial' ? `${item.lengthImp} in` : `${item.lengthMet} cm`}
                          </td>
                          <td className="py-2.5 px-4">
                            {unit === 'imperial' ? `${item.sleeveImp} in` : `${item.sleeveMet} cm`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Measurements Advice / Helper note */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 text-xs text-gray-300 space-y-1.5">
            <p className="font-semibold text-white">How to measure:</p>
            <ul className="list-disc list-inside space-y-1 text-gray-400">
              <li><strong className="text-gray-300">Width:</strong> Measured across the chest 1 inch below armhole when laid flat.</li>
              <li><strong className="text-gray-300">Length:</strong> Measured from highest point of shoulder to bottom hem.</li>
              <li><strong className="text-gray-300">Sleeve:</strong> Measured from center back neck to shoulder seam, then to sleeve hem.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
