import { Eye, Copy, Check, Image as ImageIcon } from 'lucide-react';
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
    order_items?: Array<{
      id?: number;
      product_name?: string;
      quantity?: number;
      price?: string;
      color?: string;
      size?: string;
      product_image?: string;
      image_url?: string;
    }>;
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
        return 'bg-red-100 border-red-200 text-red-700';
      case 'high':
        return 'bg-orange-100 border-orange-200 text-orange-700';
      case 'medium':
        return 'bg-amber-100 border-amber-200 text-amber-700';
      case 'low':
        return 'bg-green-100 border-green-200 text-green-700';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'printful':
        return 'bg-blue-100 border-blue-200 text-blue-700';
      case 'shopify':
        return 'bg-emerald-100 border-emerald-200 text-emerald-700';
      case 'mixed':
        return 'bg-purple-100 border-purple-200 text-purple-700';
      default:
        return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden hover:shadow-md hover:border-slate-300/60 transition-all duration-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-5 border-b border-slate-200">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                {order.order_number}
              </h3>
              <button
                onClick={copyOrderNumber}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                title="Copy order number"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-sm text-slate-600">
              {order.customer_name || 'Guest'} • {order.customer_email}
            </p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 mb-1">
              ${parseFloat(order.customer_payment_amount).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getTypeColor(order.order_type)}`}>
            {order.order_type.toUpperCase()}
          </span>
          {order.priority && (
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(order.priority)}`}>
              {order.priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="p-5 bg-white border-b border-slate-200">
        <OrderStatusPipeline
          orderStatus={order.order_status}
          paymentStatus={order.payment_status}
        />
      </div>

      {/* Products Section */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="px-5 py-4 border-b border-slate-200">
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Order Items</h4>
          <div className="grid grid-cols-2 gap-3">
            {order.order_items.slice(0, 2).map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-blue-50 p-3 rounded-lg border border-slate-200/60">
                <div className="flex gap-2 items-start">
                  {(item.product_image || item.image_url) ? (
                    <img
                      src={item.product_image || item.image_url}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-white border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 border border-slate-300">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Qty: {item.quantity || 1}
                    </p>
                    {item.size && (
                      <p className="text-xs text-slate-500">
                        Size: {item.size}
                      </p>
                    )}
                    {item.color && (
                      <p className="text-xs text-slate-500">
                        Color: {item.color}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-slate-900 mt-1">
                      ${parseFloat(item.price || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {order.order_items.length > 2 && (
              <div className="col-span-2 text-center py-2 bg-slate-50 rounded-lg border border-slate-200/60">
                <p className="text-xs font-medium text-slate-600">
                  +{order.order_items.length - 2} more item{order.order_items.length - 2 !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Quick Info */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/60 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-semibold">Order Status</div>
            <div className="text-sm font-bold text-slate-900 mt-1 capitalize">
              {order.order_status.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/60 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-semibold">Payment</div>
            <div className="text-sm font-bold text-slate-900 mt-1 capitalize">
              {order.payment_status.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="bg-gradient-to-br from-slate-50 to-blue-50 border border-slate-200/60 rounded-lg p-3">
            <div className="text-xs text-slate-600 font-semibold">Type</div>
            <div className="text-sm font-bold text-slate-900 mt-1 capitalize">
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
          className="w-full flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Full Details
        </button>
      </div>
    </div>
  );
};
