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
  loading?: boolean;
}

export const OrderCard = ({
  order,
  onViewDetails,
  onVerifyPayment,
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
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'high':
        return 'bg-orange-500/10 border-orange-500/20 text-orange-400';
      case 'medium':
        return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'low':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      default:
        return 'bg-neutral-800 border-white/5 text-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'printful':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      case 'shopify':
        return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'mixed':
        return 'bg-purple-500/10 border-purple-500/20 text-purple-400';
      default:
        return 'bg-neutral-800 border-white/5 text-gray-400';
    }
  };

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden hover:shadow-[0_20px_50px_rgba(255,109,31,0.15)] hover:border-white/20 transition-all duration-200">
      {/* Header */}
      <div className="bg-[#141414] p-5 border-b border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-white">
                {order.order_number}
              </h3>
              <button
                onClick={copyOrderNumber}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                title="Copy order number"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
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
            <p className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getTypeColor(order.order_type)}`}>
            {order?.order_type?.toUpperCase()}
          </span>
          {order.priority && (
            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(order.priority)}`}>
              {order.priority.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Status Pipeline */}
      <div className="p-5 bg-black border-b border-white/10">
        <OrderStatusPipeline
          orderStatus={order.order_status}
          paymentStatus={order.payment_status}
        />
      </div>

      {/* Products Section */}
      {order.order_items && order.order_items.length > 0 && (
        <div className="px-5 py-4 border-b border-white/10">
          <h4 className="text-sm font-semibold text-white mb-3">Order Items</h4>
          <div className="grid grid-cols-2 gap-3">
            {order.order_items.slice(0, 2).map((item, idx) => (
              <div key={idx} className="bg-neutral-950 p-3 rounded-lg border border-white/5">
                <div className="flex gap-2 items-start">
                  {(item.product_image || item.image_url) ? (
                    <img
                      src={item.product_image || item.image_url}
                      alt={item.product_name}
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-neutral-900 border border-white/10"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-neutral-900 flex items-center justify-center flex-shrink-0 border border-white/10">
                      <ImageIcon className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Qty: {item.quantity || 1}
                    </p>
                    {item.size && (
                      <p className="text-[10px] text-gray-500">
                        Size: {item.size}
                      </p>
                    )}
                    {item.color && (
                      <p className="text-[10px] text-gray-500">
                        Color: {item.color}
                      </p>
                    )}
                    <p className="text-xs font-semibold text-[#FF6D1F] mt-1">
                      ${parseFloat(item.price || '0').toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {order.order_items.length > 2 && (
              <div className="col-span-2 text-center py-2 bg-neutral-950 rounded-lg border border-white/5">
                <p className="text-xs font-medium text-gray-400">
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
          <div className="bg-neutral-950 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Order Status</div>
            <div className="text-sm font-bold text-white mt-1 capitalize truncate">
              {order?.order_status?.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="bg-neutral-950 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Payment</div>
            <div className="text-sm font-bold text-white mt-1 capitalize truncate">
              {order?.payment_status?.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="bg-neutral-950 border border-white/5 rounded-lg p-3">
            <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Type</div>
            <div className="text-sm font-bold text-white mt-1 capitalize truncate">
              {order?.order_type?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Actions */}
        <OrderActions
          orderStatus={order.order_status}
          paymentStatus={order.payment_status}
          onVerifyPayment={() => onVerifyPayment(order)}
          loading={loading}
        />

        {/* View Details Button */}
        <button
          onClick={() => onViewDetails(order)}
          className="w-full flex items-center justify-center px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white text-sm font-medium rounded-lg transition-all"
        >
          <Eye className="w-4 h-4 mr-2" />
          View Full Details
        </button>
      </div>
    </div>
  );
};
