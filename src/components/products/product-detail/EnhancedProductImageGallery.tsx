'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Share2, X, Maximize2 } from 'lucide-react';
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
      <div className="space-y-3 sm:space-y-4">
        {/* Main Image */}
        <div className="relative group">
          <div className="aspect-square overflow-hidden rounded-xl bg-white/5 border border-white/10 relative transition-all hover:border-white/20">
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
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2">
              <button
                onClick={() => setShowFullscreen(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all"
                title="Share"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg">
                <span className="text-white font-medium text-xs sm:text-sm">
                  {selectedImageIndex + 1} / {images.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Thumbnail Carousel */}
        {images.length > 1 && (
          <div className="relative group">
            <div className="overflow-x-auto scrollbar-hide" data-carousel-container>
              <div className="flex gap-2 sm:gap-3 pb-2">
                {images.map((image, index) => (
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

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 w-11 h-11 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl max-h-[90vh]">
            <Image
              src={images[selectedImageIndex]}
              alt={productName}
              width={1200}
              height={1200}
              className="w-full h-full object-contain rounded-lg border border-white/10"
              unoptimized
            />

            {/* Fullscreen Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
