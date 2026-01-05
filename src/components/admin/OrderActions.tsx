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
  // Payment flow: paid → escrowed (auto-verified) → released (submitted to Printful)
  // Order status: pending → payment_received → processing → shipped → delivered

  // Verify Payment: Show when payment is received but not yet escrowed/verified
  const canVerifyPayment =
    (orderStatus === 'pending' || orderStatus === 'payment_received') &&
    paymentStatus === 'paid';

  // Release Payment: Show when payment is escrowed (verified) but not yet released to Printful
  // Can be in 'payment_received' or 'processing' status as long as payment is escrowed
  const canReleasePayment =
    (orderStatus === 'processing' || orderStatus === 'payment_received') &&
    paymentStatus === 'escrowed';

  // Mark as Processing: Show only after payment is released and order is processing
  const canMarkProcessing =
    paymentStatus === 'released' &&
    orderStatus === 'processing';

  // Mark as Shipped: Show when order is actively processing
  const canMarkShipped =
    orderStatus === 'processing' &&
    paymentStatus === 'released';

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {/* Verify Payment */}
        {canVerifyPayment && (
          <button
            onClick={onVerifyPayment}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-2 bg-amber-100 hover:bg-amber-200 border border-amber-200 text-amber-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full flex items-center justify-center px-4 py-2 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full flex items-center justify-center px-4 py-2 bg-orange-100 hover:bg-orange-200 border border-orange-200 text-orange-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-100 hover:bg-purple-200 border border-purple-200 text-purple-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark as Shipped
          </button>
        )}

        {/* No actions available */}
        {!canVerifyPayment && !canReleasePayment && !canMarkProcessing && !canMarkShipped && (
          <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-500">No pending actions for this order</p>
          </div>
        )}
      </div>
    </div>
  );
};
