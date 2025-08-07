
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProductImageGalleryProps {
  productName: string;
  images: string[];
}

export function ProductImageGallery({ productName, images }: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: productName,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
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
    <div className="relative group">
      <div className="aspect-square overflow-hidden rounded-lg bg-black border border-gray-800 relative">
        <Image
          src={images[selectedImageIndex]}
          alt={productName}
          width={600}
          height={600}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
          onError={(e) => {
            e.currentTarget.src = '/placeholder-product.svg';
          }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-300 opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
        <button
          onClick={handleShare}
          className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-300"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>
      {images.length > 1 && (
        <div className="mt-4 grid grid-cols-5 gap-4">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImageIndex(index)}
              className={`aspect-square rounded-md overflow-hidden border-2 transition-all duration-300 ${
                selectedImageIndex === index
                  ? 'border-orange-500'
                  : 'border-gray-800 hover:border-gray-600'
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
  );
}
