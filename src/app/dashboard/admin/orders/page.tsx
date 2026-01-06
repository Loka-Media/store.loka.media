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
  Search,
  ArrowRight,
  Printer,
  Truck,
  CheckCheck,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderCard } from '@/components/admin/OrderCard';
import { OrderStatusPipeline } from '@/components/admin/OrderStatusPipeline';

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
  order_items?: Array<{
    id?: number;
    product_name?: string;
    quantity?: number;
    price?: string;
    color?: string;
    size?: string;
    product_image?: string;
    image_url?: string;
  }>;
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

interface ReleasePaymentResponse {
  success: boolean;
  message: string;
  payout: {
    payoutId: string;
    amount: string;
    recipient: string;
  };
  order: {
    id: number;
    orderNumber: string;
    status: string;
    paymentStatus: string;
  };
  fulfillment: {
    printful?: any;
    shopify?: {
      id: string;
      checkout_url?: string;
      status: string;
      total_amount?: string;
      items_count?: number;
      note?: string;
    };
  };
  summary: {
    printfulItems: number;
    shopifyItems: number;
    totalPlatforms: number;
  };
  actions?: {
    shopifyCheckout?: {
      url: string;
      message: string;
      amount: string;
      currency: string;
    };
  };
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
      const result: ReleasePaymentResponse = await adminAPI.releasePayment(selectedOrder.id.toString(), paymentForm);
      
      // Handle different fulfillment scenarios
      const hasPrintful = result.fulfillment.printful && result.summary.printfulItems > 0;
      const hasShopify = result.actions?.shopifyCheckout?.url && result.fulfillment.shopify;
      
