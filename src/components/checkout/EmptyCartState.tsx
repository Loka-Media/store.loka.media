import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export const EmptyCartState = () => {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-white">Your cart is empty</h3>
        <p className="mt-1 text-sm text-gray-400">Start adding some products to your cart!</p>
        <div className="mt-6">
          <Link href="/products" className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-orange-500 hover:bg-orange-600">
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};