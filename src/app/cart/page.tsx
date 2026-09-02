'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGuestCart } from '@/contexts/GuestCartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import GradientTitle from '@/components/ui/GradientTitle';
import { DeleteConfirmationModal } from '@/components/ui/DeleteConfirmationModal';

export default function CartPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { formatPrice } = useCurrency();
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
  const [clearCartConfirmOpen, setClearCartConfirmOpen] = useState(false);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setShowLoginPrompt(true);
    }
  }, [isAuthenticated, authLoading]);

  // Context handles data fetching - removed redundant effect

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

  const confirmClearCart = async () => {
    await clearCart();
    setClearCartConfirmOpen(false);
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
              onClick={() => router.push('/auth/login?redirect=/cart')}
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pt-2 sm:pt-3">
          <div>
            <GradientTitle text="Shopping Cart" size="sm" />
            <p className="text-gray-400 font-medium text-xs sm:text-sm mt-1 sm:mt-2">
              {summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center px-4 py-2.5 sm:px-5 sm:py-2.5 border border-white/20 text-xs sm:text-sm font-semibold rounded-xl text-white bg-black hover:bg-gray-900 transition-all shadow-md shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl inline-flex items-center justify-center mb-6">
              <ShoppingBag className="h-8 w-8 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-white block">Your cart is empty</span>
            <p className="mt-2 text-sm sm:text-base text-gray-400 font-medium">Start adding some products to your cart!</p>
            <div className="mt-6 sm:mt-8">
              <Link
                href="/products"
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
            {/* Cart Items */}
            <div className="lg:col-span-7">
              <div className="gradient-border-white-top rounded-2xl overflow-hidden bg-gray-950/60 border border-white/10">
                <div className="p-4 sm:p-6">
                  <div className="flow-root">
                    <ul className="divide-y divide-gray-800/80">
                      {items.map((item) => {
                        const productHref = `/products/${(item as any).product_slug || (item as any).slug || item.product_id}`;
                        const itemImageSrc = (() => {
                          if (typeof window !== 'undefined') {
                            try {
                              const cached = localStorage.getItem(`product_variant_${item.variant_id}`);
                              if (cached) {
                                const parsed = JSON.parse(cached);
                                if (parsed.image_url && !parsed.image_url.includes('placeholder')) {
                                  return parsed.image_url;
                                }
                              }
                            } catch {}
                          }
                          return item.image_url || item.thumbnail_url || '/placeholder-product.svg';
                        })();

                        return (
                          <li key={item.id} className="py-4 sm:py-6 flex items-start gap-3 sm:gap-5">
                            {/* Image */}
                            <Link
                              href={productHref}
                              className="flex-shrink-0 w-20 h-20 sm:w-28 sm:h-28 border border-white/10 rounded-xl overflow-hidden bg-gray-900 group hover:border-orange-500/50 transition-colors relative"
                            >
                              <Image
                                src={itemImageSrc}
                                alt={item.product_name}
                                fill
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                unoptimized={true}
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-product.svg';
                                }}
                              />
                            </Link>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                              <div>
                                <div className="flex items-start justify-between gap-2">
                                  <Link
                                    href={productHref}
                                    className="text-sm sm:text-base font-bold text-white hover:text-orange-400 transition-colors line-clamp-2 leading-snug"
                                  >
                                    {item.product_name}
                                  </Link>
                                  <p className="text-sm sm:text-base text-orange-400 font-extrabold shrink-0">
                                    {formatPrice(item.total_price)}
                                  </p>
                                </div>
                                
                                <p className="mt-0.5 text-xs sm:text-sm text-gray-400 font-medium truncate">
                                  by {item.creator_name}
                                </p>

                                {/* Size & Color Info */}
                                <div className="mt-1.5 text-xs text-gray-400 font-medium flex flex-wrap items-center gap-x-3 gap-y-1">
                                  {item.size && <span>Size: <strong className="text-white/90">{item.size}</strong></span>}
                                  <span className="flex items-center gap-1">
                                    Color:
                                    <span
                                      className="w-3.5 h-3.5 rounded-full border border-gray-600 inline-block"
                                      style={{ backgroundColor: getColorCode(item.color, item.color_code) }}
                                    ></span>
                                    <strong className="text-white/90">{item.color || 'Default'}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Quantity & Delete Controls */}
                              <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-800/60">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-400 font-medium">Qty:</span>
                                  <div className="flex items-center border border-white/15 rounded-xl bg-gray-900/90 overflow-hidden">
                                    <button
                                      type="button"
                                      className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
                                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                      disabled={item.quantity <= 1 || updatingItems.has(item.id)}
                                    >
                                      <Minus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </button>
                                    <span className="px-2.5 py-0.5 text-xs sm:text-sm text-white font-bold min-w-[2rem] text-center">
                                      {updatingItems.has(item.id) ? '...' : item.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      className="p-1 sm:p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 transition-colors disabled:opacity-40"
                                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                      disabled={item.quantity >= 10 || updatingItems.has(item.id)}
                                    >
                                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    </button>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-40"
                                  onClick={() => handleRemoveItem(item.id, item.product_name)}
                                  disabled={updatingItems.has(item.id)}
                                  title="Remove item"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>

                {/* Clear Cart Button */}
                {items.length > 0 && (
                  <div className="border-t border-gray-800 px-4 py-4 sm:px-6 flex justify-end">
                    <button
                      type="button"
                      className="text-xs sm:text-sm text-red-400 hover:text-red-300 font-semibold transition-colors flex items-center gap-1.5"
                      onClick={() => setClearCartConfirmOpen(true)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Cart
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="mt-6 lg:mt-0 lg:col-span-5">
              <div className="gradient-border-white-top rounded-2xl overflow-hidden p-5 sm:p-8 bg-gray-950/60 border border-white/10 shadow-xl">
                <span className="text-lg sm:text-xl font-bold text-white block">Order Summary</span>

                <div className="mt-5 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <dt className="text-xs sm:text-sm font-medium text-gray-400">Subtotal</dt>
                    <dd className="text-xs sm:text-sm font-bold text-white">{formatPrice(summary.subtotal)}</dd>
                  </div>
                  <div className="border-t border-gray-800/80 pt-3.5 flex items-center justify-between">
                    <dt className="text-sm sm:text-base font-bold text-white">Order total</dt>
                    <dd className="text-base sm:text-lg font-extrabold text-orange-400">{formatPrice(summary.subtotal)}</dd>
                  </div>
                </div>

                <div className="mt-6 sm:mt-8">
                  <Link
                    href="/checkout-unified"
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 border border-transparent rounded-xl shadow-lg py-3.5 px-4 text-sm sm:text-base font-bold text-white flex items-center justify-center transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)]"
                  >
                    Proceed to Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-4 sm:mt-6 flex justify-center text-xs sm:text-sm text-center text-gray-400 font-medium">
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

      <DeleteConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Remove Item"
        description={`Are you sure you want to remove "${deleteConfirm.productName}" from your cart?`}
        confirmButtonText="Remove"
      />

      <DeleteConfirmationModal
        isOpen={clearCartConfirmOpen}
        onClose={() => setClearCartConfirmOpen(false)}
        onConfirm={confirmClearCart}
        title="Clear Cart"
        description="Are you sure you want to clear your cart? This will remove all items."
        confirmButtonText="Clear Cart"
      />
    </div>
  );
}
