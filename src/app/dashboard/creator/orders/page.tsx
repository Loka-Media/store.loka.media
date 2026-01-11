'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/auth';
import {
  Package,
  DollarSign,
  Calendar,
  Eye,
  Filter,
  ChevronRight,
  ShoppingBag,
  TrendingUp,
  Clock
} from 'lucide-react';

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
  created_at: string;
  updated_at: string;
  printful_order_id: string | null;
  printful_draft_order_key: string | null;
  total_commission: string;
  products_count: number;
  commission_statuses: string[];
  products: Product[];
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

export default function CreatorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, pagination.offset]);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString()
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await api.get<OrdersResponse>(`/api/creator/orders?${params.toString()}`);

      setOrders(response.data.data);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        hasMore: response.data.pagination.hasMore
      }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'paid':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'refunded':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'fulfilled':
        return 'bg-emerald-100 text-emerald-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCommissionStatusSummary = (statuses: string[]) => {
    const uniqueStatuses = [...new Set(statuses)];
    if (uniqueStatuses.length === 1) {
      return uniqueStatuses[0];
    }
    return 'mixed';
  };

  const handleNextPage = () => {
    if (pagination.hasMore) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const handlePreviousPage = () => {
    setPagination(prev => ({
      ...prev,
      offset: Math.max(0, prev.offset - prev.limit)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-blue-600" />
                My Orders
              </h1>
              <p className="text-gray-600 mt-2">
                View orders containing your products and track commissions
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, offset: 0 }));
                  }}
                  className="bg-transparent border-none focus:outline-none text-sm font-medium text-gray-700"
                >
                  <option value="all">All Orders</option>
                  <option value="pending">Upcoming Commission</option>
                  <option value="processing">Ready for Payout</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {statusFilter !== 'all'
                ? `No orders with ${statusFilter} commission status`
                : 'Orders with your products will appear here'}
            </p>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Order Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {order.order_number}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getOrderStatusColor(order.order_status)}`}>
                          {order.order_status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(getCommissionStatusSummary(order.commission_statuses))}`}>
                          {getCommissionStatusSummary(order.commission_statuses)} commission
                        </span>
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(order.created_at)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4" />
                          {order.products_count} product{order.products_count !== 1 ? 's' : ''}
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                          <span className="font-medium text-emerald-600">
                            {formatCurrency(order.total_commission)} commission
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    >
                      <Eye className="w-4 h-4" />
                      {selectedOrder?.id === order.id ? 'Hide' : 'View'} Details
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Order Details (Expandable) */}
                {selectedOrder?.id === order.id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Product Breakdown</h4>
                    <div className="space-y-3">
                      {order.products.map((product, idx) => (
                        <div
                          key={`${product.product_id}-${idx}`}
                          className="bg-white rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4 flex-1">
                              {product.images && product.images.length > 0 && (
                                <img
                                  src={product.images[0]}
                                  alt={product.product_name}
                                  className="w-16 h-16 object-cover rounded border border-gray-200"
                                />
                              )}
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 mb-1">
                                  {product.product_name}
                                </h5>
                                <p className="text-xs text-gray-500 mb-2">
                                  Product ID: {product.product_id}
                                </p>
                                <div className="flex items-center gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Revenue: </span>
                                    <span className="font-medium text-gray-900">
                                      {formatCurrency(product.order_amount)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Commission: </span>
                                    <span className="font-medium text-emerald-600">
                                      {formatCurrency(product.commission_amount)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(product.status)}`}>
                                {product.status}
                              </span>
                              {product.paid_at && (
                                <p className="text-xs text-gray-500 mt-2">
                                  Paid: {formatDate(product.paid_at)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && orders.length > 0 && (
          <div className="mt-8 flex items-center justify-between bg-white rounded-lg border border-gray-200 px-6 py-4">
            <div className="text-sm text-gray-600">
              Showing {pagination.offset + 1} - {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} orders
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={pagination.offset === 0}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasMore}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
