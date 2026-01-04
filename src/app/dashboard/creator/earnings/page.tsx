'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, LinkIcon } from 'lucide-react';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';

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

function EarningsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [history, setHistory] = useState<CommissionHistory[]>([]);
  const [payouts, setPayouts] = useState<PayoutHistory[]>([]);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Fetch commission summary
      const summaryRes = await fetch('/api/creator/commissions/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.data);
      }

      // Fetch commission history
      const historyRes = await fetch(
        '/api/creator/commissions/history?limit=10&offset=0',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.data);
      }

      // Fetch payout history
      const payoutRes = await fetch('/api/creator/commissions/payouts', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (payoutRes.ok) {
        const data = await payoutRes.json();
        setPayouts(data.data);
      }

      // Fetch Stripe status
      const stripeRes = await fetch('/api/creator/stripe/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (stripeRes.ok) {
        const data = await stripeRes.json();
        setStripeStatus(data.data);
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
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/creator/stripe/auth-url', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        window.location.href = data.authUrl;
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
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/creator/stripe/disconnect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
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

  const pendingCommission = summary?.commissions?.processing?.totalAmount || '0.00';
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pending Commission */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Pending Commission</h3>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              ${pendingCommission}
            </p>
            <p className="text-xs text-gray-500">
              {summary?.commissions?.processing?.count || 0} orders awaiting payout
            </p>
          </div>

          {/* Paid Commission */}
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

          {/* Total Earned */}
          <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Earned</h3>
              <DollarSign className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
              ${summary?.totalEarned.toFixed(2) || '0.00'}
            </p>
            <p className="text-xs text-gray-500">All time earnings</p>
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
