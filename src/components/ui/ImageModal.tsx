'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    url: string;
    title?: string;
    placement: string;
    option?: string;
    option_group?: string;
    variant_ids?: number[];
  }>;
  initialIndex?: number;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  images,
  initialIndex = 0
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  // Reset zoom when switching images
  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex]);

  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
        case '+':
        case '=':
          setIsZoomed(true);
          break;
        case '-':
          setIsZoomed(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const downloadImage = () => {
    const currentImage = images[currentIndex];
    if (currentImage?.url) {
      const link = document.createElement('a');
      link.href = currentImage.url;
      link.download = `mockup-${currentImage.placement}-${currentImage.option || 'preview'}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative max-w-7xl max-h-full w-full h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-black bg-opacity-50 text-white">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">
              {currentImage.title || `${currentImage.placement} Preview`}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-300 mt-1">
              {currentImage.option_group && (
                <span className="bg-indigo-600 px-2 py-1 rounded text-xs">
                  {currentImage.option_group}
                </span>
              )}
              {currentImage.option && (
                <span className="bg-green-600 px-2 py-1 rounded text-xs">
                  {currentImage.option}
                </span>
              )}
              <span className="text-gray-400">
                {currentIndex + 1} of {images.length}
              </span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title={isZoomed ? 'Zoom Out (-)' : 'Zoom In (+)'}
            >
              {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
            
            <button
              onClick={downloadImage}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Download Image"
            >
              <Download className="w-5 h-5" />
            </button>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 relative flex items-center justify-center p-4">
          {/* Navigation Buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                title="Previous (←)"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all"
                title="Next (→)"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Main Image */}
          <div className={`relative transition-transform duration-300 ${isZoomed ? 'scale-150' : 'scale-100'}`}>
            <Image
              src={currentImage.url}
              alt={currentImage.title || `${currentImage.placement} mockup`}
              width={800}
              height={800}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              priority
            />
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="bg-black bg-opacity-50 p-4">
            <div className="flex justify-center space-x-2 overflow-x-auto">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                    index === currentIndex
                      ? 'border-indigo-500 ring-2 ring-indigo-300'
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt={`${image.placement} thumbnail`}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                  {index === currentIndex && (
                    <div className="absolute inset-0 bg-indigo-500 bg-opacity-20" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;