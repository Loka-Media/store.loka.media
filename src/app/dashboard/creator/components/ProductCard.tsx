'use client';

import { 
  Edit,
  Trash2} from 'lucide-react';
import Image from 'next/image';


interface CreatorProduct {
  id: number;
  is_active: boolean;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
}

export default function ProductCard({ product }: { product: CreatorProduct }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors">
      <div className="aspect-square relative">
        <Image
          src={product.thumbnail_url || '/placeholder-product.png'}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">
            {formatPrice(product.min_price)}
            {product.max_price > product.min_price && (
              <span> - {formatPrice(product.max_price)}</span>
            )}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-gray-500">
            {product.variant_count} variants
          </span>
          <div className="flex space-x-2">
            <button className="text-indigo-600 hover:text-indigo-500">
              <Edit className="w-4 h-4" />
            </button>
            <button className="text-red-600 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}