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
        <div className="relative bg-white border-4 border-black rounded-2xl overflow-hidden shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300 group cursor-pointer">
          <div className="w-full relative overflow-hidden" style={{ aspectRatio: '1/1' }}>
            <Image
              src={product.thumbnail_url || "/placeholder-product.png"}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />

            {/* Status badge */}
            <div className="absolute top-3 left-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border-2 border-black ${
                localStatus
                  ? 'bg-green-300 text-black'
                  : 'bg-gray-300 text-black'
              }`}>
                {localStatus ? '✓ Active' : 'Inactive'}
              </span>
            </div>

            {/* Action buttons overlay */}
            <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Link
                href={`/products/${createProductSlug(product.name, product.id)}`}
                target="_blank"
                className="p-2 bg-white border-2 border-black text-black hover:bg-yellow-200 rounded-lg transition-colors"
                title="View Product"
                onClick={handleEdit}
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href={`/dashboard/creator/products/${product.id}/edit`}
                className="p-2 bg-white border-2 border-black text-black hover:bg-blue-200 rounded-lg transition-colors"
                title="Edit Product"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={handleDelete}
                className="p-2 bg-white border-2 border-black text-black hover:bg-red-200 rounded-lg transition-colors"
                title="Delete Product"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Status toggle at bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={localStatus}
                  onCheckedChange={handleStatusChange}
                  id={`status-switch-${product.id}`}
                />
                <label
                  htmlFor={`status-switch-${product.id}`}
                  className="text-sm font-extrabold text-white"
                >
                  {localStatus ? "Active" : "Inactive"}
                </label>
              </div>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-yellow-50 to-pink-50">
            <h3 className="font-extrabold text-lg text-black truncate mb-2 group-hover:text-purple-600 transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center justify-between mb-3">
              <span className="text-black font-extrabold text-xl">
                {formatPrice(product.min_price)}
                {product.max_price > product.min_price && (
                  <span className="text-sm"> - {formatPrice(product.max_price)}</span>
                )}
              </span>
              <span className="text-xs font-extrabold bg-purple-200 border-2 border-black text-black px-3 py-1 rounded-full">
                {product.variant_count} variants
              </span>
            </div>
            <div className="text-xs font-bold text-gray-700 bg-white border-2 border-black px-3 py-2 rounded-lg text-center">
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
