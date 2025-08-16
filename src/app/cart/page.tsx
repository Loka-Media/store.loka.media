'use client';

import { useState, useEffect } from 'react';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/api';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  
  // Use appropriate cart context based on authentication
  const guestCart = useGuestCart();
  const authCart = useCart();
  
  // Select the appropriate cart based on authentication status
  const currentCart = isAuthenticated ? authCart : guestCart;
  const { items, summary, loading, updateCartItem, removeFromCart, clearCart, refreshCart } = currentCart;
  
  const [updatingItems, setUpdatingItems] = useState<Set<number>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    itemId: number | null;
    productName: string;
  }>({
    show: false,
    itemId: null,
    productName: ''
  });

  // Only refresh cart on initial mount (contexts handle the rest)
  useEffect(() => {
    // The contexts already handle refreshing on auth changes and visibility
    // Only do an initial refresh if the cart appears empty but we expect data
    if (items.length === 0 && !loading) {
      refreshCart();
    }
  }, []); // Empty dependency array - only run on mount

  // Function to get the actual color code for display
  const getColorCode = (colorName: string | null | undefined, colorCode?: string) => {
    const colorMap: { [key: string]: string } = {
      'charcoal': '#36454F',
      'black': '#000000',
      'white': '#FFFFFF',
      'navy': '#000080',
      'gray': '#808080',
      'grey': '#808080',
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'maroon': '#800000',
      'olive': '#808000',
      'lime': '#00FF00',
      'aqua': '#00FFFF',
      'teal': '#008080',
      'silver': '#C0C0C0',
      'fuchsia': '#FF00FF'
    };
    
    // Handle null, undefined, or empty color names
    if (!colorName || typeof colorName !== 'string') {
      return colorCode || '#808080';
    }
    
    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || colorCode || '#808080';
  };

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 10) return;
    
    setUpdatingItems(prev => new Set(prev).add(cartItemId));
    await updateCartItem(cartItemId, newQuantity);
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(cartItemId);
      return newSet;
    });
  };

  const handleRemoveItem = (cartItemId: number, productName: string) => {
    setDeleteConfirm({
      show: true,
      itemId: cartItemId,
      productName: productName
    });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.itemId) return;
    
    setUpdatingItems(prev => new Set(prev).add(deleteConfirm.itemId!));
    await removeFromCart(deleteConfirm.itemId);
    setUpdatingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(deleteConfirm.itemId!);
      return newSet;
    });
    
    setDeleteConfirm({ show: false, itemId: null, productName: '' });
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, itemId: null, productName: '' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Shopping Cart</h1>
            <p className="text-gray-400 mt-1">
              {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">Your cart is empty</h3>
            <p className="mt-1 text-sm text-gray-400">Start adding some products to your cart!</p>
            <div className="mt-6">
              <Link
                href="/products"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-black bg-orange-500 hover:bg-orange-600"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
            {/* Cart Items */}
            <div className="lg:col-span-7">
              <div className="bg-gray-900 shadow-sm rounded-lg border border-gray-800">
                <div className="px-4 py-6 sm:px-6">
                  <div className="flow-root">
                    <ul className="-my-6 divide-y divide-gray-800">
                      {items.map((item) => (
                        <li key={item.id} className="py-6 flex">
                          <div className="flex-shrink-0 w-24 h-24 border border-gray-700 rounded-md overflow-hidden">
                            <Image
                              src={item.image_url || item.thumbnail_url || '/placeholder-product.svg'}
                              alt={item.product_name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                              unoptimized={true}
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.svg';
                              }}
                            />
                          </div>

                          <div className="ml-4 flex-1 flex flex-col">
                            <div>
                              <div className="flex justify-between text-base font-medium text-white">
                                <h3>{item.product_name}</h3>
                                <p className="ml-4">{formatPrice(item.total_price)}</p>
                              </div>
                              <p className="mt-1 text-sm text-gray-400">
                                by {item.creator_name}
                              </p>
                              <div className="mt-1 text-sm text-gray-400 flex items-center space-x-4">
                                <span>Size: {item.size}</span>
                                <span className="flex items-center">
                                  Color: 
                                  <span 
                                    className="ml-1 w-4 h-4 rounded-full border border-gray-600"
                                    style={{ backgroundColor: getColorCode(item.color, item.color_code) }}
                                  ></span>
                                  <span className="ml-1">{item.color || 'Default'}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 flex items-end justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400">Qty:</span>
                                <div className="flex items-center border border-gray-600 rounded-md bg-gray-800">
                                  <button
                                    type="button"
                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-2 py-1 text-white min-w-[2rem] text-center">
                                    {updatingItems.has(item.id) ? '...' : item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-50"
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= 10 || updatingItems.has(item.id)}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex">
                                <button
                                  type="button"
                                  className="font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                                  onClick={() => handleRemoveItem(item.id, item.product_name)}
                                  disabled={updatingItems.has(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Clear Cart Button */}
                {items.length > 0 && (
                  <div className="border-t border-gray-800 px-4 py-6 sm:px-6">
                    <button
                      type="button"
                      className="text-sm text-red-400 hover:text-red-300 font-medium"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear your cart?')) {
                          clearCart();
                        }
                      }}
                    >
                      Clear Cart
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-8 lg:mt-0 lg:col-span-5">
              <div className="bg-gray-900 shadow-sm rounded-lg border border-gray-800">
                <div className="px-4 py-6 sm:px-6">
                  <h2 className="text-lg font-medium text-white">Order Summary</h2>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <dt className="text-sm text-gray-400">Subtotal</dt>
                      <dd className="text-sm font-medium text-white">{formatPrice(summary.subtotal)}</dd>
                    </div>
                    <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
                      <dt className="text-base font-medium text-white">Order total</dt>
                      <dd className="text-base font-medium text-orange-500">{formatPrice(summary.subtotal)}</dd>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href="/checkout-unified"
                      className="w-full bg-orange-500 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-black hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 flex items-center justify-center"
                    >
                      Proceed to Checkout
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </div>

                  <div className="mt-6 flex justify-center text-sm text-center text-gray-400">
                    <p>
                      or{' '}
                      <Link
                        href="/products"
                        className="text-orange-500 font-medium hover:text-orange-400"
                      >
                        Continue Shopping
                        <span aria-hidden="true"> &rarr;</span>
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simple MUI Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirm.show} 
        onClose={cancelDelete}
        slotProps={{
          paper: {
            style: {
              backgroundColor: '#1f2937',
              color: 'white',
              border: '1px solid #374151'
            }
          },
          backdrop: {
            style: {
              backgroundColor: 'rgba(0, 0, 0, 0.1)'
            }
          }
        }}
      >
        <DialogTitle style={{ color: 'white' }}>
          Remove Item
        </DialogTitle>
        <DialogContent>
          <p style={{ color: '#d1d5db' }}>
            Are you sure you want to remove &quot;{deleteConfirm.productName}&quot; from your cart?
          </p>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={cancelDelete} 
            style={{ color: '#9ca3af' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            style={{ color: '#ef4444' }}
            autoFocus
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}