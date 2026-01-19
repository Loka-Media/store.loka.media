'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DollarSign, Users, TrendingUp, AlertCircle, Loader, Play, BarChart3 } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/auth';

interface PendingPayout {
  id: number;
  creator_id: number;
  creator_name?: string;
  total_amount: number;
  commissions_count: number;
  stripe_connect_account_id?: string;
  status: 'pending' | 'in_transit' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

interface CommissionOverview {
  totalCommissionsTracked: number;
  totalCommissionsAmount: number;
  pendingCommissions: number;
  processingCommissions: number;
  paidCommissions: number;
  refundedCommissions: number;
  averageCommission: number;
  totalPayouts: number;
  totalPayoutAmount: number;
  creatorsWithPendingPayouts: number;
}

function AdminPayoutsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [pendingPayouts, setPendingPayouts] = useState<PendingPayout[]>([]);
  const [overview, setOverview] = useState<CommissionOverview | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [payoutsData, overviewData] = await Promise.all([
        adminAPI.getPendingPayouts(),
        adminAPI.getCommissionOverview(),
      ]);

      setPendingPayouts(payoutsData || []);
      setOverview(overviewData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayouts = async () => {
    try {
      setProcessing(true);

      const result = await adminAPI.processPayouts();
      toast.success(`Payouts processed: ${result.successful || 0} successful, ${result.failed || 0} failed`);
      await fetchData();
    } catch (error) {
      console.error('Error processing payouts:', error);
      toast.error('Failed to process payouts');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payouts Management</h1>
            <p className="text-gray-600">Monitor and manage creator commission payouts</p>
          </div>
          <button
            onClick={handleProcessPayouts}
            disabled={processing || pendingPayouts.length === 0}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Play className="w-5 h-5" />
            {processing ? 'Processing...' : 'Process Payouts Now'}
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin">
              <Loader className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg border-l-4 border-orange-500 p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Total Commissions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${(overview.totalCommissionsAmount || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">
                        {overview.totalCommissionsTracked || 0} commissions
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-orange-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border-l-4 border-blue-500 p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overview.pendingCommissions || 0}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">commissions waiting</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border-l-4 border-green-500 p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Paid</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overview.paidCommissions || 0}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">commissions paid</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-lg border-l-4 border-purple-500 p-6 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-600 text-sm font-medium mb-1">Active Creators</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overview.creatorsWithPendingPayouts || 0}
                      </p>
                      <p className="text-gray-500 text-xs mt-2">waiting payouts</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 px-4 font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'text-orange-600 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('pending')}
                className={`pb-3 px-4 font-semibold transition-colors ${
                  activeTab === 'pending'
                    ? 'text-orange-600 border-b-2 border-orange-500'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pending Payouts ({pendingPayouts.length})
                </div>
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && overview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Commission Summary */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Commission Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Total Commissions</span>
                      <span className="font-semibold text-gray-900">
                        ${(overview.totalCommissionsAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Average Commission</span>
                      <span className="font-semibold text-gray-900">
                        ${(overview.averageCommission || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Processing</span>
                      <span className="font-semibold text-orange-600">
                        {overview.processingCommissions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Refunded</span>
                      <span className="font-semibold text-red-600">
                        {overview.refundedCommissions || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payout Summary */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Payout Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Total Payouts</span>
                      <span className="font-semibold text-gray-900">
                        ${(overview.totalPayoutAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Payout Batches</span>
                      <span className="font-semibold text-gray-900">
                        {overview.totalPayouts || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-100">
                      <span className="text-gray-600">Creators Pending</span>
                      <span className="font-semibold text-orange-600">
                        {overview.creatorsWithPendingPayouts || 0}
                      </span>
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                      <p>💡 Tip: Payouts are automatically processed daily at 9:00 AM UTC for commissions ≥ $25</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pending Payouts Tab */}
            {activeTab === 'pending' && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                {pendingPayouts.length === 0 ? (
                  <div className="p-12 text-center">
                    <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No pending payouts</p>
                    <p className="text-gray-500 text-sm mt-2">
                      All commissions have been processed
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Creator</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Commissions</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingPayouts.map((payout) => (
                          <tr key={payout.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">Creator #{payout.creator_id}</p>
                                {payout.creator_name && (
                                  <p className="text-sm text-gray-500">{payout.creator_name}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-semibold text-gray-900">
                                ${payout.total_amount.toFixed(2)}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-600">{payout.commissions_count} orders</p>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(
                                  payout.status
                                )}`}
                              >
                                {payout.status === 'in_transit' && '🚀 In Transit'}
                                {payout.status === 'pending' && '⏳ Pending'}
                                {payout.status === 'completed' && '✅ Completed'}
                                {payout.status === 'failed' && '❌ Failed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {new Date(payout.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPayoutsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminPayoutsPageContent />
    </ProtectedRoute>
  );
}
