'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, AlertCircle, LinkIcon } from 'lucide-react';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';
import { api } from '@/lib/auth';

interface CommissionSummary {
  creatorId: number;
  commissions: {
    [key: string]: {
      count: number;
      totalAmount: string;
      earliest: string;
      latest: string;
    };
  };
  totalEarned: number;
}

interface CommissionHistory {
  id: number;
  order_id: number;
  commission_amount: number;
  order_amount: number;
  stripe_fee: number;
  platform_fee: number;
  printful_cost: number;
  status: 'pending' | 'processing' | 'paid' | 'refunded';
  created_at: string;
  paid_at?: string;
}

interface PayoutHistory {
  id: number;
  total_amount: number;
  commissions_count: number;
  status: 'pending' | 'in_transit' | 'completed' | 'failed';
  payout_date: string;
  completion_date?: string;
  error_message?: string;
  stripe_transfer_id?: string;
}

interface StripeStatus {
  connected: boolean;
  stripeConnectId?: string;
  verified?: boolean;
  email?: string;
  country?: string;
  type?: string;
  message?: string;
}

interface PrintfulStatusOrder {
  id: number;
  order_number: string;
  order_status: string;
  printful_order_id: string | null;
  total_commission: string;
  commission_statuses: string[];
  printful_status: {
    id: string;
    status: string;
    shipping: string;
  } | null;
  estimated_earnings: {
    status: string;
    commission: number;
    description: string;
    confidence: string;
  };
}

function EarningsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [history, setHistory] = useState<CommissionHistory[]>([]);
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [printfulOrders, setPrintfulOrders] = useState<PrintfulStatusOrder[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);

      // Fetch commission summary
      const summaryRes = await api.get('/api/creator/commissions/summary');
      if (summaryRes.data) {
        setSummary(summaryRes.data.data);
      }

      // Fetch commission history
      const historyRes = await api.get('/api/creator/commissions/history?limit=10&offset=0');
      if (historyRes.data) {
        setHistory(historyRes.data.data);
      }

      // Fetch payout history
      const payoutRes = await api.get('/api/creator/commissions/payouts');
      if (payoutRes.data) {
        setPayouts(payoutRes.data.data);
      }

      // Fetch Stripe status
      const stripeRes = await api.get('/api/creator/stripe/status');
      if (stripeRes.data) {
        setStripeStatus(stripeRes.data.data);
      }

      // Fetch orders with Printful status for estimated earnings
      const printfulOrdersRes = await api.get('/api/creator/orders/printful-status?limit=10');
      if (printfulOrdersRes.data) {
        setPrintfulOrders(printfulOrdersRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      const res = await api.get('/api/creator/stripe/auth-url');
      if (res.data) {
        window.location.href = res.data.authUrl;
      } else {
        toast.error('Failed to get Stripe authorization URL');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to connect Stripe');
    }
  };

  const handleDisconnectStripe = async () => {
    try {
      const res = await api.post('/api/creator/stripe/disconnect');
      if (res.data) {
        toast.success('Stripe account disconnected');
        setStripeStatus(null);
        fetchEarningsData();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to disconnect Stripe');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Loading earnings data...</p>
        </div>
      </div>
    );
  }

  // Combine pending and processing as "upcoming" since processing includes Printful draft orders
  const upcomingPending = parseFloat(summary?.commissions?.pending?.totalAmount || '0');
  const upcomingProcessing = parseFloat(summary?.commissions?.processing?.totalAmount || '0');
  const upcomingCommission = (upcomingPending + upcomingProcessing).toFixed(2);
  const upcomingCount = (summary?.commissions?.pending?.count || 0) + (summary?.commissions?.processing?.count || 0);

  const paidCommission = summary?.commissions?.paid?.totalAmount || '0.00';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Earnings</h1>
          <p className="text-gray-600">Track your commissions and payouts</p>
        </div>

        {/* Stripe Connection Alert */}
        {!stripeStatus?.connected && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">Connect Stripe Account</h3>
              <p className="text-sm text-yellow-800 mb-4">
                Link your Stripe account to receive payouts. Your commissions will be transferred to your bank account.
              </p>
              <button
                onClick={handleConnectStripe}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <LinkIcon className="w-4 h-4" />
                Connect Stripe Account
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Payment (includes draft orders in Printful) */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Upcoming Payment</h3>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              ${upcomingCommission}
            </p>
            <p className="text-xs text-gray-500">
              {upcomingCount} orders awaiting payout
            </p>
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              {summary?.commissions?.pending && (
                <p className="text-xs text-gray-600">
                  • {summary.commissions.pending.count} verified, awaiting release
                </p>
              )}
              {summary?.commissions?.processing && (
                <p className="text-xs text-gray-600">
                  • {summary.commissions.processing.count} released (Printful draft/processing)
                </p>
              )}
            </div>
          </div>

          {/* Total Paid */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Paid</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              ${paidCommission}
            </p>
            <p className="text-xs text-gray-500">
              {summary?.commissions?.paid?.count || 0} orders completed
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'commissions'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Commission History
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'payouts'
                  ? 'text-orange-600 border-b-2 border-orange-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Payouts
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">Earnings Summary</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Processing</p>
                      <p className="text-xl font-bold text-gray-900">
                        {summary?.commissions?.processing?.count || 0} orders
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Paid</p>
                      <p className="text-xl font-bold text-gray-900">
                        {summary?.commissions?.paid?.count || 0} orders
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Pending</p>
                      <p className="text-xl font-bold text-gray-900">
                        {summary?.commissions?.pending?.count || 0} orders
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Refunded</p>
                      <p className="text-xl font-bold text-gray-900">
                        {summary?.commissions?.refunded?.count || 0} orders
                      </p>
                    </div>
                  </div>
                </div>

                {stripeStatus?.connected && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-green-900 mb-1">Stripe Connected</h4>
                        <p className="text-sm text-green-800 mb-2">
                          Account: {stripeStatus.email}
                        </p>
                        <p className="text-xs text-green-700">
                          Payouts will be sent to your linked bank account
                        </p>
                      </div>
                      <button
                        onClick={handleDisconnectStripe}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}

                {/* Estimated Earnings Based on Printful Status */}
                {printfulOrders.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900 mb-4">Recent Orders & Estimated Earnings</h3>
                    <div className="space-y-3">
                      {printfulOrders.slice(0, 5).map((order) => (
                        <div key={order.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-medium text-gray-900">{order.order_number}</p>
                                {order.printful_status && (
                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    order.printful_status.status === 'fulfilled' ? 'bg-green-100 text-green-700' :
                                    order.printful_status.status === 'inprocess' ? 'bg-blue-100 text-blue-700' :
                                    order.printful_status.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    order.printful_status.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {order.printful_status.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {order.estimated_earnings.description}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  order.estimated_earnings.confidence === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                                  order.estimated_earnings.confidence === 'high' ? 'bg-blue-100 text-blue-700' :
                                  order.estimated_earnings.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                  order.estimated_earnings.confidence === 'low' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {order.estimated_earnings.confidence} confidence
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-emerald-600">
                                ${order.estimated_earnings.commission.toFixed(2)}
                              </p>
                              <p className="text-xs text-gray-500">estimated</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => router.push('/dashboard/creator/orders')}
                      className="mt-4 w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 py-2"
                    >
                      View All Orders →
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'commissions' && (
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Recent Commissions</h3>
                {history.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Order</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Amount</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Commission</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {history.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-900">#{item.order_id}</td>
                            <td className="px-4 py-3 text-gray-900">
                              ${item.order_amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900">
                              ${item.commission_amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  item.status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : item.status === 'processing'
                                    ? 'bg-blue-100 text-blue-800'
                                    : item.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No commission history yet</p>
                )}
              </div>
            )}

            {activeTab === 'payouts' && (
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Payout History</h3>
                {payouts.length > 0 ? (
                  <div className="space-y-4">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-gray-900">
                              ${payout.total_amount.toFixed(2)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {payout.commissions_count} commissions
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              payout.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : payout.status === 'in_transit'
                                ? 'bg-blue-100 text-blue-800'
                                : payout.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {payout.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>
                            Initiated:{' '}
                            {new Date(payout.payout_date).toLocaleDateString()}
                          </p>
                          {payout.completion_date && (
                            <p>
                              Completed:{' '}
                              {new Date(payout.completion_date).toLocaleDateString()}
                            </p>
                          )}
                          {payout.error_message && (
                            <p className="text-red-600">Error: {payout.error_message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">No payouts yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EarningsPage() {
  return (
    <CreatorProtectedRoute>
      <EarningsPageContent />
    </CreatorProtectedRoute>
  );
}
