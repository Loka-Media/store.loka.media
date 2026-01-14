'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface UnavailableItem {
  name: string;
  variant_id: number;
  reason: string;
}

interface InventoryErrorDialogProps {
  unavailableItems: UnavailableItem[];
  onClose: () => void;
  onRemoveItems?: (variantIds: number[]) => Promise<void>;
}

export default function InventoryErrorDialog({
  unavailableItems,
  onClose,
  onRemoveItems
}: InventoryErrorDialogProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (unavailableItems.length > 0) {
      setShowDialog(true);
    }
  }, [unavailableItems]);

  const handleRemoveItems = async () => {
    if (!onRemoveItems) return;

    setIsRemoving(true);
    try {
      const variantIds = unavailableItems.map(item => item.variant_id);
      await onRemoveItems(variantIds);
      setShowDialog(false);
      onClose();
    } catch (error) {
      console.error('Failed to remove items:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleClose = () => {
    setShowDialog(false);
    onClose();
  };

  if (!showDialog) return null;

  const getReasonIcon = (reason: string) => {
    if (reason.includes('discontinued')) {
      return '🚫';
    } else if (reason.includes('out of stock')) {
      return '📦';
    } else if (reason.includes('region')) {
      return '🌍';
    }
    return '⚠️';
  };

  const getReasonColor = (reason: string) => {
    if (reason.includes('discontinued')) {
      return 'text-red-600 bg-red-50';
    } else if (reason.includes('out of stock')) {
      return 'text-orange-600 bg-orange-50';
    } else if (reason.includes('region')) {
      return 'text-blue-600 bg-blue-50';
    }
    return 'text-yellow-600 bg-yellow-50';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-red-900">
                Items Unavailable
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-red-600 hover:text-red-800 transition-colors"
              aria-label="Close dialog"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            <p className="text-gray-700 mb-4">
              The following {unavailableItems.length === 1 ? 'item is' : 'items are'} no longer available and cannot be included in your order:
            </p>

            <div className="space-y-3">
              {unavailableItems.map((item, index) => (
                <div
                  key={`${item.variant_id}-${index}`}
                  className={`border rounded-lg p-4 ${getReasonColor(item.reason)}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl flex-shrink-0">
                      {getReasonIcon(item.reason)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {item.name}
                      </p>
                      <p className="text-sm mt-1 capitalize">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>What to do next:</strong> Please remove these items from your cart to continue with your order. You can browse our catalog for similar available products.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Review Cart
            </button>
            {onRemoveItems && (
              <button
                onClick={handleRemoveItems}
                disabled={isRemoving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRemoving ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Removing...</span>
                  </span>
                ) : (
                  'Remove Items'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
