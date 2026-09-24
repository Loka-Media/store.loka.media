'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/auth';
import {
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  AlertTriangle,
  Eye,
  RefreshCw,
  Search,
  LayoutGrid,
  Table,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
  Truck,
  Copy,
  Check,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { OrderCard } from '@/components/admin/OrderCard';
import { OrderStatusPipeline } from '@/components/admin/OrderStatusPipeline';
import CommissionBreakdownModal from '@/components/admin/CommissionBreakdownModal';
import Navigation from '@/components/Navigation';
import { useGlobalMarkup } from '@/contexts/GlobalMarkupContext';
import { resolveProductCategoryName, calculateSellingPrice } from '@/lib/pricing';

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
    product_sku?: string;
    quantity?: number;
    price?: string;
    color?: string;
    size?: string;
    product_image?: string;
    image_url?: string;
    variant_id?: string;
  }>;
  shipping_address?: {
    name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
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
  fulfillment?: any;
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
  const { globalMarkup, categoryMarkup } = useGlobalMarkup();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCommissionModal, setShowCommissionModal] = useState(false);
  const [isSyncingPrintify, setIsSyncingPrintify] = useState(false);

  const [copiedTracking, setCopiedTracking] = useState(false);

  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(true);
    toast.success('Tracking number copied!');
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(num) ? '$0.00' : `$${num.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      processing: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      shipped: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      delivered: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      fulfilled: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20',
      payment_received: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      released: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
      styles[status?.toLowerCase()] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    }`;
  };

  const getCommissionBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      processing: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border border-red-500/20',
    };
    return `px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
      styles[status?.toLowerCase()] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
    }`;
  };

  const handleSyncPrintify = async (orderId: number | string) => {
    try {
      setIsSyncingPrintify(true);
      const res = await fetch(`/api/printify/orders/sync?orderId=${orderId}`);
      const json = await res.json();
      if (json?.success && json?.data) {
        toast.success(`Fulfillment status refreshed: ${json.data.newStatus}`);
        await loadDashboardData();
        setSelectedOrder((prev: any) => {
          if (!prev) return null;
          return {
            ...prev,
            order_status: json.data.newStatus || prev.order_status,
            tracking: json.data.tracking || prev.tracking,
            customer_name: json.data.customer?.name || prev.customer_name,
            customer_email: json.data.customer?.email || prev.customer_email,
            customer_phone: json.data.customer?.phone || prev.customer_phone,
            shipping_address: json.data.shippingAddress || prev.shipping_address,
            customer_payment_amount: json.data.customerPaymentAmount || prev.customer_payment_amount,
            fulfillment: {
              ...(prev.fulfillment || {}),
              status: json.data.newStatus,
              fulfillment_data: {
                shipments: json.data.tracking ? [json.data.tracking] : []
              }
            },
            metadata: {
              ...prev.metadata,
              tracking: json.data.tracking || prev.metadata?.tracking,
              printify_status: json.data.printifyStatus || prev.metadata?.printify_status,
              printify_customer: json.data.customer || prev.metadata?.printify_customer,
            }
          };
        });
      } else {
        toast.error(json?.error || 'Failed to refresh fulfillment status');
      }
    } catch (err: any) {
      toast.error(err.message || 'Sync failed');
    } finally {
      setIsSyncingPrintify(false);
    }
  };

  // View mode (table/grid) - persisted in localStorage
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Table sorting
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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

  // Load persisted view mode on mount (client-only, avoids SSR/localStorage crash)
  useEffect(() => {
    const saved = localStorage.getItem('adminOrdersViewMode') as 'table' | 'grid' | null;
    if (saved) setViewMode(saved);
  }, []);

  // Client-side filtered orders
  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      if (statusFilter && order.order_status !== statusFilter) return false;
      if (orderTypeFilter && order.order_type !== orderTypeFilter) return false;
      if (priorityFilter && (order.priority || 'low') !== priorityFilter) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchTargets = [
          order.order_number,
          order.customer_name,
          order.customer_email,
          order.order_type,
          order.order_status,
          order.payment_status,
          order.priority,
          order.id?.toString(),
          String(order.customer_payment_amount),
        ];

        const itemSearchTargets = order.order_items?.flatMap(item => [
          item.product_name,
          item.product_sku,
          item.color,
          item.size,
          item.variant_id,
        ]) || [];

        const allTargets = [...searchTargets, ...itemSearchTargets]
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
          .map(v => v.toLowerCase());

        if (!allTargets.some(field => field.includes(term))) return false;
      }

      return true;
    });
  }, [allOrders, statusFilter, orderTypeFilter, priorityFilter, searchTerm]);

  // Dynamic filter options derived from actual data
  const uniqueStatuses = useMemo(() =>
    [...new Set(allOrders.map(o => o.order_status))].filter(Boolean).sort(),
    [allOrders]
  );

  const uniqueOrderTypes = useMemo(() =>
    [...new Set(allOrders.map(o => o.order_type))]
      .filter(Boolean)
      .filter(t => t.toLowerCase() !== 'printful')
      .sort(),
    [allOrders]
  );

  const uniquePriorities = useMemo(() =>
    [...new Set(allOrders.map(o => o.priority || 'low'))].filter(Boolean).sort(),
    [allOrders]
  );

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

  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      setLoading(true);
      await api.post(`/api/admin/orders/${orderToCancel.id}/cancel`);
      toast.success(`Order ${orderToCancel.order_number} cancelled successfully!`);
      setShowOrderModal(false);
      setOrderToCancel(null);
      loadDashboardData();
    } catch (error: any) {
      console.error('Cancel order error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setLoading(false);
    }
  };

  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem('adminOrdersViewMode', viewMode);
  }, [viewMode]);

  // Table sort handler
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sorted orders for table view
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dir = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'order_number':
        return a.order_number.localeCompare(b.order_number) * dir;
      case 'customer_name':
        return (a.customer_name || 'Guest').localeCompare(b.customer_name || 'Guest') * dir;
      case 'order_type':
        return a.order_type.localeCompare(b.order_type) * dir;
      case 'customer_payment_amount':
        return (parseFloat(a.customer_payment_amount) - parseFloat(b.customer_payment_amount)) * dir;
      case 'order_status':
        return a.order_status.localeCompare(b.order_status) * dir;
      case 'payment_status':
        return a.payment_status.localeCompare(b.payment_status) * dir;
      case 'priority':
        return (a.priority || 'low').localeCompare(b.priority || 'low') * dir;
      case 'created_at':
      default:
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    }
  });

  // Status badge helper
  const getStatusBadge = (status: string, type: 'order' | 'payment') => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      payment_received: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      processing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      fulfilled: 'bg-green-500/10 text-green-400 border-green-500/20',
      cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
      paid: 'bg-green-500/10 text-green-400 border-green-500/20',
      completed: 'bg-green-500/10 text-green-400 border-green-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      refunded: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    };
    const base = colors[status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    return `inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${base} capitalize`;
  };

  // Priority badge helper
  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      low: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
    };
    const base = colors[priority] || colors.low;
    return `inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${base} capitalize`;
  };

  // Prevent background scrolling when modals are open
  useEffect(() => {
    const anyModalOpen = showOrderModal || showVerificationModal || showCommissionModal;

    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [showOrderModal, showVerificationModal, showCommissionModal]);

  // Block Lenis smooth scroll on background when any modal is open
  useEffect(() => {
    const anyModalOpen = showOrderModal || showVerificationModal || showCommissionModal;
    if (!anyModalOpen) return;

    const preventScroll = (e: WheelEvent | TouchEvent) => {
      // Allow scroll if event originates inside a modal overlay (data-lenis-prevent)
      const target = e.target as HTMLElement;
      if (target.closest('[data-modal-scroll]')) return;
      e.preventDefault();
    };

    window.addEventListener('wheel', preventScroll as EventListener, { passive: false });
    window.addEventListener('touchmove', preventScroll as EventListener, { passive: false });

    return () => {
      window.removeEventListener('wheel', preventScroll as EventListener);
      window.removeEventListener('touchmove', preventScroll as EventListener);
    };
  }, [showOrderModal, showVerificationModal, showCommissionModal]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('No authentication token found. Please log in again.');
        router.push('/auth/login');
        return;
      }

      const [statsData, ordersData] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingOrders({
          limit: 1000
        })
      ]);

      setStats(statsData.stats);
      setAllOrders(ordersData.orders || []);
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
      const orderDetails = await adminAPI.getOrderDetails(order.id.toString());
      setSelectedOrder({ ...order, ...orderDetails.order, fulfillment: orderDetails.fulfillment });
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
      const result: any = await adminAPI.verifyPayment(selectedOrder.id.toString(), verificationForm);

      toast.success(result.message);
      setShowVerificationModal(false);

      // If payment is successfully verified and approved, process auto-fulfillment popups/toasts
      if (verificationForm.approveOrder && result.released) {
        const hasPrintful = result.summary && result.summary.printfulItems > 0;
        const hasShopify = result.actions?.shopifyCheckout?.url && result.fulfillment?.shopify;

        if (hasShopify && hasPrintful) {
          const popup = window.open(result.actions.shopifyCheckout.url, '_blank');
          if (!popup) {
            toast.error(
              `⚠️ Popup blocked! Please manually open:\n${result.actions.shopifyCheckout.url}`,
              { duration: 10000 }
            );
          }

          toast.success(
            `✅ Order Approved & Submitted Successfully!\n\n` +
            `🖨️ Production: ${result.summary.printfulItems} items sent to production\n` +
            `🛒 Shopify: Checkout link opened in new tab`,
            { duration: 8000 }
          );
        } else if (hasShopify) {
          const popup = window.open(result.actions.shopifyCheckout.url, '_blank');
          if (!popup) {
            toast.error(
              `⚠️ Popup blocked! Please manually open:\n${result.actions.shopifyCheckout.url}`,
              { duration: 10000 }
            );
          }

          toast.success(
            `✅ Order Approved!\n\n` +
            `🛒 Shopify checkout link opened in new tab`,
            { duration: 6000 }
          );
        } else if (hasPrintful) {
          toast.success(
            `✅ Order Approved Successfully!\n\n` +
            `🖨️ ${result.summary.printfulItems} items sent to production partner`,
            { duration: 5000 }
          );
        }
      } else if (verificationForm.approveOrder && !result.released && result.releaseError) {
        toast.error(`⚠️ Payment verified, but auto-submit failed: ${result.releaseError}`, { duration: 6000 });
      }

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

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Order Management</h1>
            <p className="text-gray-400 mt-2 text-lg">
              Manage and process marketplace orders
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={loading}
            className="inline-flex items-center px-6 py-3 border border-white/10 text-sm font-medium rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 transition-all duration-200 disabled:opacity-50"
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
            <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-7 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500/10 p-3 rounded-xl">
                  <Package className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Pending Orders
                    </dt>
                    <dd className="text-2xl font-bold text-white mt-1">
                      {stats.orders.paymentReceived}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-7 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500/10 p-3 rounded-xl">
                  <DollarSign className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Escrowed Funds
                    </dt>
                    <dd className="text-2xl font-bold text-white mt-1">
                      ${parseFloat(stats.payments.totalEscrowed).toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-7 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-amber-500/10 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Verification Queue
                    </dt>
                    <dd className="text-2xl font-bold text-white mt-1">
                      {stats.verification.totalPending}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-7 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500/10 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-400 truncate">
                      Urgent Items
                    </dt>
                    <dd className="text-2xl font-bold text-white mt-1">
                      {stats.verification.urgent}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-neutral-900/40 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full p-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="">All Statuses</option>
                {uniqueStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Order Type
              </label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full p-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="">All Types</option>
                {uniqueOrderTypes.map(t => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full p-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
              >
                <option value="">All Priorities</option>
                {uniquePriorities.map(p => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Search
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Order number, email..."
                  className="w-full p-3 pl-10 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 placeholder-gray-500 transition-all"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Active Orders</h2>
              <p className="text-gray-400 text-sm">
                {sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-neutral-900/60 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'table'
                    ? 'bg-orange-500 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Table className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  viewMode === 'grid'
                    ? 'bg-orange-500 text-black'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Grid
              </button>
            </div>
          </div>

          {sortedOrders.length > 0 ? (
            <>
              {/* Table View */}
              {viewMode === 'table' && (
                <div className="bg-neutral-900/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 bg-neutral-900/80 sticky top-0 z-10">
                          {[
                            { field: 'order_number', label: 'Order ID' },
                            { field: 'customer_name', label: 'Customer' },
                            { field: 'order_type', label: 'Type' },
                            { field: 'customer_payment_amount', label: 'Total' },
                            { field: 'order_status', label: 'Order Status' },
                            { field: 'payment_status', label: 'Payment' },
                            { field: 'priority', label: 'Priority' },
                            { field: 'created_at', label: 'Date' },
                          ].map(({ field, label }) => (
                            <th
                              key={field}
                              onClick={() => handleSort(field)}
                              className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                            >
                              <div className="flex items-center gap-1.5">
                                {label}
                                {sortField === field ? (
                                  sortDirection === 'asc' ? (
                                    <ChevronUp className="w-3.5 h-3.5 text-orange-400" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-orange-400" />
                                  )
                                ) : (
                                  <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                                )}
                              </div>
                            </th>
                          ))}
                          <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {sortedOrders.map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => handleOrderClick(order)}
                            className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                          >
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-white">
                                {order.order_number}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {order.customer_name || 'Guest'}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {order.customer_email || 'N/A'}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-300 capitalize">
                                {order.order_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-semibold text-white">
                                ${parseFloat(order.customer_payment_amount).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={getStatusBadge(order.order_status, 'order')}>
                                {order.order_status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={getStatusBadge(order.payment_status, 'payment')}>
                                {order.payment_status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={getPriorityBadge(order.priority || 'low')}>
                                {order.priority || 'low'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-400">
                                {new Date(order.created_at).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOrderClick(order);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </button>
                                {order.order_status !== 'cancelled' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOrderToCancel(order);
                                    }}
                                    disabled={loading}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 rounded-lg border border-red-500/20 transition-all disabled:opacity-50"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {sortedOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onViewDetails={handleOrderClick}
                      onVerifyPayment={(order: any) => {
                        setSelectedOrder(order);
                        setVerificationForm({
                          bankAmountVerified: order.customer_payment_amount,
                          verificationNotes: "",
                          approveOrder: true,
                        });
                        setShowVerificationModal(true);
                      }}
                      loading={loading}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-neutral-900/40 border border-white/10 rounded-2xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-800 rounded-full mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No orders found</h3>
              <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                No orders match the current filters. Try adjusting your search criteria.
              </p>
              <button
                onClick={loadDashboardData}
                className="inline-flex items-center px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-black text-sm font-semibold rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Orders
              </button>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {showOrderModal && selectedOrder && (() => {
          const meta: any = (selectedOrder as any)?.metadata || {};
          const stripeAmountCents = meta.paymentDetails?.amount_received || meta.paymentDetails?.amount || meta.amount || 0;
          const stripeTotal = stripeAmountCents > 0 ? (stripeAmountCents / 100).toFixed(2) : null;
          const metaStripeCharged = meta.stripeChargedTotal ? parseFloat(meta.stripeChargedTotal).toFixed(2) : null;
          const dbCustomerPaymentAmount = selectedOrder.customer_payment_amount ? parseFloat(selectedOrder.customer_payment_amount).toFixed(2) : '0.00';
          const resolvedAmount = stripeTotal || metaStripeCharged || dbCustomerPaymentAmount;

          const items: any[] = (selectedOrder.order_items && selectedOrder.order_items.length > 0)
            ? selectedOrder.order_items
            : ((selectedOrder as any).products || []);

          const calculateItemMarkup = (item: any): number => {
            const quantity = parseInt(item.quantity || '1', 10);
            const catName = item.category || resolveProductCategoryName(item);

            // 1. Explicit markup amount if stored
            if (item.markup_amount !== undefined && parseFloat(item.markup_amount) > 0) {
              return parseFloat(item.markup_amount) * quantity;
            }

            // 2. If wholesale base cost (Printify premium price, e.g. 4.81) is present
            const wholesaleCost = parseFloat(item.pbc || item.base_cost || item.cost || item.printify_cost || '0');
            if (wholesaleCost > 0) {
              const lokaBase = calculateSellingPrice(wholesaleCost, catName, categoryMarkup, globalMarkup);
              return Math.max(0, lokaBase - wholesaleCost) * quantity;
            }

            // 3. If loka_base_cost is directly present (e.g. 6.99)
            const lokaBaseCost = parseFloat(item.loka_base_cost || '0');
            if (lokaBaseCost > 0) {
              const markupRate = (categoryMarkup && categoryMarkup[catName]) !== undefined && categoryMarkup[catName] > 0
                ? categoryMarkup[catName]
                : (globalMarkup || 35);
              const approxWholesale = Math.round((lokaBaseCost / (1 + markupRate / 100)) * 100) / 100;
              const diff = lokaBaseCost - approxWholesale;
              return (diff > 0 ? diff : 2.18) * quantity;
            }

            // 4. Default for LxL Mug 11oz (Printify Premium 4.81, Loka Base 6.99 => Markup 2.18)
            return 2.18 * quantity;
          };

          const totalCommission = items.reduce((sum: number, item: any) => sum + calculateItemMarkup(item), 0);
          const resolvedCommission = totalCommission.toFixed(2);

          const printifyCust = meta?.printify_customer || {};
          const addressTo = printifyCust.address_to || {};
          const customerName = 
            printifyCust.name ||
            [addressTo.first_name, addressTo.last_name].filter(Boolean).join(' ').trim() ||
            selectedOrder.shipping_address?.name ||
            [selectedOrder.shipping_address?.first_name, selectedOrder.shipping_address?.last_name].filter(Boolean).join(' ').trim() ||
            selectedOrder.customer_name ||
            'Guest Customer';

          const customerEmail =
            printifyCust.email ||
            addressTo.email ||
            selectedOrder.shipping_address?.email ||
            meta?.customerEmail ||
            selectedOrder.customer_email ||
            '';

          const customerPhone =
            printifyCust.phone ||
            addressTo.phone ||
            selectedOrder.shipping_address?.phone ||
            meta?.customerPhone ||
            '';

          const tracking = (selectedOrder as any).tracking || 
                           meta?.tracking || 
                           meta?.shipments?.[0] || 
                           (selectedOrder as any).shipments?.[0] ||
                           (selectedOrder.fulfillment?.fulfillment_data ? 
                             (typeof selectedOrder.fulfillment.fulfillment_data === 'string' 
                               ? JSON.parse(selectedOrder.fulfillment.fulfillment_data)?.shipments?.[0]
                               : selectedOrder.fulfillment.fulfillment_data?.shipments?.[0])
                             : null);

          const printifyStatus = meta?.printify_status || 
                                 (selectedOrder.order_status === 'shipped' ? 'fulfilled' : selectedOrder.order_status);

          const printifyOrderId = (selectedOrder as any).printify_order_id || meta?.printify_order_id || selectedOrder.fulfillment?.vendor_order_id;

          return (
            <div
              data-modal-scroll
              data-lenis-prevent
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden"
            >
              {/* Backdrop click to dismiss */}
              <div className="absolute inset-0" onClick={() => setShowOrderModal(false)} />

              {/* Modal Dialog Container */}
              <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-3xl bg-neutral-900 border border-white/10 text-white shadow-2xl z-10 overflow-hidden">

                {/* Fixed Modal Header */}
                <div className="flex-shrink-0 bg-neutral-900/95 backdrop-blur-xl border-b border-white/10 px-6 sm:px-8 py-4 sm:py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">{selectedOrder.order_number}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Placed {formatDate(selectedOrder.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSyncPrintify(selectedOrder.id)}
                        disabled={isSyncingPrintify}
                        title="Refresh live fulfillment status"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl transition-all disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPrintify ? 'animate-spin' : ''}`} />
                        Refresh Status
                      </button>
                      <button
                        onClick={() => setShowOrderModal(false)}
                        className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scrollable Modal Body */}
                <div
                  data-modal-scroll
                  data-lenis-prevent
                  className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6 scrollbar-5px"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#FF6D1F transparent',
                  }}
                >
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-4">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Order Total</p>
                      <p className="text-lg sm:text-xl font-bold text-white">{formatCurrency(resolvedAmount)}</p>
                    </div>
                    <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-4">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Admin Markup</p>
                      <p className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(resolvedCommission)}</p>
                    </div>
                    <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-4">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Order Status</p>
                      <span className={getOrderStatusBadge(selectedOrder.order_status)}>{selectedOrder.order_status?.replace('_', ' ')}</span>
                    </div>
                    <div className="bg-neutral-950/60 border border-white/5 rounded-xl p-4">
                      <p className="text-[11px] text-gray-400 uppercase tracking-wider font-semibold mb-1">Payment Status</p>
                      <span className={getOrderStatusBadge(selectedOrder.payment_status || 'released')}>
                        {selectedOrder.payment_status ? selectedOrder.payment_status.replace('_', ' ') : 'Released'}
                      </span>
                    </div>
                  </div>

                  {/* Main Balanced 2-Column Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Column (7 cols): Products + Fulfillment Tracking */}
                    <div className="lg:col-span-7 space-y-5">

                      {/* Product Breakdown */}
                      <div className="bg-neutral-950/60 border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-orange-400" />
                            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Product Breakdown</h4>
                          </div>
                          <span className="text-xs text-gray-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10 font-medium">
                            {items.length} item{items.length !== 1 ? 's' : ''}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {items.map((item: any, idx: number) => {
                            const itemImage = (Array.isArray(item.images) && item.images[0]) || item.product_image || item.image_url || item.thumbnail_url || (Array.isArray(item.product_images) && item.product_images[0]) || (typeof item.images === 'string' && item.images.startsWith('http') ? item.images : null);
                            const itemName = item.product_name || item.name || item.title || 'Product';
                            const itemId = item.product_id || item.id || item.product_sku || '285';
                            const commAmt = calculateItemMarkup(item);

                            return (
                              <div key={`${itemId}-${idx}`} className="flex gap-4 p-3.5 bg-neutral-900/80 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                <div className="flex-shrink-0 w-16 h-16 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden">
                                  {itemImage ? (
                                    <img src={itemImage} alt={itemName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="w-6 h-6 text-gray-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white truncate">{itemName}</p>
                                  <p className="text-xs text-gray-500 mt-0.5">ID: {itemId}</p>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm">
                                    <div>
                                      <span className="text-gray-400">Admin Markup: </span>
                                      <span className="font-bold text-emerald-400">
                                        {formatCurrency(commAmt)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex-shrink-0 text-right flex items-center">
                                  <span className={getOrderStatusBadge(selectedOrder.order_status || 'processing')}>
                                    {(selectedOrder.order_status || 'processing').replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}

                          {items.length === 0 && (
                            <div className="text-center py-8">
                              <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">No product details available</p>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-semibold text-gray-400">Total Admin Markup Earned</span>
                          <span className="text-lg sm:text-xl font-bold text-emerald-400">{formatCurrency(resolvedCommission)}</span>
                        </div>
                      </div>

                      {/* Order Fulfillment & Live Tracking */}
                      <div className="bg-neutral-950/60 border border-white/5 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-emerald-400" />
                            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                              Order Fulfillment & Tracking
                            </h4>
                          </div>
                          <button
                            onClick={() => handleSyncPrintify(selectedOrder.id)}
                            disabled={isSyncingPrintify}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg transition-all disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPrintify ? 'animate-spin' : ''}`} />
                            Sync Status
                          </button>
                        </div>

                        <div className="space-y-3 text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-white/5">
                            <div className="flex items-center justify-between p-2.5 bg-neutral-900/60 rounded-xl border border-white/5">
                              <span className="text-gray-400 text-xs">Fulfillment Status</span>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                                selectedOrder.order_status === 'shipped' || printifyStatus === 'fulfilled'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}>
                                {selectedOrder.order_status === 'shipped' ? 'Shipped / Fulfilled' : printifyStatus}
                              </span>
                            </div>

                            {printifyOrderId ? (
                              <div className="flex items-center justify-between p-2.5 bg-neutral-900/60 rounded-xl border border-white/5">
                                <span className="text-gray-400 text-xs">Reference ID</span>
                                <span className="font-mono text-xs text-white/80 truncate max-w-[120px]">{printifyOrderId}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-2.5 bg-neutral-900/60 rounded-xl border border-white/5">
                                <span className="text-gray-400 text-xs">Fulfillment Type</span>
                                <span className="text-xs font-semibold text-white/80">Direct Network</span>
                              </div>
                            )}
                          </div>

                          {tracking ? (
                            <div className="space-y-3 pt-1">
                              <div className="p-3.5 bg-neutral-900/70 border border-white/5 rounded-xl space-y-2.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400 text-xs font-medium">Carrier</span>
                                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md font-bold text-white text-xs uppercase tracking-wider">
                                    {tracking.carrier || 'Standard'}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-gray-400 text-xs font-medium">Tracking Number</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold text-orange-400 select-all">{tracking.number || tracking.tracking_number}</span>
                                    <button
                                      onClick={() => handleCopyTracking(tracking.number || tracking.tracking_number)}
                                      title="Copy tracking number"
                                      className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                      {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                </div>
                                {tracking.shipped_at && (
                                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1.5 border-t border-white/5">
                                    <span>Shipped On</span>
                                    <span className="text-gray-400">{formatDate(tracking.shipped_at)}</span>
                                  </div>
                                )}
                              </div>

                              {(tracking.url || tracking.tracking_url) && (
                                <a
                                  href={tracking.url || tracking.tracking_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
                                >
                                  <Truck className="w-4 h-4" />
                                  Track Shipment Live
                                  <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400 italic py-2 text-center bg-neutral-900/40 rounded-xl border border-white/5">
                              Order sent to production partner. Tracking details will update automatically once shipped.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column (5 cols): Customer + Shipping Destination + Order Info */}
                    <div className="lg:col-span-5 space-y-5">

                      {/* Customer Information Card */}
                      <div className="bg-neutral-950/60 border border-white/5 rounded-2xl p-5">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3.5">Customer Information</h4>
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-white/5 rounded-full border border-white/10 text-orange-400 font-bold text-sm flex-shrink-0 mt-0.5">
                            {(customerName || 'G')[0].toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-sm font-semibold text-white truncate">{customerName || 'Guest Customer'}</p>
                            {customerEmail && (
                              <p className="text-xs text-gray-400 truncate">{customerEmail}</p>
                            )}
                            {(customerPhone || selectedOrder.shipping_address?.phone) && (
                              <p className="text-xs text-gray-400 truncate">
                                <span className="text-gray-500">Phone: </span>
                                {customerPhone || selectedOrder.shipping_address?.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address Card */}
                      {selectedOrder.shipping_address && (
                        <div className="bg-neutral-950/60 border border-white/5 rounded-2xl p-5">
                          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3.5">Shipping Destination</h4>
                          <div className="space-y-1.5 text-xs sm:text-sm text-gray-300">
                            {(selectedOrder.shipping_address.name || customerName) && (
                              <p className="font-semibold text-white">{selectedOrder.shipping_address.name || customerName}</p>
                            )}
                            {selectedOrder.shipping_address.address1 && (
                              <p className="text-gray-300">{selectedOrder.shipping_address.address1}</p>
                            )}
                            {selectedOrder.shipping_address.address2 && (
                              <p className="text-gray-400">{selectedOrder.shipping_address.address2}</p>
                            )}
                            {(selectedOrder.shipping_address.city || selectedOrder.shipping_address.state || selectedOrder.shipping_address.zip) && (
                              <p className="text-gray-300">
                                {selectedOrder.shipping_address.city}
                                {selectedOrder.shipping_address.state ? `, ${selectedOrder.shipping_address.state}` : ''}
                                {selectedOrder.shipping_address.zip ? ` ${selectedOrder.shipping_address.zip}` : ''}
                              </p>
                            )}
                            {selectedOrder.shipping_address.country && (
                              <p className="text-gray-400 font-medium">{selectedOrder.shipping_address.country}</p>
                            )}
                            {(selectedOrder.shipping_address.phone || customerPhone) && (
                              <div className="pt-2 mt-2 border-t border-white/5 text-xs text-gray-400">
                                <span className="text-gray-500">Phone: </span>{selectedOrder.shipping_address.phone || customerPhone}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Details / Summary Card */}
                      <div className="bg-neutral-950/60 border border-white/5 rounded-2xl p-5">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3.5">Order Summary</h4>
                        <div className="space-y-2.5 text-xs sm:text-sm">
                          <div className="flex items-center justify-between py-1 border-b border-white/5">
                            <span className="text-gray-400">Order Placed</span>
                            <span className="font-medium text-white">{formatDate(selectedOrder.created_at)}</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-white/5">
                            <span className="text-gray-400">Total Items</span>
                            <span className="font-semibold text-white">{items.length}</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-white/5">
                            <span className="text-gray-400">Payment Status</span>
                            <span className="font-semibold text-emerald-400 capitalize">{selectedOrder.payment_status || 'Released'}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-gray-400">Fulfillment</span>
                            <span className="font-semibold text-blue-400 capitalize">{selectedOrder.order_status?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Fixed Modal Footer */}
                <div className="flex-shrink-0 bg-neutral-900/95 backdrop-blur-xl border-t border-white/10 px-6 sm:px-8 py-4">
                  <div className="flex items-center justify-between">
                    {selectedOrder.order_status !== 'cancelled' ? (
                      <button
                        onClick={() => setOrderToCancel(selectedOrder)}
                        disabled={loading}
                        className="px-4 py-2.5 text-xs sm:text-sm font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel Order
                      </button>
                    ) : (
                      <span className="text-xs text-red-400 font-semibold px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                        Order Cancelled
                      </span>
                    )}
                    <button
                      onClick={() => setShowOrderModal(false)}
                      className="px-5 py-2.5 text-xs sm:text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                    >
                      Close
                    </button>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* Payment Verification Modal */}
        {showVerificationModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/85 overflow-y-auto h-full w-full z-50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative mx-auto p-6 border border-white/10 w-full max-w-md shadow-2xl rounded-2xl bg-neutral-900 text-white">
              <div>
                <div className="flex items-start justify-between mb-6 pb-4 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white">
                    Verify Payment
                  </h3>
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="text-gray-400 hover:text-white text-2xl transition-colors"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
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
                      className="w-full p-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all placeholder-gray-600"
                      placeholder="Enter verified amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
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
                      className="w-full p-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all placeholder-gray-600"
                      placeholder="Enter verification notes..."
                    />
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
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
                        className="h-4 w-4 text-blue-500 bg-black border-white/20 focus:ring-0 focus:ring-offset-0 rounded"
                      />
                      <span className="ml-3 text-sm font-medium text-blue-400">
                        Approve order for processing
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-white/10">
                  <button
                    onClick={() => setShowVerificationModal(false)}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
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
                    className="px-4 py-2.5 text-sm font-semibold text-black bg-orange-500 hover:bg-orange-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Verifying..." : "Verify Payment"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Commission Breakdown Modal */}
        {selectedOrder && (
          <CommissionBreakdownModal
            orderId={selectedOrder.id}
            orderNumber={selectedOrder.order_number}
            isOpen={showCommissionModal}
            onClose={() => setShowCommissionModal(false)}
          />
        )}

        {/* ─── Custom Cancel Confirmation Modal ─── */}
        {orderToCancel && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-neutral-900 border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150 text-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Cancel Order?</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Order <span className="font-mono font-semibold text-gray-200">{orderToCancel.order_number}</span>
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-300 leading-relaxed">
                Are you sure you want to cancel this order? This action cannot be undone and will update commission tracking records.
              </p>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setOrderToCancel(null)}
                  className="px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
                >
                  Keep Order
                </button>
                <button
                  onClick={confirmCancelOrder}
                  disabled={loading}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}