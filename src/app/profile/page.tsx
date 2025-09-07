'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatPrice, formatDate, checkoutAPI, addressAPI, Address } from '@/lib/api';
import { User, Package, MapPin, Calendar, Phone, Mail, Edit2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-1">Manage your account and view your order history</p>
        </div>

        {/* Profile Overview */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 rounded-full p-3">
                <User className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                <p className="text-gray-600">@{user?.username}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-1" />
                    {user?.email}
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    {user?.phone}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    Member since 2024
                  </div>
                </div>
              </div>
            </div>
            <Link
              href="/profile/edit"
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview', icon: User },
              { key: 'orders', label: 'Order History', icon: Package },
              { key: 'addresses', label: 'Addresses', icon: MapPin },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <Package className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{orders.length}</p>
                  <p className="text-gray-600">Total Orders</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <MapPin className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900">{addresses.length}</p>
                  <p className="text-gray-600">Saved Addresses</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow-sm rounded-lg p-6">
              <div className="flex items-center">
                <User className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-semibold text-gray-900 capitalize">{user?.role || 'User'}</p>
                  <p className="text-gray-600">Account Type</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            </div>
            {orders.length === 0 ? (
              <div className="p-6 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No orders yet</p>
                <Link
                  href="/products"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.id);
                  return (
                    <div key={order.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      {/* Compact Order Header */}
                      <div 
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        onClick={() => toggleOrderExpansion(order.id)}
                      >
                        <div className="flex items-center space-x-3">
                          <Package className="w-5 h-5 text-indigo-600" />
                          <div>
                            <p className="font-semibold text-gray-900">
                              Order #{order.order_number}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(order.created_at)} • {order.item_count} item(s)
                            </p>
                            <p className="text-sm text-gray-500">
                              Payment: {order.payment_method.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="font-bold text-lg text-gray-900">
                              {formatPrice(order.total_amount)}
                            </p>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expandable Order Details */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 p-4 bg-gray-50">
                          {/* Order Items */}
                          {order.order_items && order.order_items.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                <Package className="w-4 h-4 mr-2 text-indigo-600" />
                                Items Ordered
                              </h4>
                              <div className="space-y-3">
                                {order.order_items.map((item, index) => (
                                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center space-x-3 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <Link 
                                      href={`/products/${item.product_id}`} 
                                      className="flex items-center space-x-3 flex-1"
                                    >
                                      <div className="flex-shrink-0 relative">
                                        {item.image_url ? (
                                          <>
                                            <img
                                              src={item.image_url}
                                              alt={item.product_name}
                                              className="w-12 h-12 object-cover rounded-md border border-gray-200 group-hover:border-indigo-300 transition-colors"
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
                                              <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center animate-pulse">
                                                <div className="w-6 h-6 bg-gray-300 rounded animate-pulse"></div>
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center group-hover:bg-gray-300 transition-colors">
                                            <Package className="w-6 h-6 text-gray-400" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate text-sm group-hover:text-indigo-600 transition-colors">
                                          {item.product_name}
                                        </p>
                                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                                          {item.size && <span>Size: {item.size}</span>}
                                          {item.color && <span>Color: {item.color}</span>}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          Qty: {item.quantity} × {formatPrice(parseFloat(item.price))}
                                        </p>
                                      </div>
                                    </Link>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-900 text-sm">
                                        {formatPrice(parseFloat(item.total_price) || (parseFloat(item.price) * item.quantity))}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Order Summary */}
                          <div className="bg-white rounded-lg p-3 border border-gray-200 mb-4">
                            <h5 className="text-sm font-semibold text-gray-900 mb-2">Order Summary</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal:</span>
                                <span className="text-gray-900">
                                  {formatPrice(
                                    order.order_items?.reduce((sum, item) => 
                                      sum + (parseFloat(item.total_price) || (parseFloat(item.price) * item.quantity)), 0
                                    ) || 0
                                  )}
                                </span>
                              </div>
                              {order.shipping_cost && order.shipping_cost > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Shipping:</span>
                                  <span className="text-gray-900">{formatPrice(order.shipping_cost)}</span>
                                </div>
                              )}
                              {(order.tax_amount > 0 || order.admin_fee > 0) && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Tax & Fees:</span>
                                  <span className="text-gray-900">
                                    {formatPrice((order.tax_amount || 0) + (order.admin_fee || 0))}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-1 border-t border-gray-200">
                                <span className="text-gray-900">Total:</span>
                                <span className="text-indigo-600">{formatPrice(order.total_amount)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          {order.shipping_address && (
                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                              <h5 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                                <MapPin className="w-4 h-4 mr-1 text-green-600" />
                                Shipping Address
                              </h5>
                              <div className="text-sm text-gray-600 space-y-0.5">
                                <p className="font-medium text-gray-900">{order.shipping_address.name}</p>
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
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Saved Addresses</h3>
              <Link
                href="/addresses"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Address
              </Link>
            </div>
            {addresses.length === 0 ? (
              <div className="p-6 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No addresses saved</p>
                <Link
                  href="/addresses"
                  className="text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Add Your First Address
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {addresses.map((address) => (
                  <div key={address.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{address.name}</p>
                        <p className="text-gray-600">{address.address1}</p>
                        {address.address2 && <p className="text-gray-600">{address.address2}</p>}
                        <p className="text-gray-600">
                          {address.city}, {address.state} {address.zip}
                        </p>
                        <p className="text-gray-600">{address.country}</p>
                        {address.phone && <p className="text-gray-600">{address.phone}</p>}
                      </div>
                      <div className="text-right">
                        {address.is_default && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Default
                          </span>
                        )}
                        <p className="text-xs text-gray-500 mt-1 capitalize">
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