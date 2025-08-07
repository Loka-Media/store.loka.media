'use client';

import {
  Edit,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';


interface CreatorProduct {
  id: number;
  is_active: boolean;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
}

export default function ProductCard({ product, onDelete }: { product: CreatorProduct, onDelete: (productId: number) => void }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(product.id);
    setIsDeleteDialogOpen(false);
  };
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group">
      <div className="aspect-square relative overflow-hidden rounded-t-xl">
        <Image
          src={product.thumbnail_url || '/placeholder-product.png'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            product.is_active ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
          }`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-white truncate mb-1">{product.name}</h3>
        <div className="flex items-center justify-between">
          <span className="text-orange-400 font-semibold">
            {formatPrice(product.min_price)}
            {product.max_price > product.min_price && (
              <span> - {formatPrice(product.max_price)}</span>
            )}
          </span>
          <span className="text-sm text-gray-400">
            {product.variant_count} variants
          </span>
        </div>
        <div className="flex justify-end items-center mt-4 space-x-3">
          <button className="p-2 rounded-full bg-gray-800 text-orange-400 hover:bg-orange-600 hover:text-white transition-colors duration-200" title="Edit Product">
            <Edit className="w-5 h-5" />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-full bg-gray-800 text-red-400 hover:bg-red-600 hover:text-white transition-colors duration-200" title="Delete Product">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Are you sure?"
        description={`This will permanently delete the product "${product.name}". This action cannot be undone.`}
      />
    </div>
  );
}