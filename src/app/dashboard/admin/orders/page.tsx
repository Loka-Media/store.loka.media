'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/auth';
import { 
  Package, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  Send,
  RefreshCw,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

// Admin API functions using the configured axios instance
const adminAPI = {
  getDashboardStats: async () => {
    const response = await api.get('/api/unified-checkout/admin/dashboard/stats');
    return response.data;
  },

  getPendingOrders: async (params = {}) => {
    const response = await api.get('/api/unified-checkout/admin/orders/pending', { params });
    return response.data;
  },

  getOrderDetails: async (orderId: string) => {
    const response = await api.get(`/api/unified-checkout/admin/orders/${orderId}/details`);
    return response.data;
  },

  verifyPayment: async (orderId: string, data: { bankAmountVerified: string; verificationNotes: string; approveOrder: boolean }) => {
    const response = await api.post(`/api/unified-checkout/admin/orders/${orderId}/verify`, data);
    return response.data;
  },

  releasePayment: async (orderId: string, data: { vendorEmail: string; notes: string }) => {
    const response = await api.post(`/api/unified-checkout/admin/orders/${orderId}/release-payment`, data);
    return response.data;
  }
};

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    paymentReceived: number;
    verified: number;
    processing: number;
    fulfilled: number;
    today: number;
    thisWeek: number;
  };
  payments: {
    totalEscrowed: string;
    pendingFees: string;
    escrowedCount: number;
  };
  verification: {
    totalPending: number;
    urgent: number;
    highPriority: number;
    inReview: number;
    overdue: number;
  };
}

interface Order {
  id: number;
  order_number: string;
  order_type: string;
  order_status: string;
  payment_status: string;
  customer_payment_amount: string;
  customer_name?: string;
  customer_email?: string;
  created_at: string;
  priority?: string;
  verification_notes?: string;
  due_date?: string;
  order_items?: unknown[];
  shipping_address?: {
    name?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    phone?: string;
  };
  metadata?: unknown;
  vendor_payment_amount?: string;
  admin_fee?: string;
}

