'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/api';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button as MuiButton } from '@mui/material';
import { Button } from '@/components/ui/button';
import GradientTitle from '@/components/ui/GradientTitle';

export default function CartPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  
  // Use GuestCart for both authenticated and guest users (handles both cases)
  const { items, summary, loading, updateCartItem, removeFromCart, clearCart, refreshCart } = useGuestCart();
  
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

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowLoginPrompt(true);
    }
  }, [isAuthenticated, authLoading]);

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Show login prompt if user is not authenticated
  if (showLoginPrompt) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl inline-flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Sign In to Continue</h2>
          <p className="text-gray-400 font-medium mb-8">Please log in to access your cart and complete your purchase.</p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push('/auth/login')}
              variant="primary"
              className="w-full"
            >
              Sign In
            </Button>
            <Button
              onClick={() => router.push('/products')}
              variant="secondary"
              className="w-full"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <GradientTitle text="Shopping Cart" size="sm" />
            <p className="text-gray-400 font-medium mt-2">
              {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-lg text-gray-300 bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl inline-flex items-center justify-center mb-6">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <span className="mt-4 text-lg sm:text-xl font-bold text-white block">Your cart is empty</span>
            <p className="mt-2 text-gray-400 font-medium">Start adding some products to your cart!</p>
            <div className="mt-8">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
            {/* Cart Items */}
            <div className="lg:col-span-7">
              <div className="gradient-border-white-top rounded-xl overflow-hidden">
                <div className="px-4 py-6 sm:px-6">
                  <div className="flow-root">
                    <ul className="-my-6 divide-y divide-gray-800">
                      {items.map((item) => (
                        <li key={item.id} className="py-6 flex">
                          <div className="flex-shrink-0 w-24 h-24 border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
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
                              <div className="flex justify-between text-base font-bold text-white">
                                <span>{item.product_name}</span>
                                <p className="ml-4 text-orange-400">{formatPrice(item.total_price)}</p>
                              </div>
                              <p className="mt-1 text-sm text-gray-400 font-medium">
                                by {item.creator_name}
                              </p>
                              <div className="mt-2 text-sm text-gray-400 font-medium flex items-center space-x-4">
                                <span>Size: {item.size}</span>
                                <span className="flex items-center">
                                  Color:
                                  <span
                                    className="ml-2 w-4 h-4 rounded-full border border-gray-600"
                                    style={{ backgroundColor: getColorCode(item.color, item.color_code) }}
                                  ></span>
                                  <span className="ml-1">{item.color || 'Default'}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex-1 flex items-end justify-between text-sm">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-400 font-medium">Qty:</span>
                                <div className="flex items-center border border-gray-700 rounded-lg bg-gray-900">
                                  <button
                                    type="button"
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="px-3 py-1 text-white font-medium min-w-[2.5rem] text-center">
                                    {updatingItems.has(item.id) ? '...' : item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
                                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                    disabled={item.quantity >= 10 || updatingItems.has(item.id)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="flex">
                                <button
                                  type="button"
                                  className="font-medium text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
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
                      className="text-sm text-red-500 hover:text-red-400 font-medium transition-colors"
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
              <div className="gradient-border-white-top rounded-xl overflow-hidden p-6 sm:p-8">
                <span className="text-lg sm:text-xl font-bold text-white block">Order Summary</span>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <dt className="text-sm font-medium text-gray-400">Subtotal</dt>
                    <dd className="text-sm font-bold text-white">{formatPrice(summary.subtotal)}</dd>
                  </div>
                  <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
                    <dt className="text-base font-bold text-white">Order total</dt>
                    <dd className="text-base font-bold text-orange-400">{formatPrice(summary.subtotal)}</dd>
                  </div>
                </div>

                <div className="mt-8">
                  <Link
                    href="/checkout-unified"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border border-transparent rounded-lg shadow-lg py-3 px-4 text-base font-bold text-white flex items-center justify-center transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-6 flex justify-center text-sm text-center text-gray-400 font-medium">
                  <p>
                    or{' '}
                    <Link
                      href="/products"
                      className="text-orange-400 font-bold hover:text-orange-300 transition-colors"
                    >
                      Continue Shopping
                      <span aria-hidden="true"> &rarr;</span>
                    </Link>
                  </p>
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
          <MuiButton
            onClick={cancelDelete}
            style={{ color: '#9ca3af' }}
          >
            Cancel
          </MuiButton>
          <MuiButton
            onClick={confirmDelete}
            style={{ color: '#ef4444' }}
            autoFocus
          >
            Remove
          </MuiButton>
        </DialogActions>
      </Dialog>
    </div>
  );
}