import { ShoppingCart } from 'lucide-react';
import { CartMergeData } from '@/lib/checkout-types';

interface CartMergeDialogProps {
  cartMergeData: CartMergeData;
  loading: boolean;
  onMergeConfirm: () => void;
  onMergeCancel: () => void;
}

export const CartMergeDialog = ({ 
  cartMergeData, 
  loading, 
  onMergeConfirm, 
  onMergeCancel 
}: CartMergeDialogProps) => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-4">Cart Items Found!</h2>
          
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300 mb-2">
              <strong>Your account has {cartMergeData.userCartCount} saved items</strong>
            </p>
            <p className="text-sm text-gray-300 mb-2">
              <strong>Guest cart has {cartMergeData.guestCartCount} items</strong>
            </p>
            <p className="text-sm text-gray-400">
              Would you like to merge both carts together?
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={onMergeConfirm}
              disabled={loading}
              className="w-full bg-orange-500 text-black py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {loading ? 'Merging...' : `Yes, Merge All ${cartMergeData.userCartCount + cartMergeData.guestCartCount} Items`}
            </button>
            
            <button
              onClick={onMergeCancel}
              disabled={loading}
              className="w-full bg-gray-700 text-gray-300 py-3 px-4 rounded-md hover:bg-gray-600 disabled:opacity-50"
            >
              No, Use Only My Saved Cart ({cartMergeData.userCartCount} items)
            </button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            Merging will add guest items to your saved cart.
          </p>
        </div>
      </div>
    </div>
  );
};