'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/auth';
import {
  Package,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Eye,
  RefreshCw,
  Search,
  LayoutGrid,
  Table,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  X,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navigation from '@/components/Navigation';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Product {
  product_id: number;
  product_name: string;
  order_amount: string;
  commission_amount: string;
  status: string;
  tracked_at: string;
  paid_at: string | null;
  images: string[];
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
  updated_at: string;
  printful_order_id: string | null;
  printful_draft_order_key: string | null;
  total_commission: string;
  products_count: number;
  commission_statuses: string[];
  products: Product[];
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
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOrderStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending:          'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    payment_received: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    verified:         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    processing:       'bg-purple-500/10 text-purple-400 border-purple-500/20',
    fulfilled:        'bg-green-500/10 text-green-400 border-green-500/20',
    cancelled:        'bg-red-500/10 text-red-400 border-red-500/20',
    completed:        'bg-green-500/10 text-green-400 border-green-500/20',
  };
  const base = map[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return `inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${base} capitalize`;
};

const getCommissionBadge = (status: string) => {
  const map: Record<string, string> = {
    pending:    'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    paid:       'bg-green-500/10 text-green-400 border-green-500/20',
    refunded:   'bg-orange-500/10 text-orange-400 border-orange-500/20',
    mixed:      'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };
  const base = map[status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  return `inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${base} capitalize`;
};

const getCommissionStatusSummary = (statuses: string[]) => {
  if (!statuses || statuses.length === 0) return 'pending';
  const unique = [...new Set(statuses)];
  return unique.length === 1 ? unique[0] : 'mixed';
};

const formatCurrency = (amount: string | number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    typeof amount === 'string' ? parseFloat(amount) : amount
  );

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreatorOrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  const confirmCancelOrder = async () => {
    if (!orderToCancel) return;
    try {
      setCancellingId(orderToCancel.id);
      await api.post(`/api/creator/orders/${orderToCancel.id}/cancel`);
      toast.success(`Order ${orderToCancel.order_number} cancelled successfully!`);
      setShowModal(false);
      setOrderToCancel(null);
      loadOrders();
    } catch (error: any) {
      console.error('Cancel order error:', error);
      toast.error(error.response?.data?.error || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [commissionFilter, setCommissionFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const totalRevenue = useMemo(
    () => allOrders.reduce((acc, o) => acc + parseFloat(o.customer_payment_amount || '0'), 0),
    [allOrders]
  );
  const totalCommission = useMemo(
    () => allOrders.reduce((acc, o) => acc + parseFloat(o.total_commission || '0'), 0),
    [allOrders]
  );
  const pendingCommission = useMemo(
    () =>
      allOrders
        .filter(o => getCommissionStatusSummary(o.commission_statuses) === 'pending')
        .reduce((acc, o) => acc + parseFloat(o.total_commission || '0'), 0),
    [allOrders]
  );

  useEffect(() => {
    const saved = localStorage.getItem('creatorOrdersViewMode') as 'table' | 'grid' | null;
    if (saved) setViewMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('creatorOrdersViewMode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (showModal) {
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
  }, [showModal]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    loadOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get<OrdersResponse>('/api/creator/orders', {
        params: { limit: 1000, offset: 0 },
      });
      setAllOrders(response.data.data || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err?.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      if (statusFilter && order.order_status !== statusFilter) return false;
      if (commissionFilter && getCommissionStatusSummary(order.commission_statuses) !== commissionFilter) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        const targets = [
          order.order_number,
          order.customer_name,
          order.customer_email,
          order.order_type,
          order.order_status,
          ...order.products.map(p => p.product_name),
        ]
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
          .map(v => v.toLowerCase());
        if (!targets.some(f => f.includes(t))) return false;
      }
      return true;
    });
  }, [allOrders, statusFilter, commissionFilter, searchTerm]);

  const uniqueStatuses = useMemo(
    () => [...new Set(allOrders.map(o => o.order_status))].filter(Boolean).sort(),
    [allOrders]
  );
  const uniqueCommissions = useMemo(
    () => [...new Set(allOrders.map(o => getCommissionStatusSummary(o.commission_statuses)))].filter(Boolean).sort(),
    [allOrders]
  );

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDir('asc'); }
  };

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'order_number': return a.order_number.localeCompare(b.order_number) * dir;
      case 'order_type':   return a.order_type.localeCompare(b.order_type) * dir;
      case 'order_status': return a.order_status.localeCompare(b.order_status) * dir;
      case 'customer_payment_amount':
        return (parseFloat(a.customer_payment_amount) - parseFloat(b.customer_payment_amount)) * dir;
      case 'total_commission':
        return (parseFloat(a.total_commission) - parseFloat(b.total_commission)) * dir;
      case 'products_count': return (a.products_count - b.products_count) * dir;
      default:
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
    }
  });

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (
      sortDir === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5 text-orange-400" />
        : <ChevronDown className="w-3.5 h-3.5 text-orange-400" />
    ) : (
      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
    );

  if (loading && allOrders.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
      </div>
    );
  }

  return (
    <CreatorProtectedRoute>
      <div className="min-h-screen bg-black text-white">
        <Navigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Order Management
              </h1>
              <p className="text-gray-400 mt-2 text-lg">
                Track orders containing your products and your commissions
              </p>
            </div>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-white/10 text-sm font-medium rounded-xl text-white bg-neutral-900 hover:bg-neutral-800 transition-all duration-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {[
              { icon: <ShoppingBag className="h-6 w-6 text-blue-400" />, bg: 'bg-blue-500/10', label: 'Total Orders', value: String(allOrders.length) },
              { icon: <DollarSign className="h-6 w-6 text-green-400" />, bg: 'bg-green-500/10', label: 'Total Revenue', value: formatCurrency(totalRevenue) },
              { icon: <TrendingUp className="h-6 w-6 text-orange-400" />, bg: 'bg-orange-500/10', label: 'Total Commission', value: formatCurrency(totalCommission) },
              { icon: <Clock className="h-6 w-6 text-yellow-400" />, bg: 'bg-yellow-500/10', label: 'Pending Commission', value: formatCurrency(pendingCommission) },
            ].map(({ icon, bg, label, value }) => (
              <div key={label} className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-7 hover:border-white/20 transition-all duration-200">
                <div className="flex items-center">
                  <div className={`flex-shrink-0 ${bg} p-3 rounded-xl`}>{icon}</div>
                  <div className="ml-4 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-400 truncate">{label}</dt>
                    <dd className="text-2xl font-bold text-white mt-1">{value}</dd>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="bg-neutral-900/40 backdrop-blur-sm rounded-2xl border border-white/10 p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Order Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full p-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Commission Status</label>
                <select
                  value={commissionFilter}
                  onChange={e => setCommissionFilter(e.target.value)}
                  className="w-full p-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 transition-all cursor-pointer"
                >
                  <option value="">All Commissions</option>
                  {uniqueCommissions.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-3">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Order number, product, customer..."
                    className="w-full p-3 pl-10 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-orange-500 placeholder-gray-500 transition-all"
                  />
                  <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Orders Section ── */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Active Orders</h2>
                <p className="text-gray-400 text-sm">
                  {sortedOrders.length} order{sortedOrders.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="flex items-center bg-neutral-900/60 border border-white/10 rounded-xl p-1">
                {(['table', 'grid'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      viewMode === mode ? 'bg-orange-500 text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {mode === 'table' ? <Table className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
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
                              { field: 'order_number',            label: 'Order ID' },
                              { field: 'products_count',          label: 'Products' },
                              { field: 'customer_payment_amount', label: 'Order Total' },
                              { field: 'total_commission',        label: 'Commission' },
                              { field: 'order_status',            label: 'Order Status' },
                              { field: 'created_at',              label: 'Date' },
                            ].map(({ field, label }) => (
                              <th
                                key={field}
                                onClick={() => handleSort(field)}
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                              >
                                <div className="flex items-center gap-1.5">
                                  {label}
                                  <SortIcon field={field} />
                                </div>
                              </th>
                            ))}
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Commission Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {sortedOrders.map(order => (
                            <tr
                              key={order.id}
                              onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                              className="hover:bg-white/[0.02] transition-colors cursor-pointer"
                            >
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-white">{order.order_number}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-300">{order.products_count}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-semibold text-white">{formatCurrency(order.customer_payment_amount)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-emerald-400">{formatCurrency(order.total_commission)}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={getOrderStatusBadge(order.order_status)}>{order.order_status.replace('_', ' ')}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-400">{formatDate(order.created_at)}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <span className={getCommissionBadge(getCommissionStatusSummary(order.commission_statuses))}>
                                  {getCommissionStatusSummary(order.commission_statuses)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={e => { e.stopPropagation(); setSelectedOrder(order); setShowModal(true); }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </button>
                                  {order.order_status !== 'cancelled' && (
                                    <button
                                      onClick={e => { e.stopPropagation(); setOrderToCancel(order); }}
                                      disabled={cancellingId === order.id}
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
                    {sortedOrders.map(order => (
                      <div
                        key={order.id}
                        onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                        className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">{order.order_number}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{formatDate(order.created_at)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={getOrderStatusBadge(order.order_status)}>{order.order_status.replace('_', ' ')}</span>
                            <span className={getCommissionBadge(getCommissionStatusSummary(order.commission_statuses))}>
                              {getCommissionStatusSummary(order.commission_statuses)} commission
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                          {[
                            { label: 'Revenue', value: formatCurrency(order.customer_payment_amount), cn: 'text-white' },
                            { label: 'Commission', value: formatCurrency(order.total_commission), cn: 'text-emerald-400' },
                            { label: 'Products', value: String(order.products_count), cn: 'text-white' },
                          ].map(({ label, value, cn }) => (
                            <div key={label} className="bg-black/40 rounded-xl p-3 border border-white/5">
                              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{label}</p>
                              <p className={`text-sm font-bold ${cn}`}>{value}</p>
                            </div>
                          ))}
                        </div>

                        {order.products && order.products.length > 0 && (
                          <div className="flex items-center gap-2 mb-4">
                            {order.products.slice(0, 4).map((p, i) => (
                              <div key={i} className="w-10 h-10 rounded-lg border border-white/10 bg-neutral-800 overflow-hidden flex-shrink-0">
                                {p.images && p.images.length > 0 ? (
                                  <img src={p.images[0]} alt={p.product_name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-4 h-4 text-gray-600" />
                                  </div>
                                )}
                              </div>
                            ))}
                            {order.products.length > 4 && (
                              <span className="text-xs text-gray-500">+{order.products.length - 4} more</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-end pt-4 border-t border-white/5">
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all">
                            <Eye className="w-3.5 h-3.5" />
                            View Details
                          </button>
                        </div>
                      </div>
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
                  {statusFilter || commissionFilter || searchTerm
                    ? 'No orders match the current filters. Try adjusting your search criteria.'
                    : 'Orders containing your products will appear here.'}
                </p>
                <button
                  onClick={loadOrders}
                  className="inline-flex items-center px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-black text-sm font-semibold rounded-lg transition-all"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Orders
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─── Order Detail Modal ─── */}
        {showModal && selectedOrder && (
          <div
            data-modal-scroll
            className="fixed inset-0 bg-black/90 overflow-y-auto h-full w-full z-50 backdrop-blur-md flex items-start justify-center p-4 md:py-8"
          >
            <div className="relative mx-auto w-full max-w-5xl shadow-2xl rounded-3xl bg-neutral-900 border border-white/10 text-white overflow-clip">

              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-neutral-900/95 backdrop-blur-xl border-b border-white/10 px-8 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <ShoppingBag className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-tight">{selectedOrder.order_number}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Placed {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-8 py-6 space-y-6">

                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-neutral-950/50 border border-white/5 rounded-xl p-4">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Order Total</p>
                    <p className="text-xl font-bold text-white">{formatCurrency(selectedOrder.customer_payment_amount)}</p>
                  </div>
                  <div className="bg-neutral-950/50 border border-white/5 rounded-xl p-4">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">My Commission</p>
                    <p className="text-xl font-bold text-emerald-400">{formatCurrency(selectedOrder.total_commission)}</p>
                  </div>
                  <div className="bg-neutral-950/50 border border-white/5 rounded-xl p-4">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Order Status</p>
                    <span className={getOrderStatusBadge(selectedOrder.order_status)}>{selectedOrder.order_status.replace('_', ' ')}</span>
                  </div>
                  <div className="bg-neutral-950/50 border border-white/5 rounded-xl p-4">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Commission</p>
                    <span className={getCommissionBadge(getCommissionStatusSummary(selectedOrder.commission_statuses))}>
                      {getCommissionStatusSummary(selectedOrder.commission_statuses)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Left Column */}
                  <div className="lg:col-span-1 space-y-5">
                    <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Order Info</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                          <span className="text-gray-400">Products</span>
                          <span className="font-semibold text-white">{selectedOrder.products_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Date</span>
                          <span className="font-semibold text-white">{formatDate(selectedOrder.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {(selectedOrder.customer_name || selectedOrder.customer_email) && (
                      <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Customer</h4>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-9 h-9 bg-white/5 rounded-full border border-white/10">
                            <span className="text-sm font-bold text-white">{(selectedOrder.customer_name || 'G')[0].toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{selectedOrder.customer_name || 'Guest'}</p>
                            <p className="text-xs text-gray-500">{selectedOrder.customer_email || ''}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedOrder.shipping_address && (
                      <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Shipping</h4>
                        <div className="space-y-1.5 text-sm">
                          {selectedOrder.shipping_address.name && <p className="font-semibold text-white">{selectedOrder.shipping_address.name}</p>}
                          {selectedOrder.shipping_address.address1 && <p className="text-gray-400">{selectedOrder.shipping_address.address1}</p>}
                          {selectedOrder.shipping_address.address2 && <p className="text-gray-400">{selectedOrder.shipping_address.address2}</p>}
                          {selectedOrder.shipping_address.city && (
                            <p className="text-gray-400">
                              {selectedOrder.shipping_address.city}{selectedOrder.shipping_address.state ? `, ${selectedOrder.shipping_address.state}` : ''} {selectedOrder.shipping_address.zip}
                            </p>
                          )}
                          {selectedOrder.shipping_address.country && <p className="text-gray-400">{selectedOrder.shipping_address.country}</p>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column — Product Breakdown */}
                  <div className="lg:col-span-2">
                    <div className="bg-neutral-950/50 border border-white/5 rounded-2xl p-5 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Product Breakdown</h4>
                        <span className="text-xs text-gray-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                          {selectedOrder.products.length} item{selectedOrder.products.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                        {selectedOrder.products.map((product, idx) => (
                          <div key={`${product.product_id}-${idx}`} className="flex gap-4 p-4 bg-neutral-900/60 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                            <div className="flex-shrink-0 w-16 h-16 bg-neutral-800 border border-white/10 rounded-xl overflow-hidden">
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0]} alt={product.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-gray-600" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{product.product_name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">ID: {product.product_id}</p>
                              <div className="flex items-center gap-4 mt-2 text-sm">
                                <div>
                                  <span className="text-gray-400">Revenue: </span>
                                  <span className="font-medium text-white">{formatCurrency(product.order_amount)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Commission: </span>
                                  <span className="font-bold text-emerald-400">{formatCurrency(product.commission_amount)}</span>
                                </div>
                              </div>
                              {product.paid_at && (
                                <p className="text-xs text-gray-500 mt-1">
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  Paid: {formatDate(product.paid_at)}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-right">
                              <span className={getCommissionBadge(product.status)}>{product.status}</span>
                            </div>
                          </div>
                        ))}

                        {selectedOrder.products.length === 0 && (
                          <div className="text-center py-8">
                            <Package className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No product details available</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-gray-400">Total Commission Earned</span>
                          <span className="text-xl font-bold text-emerald-400">{formatCurrency(selectedOrder.total_commission)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-neutral-900/95 backdrop-blur-xl border-t border-white/10 px-8 py-4">
                <div className="flex items-center justify-between">
                  {selectedOrder.order_status !== 'cancelled' ? (
                    <button
                      onClick={() => setOrderToCancel(selectedOrder)}
                      disabled={cancellingId === selectedOrder.id}
                      className="px-4 py-2.5 text-sm font-medium text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      {cancellingId === selectedOrder.id ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  ) : (
                    <span className="text-xs text-red-400 font-semibold px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                      Order Cancelled
                    </span>
                  )}
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
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
                  disabled={cancellingId === orderToCancel.id}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {cancellingId === orderToCancel.id ? 'Cancelling...' : 'Yes, Cancel Order'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CreatorProtectedRoute>
  );
}
