'use client';

import {
  Edit,
  Trash2
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { productAPI } from '@/lib/api';
import { Switch } from "@/components/ui/switch";
import { createProductSlug } from '@/lib/utils';

interface CreatorProduct {
  id: number;
  status?: string;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
}

export default function ProductCard({ product, onDelete }: { product: CreatorProduct, onDelete: (productId: number) => void }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<boolean | null>(null);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    onDelete(product.id);
    setIsDeleteDialogOpen(false);
  };

  const handleStatusChange = (status: boolean) => {
    setNewStatus(status);
    setShowStatusConfirmDialog(true);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    // Don't preventDefault - let the Link navigate
  };

  const confirmStatusChange = async () => {
    if (newStatus !== null) {
      try {
        await productAPI.updateProductStatus(product.id, newStatus);

        // Optionally, refresh the product data or show a success message
        console.log(`Product status updated to ${newStatus ? 'active' : 'inactive'}`);
        // You might want to trigger a re-fetch of the product list here
      } catch (error) {
        console.error('Error updating product status:', error);
        // Show an error message to the user
      } finally {
        setShowStatusConfirmDialog(false);
        setNewStatus(null);
      }
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <>
    <Link href={`/products/${createProductSlug(product.name, product.id)}`}>
      <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 group cursor-pointer hover:border-orange-500/50">
        <div className="w-full relative overflow-hidden rounded-t-xl" style={{ aspectRatio: '1/1' }}>
          <Image
            src={product.thumbnail_url || "/placeholder-product.png"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
              <Switch
                checked={product.status === "active"}
                onCheckedChange={handleStatusChange}
                id={`status-switch-${product.id}`}
              />
              <label
                htmlFor={`status-switch-${product.id}`}
                className="text-sm font-semibold text-white"
              >
                {product.status === "active" ? "Active" : "Inactive"}
              </label>
            </div>
          </div>
          
          {/* Action buttons overlay */}
          <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Link
              href={`/dashboard/creator/products/${product.id}/edit`}
              className="p-2 bg-gray-900/80 text-orange-400 hover:text-white hover:bg-orange-600 rounded-lg transition-colors backdrop-blur-sm"
              title="Edit Product"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4" />
            </Link>
            <button
              onClick={handleDelete}
              className="p-2 bg-gray-900/80 text-red-400 hover:text-white hover:bg-red-600 rounded-lg transition-colors backdrop-blur-sm"
              title="Delete Product"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-white truncate mb-1 group-hover:text-orange-300 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between mb-3">
            <span className="text-orange-400 font-semibold">
              {formatPrice(product.min_price)}
              {product.max_price > product.min_price && (
                <span> - {formatPrice(product.max_price)}</span>
              )}
            </span>
            <span className="text-sm text-gray-400 bg-gray-800/50 px-2 py-1 rounded-lg">
              {product.variant_count} variants
            </span>
          </div>
          <div className="text-xs text-gray-500 bg-gray-800/30 px-3 py-2 rounded-lg">
            Click to view full product details
          </div>
        </div>
      </div>
    </Link>
    <ConfirmationDialog
      isOpen={isDeleteDialogOpen}
      onClose={() => setIsDeleteDialogOpen(false)}
      onConfirm={confirmDelete}
      title="Are you sure?"
      description={`This will permanently delete the product "${product.name}". This action cannot be undone.`}
    />
    <ConfirmationDialog
      isOpen={showStatusConfirmDialog}
      onClose={() => setShowStatusConfirmDialog(false)}
      onConfirm={confirmStatusChange}
      title={`Confirm ${newStatus ? "Activation" : "Deactivation"}`}
      description={`Are you sure you want to ${
        newStatus ? "activate" : "deactivate"
      } this product?`}
    />
  </>
  );
}