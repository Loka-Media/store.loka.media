'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Loader, 
  Check, 
  X,
  BarChart3,
  Landmark,
  Building,
  AlertTriangle,
  Info,
  Calendar
} from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { api } from '@/lib/auth';

interface WithdrawalRequest {
  id: number;
  creator_id: number;
  creator_name: string;
  creator_email: string;
  creator_username: string;
  amount: string | number;
  payout_method: 'stripe_connect' | 'manual_bank_transfer';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  stripe_payout_id: string | null;
  stripe_connect_account_id: string | null;
  stripe_onboarding_complete: boolean;
  metadata: {
    bankName?: string;
    accountHolderName?: string;
    routingNumber?: string;
    accountNumber?: string;
  } | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  processed_at: string | null;
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
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [overview, setOverview] = useState<CommissionOverview | null>(null);
  
  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals'>('overview');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Action state
  const [actioningId, setActioningId] = useState<number | null>(null);
  
  // Reject Modal States
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  // Approve Modal States (for confirmation & notes)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveId, setApproveId] = useState<number | null>(null);
  const [approveMethod, setApproveMethod] = useState<'stripe_connect' | 'manual_bank_transfer'>('manual_bank_transfer');
  const [approveNotes, setApproveNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [withdrawalsRes, overviewRes] = await Promise.all([
        api.get('/api/admin/withdrawals'),
        api.get('/api/admin/commissions/overview')
      ]);

      setWithdrawals(withdrawalsRes.data?.data || []);
      setOverview(overviewRes.data?.data);
    } catch (error) {
      console.error('Error fetching admin payout data:', error);
      toast.error('Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (req: WithdrawalRequest) => {
    setApproveId(req.id);
    setApproveMethod(req.payout_method);
    setApproveNotes('');
    setIsApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveId) return;

    try {
      setActioningId(approveId);
      setIsApproveModalOpen(false);
      
      const res = await api.post(`/api/admin/withdrawals/${approveId}/approve`, {
        adminNotes: approveNotes.trim() || undefined
      });
      
      toast.success(res.data?.message || 'Withdrawal approved successfully!');
      fetchData();
    } catch (error: any) {
      console.error('Approve error:', error);
      toast.error(error.response?.data?.error || 'Failed to approve withdrawal request');
    } finally {
      setActioningId(null);
      setApproveId(null);
    }
  };

