'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Share2, X, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface EnhancedProductImageGalleryProps {
  productName: string;
  images: string[];
  selectedIndex?: number;
  onSelectImage?: (index: number) => void;
}

export function EnhancedProductImageGallery({
  productName,
  images,
  selectedIndex,
  onSelectImage,
}: EnhancedProductImageGalleryProps) {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(0);
  const selectedImageIndex = selectedIndex !== undefined ? selectedIndex : internalSelectedIndex;

  const handleSelectIndex = (index: number) => {
    if (onSelectImage) {
      onSelectImage(index);
    }
    setInternalSelectedIndex(index);
    scrollSelectedThumbnailIntoView(index);
  };

  useEffect(() => {
    if (selectedIndex !== undefined) {
      scrollSelectedThumbnailIntoView(selectedIndex);
    }
  }, [selectedIndex]);

  const [isZoomed, setIsZoomed] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [isFullscreenZoomed, setIsFullscreenZoomed] = useState(false);
  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  const prevImage = useCallback(() => {
    const nextIndex = selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1;
    handleSelectIndex(nextIndex);
  }, [selectedImageIndex, images.length]);

  const nextImage = useCallback(() => {
    const nextIndex = selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1;
    handleSelectIndex(nextIndex);
  }, [selectedImageIndex, images.length]);

  // Handle Keyboard Navigation & Escape
  useEffect(() => {
    if (!showFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowFullscreen(false);
        setIsFullscreenZoomed(false);
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showFullscreen, prevImage, nextImage]);

  // Lock body scroll cleanly while fullscreen lightbox is open
  useEffect(() => {
    if (showFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setIsFullscreenZoomed(false);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFullscreen]);

  const scrollSelectedThumbnailIntoView = (index: number) => {
    const container = thumbnailContainerRef.current;
    if (!container) return;
    const button = container.querySelector<HTMLButtonElement>(`[data-thumb-index="${index}"]`);
    button?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

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

  const currentImageUrl = images[selectedImageIndex]?.startsWith('//')
    ? `https:${images[selectedImageIndex]}`
    : images[selectedImageIndex] || '/placeholder-product.svg';

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {/* Main Image */}
        <div className="relative group">
          <div className="aspect-square overflow-hidden rounded-2xl bg-neutral-950 border border-white/10 relative transition-all hover:border-white/20">
            <Image
              src={currentImageUrl}
              alt={productName}
              width={600}
              height={600}
              className={`w-full h-full object-contain p-2 transition-transform duration-500 ${
                isZoomed ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in group-hover:scale-105'
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
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-black/60 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-orange-500 hover:border-orange-400 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-11 sm:h-11 bg-black/60 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:bg-orange-500 hover:border-orange-400 transition-all opacity-0 group-hover:opacity-100 z-10"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </>
            )}

            {/* Action Buttons */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex gap-2 z-10">
              <button
                onClick={() => setShowFullscreen(true)}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-black/75 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-orange-500 hover:border-orange-400 transition-all"
                title="Fullscreen Preview"
              >
                <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={handleShare}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-black/75 backdrop-blur-md border border-white/30 rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-orange-500 hover:border-orange-400 transition-all"
                title="Share"
              >
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full pointer-events-none">
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
            <div ref={thumbnailContainerRef} className="overflow-x-auto scrollbar-hide py-1" data-carousel-container>
              <div className="flex gap-2.5 sm:gap-3">
                {images.map((image, index) => {
                  const thumbUrl = image?.startsWith('//') ? `https:${image}` : image;
                  return (
                    <button
                      key={index}
                      data-thumb-index={index}
                      onClick={() => handleSelectIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-neutral-950 border-2 transition-all p-1.5 ${
                        selectedImageIndex === index
                          ? 'border-orange-500 ring-2 ring-orange-500/30'
                          : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <Image
                        src={thumbUrl}
                        alt={`${productName} thumbnail ${index + 1}`}
                        width={100}
                        height={100}
                        className="w-full h-full object-contain"
                        unoptimized
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-product.svg';
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Left Arrow */}
            <button
              onClick={prevImage}
              className="absolute -left-3 sm:-left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/80 hover:bg-orange-500 border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={nextImage}
              className="absolute -right-3 sm:-right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/80 hover:bg-orange-500 border border-white/20 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {showFullscreen && (
        <div
          data-lenis-prevent
          data-modal-scroll
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-in fade-in duration-200"
          onClick={() => setShowFullscreen(false)}
        >
          {/* Top Controls Bar */}
          <div
            className="flex items-center justify-between w-full max-w-6xl mx-auto z-20 pb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/10 border border-white/20 px-3.5 py-1.5 rounded-full text-white text-xs sm:text-sm font-semibold">
              {selectedImageIndex + 1} / {images.length}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setIsFullscreenZoomed(!isFullscreenZoomed)}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl flex items-center justify-center text-white transition-all"
                title={isFullscreenZoomed ? 'Zoom Out' : 'Zoom In'}
              >
                {isFullscreenZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowFullscreen(false)}
                className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 hover:bg-red-500/80 border border-white/20 rounded-xl flex items-center justify-center text-white transition-all"
                title="Close (Esc)"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Center Main Image Stage */}
          <div
            className="relative flex-1 flex items-center justify-center w-full max-w-6xl mx-auto overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Button */}
            {images.length > 1 && (
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-orange-500 border border-white/20 rounded-full flex items-center justify-center text-white transition-all z-20"
                title="Previous Image"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Lightbox Image Container */}
            <div
              className={`relative max-w-full max-h-[75vh] flex items-center justify-center overflow-auto scrollbar-thin transition-all duration-300 ${
                isFullscreenZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsFullscreenZoomed(!isFullscreenZoomed)}
            >
              <img
                src={currentImageUrl}
                alt={productName}
                className={`max-h-[75vh] max-w-[85vw] object-contain rounded-2xl border border-white/10 shadow-2xl transition-transform duration-300 ${
                  isFullscreenZoomed ? 'scale-150' : 'scale-100'
                }`}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/placeholder-product.svg';
                }}
              />
            </div>

            {/* Next Button */}
            {images.length > 1 && (
              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-orange-500 border border-white/20 rounded-full flex items-center justify-center text-white transition-all z-20"
                title="Next Image"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {images.length > 1 && (
            <div
              className="flex justify-center items-center gap-2 sm:gap-3 py-2 z-20 overflow-x-auto max-w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => {
                const thumbUrl = img?.startsWith('//') ? `https:${img}` : img;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-neutral-900 border-2 transition-all p-1 flex-shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-orange-500 scale-105 ring-2 ring-orange-500/30'
                        : 'border-white/10 hover:border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/placeholder-product.svg';
                      }}
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
