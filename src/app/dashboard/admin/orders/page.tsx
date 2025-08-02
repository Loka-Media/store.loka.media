'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Eye,
  CreditCard,
  Send,
  RefreshCw,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://store-api-loka-media.vercel.app' 
  : 'http://localhost:3003';

// Admin API functions
const adminAPI = {
  getDashboardStats: async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/admin/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard stats');
    return response.json();
  },

  getPendingOrders: async (params = {}) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/admin/orders/pending?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch pending orders');
    return response.json();
  },

  getOrderDetails: async (orderId: string) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/admin/orders/${orderId}/details`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch order details');
    return response.json();
  },

  verifyPayment: async (orderId: string, data: any) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/admin/orders/${orderId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to verify payment');
    return response.json();
  },

  releasePayment: async (orderId: string, data: any) => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/admin/orders/${orderId}/release-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to release payment');
    return response.json();
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
  order_items?: any[];
  shipping_address?: any;
  metadata?: any;
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
  const [statusFilter, setStatusFilter] = useState('payment_received');
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

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, ordersData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingOrders({
          status: statusFilter,
          orderType: orderTypeFilter || undefined,
          priority: priorityFilter || undefined,
          limit: 50
        })
      ]);

      setStats(statsData.stats);
      setOrders(ordersData.orders);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = async (order: Order) => {
    try {
      const orderDetails = await adminAPI.getOrderDetails(order.id.toString());
      setSelectedOrder({ ...order, ...orderDetails.order });
      setShowOrderModal(true);
    } catch (error: any) {
      toast.error('Failed to load order details');
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Manage and process marketplace orders</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Package className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.orders.paymentReceived}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Escrowed Funds
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      ${stats.payments.totalEscrowed}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Verification Queue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.verification.totalPending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Urgent Items
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.verification.urgent}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="payment_received">Payment Received</option>
                <option value="verified">Verified</option>
                <option value="processing">Processing</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Type
              </label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Types</option>
                <option value="printful">Printful</option>
                <option value="shopify">Shopify</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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

          <div className="mt-4">
            <button
              onClick={loadDashboardData}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Orders</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.customer_name || 'Guest'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.customer_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {order.order_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No orders match the current filters.
              </p>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Order Details - {selectedOrder.order_number}
                  </h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Order Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><span className="font-medium">Type:</span> {selectedOrder.order_type}</p>
                        <p><span className="font-medium">Status:</span> {selectedOrder.order_status}</p>
                        <p><span className="font-medium">Payment Status:</span> {selectedOrder.payment_status}</p>
                        <p><span className="font-medium">Amount:</span> ${parseFloat(selectedOrder.customer_payment_amount).toFixed(2)}</p>
                        <p><span className="font-medium">Created:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedOrder.customer_name || 'Guest'}</p>
                        <p><span className="font-medium">Email:</span> {selectedOrder.customer_email || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Shipping Address</h4>
                      {selectedOrder.shipping_address && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p>{selectedOrder.shipping_address.name}</p>
                          <p>{selectedOrder.shipping_address.address1}</p>
                          {selectedOrder.shipping_address.address2 && <p>{selectedOrder.shipping_address.address2}</p>}
                          <p>{selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}</p>
                          <p>{selectedOrder.shipping_address.country}</p>
                          {selectedOrder.shipping_address.phone && <p>{selectedOrder.shipping_address.phone}</p>}
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Order Items</h4>
                      <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto">
                        {selectedOrder.order_items && selectedOrder.order_items.map((item: any, index: number) => (
                          <div key={index} className="border-b border-gray-200 last:border-b-0 pb-2 mb-2 last:mb-0">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-gray-600">
                              {item.size} • {item.color} • Qty: {item.quantity}
                            </p>
                            <p className="text-sm text-gray-600">${parseFloat(item.price).toFixed(2)} each</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Verify Payment
                  </h3>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Enter verified amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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