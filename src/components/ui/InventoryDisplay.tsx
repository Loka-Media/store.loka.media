'use client';

import React from 'react';
import { Package, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface InventoryVariant {
  id: number;
  title: string;
  source: 'printful' | 'shopify';
  display_quantity: number;
  is_available: boolean;
  printful_in_stock?: boolean;
  inventory_quantity?: number;
  printful_last_sync?: string;
  updated_at?: string;
}

interface InventoryDisplayProps {
  variants: InventoryVariant[];
  productName: string;
  source: 'printful' | 'shopify';
  className?: string;
  showDetails?: boolean;
}

const InventoryDisplay: React.FC<InventoryDisplayProps> = ({
  variants,
  productName,
  source,
  className = '',
  showDetails = false
}) => {
  const totalQuantity = variants.reduce((sum, variant) => sum + variant.display_quantity, 0);
  const availableVariants = variants.filter(variant => variant.is_available);
  const lastSync = variants.reduce((latest, variant) => {
    const syncTime = source === 'printful' ? variant.printful_last_sync : variant.updated_at;
    if (!syncTime) return latest;
    return !latest || syncTime > latest ? syncTime : latest;
  }, null as string | null);

  const getStockStatus = () => {
    if (availableVariants.length === 0) {
      return { status: 'out_of_stock', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle };
    } else if (source === 'printful') {
      return { status: 'in_stock', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    } else if (totalQuantity > 20) {
      return { status: 'high_stock', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    } else if (totalQuantity > 5) {
      return { status: 'medium_stock', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: AlertTriangle };
    } else {
      return { status: 'low_stock', color: 'text-orange-600', bgColor: 'bg-orange-50', icon: AlertTriangle };
    }
  };

  const stockInfo = getStockStatus();
  const StatusIcon = stockInfo.icon;

  const formatLastSync = (syncTime: string | null) => {
    if (!syncTime) return 'Never';
    const date = new Date(syncTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getQuantityDisplay = () => {
    if (source === 'printful') {
      return availableVariants.length > 0 ? 'In Stock' : 'Out of Stock';
    } else {
      if (totalQuantity === 0) return 'Out of Stock';
      if (totalQuantity > 999) return '999+';
      return totalQuantity.toString();
    }
  };

  return (
    <div className={`rounded-lg border p-4 ${stockInfo.bgColor} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Package className="w-5 h-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Inventory Status</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${stockInfo.color} bg-white`}>
            {source.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <StatusIcon className={`w-4 h-4 ${stockInfo.color}`} />
          <span className={`text-sm font-medium ${stockInfo.color}`}>
            {getQuantityDisplay()}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        <div>
          <div className="text-xs text-gray-500">Total Variants</div>
          <div className="font-medium">{variants.length}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Available</div>
          <div className="font-medium text-green-600">{availableVariants.length}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Last Sync</div>
          <div className="font-medium text-blue-600 text-xs">{formatLastSync(lastSync)}</div>
        </div>
      </div>

      {/* Details */}
      {showDetails && variants.length > 0 && (
        <div className="border-t pt-3 mt-3">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Variant Details</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {variants.map((variant) => (
                <div key={variant.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate max-w-[60%]">
                    {variant.title || `Variant ${variant.id}`}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className={variant.is_available ? 'text-green-600' : 'text-red-600'}>
                      {source === 'printful' 
                        ? (variant.is_available ? 'In Stock' : 'Out')
                        : variant.display_quantity
                      }
                    </span>
                    {variant.is_available ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sync Info */}
      {lastSync && (
        <div className="border-t pt-2 mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Last synced {formatLastSync(lastSync)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3" />
              <span>Auto-sync active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDisplay;