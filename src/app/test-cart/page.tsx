'use client';

import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';

export default function TestCartPage() {
  const { items, summary, addToCart, clearCart } = useGuestCart();
  const { isAuthenticated } = useAuth();

  const handleTestAddToCart = async () => {
    await addToCart(12345, 1);
  };

  const handleTestAddToCart2 = async () => {
    await addToCart(67890, 2);
  };

  const checkLocalStorage = () => {
    const guestCart = localStorage.getItem('guestCart');
    console.log('Guest cart in localStorage:', guestCart);
    if (guestCart) {
      console.log('Parsed cart:', JSON.parse(guestCart));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Guest Cart Test</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Auth Status</h2>
          <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Cart Summary</h2>
          <p>Items in cart: {items.length}</p>
          <p>Total quantity: {summary.itemCount}</p>
          <p>Subtotal: ${summary.subtotal}</p>
          <p>Total: ${summary.total}</p>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Cart Items</h2>
          {items.map((item, index) => (
            <div key={item.id} className="border-b py-2">
              <p>Item {index + 1}: {item.product_name}</p>
              <p>Quantity: {item.quantity}, Price: ${item.price}</p>
              <p>Variant ID: {item.variant_id}</p>
            </div>
          ))}
          {items.length === 0 && <p>No items in cart</p>}
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <button 
              onClick={handleTestAddToCart}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Add Test Item 1 (Variant 12345)
            </button>
            <button 
              onClick={handleTestAddToCart2}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Add Test Item 2 (Variant 67890, Qty 2)
            </button>
            <button 
              onClick={clearCart}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Clear Cart
            </button>
            <button 
              onClick={checkLocalStorage}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Check localStorage (console)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}