export default function AdminOrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [orderTypeFilter, setOrderTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Verification form
  const [verificationForm, setVerificationForm] = useState({
    bankAmountVerified: '',
    verificationNotes: '',
    approveOrder: true
  });
  
  // Payment release form
  const [paymentForm, setPaymentForm] = useState({
    vendorEmail: '',
    notes: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (user?.role !== 'admin') {
      toast.error('Admin access required');
      router.push('/dashboard');
      return;
    }

    loadDashboardData();
  }, [isAuthenticated, user, router]);

  // Auto-reload data when filters change
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadDashboardData();
    }
  }, [statusFilter, orderTypeFilter, priorityFilter]);

  // Debounced search
  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      const timeoutId = setTimeout(() => {
        loadDashboardData();
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Check if we have a token before making API calls
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        router.push('/auth/login');
        return;
      }
      
      // Debug logs
      console.log('Loading dashboard data...');
      console.log('User:', user);
      console.log('Token in storage:', token ? 'Present' : 'Missing');
      
      const [statsData, ordersData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingOrders({
          status: statusFilter || undefined,
          orderType: orderTypeFilter || undefined,
          priority: priorityFilter || undefined,
          search: searchTerm || undefined,
          limit: 50
        })
      ]);

      setStats(statsData.stats);
      setOrders(ordersData.orders);
    } catch (error: unknown) {
      console.error('Failed to load dashboard data:', error);
      
      const errorResponse = error as { response?: { status?: number; data?: { error?: string } } };
      if (errorResponse?.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        router.push('/auth/login');
      } else if (errorResponse?.response?.status === 403) {
        toast.error('Admin access required');
        router.push('/dashboard');
      } else {
        toast.error(errorResponse?.response?.data?.error || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (order: Order) => {
    try {
      console.log('Fetching order details for order ID:', order.id);
      const orderDetails = await adminAPI.getOrderDetails(order.id.toString());
      console.log('Order details received:', orderDetails);
      setSelectedOrder({ ...order, ...orderDetails.order });
      setShowOrderModal(true);
    } catch (error: unknown) {
      console.error('Failed to load order details:', error);
      const errorResponse = error as { response?: { status?: number; data?: { error?: string } } };
      if (errorResponse?.response?.status === 401) {
        toast.error('Authentication failed. Please log in again.');
        router.push('/auth/login');
      } else {
        toast.error(errorResponse?.response?.data?.error || 'Failed to load order details');
      }
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const result = await adminAPI.verifyPayment(selectedOrder.id.toString(), verificationForm);
      
      toast.success(result.message);
      setShowVerificationModal(false);
      setVerificationForm({
        bankAmountVerified: '',
        verificationNotes: '',
        approveOrder: true
      });
      
      await loadDashboardData();
    } catch (error: unknown) {
      console.error('Payment verification error:', error);
      toast.error('Failed to verify payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const result = await adminAPI.releasePayment(selectedOrder.id.toString(), paymentForm);
      
      toast.success(result.message);
      setShowPaymentModal(false);
      setPaymentForm({
        vendorEmail: '',
        notes: ''
      });
      
      await loadDashboardData();
    } catch (error: unknown) {
      console.error('Payment release error:', error);
      toast.error('Failed to release payment');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'payment_received': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'fulfilled': return 'bg-purple-100 text-purple-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Order Management</h1>
            <p className="text-gray-300 mt-1">Manage and process marketplace orders</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {stats.orders.paymentReceived}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Escrowed Funds
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      ${stats.payments.totalEscrowed}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Verification Queue
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {stats.verification.totalPending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Urgent Items
                    </dt>
                    <dd className="text-lg font-medium text-white">
                      {stats.verification.urgent}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
              >
                <option value="">All Orders</option>
                <option value="pending">Pending</option>
                <option value="payment_received">Payment Received</option>
                <option value="verified">Verified</option>
                <option value="processing">Processing</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Order Type
              </label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
              >
                <option value="">All Types</option>
                <option value="printful">Printful</option>
                <option value="shopify">Shopify</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Order number, email..."
                  className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-gray-800 shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-700">
            <h3 className="text-lg font-medium text-white">Orders</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {order.customer_name || 'Guest'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {order.customer_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {order.order_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      ${parseFloat(order.customer_payment_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.order_status)}`}>
                        {order.order_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.priority && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(order.priority)}`}>
                          {order.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOrderClick(order)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {order.order_status === 'payment_received' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setVerificationForm({
                                bankAmountVerified: order.customer_payment_amount,
                                verificationNotes: '',
                                approveOrder: true
                              });
                              setShowVerificationModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        
                        {order.order_status === 'verified' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setPaymentForm({
                                vendorEmail: order.order_type === 'shopify' ? 'shopify@vendor.com' : 'printful@vendor.com',
                                notes: `Payment for order ${order.order_number}`
                              });
                              setShowPaymentModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-white">No orders found</h3>
              <p className="mt-1 text-sm text-gray-400">
                No orders match the current filters.
              </p>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-600 w-full max-w-4xl shadow-lg rounded-md bg-gray-800">
              <div className="mt-3">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Order Details - {selectedOrder.order_number}
                  </h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Order Information</h4>
                      <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                        <p className="text-gray-300"><span className="font-medium text-white">Type:</span> {selectedOrder.order_type}</p>
                        <p className="text-gray-300"><span className="font-medium text-white">Status:</span> {selectedOrder.order_status}</p>
                        <p className="text-gray-300"><span className="font-medium text-white">Payment Status:</span> {selectedOrder.payment_status}</p>
                        <p className="text-gray-300"><span className="font-medium text-white">Amount:</span> ${parseFloat(selectedOrder.customer_payment_amount).toFixed(2)}</p>
                        <p className="text-gray-300"><span className="font-medium text-white">Created:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Customer Information</h4>
                      <div className="bg-gray-700 p-4 rounded-lg space-y-2">
                        <p className="text-gray-300"><span className="font-medium text-white">Name:</span> {selectedOrder.customer_name || 'Guest'}</p>
                        <p className="text-gray-300"><span className="font-medium text-white">Email:</span> {selectedOrder.customer_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-white mb-2">Shipping Address</h4>
                      {selectedOrder.shipping_address && (
                        <div className="bg-gray-700 p-4 rounded-lg">
                          <p className="text-gray-300">{selectedOrder.shipping_address.name}</p>
                          <p className="text-gray-300">{selectedOrder.shipping_address.address1}</p>
                          {selectedOrder.shipping_address.address2 && <p className="text-gray-300">{selectedOrder.shipping_address.address2}</p>}
                          <p className="text-gray-300">{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}</p>
                          <p className="text-gray-300">{selectedOrder.shipping_address.country}</p>
                          {selectedOrder.shipping_address.phone && <p>{selectedOrder.shipping_address.phone}</p>}
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-white mb-2">Order Items</h4>
                      <div className="bg-gray-700 p-4 rounded-lg max-h-48 overflow-y-auto">
                        {selectedOrder.order_items && selectedOrder.order_items.map((item: unknown, index: number) => {
                          const orderItem = item as { product_name?: string; quantity?: number; price?: string; color?: string; size?: string };
                          return (
                            <div key={index} className="border-b border-gray-600 last:border-b-0 pb-2 mb-2 last:mb-0">
                              <p className="font-medium text-white">{orderItem.product_name}</p>
                              <p className="text-sm text-gray-300">
                                {orderItem.size} • {orderItem.color} • Qty: {orderItem.quantity}
                              </p>
                              <p className="text-sm text-gray-300">${orderItem.price ? parseFloat(orderItem.price).toFixed(2) : '0.00'} each</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Verification Modal */}
        {showVerificationModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-600 w-full max-w-md shadow-lg rounded-md bg-gray-800">
              <div className="mt-3">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">
                    Verify Payment
                  </h3>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bank Amount Verified ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={verificationForm.bankAmountVerified}
                      onChange={(e) => setVerificationForm({
                        ...verificationForm,
                        bankAmountVerified: e.target.value
                      })}
                      className="w-full p-3 border border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      placeholder="Enter verified amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Verification Notes
                    </label>
                    <textarea
                      value={verificationForm.verificationNotes}
                      onChange={(e) => setVerificationForm({
                        ...verificationForm,
                        verificationNotes: e.target.value
                      })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter verification notes..."
                    />
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={verificationForm.approveOrder}
                        onChange={(e) => setVerificationForm({
                          ...verificationForm,
                          approveOrder: e.target.checked
                        })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">
                        Approve order for processing
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyPayment}
                    disabled={loading || !verificationForm.bankAmountVerified || !verificationForm.verificationNotes}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? 'Verifying...' : 'Verify Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Release Modal */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Release Payment
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Vendor Email
                    </label>
                    <input
                      type="email"
                      value={paymentForm.vendorEmail}
                      onChange={(e) => setPaymentForm({
                        ...paymentForm,
                        vendorEmail: e.target.value
                      })}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({
                        ...paymentForm,
                        notes: e.target.value
                      })}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Payment notes..."
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Amount to release:</strong> ${selectedOrder.vendor_payment_amount || 'Calculating...'}<br/>
                      <strong>Admin fee:</strong> ${selectedOrder.admin_fee || 'Calculating...'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReleasePayment}
                    disabled={loading || !paymentForm.vendorEmail}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Releasing...' : 'Release Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}