      if (hasShopify && hasPrintful) {
        // Mixed order: Both Printful and Shopify
        const popup = window.open(result.actions!.shopifyCheckout!.url, '_blank');
        
        if (!popup) {
          toast.error(
            `⚠️ Popup blocked! Please manually open:\n${result.actions!.shopifyCheckout!.url}`,
            { duration: 10000 }
          );
        }
        
        toast.success(
          `✅ Payment Released Successfully!\n\n` +
          `🖨️ Printful: ${result.summary.printfulItems} items sent to production\n` +
          `🛒 Shopify: ${result.fulfillment.shopify!.items_count || 0} items checkout opened in new tab\n` +
          `💰 Shopify Amount: $${result.actions!.shopifyCheckout!.amount}`,
          { duration: 8000 }
        );
      } else if (hasShopify) {
        // Shopify only
        const popup = window.open(result.actions!.shopifyCheckout!.url, '_blank');
        
        if (!popup) {
          toast.error(
            `⚠️ Popup blocked! Please manually open:\n${result.actions!.shopifyCheckout!.url}`,
            { duration: 10000 }
          );
        }
        
        toast.success(
          `✅ Payment Released!\n\n` +
          `🛒 Shopify checkout opened in new tab\n` +
          `💰 Amount: $${result.actions!.shopifyCheckout!.amount} (${result.fulfillment.shopify!.items_count || 0} items)`,
          { duration: 6000 }
        );
      } else if (hasPrintful) {
        // Printful only
        toast.success(
          `✅ Payment Released Successfully!\n\n` +
          `🖨️ ${result.summary.printfulItems} items sent to Printful for production`,
          { duration: 4000 }
        );
      } else {
        // Fallback
        toast.success(result.message);
      }
      
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
      case 'pending': return 'bg-gray-700 text-gray-300';
      case 'payment_received': return 'bg-blue-900/30 text-blue-300';
      case 'verified': return 'bg-green-900/30 text-green-300';
      case 'processing': return 'bg-yellow-900/30 text-yellow-300';
      case 'fulfilled': return 'bg-purple-900/30 text-purple-300';
      case 'cancelled': return 'bg-red-900/30 text-red-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-900/30 text-red-300';
      case 'high': return 'bg-orange-900/30 text-orange-300';
      case 'medium': return 'bg-yellow-900/30 text-yellow-300';
      case 'low': return 'bg-green-900/30 text-green-300';
      default: return 'bg-gray-700 text-gray-300';
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Order Management</h1>
            <p className="text-slate-500 mt-2 text-lg">
              Manage and process marketplace orders
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-slate-200 text-sm font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 hover:shadow-lg transition-all duration-200 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-7 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100/80 p-3 rounded-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-600 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">
                      {stats.orders.paymentReceived}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-7 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100/80 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-600 truncate">
                      Escrowed Funds
                    </dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">
                      ${stats.payments.totalEscrowed}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-7 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-100/80 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-600 truncate">
                      Verification Queue
                    </dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">
                      {stats.verification.totalPending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-7 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100/80 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-slate-600 truncate">
                      Urgent Items
                    </dt>
                    <dd className="text-2xl font-bold text-slate-900 mt-1">
                      {stats.verification.urgent}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-8 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
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
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Order Type
              </label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
              >
                <option value="">All Types</option>
                <option value="printful">Printful</option>
                <option value="shopify">Shopify</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
              >
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Order number, email..."
                  className="w-full p-3 pl-10 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Grid */}
        <div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">Active Orders</h2>
            <p className="text-slate-600 text-sm">
              {orders.length} order{orders.length !== 1 ? 's' : ''} found
            </p>
          </div>

          {orders.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onViewDetails={handleOrderClick}
                  onVerifyPayment={(order) => {
                    setSelectedOrder(order);
                    setVerificationForm({
                      bankAmountVerified: order.customer_payment_amount,
                      verificationNotes: "",
                      approveOrder: true,
                    });
                    setShowVerificationModal(true);
                  }}
                  onReleasePayment={(order) => {
                    setSelectedOrder(order);
                    setPaymentForm({
                      vendorEmail:
                        order.order_type === "shopify"
                          ? "shopify@vendor.com"
                          : "printful@vendor.com",
                      notes: `Payment for order ${order.order_number}`,
                    });
                    setShowPaymentModal(true);
                  }}
                  loading={loading}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full mb-4">
                <Package className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No orders found</h3>
              <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                No orders match the current filters. Try adjusting your search criteria.
              </p>
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Orders
              </button>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-20 mx-auto p-6 border border-slate-200/60 w-full max-w-4xl shadow-2xl rounded-2xl bg-white">
              <div className="mt-3">
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                    Order Details - {selectedOrder.order_number}
                  </h3>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>

                {/* Status Pipeline */}
                <div className="mb-8">
                  <h4 className="font-semibold text-slate-900 mb-4">Order Status Pipeline</h4>
                  <OrderStatusPipeline
                    orderStatus={selectedOrder.order_status}
                    paymentStatus={selectedOrder.payment_status}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Order Information
                      </h4>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">Type:</span>{" "}
                          <span className="ml-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium capitalize">{selectedOrder.order_type}</span>
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">
                            Status:
                          </span>{" "}
                          <span className="ml-2 inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium capitalize">{selectedOrder.order_status}</span>
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">
                            Payment Status:
                          </span>{" "}
                          <span className="ml-2 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium capitalize">{selectedOrder.payment_status}</span>
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">
                            Amount:
                          </span>{" "}
                          <span className="ml-2 font-semibold text-slate-900">
                            $
                            {parseFloat(
                              selectedOrder.customer_payment_amount
                            ).toFixed(2)}
                          </span>
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">
                            Created:
                          </span>{" "}
                          <span className="ml-2 text-slate-600">{new Date(selectedOrder.created_at).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Customer Information
                      </h4>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200/60 space-y-3">
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">Name:</span>{" "}
                          <span className="ml-2 text-slate-600">{selectedOrder.customer_name || "Guest"}</span>
                        </p>
                        <p className="text-slate-700">
                          <span className="font-semibold text-slate-900">Email:</span>{" "}
                          <span className="ml-2 text-slate-600">{selectedOrder.customer_email || "N/A"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Shipping Address
                      </h4>
                      {selectedOrder.shipping_address && (
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200/60 text-slate-700 space-y-1">
                          <p className="font-semibold text-slate-900">
                            {selectedOrder.shipping_address.name}
                          </p>
                          <p className="text-sm">
                            {selectedOrder.shipping_address.address1}
                          </p>
                          {selectedOrder.shipping_address.address2 && (
                            <p className="text-sm">
                              {selectedOrder.shipping_address.address2}
                            </p>
                          )}
                          <p className="text-sm">
                            {selectedOrder.shipping_address.city},{" "}
                            {selectedOrder.shipping_address.state}{" "}
                            {selectedOrder.shipping_address.zip}
                          </p>
                          <p className="text-sm">
                            {selectedOrder.shipping_address.country}
                          </p>
                          {selectedOrder.shipping_address.phone && (
                            <p className="text-sm font-medium mt-2">{selectedOrder.shipping_address.phone}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Order Items */}
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3">
                        Order Items
                      </h4>
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-xl border border-slate-200/60 max-h-48 overflow-y-auto">
                        {selectedOrder.order_items &&
                          selectedOrder.order_items.map(
                            (item: unknown, index: number) => {
                              const orderItem = item as {
                                product_name?: string;
                                quantity?: number;
                                price?: string;
                                color?: string;
                                size?: string;
                              };
                              return (
                                <div
                                  key={index}
                                  className="border-b border-slate-200 last:border-b-0 pb-3 mb-3 last:mb-0"
                                >
                                  <p className="font-semibold text-slate-900">
                                    {orderItem.product_name}
                                  </p>
                                  <p className="text-sm text-slate-600">
                                    {orderItem.size} • {orderItem.color} • Qty:{" "}
                                    {orderItem.quantity}
                                  </p>
                                  <p className="text-sm font-medium text-slate-700">
                                    $
                                    {orderItem.price
                                      ? parseFloat(orderItem.price).toFixed(2)
                                      : "0.00"}{" "}
                                    each
                                  </p>
                                </div>
                              );
                            }
                          )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
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
          <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-32 mx-auto p-6 border border-slate-200/60 w-full max-w-md shadow-2xl rounded-2xl bg-white">
              <div className="mt-0">
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">
                    Verify Payment
                  </h3>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Bank Amount Verified ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={verificationForm.bankAmountVerified}
                      onChange={(e) =>
                        setVerificationForm({
                          ...verificationForm,
                          bankAmountVerified: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
                      placeholder="Enter verified amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Verification Notes
                    </label>
                    <textarea
                      value={verificationForm.verificationNotes}
                      onChange={(e) =>
                        setVerificationForm({
                          ...verificationForm,
                          verificationNotes: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
                      placeholder="Enter verification notes..."
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={verificationForm.approveOrder}
                        onChange={(e) =>
                          setVerificationForm({
                            ...verificationForm,
                            approveOrder: e.target.checked,
                          })
                        }
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-slate-700">
                        Approve order for processing
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleVerifyPayment}
                    disabled={
                      loading ||
                      !verificationForm.bankAmountVerified ||
                      !verificationForm.verificationNotes
                    }
                    className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 border border-transparent rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verifying..." : "Verify Payment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Release Modal */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-40 overflow-y-auto h-full w-full z-50 backdrop-blur-sm">
            <div className="relative top-32 mx-auto p-6 border border-slate-200/60 w-full max-w-md shadow-2xl rounded-2xl bg-white">
              <div className="mt-0">
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">
                    Release Payment
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Vendor Email
                    </label>
                    <input
                      type="email"
                      value={paymentForm.vendorEmail}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          vendorEmail: e.target.value,
                        })
                      }
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) =>
                        setPaymentForm({
                          ...paymentForm,
                          notes: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-slate-400 transition-all shadow-sm hover:border-slate-300"
                      placeholder="Payment notes..."
                    />
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold block mb-1">Amount Summary</span>
                      <span className="text-emerald-700 font-semibold">Amount to release:</span> <span className="text-emerald-900 font-bold">${selectedOrder.vendor_payment_amount || "Calculating..."}</span>
                      <br />
                      <span className="text-orange-600 font-semibold">Admin fee:</span> <span className="text-orange-900 font-bold">${selectedOrder.admin_fee || "Calculating..."}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-slate-200">
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReleasePayment}
                    disabled={loading || !paymentForm.vendorEmail}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 border border-transparent rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Releasing..." : "Release Payment"}
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