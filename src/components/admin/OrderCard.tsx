import { Eye, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { OrderStatusPipeline } from './OrderStatusPipeline';
import { OrderActions } from './OrderActions';

interface OrderCardProps {
  order: {
    id: number;
    order_number: string;
    customer_name?: string;
    customer_email?: string;
    customer_payment_amount: string;
    order_status: string;
    payment_status: string;
    order_type: string;
    created_at: string;
    priority?: string;
  };
  onViewDetails: (order: any) => void;
  onVerifyPayment: (order: any) => void;
  onReleasePayment: (order: any) => void;
  loading?: boolean;
}

export const OrderCard = ({
  order,
  onViewDetails,
  onVerifyPayment,
  onReleasePayment,
  loading = false
}: OrderCardProps) => {
  const [copied, setCopied] = useState(false);

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-900/30 border-red-700 text-red-300';
      case 'high':
        return 'bg-orange-900/30 border-orange-700 text-orange-300';
      case 'medium':
        return 'bg-yellow-900/30 border-yellow-700 text-yellow-300';
      case 'low':
        return 'bg-green-900/30 border-green-700 text-green-300';
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-300';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'printful':
        return 'bg-blue-900/30 border-blue-700 text-blue-300';
      case 'shopify':
        return 'bg-green-900/30 border-green-700 text-green-300';
      case 'mixed':
        return 'bg-purple-900/30 border-purple-700 text-purple-300';
      default:
        return 'bg-gray-800/50 border-gray-700 text-gray-300';
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden hover:border-gray-600 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-white">
                {order.order_number}
              </h3>
              <button
                onClick={copyOrderNumber}
                className="text-gray-400 hover:text-gray-200 transition-colors"
                title="Copy order number"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-sm text-gray-400">
              {order.customer_name || 'Guest'} • {order.customer_email}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white mb-1">
              ${parseFloat(order.customer_payment_amount).toFixed(2)}
            </div>
            <p className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getTypeColor(order.order_type)}`}>
            {order.order_type.toUpperCase()}
          </span>
          {order.priority && (
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(order.priority)}`}>
              {order.priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="p-4 bg-gray-800/30 border-b border-gray-700">
        <OrderStatusPipeline
          orderStatus={order.order_status}
          paymentStatus={order.payment_status}
        />
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
            <div className="text-xs text-gray-400 font-medium">Order Status</div>
            <div className="text-sm font-semibold text-white mt-1">
              {order.order_status.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
            <div className="text-xs text-gray-400 font-medium">Payment</div>
            <div className="text-sm font-semibold text-white mt-1">
              {order.payment_status.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded p-3">
            <div className="text-xs text-gray-400 font-medium">Type</div>
            <div className="text-sm font-semibold text-white mt-1">
              {order.order_type}
            </div>
          </div>
        </div>

        {/* Actions */}
        <OrderActions
          orderStatus={order.order_status}
          paymentStatus={order.payment_status}
          onVerifyPayment={() => onVerifyPayment(order)}
          onReleasePayment={() => onReleasePayment(order)}
          loading={loading}
        />

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails(order)}
          className="w-full flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Full Details
        </button>
      </div>
    </div>
  );
};
