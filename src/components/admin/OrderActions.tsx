import { CheckCircle, Send, AlertCircle, Printer } from 'lucide-react';

interface OrderActionsProps {
  orderStatus: string;
  paymentStatus: string;
  onVerifyPayment: () => void;
  onReleasePayment: () => void;
  onMarkProcessing?: () => void;
  onMarkShipped?: () => void;
  loading?: boolean;
}

export const OrderActions = ({
  orderStatus,
  paymentStatus,
  onVerifyPayment,
  onReleasePayment,
  onMarkProcessing,
  onMarkShipped,
  loading = false
}: OrderActionsProps) => {
  // Action availability based on current order and payment status
  // Orders flow: pending → payment_received → verified → processing → fulfilled → delivered

  // Verify Payment: Show when payment is received but not yet verified
  const canVerifyPayment =
    (orderStatus === 'pending' || orderStatus === 'payment_received') &&
    paymentStatus !== 'verified' &&
    paymentStatus !== 'released';

  // Release Payment: Show when order is verified or payment is confirmed, ready to go to Printful
  const canReleasePayment =
    (orderStatus === 'verified' || orderStatus === 'payment_received') &&
    paymentStatus !== 'released' &&
    paymentStatus !== 'completed';

  // Mark as Processing: Show only after payment is released
  const canMarkProcessing =
    paymentStatus === 'released' &&
    orderStatus !== 'processing' &&
    orderStatus !== 'fulfilled';

  // Mark as Shipped: Show when order is actively processing
  const canMarkShipped =
    orderStatus === 'processing' &&
    paymentStatus === 'released';

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white mb-3">Fulfillment Actions</h4>

      <div className="grid grid-cols-1 gap-2">
        {/* Verify Payment */}
        {canVerifyPayment && (
          <button
            onClick={onVerifyPayment}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-600/50 text-yellow-300 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Verify Payment
          </button>
        )}

        {/* Release Payment */}
        {canReleasePayment && (
          <button
            onClick={onReleasePayment}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 text-green-300 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 mr-2" />
            Release Payment & Submit to Printful
          </button>
        )}

        {/* Mark as Processing */}
        {canMarkProcessing && onMarkProcessing && (
          <button
            onClick={onMarkProcessing}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/50 text-orange-300 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Printer className="w-4 h-4 mr-2" />
            Mark as Processing
          </button>
        )}

        {/* Mark as Shipped */}
        {canMarkShipped && onMarkShipped && (
          <button
            onClick={onMarkShipped}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 text-purple-300 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Shipped
          </button>
        )}

        {/* No actions available */}
        {!canVerifyPayment && !canReleasePayment && !canMarkProcessing && !canMarkShipped && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-md p-3 text-center">
            <p className="text-xs text-gray-400">No pending actions for this order</p>
          </div>
        )}
      </div>
    </div>
  );
};