  const handleRejectClick = (id: number) => {
    setRejectId(id);
    setRejectionReason('');
    setAdminNotes('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectId || !rejectionReason.trim()) {
      toast.error('Rejection reason is required');
      return;
    }

    try {
      setActioningId(rejectId);
      setIsRejectModalOpen(false);

      const res = await api.post(`/api/admin/withdrawals/${rejectId}/reject`, {
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim() || undefined
      });

      toast.success(res.data?.message || 'Withdrawal request rejected successfully.');
      fetchData();
    } catch (error: any) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.error || 'Failed to reject withdrawal request');
    } finally {
      setActioningId(null);
      setRejectId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-950 text-green-400 border border-green-900';
      case 'processing':
        return 'bg-blue-950 text-blue-400 border border-blue-900';
      case 'pending':
        return 'bg-yellow-950 text-yellow-400 border border-yellow-900';
      case 'rejected':
        return 'bg-red-950 text-red-400 border border-red-900';
      default:
        return 'bg-gray-800 text-gray-400';
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (statusFilter === 'all') return true;
    return w.status === statusFilter;
  });

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent mb-2">
            Payouts Management
          </h1>
          <p className="text-gray-400">Review creator withdrawal requests and settle payments</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            {overview && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-orange-500">
                    <DollarSign className="w-16 h-16" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Total Commissions</p>
                  <p className="text-2xl font-bold text-white">
                    ${(overview.totalCommissionsAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    {overview.totalCommissionsTracked || 0} commissions tracked
                  </p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-yellow-500">
                    <AlertCircle className="w-16 h-16" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Pending/Processing</p>
                  <p className="text-2xl font-bold text-white">
                    {overview.pendingCommissions + overview.processingCommissions || 0}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">unsettled commissions</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-green-500">
                    <TrendingUp className="w-16 h-16" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Total Settled</p>
                  <p className="text-2xl font-bold text-white">
                    ${(overview.totalPayoutAmount || 0).toFixed(2)}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">payout batch volume</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 text-purple-500">
                    <Users className="w-16 h-16" />
                  </div>
                  <p className="text-gray-400 text-sm font-medium mb-1">Pending Withdrawals</p>
                  <p className="text-2xl font-bold text-white">
                    {withdrawals.filter(w => w.status === 'pending').length}
                  </p>
                  <p className="text-gray-600 text-xs mt-2">requests awaiting approval</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex gap-4 border-b border-gray-800">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === 'overview'
                    ? 'text-orange-500 border-orange-500 bg-orange-500/5'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  System Overview
                </span>
              </button>
              <button
                onClick={() => setActiveTab('withdrawals')}
                className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === 'withdrawals'
                    ? 'text-orange-500 border-orange-500 bg-orange-500/5'
                    : 'text-gray-400 border-transparent hover:text-gray-200'
                }`}
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Withdrawal Requests ({withdrawals.filter(w => w.status === 'pending').length} pending)
                </span>
              </button>
            </div>

            {/* Overview Tab Content */}
            {activeTab === 'overview' && overview && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Commission Ledger Summary */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-6">Commission Ledger Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-gray-800">
                      <span className="text-gray-400">Total Commissions Tracked</span>
                      <span className="font-semibold text-white">
                        ${(overview.totalCommissionsAmount || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-800">
                      <span className="text-gray-400">Average Earning per Product</span>
                      <span className="font-semibold text-white">
                        ${(overview.averageCommission || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-800">
                      <span className="text-gray-400">Commissions in Holding</span>
                      <span className="font-semibold text-amber-500">
                        {overview.pendingCommissions || 0} orders
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-800">
                      <span className="text-gray-400">Refunded/Cancelled Commissions</span>
                      <span className="font-semibold text-red-500">
                        {overview.refundedCommissions || 0} orders
                      </span>
                    </div>
                  </div>
                </div>

                {/* Process Info */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Payout Process Workflow</h3>
                    <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                      Creators request payouts directly from their dashboard using either Stripe Connect or Manual Bank Transfer.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="bg-orange-500/10 text-orange-400 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</span>
                        <span>Creator submits request specifying the amount and bank details/Stripe connect. Available balance is automatically debited.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="bg-orange-500/10 text-orange-400 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</span>
                        <span>Admin reviews request. If Stripe Connect is chosen, approval automatically initiates a secure Stripe Connect Transfer API call.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-gray-400">
                        <span className="bg-orange-500/10 text-orange-400 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</span>
                        <span>If Manual Bank Transfer is chosen, Admin executes the wire/payout manually and approves to mark it completed.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-950/20 border border-blue-900/50 p-4 rounded-xl flex gap-3 text-blue-300 text-xs mt-6 leading-relaxed">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Automatic Ledger:</strong> Ledger transactions write debits when withdrawals are requested and update to completed when approved. Rejections restore funds instantly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Withdrawal Requests Ledger */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-900 border border-gray-800 p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-400">Filter status:</span>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-black border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <span className="text-xs text-gray-500">{filteredWithdrawals.length} requests matching filter</span>
                </div>

                {filteredWithdrawals.length === 0 ? (
                  <div className="p-12 text-center border border-gray-800 rounded-2xl bg-gray-900">
                    <DollarSign className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No withdrawal requests found</p>
                    <p className="text-xs text-gray-600 mt-1">There are no requests matching the current status filter.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredWithdrawals.map((req) => (
                      <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                          {/* Left: Info */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-white">${parseFloat(req.amount.toString()).toFixed(2)}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                req.payout_method === 'stripe_connect' ? 'bg-blue-950 text-blue-400' : 'bg-purple-950 text-purple-400'
                              }`}>
                                {req.payout_method.replace('_', ' ')}
                              </span>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase ${getStatusBadge(req.status)}`}>
                                {req.status}
                              </span>
                            </div>
                            <div className="text-xs text-gray-400 pt-1">
                              Creator: <span className="text-white font-semibold">{req.creator_name || `@${req.creator_username}`}</span> 
                              <span className="text-gray-600 mx-2">|</span> 
                              Email: <span className="text-white">{req.creator_email}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Requested {new Date(req.created_at).toLocaleString()}
                            </div>
                          </div>

                          {/* Right: Actions */}
                          {req.status === 'pending' && (
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleRejectClick(req.id)}
                                disabled={actioningId === req.id}
                                className="flex items-center justify-center gap-1 px-4 py-2 border border-red-900 bg-red-950/20 text-red-400 rounded-xl font-bold hover:bg-red-950/40 transition-colors text-sm disabled:opacity-40"
                              >
                                <X className="w-4 h-4" /> Reject
                              </button>
                              <button
                                onClick={() => handleApproveClick(req)}
                                disabled={actioningId === req.id}
                                className="flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-lg hover:opacity-95 transition-all text-sm disabled:opacity-40"
                              >
                                <Check className="w-4 h-4" /> Approve
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Recipient Details & Process Data */}
                        <div className="text-xs text-gray-400 border-t border-gray-800/60 pt-4 mt-4 space-y-3">
                          {req.payout_method === 'manual_bank_transfer' && req.metadata && (
                            <div className="bg-black border border-gray-800 rounded-xl p-4">
                              <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-3 flex items-center gap-1">
                                <Landmark className="w-3.5 h-3.5 text-orange-400" />
                                Recipient Bank Routing Wire Info
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-gray-600 block">Bank Name</span>
                                  <span className="font-bold text-gray-200 select-all">{req.metadata.bankName}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-gray-600 block">Account Holder</span>
                                  <span className="font-bold text-gray-200 select-all">{req.metadata.accountHolderName}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-gray-600 block">Routing Number</span>
                                  <span className="font-mono font-bold text-orange-400 select-all">{req.metadata.routingNumber}</span>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-gray-600 block">Account Number</span>
                                  <span className="font-mono font-bold text-orange-400 select-all">{req.metadata.accountNumber}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {req.payout_method === 'stripe_connect' && (
                            <div className="bg-black border border-gray-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                              <div className="flex items-center gap-2">
                                <Building className="w-4 h-4 text-blue-400" />
                                <div>
                                  <span className="text-gray-600 text-[10px] block uppercase font-bold tracking-wider">Stripe Connect Destination</span>
                                  <span className="font-mono text-gray-300 font-bold select-all">{req.stripe_connect_account_id || 'Not Connected'}</span>
                                </div>
                              </div>
                              <span className={`text-[10px] px-2.5 py-0.5 rounded font-extrabold uppercase ${
                                req.stripe_onboarding_complete ? 'bg-green-950 text-green-400' : 'bg-yellow-950 text-yellow-400'
                              }`}>
                                {req.stripe_onboarding_complete ? 'Onboarding Completed' : 'Onboarding Pending'}
                              </span>
                            </div>
                          )}

                          {req.stripe_payout_id && (
                            <p className="font-mono text-[11px] text-gray-500 flex items-center gap-1.5">
                              Stripe Payout Reference ID: <span className="text-gray-300 font-bold select-all">{req.stripe_payout_id}</span>
                            </p>
                          )}

                          {req.admin_notes && (
                            <p className="bg-black p-3 rounded-lg border border-gray-800 text-gray-300">
                              <strong>Admin Notes:</strong> {req.admin_notes}
                            </p>
                          )}

                          {req.rejection_reason && (
                            <div className="bg-red-950/20 border border-red-900/50 p-3.5 rounded-xl flex gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-red-300 leading-normal">
                                <strong>Rejection Reason:</strong> {req.rejection_reason}
                              </p>
                            </div>
                          )}

                          {req.processed_at && (
                            <p className="text-xs text-gray-500">
                              Processed on: {new Date(req.processed_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal: Confirm Approval */}
            {isApproveModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Approve Withdrawal Request</h3>
                    <button
                      onClick={() => setIsApproveModalOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleApproveSubmit} className="space-y-4">
                    <div className="bg-gray-950 p-4 border border-gray-800 rounded-xl space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Withdrawal Details</p>
                      {approveMethod === 'stripe_connect' ? (
                        <p className="text-xs text-yellow-500 font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" />
                          Approval will trigger an automated Stripe Transfer API call.
                        </p>
                      ) : (
                        <p className="text-xs text-blue-400 font-semibold flex items-center gap-1.5">
                          <Info className="w-4 h-4" />
                          Manual Bank Payout: Please ensure wire has been processed manually before approving.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Admin Notes (Optional)</label>
                      <textarea
                        rows={3}
                        placeholder="Add details about this wire transfer or payout reference..."
                        value={approveNotes}
                        onChange={(e) => setApproveNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsApproveModalOpen(false)}
                        className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-lg transition-all text-sm"
                      >
                        Confirm Approval
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Specify Rejection Reason */}
            {isRejectModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Reject Withdrawal Request</h3>
                    <button
                      onClick={() => setIsRejectModalOpen(false)}
                      className="p-1 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                      &times;
                    </button>
                  </div>

                  <form onSubmit={handleRejectSubmit} className="space-y-4">
                    <div className="bg-red-950/20 border border-red-900/50 p-4 rounded-xl text-xs text-red-300 flex gap-2">
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
                      <p>
                        Rejecting will immediately cancel the transaction and restore the requested amount back to the creator's Available Balance.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Rejection Reason *</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Specify routing number discrepancy, invalid account holder details, etc..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Internal Admin Notes (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder="Internal audit notes..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-black border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsRejectModalOpen(false)}
                        className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors text-sm"
                      >
                        Reject Request
                      </button>
                    </div>
                  </form>
                </div>
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
