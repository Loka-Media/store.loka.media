import Link from 'next/link';

interface CheckoutCompleteProps {
  orderData: { orderNumber: string } | null;
  wantsToSignup: boolean;
  calculateTotal: () => number;
}

export const CheckoutComplete = ({ 
  orderData, 
  wantsToSignup, 
  calculateTotal 
}: CheckoutCompleteProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center bg-gray-900 border border-gray-800 shadow-sm rounded-lg p-8 max-w-md">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-300 mb-4">Thank you for your order. We&apos;ve received your payment and will process your order shortly.</p>
        
        {wantsToSignup && (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 mb-6">
            <p className="text-green-400 text-sm">
              <strong>Account Created!</strong> Your account has been set up with your shipping information saved.
            </p>
          </div>
        )}
        
        {orderData && (
          <div className="bg-gray-800 rounded-lg p-4 mb-6 text-left">
            <p className="text-gray-300"><strong className="text-white">Order Number:</strong> {orderData.orderNumber}</p>
            <p className="text-gray-300"><strong className="text-white">Total:</strong> ${calculateTotal().toFixed(2)}</p>
            <p className="text-gray-300"><strong className="text-white">Status:</strong> Payment Received</p>
          </div>
        )}

        <div className="space-y-3">
          <Link href="/products" className="block w-full bg-orange-500 text-black py-3 px-4 rounded-md hover:bg-orange-600">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};