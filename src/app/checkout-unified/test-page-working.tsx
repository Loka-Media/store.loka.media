'use client';

import { useGuestCart } from '@/contexts/GuestCartContext';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';

export default function TestCheckoutPage() {
  const { items, summary } = useGuestCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
          <p className="mt-1 text-sm text-gray-500">Start adding some products to your cart!</p>
          <div className="mt-6">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Test Checkout</h1>
        
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{item.product_name}</p>
                  <p className="text-sm text-gray-500">
                    {item.size} • {item.color} • Qty: {item.quantity}
                  </p>
                </div>
                <p className="font-medium">${item.total_price}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="flex justify-between">
              <p className="text-base font-medium">Total</p>
              <p className="text-base font-medium">${summary.total}</p>
            </div>
          </div>
          
          <div className="mt-6">
            <button className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700">
              Test Checkout Works!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}