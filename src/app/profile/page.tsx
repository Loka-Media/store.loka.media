'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDate, checkoutAPI, addressAPI, Address } from '@/lib/api';
import { User, Package, MapPin, Calendar, Phone, Mail, Edit2, Plus, ChevronDown, ChevronUp, LogOut, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import CreativeLoader from '@/components/CreativeLoader';
import GradientTitle from '@/components/ui/GradientTitle';

interface OrderItem {
  product_id: number;
  variant_id: number;
  product_name: string;
  price: string;
  quantity: number;
  size?: string;
  color?: string;
  image_url?: string;
  total_price: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
  item_count: number;
  order_items: OrderItem[];
  shipping_cost: number;
  tax_amount: number;
  admin_fee: number;
  shipping_address: any;
  metadata: any;
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    fetchUserData();
  }, [isAuthenticated, router]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [ordersResponse, addressesResponse] = await Promise.all([
        checkoutAPI.getUserOrders({ limit: 5 }),
        addressAPI.getAddresses()
      ]);

      console.log('📦 Fetched orders:', ordersResponse.orders);
      // Log image URLs for debugging
      ordersResponse.orders.forEach((order: Order, orderIndex:any) => {
        order.order_items?.forEach((item, itemIndex) => {
          console.log(`🖼️ Order ${orderIndex + 1}, Item ${itemIndex + 1} - Image URL:`, item.image_url);
        });
      });

      setOrders(ordersResponse.orders);
      setAddresses(addressesResponse.addresses);
    } catch (error) {
      console.error('Failed to fetch user data:', error);
      setError('Failed to load profile data. Please try again.');
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleOrderExpansion = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black">
        <CreativeLoader variant="default" message="Loading your profile..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="pb-6 sm:pb-8 pt-6 sm:pt-8">
              <GradientTitle text="My Profile" size="lg" />
            </div>
          </div>
        </div>

        {/* Error State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-8 sm:p-12 mb-8 inline-block">
              <AlertCircle className="w-16 h-16 sm:w-20 sm:h-20 text-red-400 mx-auto" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Profile Data Not Found</h2>
            <p className="text-white/60 text-base sm:text-lg mb-8 max-w-lg">
              {error}
            </p>
            <button
              onClick={() => fetchUserData()}
              disabled={loading}
              className="inline-flex items-center px-6 sm:px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-sm sm:text-base gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Retrying...</span>
                </>
              ) : (
                <>
                  <span>Try Again</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <CreativeLoader variant="default" message="Loading your profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-6 sm:pb-8 pt-6 sm:pt-8">
            <GradientTitle text="My Profile" size="lg" />
            <p className="mt-2 text-xs sm:text-sm text-gray-400 font-medium">
              Manage your account and view your order history
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Overview */}
        <div className="gradient-border-white-top p-6 sm:p-8 mb-8">
          {/* Top Row - Member Since & Edit Button */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            <div />
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white/5 border border-white/20 rounded-lg px-3 py-1.5">
                <Calendar className="w-4 h-4 mr-2 text-white/70" />
                <span className="text-white/80 text-xs sm:text-sm font-medium">Member Since 2024</span>
              </div>
              <Link
                href="/profile/edit"
                className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2 whitespace-nowrap"
              >
                <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* Main Content - Avatar, Name, and Contact Badges */}
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Left Section - Avatar + Name/Username */}
            <div>
              <div className="flex items-start gap-4 sm:gap-6 mb-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 border-white/20 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <User className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                </div>

                {/* User Details */}
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">{user?.name}</h2>
                  <p className="text-xs sm:text-sm text-orange-400 font-medium mt-1">@{user?.username}</p>
                </div>
              </div>

              {/* Contact Info Badges - Horizontal Row */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center bg-white/5 border border-white/20 rounded-lg px-4 py-2">
                  <Phone className="w-4 h-4 mr-2 text-white/70" />
                  <span className="text-white/80 text-xs sm:text-sm font-medium">{user?.phone || 'Not provided'}</span>
                </div>
                <div className="flex items-center bg-white/5 border border-white/20 rounded-lg px-4 py-2">
                  <Mail className="w-4 h-4 mr-2 text-white/70" />
                  <span className="text-white/80 text-xs sm:text-sm font-medium">{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="gradient-border-white-top p-2 sm:p-3 mb-8">
          <nav className="flex gap-2">
            {[
              { key: 'overview', label: 'Overview', icon: User },
              { key: 'orders', label: 'Order History', icon: Package },
              { key: 'addresses', label: 'Addresses', icon: MapPin },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-3 sm:py-3.5 px-4 sm:px-6 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 rounded-lg transition-all ${
                  activeTab === key
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg'
                    : 'border border-white/20 text-gray-400 hover:border-white/40 hover:text-gray-300 bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="gradient-border-white-top p-6 sm:p-8 hover:bg-white/5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{orders.length}</p>
                  <p className="text-white/60 font-medium text-xs sm:text-sm mt-2">Total Orders</p>
                </div>
                <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-3">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="gradient-border-white-top p-6 sm:p-8 hover:bg-white/5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">{addresses.length}</p>
                  <p className="text-white/60 font-medium text-xs sm:text-sm mt-2">Saved Addresses</p>
                </div>
                <div className="bg-green-500/20 border border-green-400/50 rounded-lg p-3">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
                </div>
              </div>
            </div>

            <div className="gradient-border-white-top p-6 sm:p-8 hover:bg-white/5 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl sm:text-4xl font-bold text-white capitalize">{user?.role || 'User'}</p>
                  <p className="text-white/60 font-medium text-xs sm:text-sm mt-2">Account Type</p>
                </div>
                <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-3">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="gradient-border-white-top overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-white/10">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Recent Orders</h3>
            </div>
            {orders.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-8 inline-block mb-6">
                  <Package className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400 mx-auto" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-4">No orders yet</p>
                <Link
                  href="/products"
                  className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4 p-4 sm:p-6">
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <div key={order.id} className="gradient-border-white-top rounded-lg overflow-hidden">
                      {/* Compact Order Header */}
                      <div
                        className="flex items-center justify-between p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/10"
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-purple-500/20 border border-purple-400/50 rounded-lg p-2">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm sm:text-base">
                              Order #{order.order_number}
                            </p>
                            <p className="text-xs sm:text-sm text-white/60 mt-1">
                              {formatDate(order.created_at)} • {order.item_count} item(s)
                            </p>
                            <p className="text-xs sm:text-sm text-white/60">
                              {order.payment_method.toUpperCase()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="text-right">
                            <p className="font-bold text-lg sm:text-xl text-white">
                              {formatPrice(order.total_amount)}
                            </p>
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold border mt-1 ${
                              order.status.toLowerCase() === 'pending'
                                ? 'bg-yellow-500/10 border-yellow-400/50 text-yellow-400'
                                : order.status.toLowerCase() === 'processing'
                                ? 'bg-blue-500/10 border-blue-400/50 text-blue-400'
                                : order.status.toLowerCase() === 'completed'
                                ? 'bg-green-500/10 border-green-400/50 text-green-400'
                                : 'bg-red-500/10 border-red-400/50 text-red-400'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          <div className="bg-white/10 border border-white/20 rounded-full p-2">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            ) : (
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      {isExpanded && (
                        <div className="border-t border-white/10 p-4 sm:p-6 space-y-4">
                          {/* Order Items */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
                                <Package className="w-4 h-4 mr-2 text-purple-400" />
                                Items Ordered
                              </h4>
                              <div className="space-y-3">
                                {order.order_items.map((item, index) => (
                                  <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-pointer group">
                                    <Link
                                      href={`/products/${item.product_id}`}
                                      className="flex items-center gap-3 flex-1"
                                    >
                                      <div className="flex-shrink-0 relative">
                                        {item.image_url ? (
                                          <>
                                            <img
                                              src={item.image_url}
                                              alt={item.product_name}
                                              className="w-12 h-12 object-cover rounded-md border border-white/20 group-hover:border-purple-400/50 transition-colors"
                                              loading="lazy"
                                              onLoad={() => {
                                                console.log('✅ Image loaded successfully:', item.image_url);
                                                const key = `${item.variant_id}-${item.product_id}`;
                                                setLoadingImages(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(key);
                                                  return newSet;
                                                });
                                              }}
                                              onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                console.error('❌ Failed to load image:', item.image_url);
                                                target.onerror = null;
                                                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzZaIiBmaWxsPSIjOUIxMDZGIi8+CjxwYXRoIGQ9Ik0yNCAzMkMzMS4xNzk3IDMyIDM2IDI3LjE3OTcgMzYgMjBDMzYgMTIuODIwMyAzMS4xNzk3IDggMjQgOEMxNi44MjAzIDggMTIgMTIuODIwMyAxMiAyMEMxMiAyNy4xNzk3IDE2LjgyMDMgMzIgMjQgMzJaIiBmaWxsPSIjNjM2NkY3Ii8+CjxwYXRoIGQ9Ik0yNCAyOEMyOS41MjI4IDI4IDM0IDIzLjUyMjggMzQgMThDMzQgMTIuNDc3MiAyOS41MjI4IDggMjQgOEMxOC40NzcyIDggMTQgMTIuNDc3MiAxNCAxOEMxNCAyMy41MjI4IDE4LjQ3NzIgMjggMjQgMjhaIiBmaWxsPSIjRkZGRkZGIi8+PC9zdmc+';
                                                const key = `${item.variant_id}-${item.product_id}`;
                                                setLoadingImages(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.delete(key);
                                                  return newSet;
                                                });
                                              }}
                                              style={{ display: loadingImages.has(`${item.variant_id}-${item.product_id}`) ? 'none' : 'block' }}
                                            />
                                            {loadingImages.has(`${item.variant_id}-${item.product_id}`) && (
                                              <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center animate-pulse">
                                                <div className="w-6 h-6 bg-white/20 rounded animate-pulse"></div>
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="w-12 h-12 bg-white/10 rounded-md flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                            <Package className="w-6 h-6 text-white/40" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-white/90 truncate text-sm group-hover:text-white transition-colors">
                                          {item.product_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-white/50 mt-1">
                                          {item.size && <span>Size: {item.size}</span>}
                                          {item.color && <span>Color: {item.color}</span>}
                                        </div>
                                        <p className="text-xs text-white/50">
                                          Qty: {item.quantity} × {formatPrice(parseFloat(item.price))}
                                        </p>
                                      </div>
                                    </Link>
                                    <div className="text-right">
                                      <p className="font-semibold text-white/90 text-sm">
                                        {formatPrice(parseFloat(item.total_price) || (parseFloat(item.price) * item.quantity))}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Order Summary */}
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <h5 className="text-sm font-semibold text-white mb-3">Order Summary</h5>
                            <div className="space-y-2 text-sm text-white/70">
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="text-white/90">
                                  {formatPrice(
                                    order.order_items?.reduce((sum, item) =>
                                      sum + (parseFloat(item.total_price) || (parseFloat(item.price) * item.quantity)), 0
                                    ) || 0
                                  )}
                                </span>
                              </div>
                              {order.shipping_cost && order.shipping_cost > 0 && (
                                <div className="flex justify-between">
                                  <span>Shipping:</span>
                                  <span className="text-white/90">{formatPrice(order.shipping_cost)}</span>
                                </div>
                              )}
                              {(order.tax_amount > 0 || order.admin_fee > 0) && (
                                <div className="flex justify-between">
                                  <span>Tax & Fees:</span>
                                  <span className="text-white/90">
                                    {formatPrice((order.tax_amount || 0) + (order.admin_fee || 0))}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-2 border-t border-white/10 text-white">
                                <span>Total:</span>
                                <span className="text-orange-400">{formatPrice(order.total_amount)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          {order.shipping_address && (
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <h5 className="text-sm font-semibold text-white mb-3 flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-green-400" />
                                Shipping Address
                              </h5>
                              <div className="text-sm text-white/70 space-y-1">
                                <p className="font-medium text-white/90">{order.shipping_address.name}</p>
                                <p>{order.shipping_address.address1}</p>
                                {order.shipping_address.address2 && <p>{order.shipping_address.address2}</p>}
                                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip}</p>
                                <p>{order.shipping_address.country}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="gradient-border-white-top overflow-hidden">
            <div className="px-6 sm:px-8 py-6 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl sm:text-2xl font-bold text-white">Saved Addresses</h3>
              <Link
                href="/addresses"
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Address</span>
                <span className="sm:hidden">Add</span>
              </Link>
            </div>
            {addresses.length === 0 ? (
              <div className="p-8 sm:p-12 text-center">
                <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-8 inline-block mb-6">
                  <MapPin className="w-12 h-12 sm:w-16 sm:h-16 text-green-400 mx-auto" />
                </div>
                <p className="text-xl sm:text-2xl font-bold text-white mb-4">No addresses saved</p>
                <Link
                  href="/addresses"
                  className="inline-flex items-center px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg transition-all text-xs sm:text-sm gap-2"
                >
                  Add Your First Address
                </Link>
              </div>
            ) : (
              <div className="p-4 sm:p-6 space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="gradient-border-white-top rounded-lg p-4 sm:p-6 hover:bg-white/5 transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-bold text-white text-base sm:text-lg mb-2">{address.name}</p>
                        <p className="text-white/70 font-medium text-xs sm:text-sm">{address.address1}</p>
                        {address.address2 && <p className="text-white/70 font-medium text-xs sm:text-sm">{address.address2}</p>}
                        <p className="text-white/70 font-medium text-xs sm:text-sm">
                          {address.city}, {address.state} {address.zip}
                        </p>
                        <p className="text-white/70 font-medium text-xs sm:text-sm">{address.country}</p>
                        {address.phone && <p className="text-white/70 font-medium text-xs sm:text-sm mt-2">{address.phone}</p>}
                      </div>
                      <div className="text-right flex flex-col gap-2">
                        {address.is_default && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-400/50">
                            ✓ Default
                          </span>
                        )}
                        <p className="text-xs font-semibold text-white/70 capitalize bg-white/10 border border-white/20 rounded-lg px-2 py-1">
                          {address.address_type} address
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}