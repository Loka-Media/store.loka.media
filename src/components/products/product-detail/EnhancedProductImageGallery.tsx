'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Share2, ZoomIn, X, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface EnhancedProductImageGalleryProps {
  productName: string;
  images: string[];
}

export function EnhancedProductImageGallery({ productName, images }: EnhancedProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: productName,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('🔗 Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative group">
          <div className="aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-black relative shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
            <Image
              src={images[selectedImageIndex]}
              alt={productName}
              width={600}
              height={600}
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in group-hover:scale-105'
              }`}
              unoptimized
              onClick={() => setIsZoomed(!isZoomed)}
              onError={(e) => {
                e.currentTarget.src = '/placeholder-product.svg';
              }}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-black rounded-full flex items-center justify-center text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white border-4 border-black rounded-full flex items-center justify-center text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[-2px] transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => setShowFullscreen(true)}
                className="w-12 h-12 bg-white/90 backdrop-blur-sm border-2 border-black rounded-xl flex items-center justify-center text-black hover:bg-yellow-300 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                title="Fullscreen"
              >
                <Maximize2 className="w-5 h-5" />
              </button>
              <button
                onClick={handleShare}
                className="w-12 h-12 bg-white/90 backdrop-blur-sm border-2 border-black rounded-xl flex items-center justify-center text-black hover:bg-pink-300 transition-all hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                title="Share"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-sm border-2 border-white px-4 py-2 rounded-full">
                <span className="text-white font-extrabold text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Grid */}
        {images.length > 1 && (
          <div className="grid grid-cols-5 gap-3">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-square rounded-xl overflow-hidden border-4 transition-all ${
                  selectedImageIndex === index
                    ? 'border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] scale-105'
                    : 'border-gray-300 hover:border-black hover:scale-105'
                }`}
              >
                <Image
                  src={image}
                  alt={`${productName} view ${index + 1}`}
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
        )}
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 w-12 h-12 bg-white border-4 border-black rounded-full flex items-center justify-center text-black hover:bg-red-400 transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh]">
            <Image
              src={images[selectedImageIndex]}
              alt={productName}
              width={1200}
              height={1200}
              className="w-full h-full object-contain rounded-2xl border-4 border-white"
              unoptimized
            />

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-white border-4 border-black rounded-full flex items-center justify-center text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-white border-4 border-black rounded-full flex items-center justify-center text-black hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
