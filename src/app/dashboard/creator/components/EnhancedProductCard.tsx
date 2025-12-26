'use client';

import {
  Edit,
  Trash2,
  ExternalLink
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
  is_active?: boolean;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
}

export default function EnhancedProductCard({ product, onDelete }: { product: CreatorProduct, onDelete: (productId: number) => void }) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [showStatusConfirmDialog, setShowStatusConfirmDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<boolean | null>(null);
  const [localStatus, setLocalStatus] = useState(product.status === "active" || product.is_active);

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
    e.stopPropagation();
  };

  const confirmStatusChange = async () => {
    if (newStatus !== null) {
      try {
        await productAPI.updateProductStatus(product.id, newStatus);
        setLocalStatus(newStatus);
      } catch (error) {
        console.error('Error updating product status:', error);
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
        <div className="gradient-border-white-top overflow-hidden group cursor-pointer flex flex-col h-full hover:shadow-[0_20px_60px_rgba(255,99,71,0.3)] transition-all duration-300">
          {/* Image Container */}
          <div className="w-full relative overflow-hidden bg-gradient-to-br from-gray-800 to-black" style={{ aspectRatio: '1/1' }}>
            <Image
              src={product.thumbnail_url || "/placeholder-product.png"}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />

            {/* Status badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                localStatus
                  ? 'bg-green-500/20 border border-green-500 text-green-400'
                  : 'bg-gray-500/20 border border-gray-500 text-gray-400'
              }`}>
                {localStatus ? '✓ Active' : 'Inactive'}
              </span>
            </div>

            {/* Action buttons overlay */}
            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
              <Link
                href={`/products/${createProductSlug(product.name, product.id)}`}
                target="_blank"
                className="p-2.5 bg-black/60 hover:bg-orange-500 border border-white/20 text-white rounded-lg transition-all duration-300"
                title="View Product"
                onClick={handleEdit}
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href={`/dashboard/creator/products/${product.id}/edit`}
                className="p-2.5 bg-black/60 hover:bg-blue-500 border border-white/20 text-white rounded-lg transition-all duration-300"
                title="Edit Product"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2.5 bg-black/60 hover:bg-red-500 border border-white/20 text-white rounded-lg transition-all duration-300"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Status toggle at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={localStatus}
                  onCheckedChange={handleStatusChange}
                  id={`status-switch-${product.id}`}
                />
                <label
                  htmlFor={`status-switch-${product.id}`}
                  className="text-sm font-bold text-white"
                >
                  {localStatus ? "Active" : "Inactive"}
                </label>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 sm:p-6 flex flex-col flex-1 bg-black">
            <h3 className="font-extrabold text-sm text-white truncate mb-2 group-hover:text-orange-400 transition-colors line-clamp-2 tracking-tight">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <span className="text-sm sm:text-base font-bold text-cyan-400">
                {formatPrice(product.min_price)}
                {product.max_price > product.min_price && (
                  <span className="text-xs text-gray-400 font-normal ml-1">- {formatPrice(product.max_price)}</span>
                )}
              </span>
              <span className="text-xs font-bold bg-purple-500/20 border border-purple-500 text-purple-400 px-2.5 py-1 rounded-full">
                {product.variant_count} variants
              </span>
            </div>
            <div className="text-xs font-medium text-gray-400 text-center mt-auto">
              Click to view product
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
