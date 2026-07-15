'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { 
  Clock, 
  CheckCircle, 
  Info, 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle, 
  Building, 
  Check, 
  Landmark, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';
import GradientTitle from '@/components/ui/GradientTitle';
import { api } from '@/lib/auth';

interface WalletData {
  id: number;
  creator_id: number;
  available_balance: string | number;
  pending_balance: string | number;
  total_withdrawn: string | number;
}

interface WalletTransaction {
  id: number;
  wallet_id: number;
  type: 'credit' | 'debit';
  amount: string | number;
  source: 'order_earning' | 'withdrawal' | 'refund_deduction' | 'adjustment';
  reference_id: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  created_at: string;
}

interface WithdrawalRequest {
  id: number;
  creator_id: number;
  wallet_id: number;
  amount: string | number;
  payout_method: 'stripe_connect' | 'manual_bank_transfer';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  stripe_payout_id: string | null;
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
  printify_cost: number;
  status: 'pending' | 'processing' | 'paid' | 'refunded';
  created_at: string;
  paid_at?: string;
}

interface PrintifyStatusOrder {
  id: number;
  order_number: string;
  order_status: string;
  printify_order_id: string | null;
  total_commission: string;
  commission_statuses: string[];
  printify_status: {
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
  const [activeTab, setActiveTab] = useState('wallet');
  
  // Wallet States
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [stripeStatus, setStripeStatus] = useState<{ stripeConnectId: string | null; onboardingComplete: boolean } | null>(null);
  
  // Commission States
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [history, setHistory] = useState<CommissionHistory[]>([]);
  const [printifyOrders, setPrintifyOrders] = useState<PrintifyStatusOrder[]>([]);
  const [showCommissionInfo, setShowCommissionInfo] = useState(false);
  
  // Withdraw Modal States
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'stripe_connect' | 'manual_bank_transfer'>('manual_bank_transfer');
  
  // Bank Details States
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      setLoading(true);

      // Fetch wallet balance
      const walletRes = await api.get('/api/creator/wallet');
      if (walletRes.data?.data) {
        setWallet(walletRes.data.data);
      }

      // Fetch wallet transactions
      const txRes = await api.get('/api/creator/wallet/transactions?limit=20');
      if (txRes.data?.data) {
        setTransactions(txRes.data.data.transactions || txRes.data.data);
      }

      // Fetch withdrawals list
      const withdrawalsRes = await api.get('/api/creator/withdrawals');
      if (withdrawalsRes.data?.data) {
        setWithdrawals(withdrawalsRes.data.data);
      }

      // Fetch stripe connect status
      const stripeRes = await api.get('/api/creator/stripe/status');
      if (stripeRes.data?.data) {
        setStripeStatus(stripeRes.data.data);
        if (stripeRes.data.data.onboardingComplete) {
          setPayoutMethod('stripe_connect');
        }
      }

      // Fetch commission summary
      const summaryRes = await api.get('/api/creator/commissions/summary');
      if (summaryRes.data?.data) {
        setSummary(summaryRes.data.data);
      }

      // Fetch commission history
      const historyRes = await api.get('/api/creator/commissions/history?limit=10&offset=0');
      if (historyRes.data?.data) {
        setHistory(historyRes.data.data);
      }

      // Fetch orders with Printify status
      const printifyOrdersRes = await api.get('/api/creator/orders/printify-status?limit=10');
      if (printifyOrdersRes.data?.data) {
        setPrintifyOrders(printifyOrdersRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkStripe = async () => {
    try {
      const res = await api.get('/api/creator/stripe/auth-url');
      if (res.data?.authUrl) {
        window.location.href = res.data.authUrl;
      } else {
        toast.error('Could not generate Stripe Connect onboarding URL');
      }
    } catch (error: any) {
      console.error('Stripe connect error:', error);
      toast.error(error.response?.data?.error || 'Failed to initiate Stripe Connect');
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(withdrawAmount);
    const available = parseFloat(wallet?.available_balance?.toString() || '0');
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }
    if (amountNum > available) {
      toast.error(`Insufficient balance. You can withdraw up to $${available.toFixed(2)}`);
      return;
    }

    let bankDetails = null;
    if (payoutMethod === 'manual_bank_transfer') {
      if (!bankName.trim() || !accountHolderName.trim() || !routingNumber.trim() || !accountNumber.trim()) {
        toast.error('Please fill out all bank account fields');
        return;
      }
      bankDetails = {
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        routingNumber: routingNumber.trim(),
        accountNumber: accountNumber.trim()
      };
    } else {
      if (!stripeStatus?.onboardingComplete) {
        toast.error('Please connect your Stripe account first');
        return;
      }
    }

    try {
      setSubmittingWithdrawal(true);
      await api.post('/api/creator/withdrawals', {
        amount: amountNum,
        payoutMethod,
        bankDetails
      });
      toast.success('Withdrawal request submitted successfully!');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      setBankName('');
      setAccountHolderName('');
      setRoutingNumber('');
      setAccountNumber('');
      fetchEarningsData();
    } catch (error: any) {
      console.error('Withdrawal error:', error);
      toast.error(error.response?.data?.error || 'Failed to submit withdrawal request');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-400">Loading wallet & earnings data...</p>
        </div>
      </div>
    );
  }

  const availableBal = parseFloat(wallet?.available_balance?.toString() || '0');
  const pendingBal = parseFloat(wallet?.pending_balance?.toString() || '0');
  const totalWithdrawn = parseFloat(wallet?.total_withdrawn?.toString() || '0');
  const lifetimeEarned = availableBal + pendingBal + totalWithdrawn;

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <GradientTitle text="Creator Wallet" size="md" className="mb-2" />
            <p className="text-gray-400">Manage your earnings, view balance ledger, and withdraw funds</p>
          </div>
          <button
            onClick={() => setIsWithdrawModalOpen(true)}
            disabled={availableBal <= 0}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:opacity-95 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:shadow-none"
          >
            <ArrowUpRight className="w-5 h-5" />
            Withdraw Funds
          </button>
        </div>

        {/* Balance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Available to Withdraw */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-500 group-hover:scale-110 transition-transform">
              <Wallet className="w-20 h-20" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Available to Withdraw</p>
            <p className="text-3xl font-extrabold text-white mb-2">${availableBal.toFixed(2)}</p>
            <div className="flex items-center gap-2 text-xs text-orange-400 font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
              Ready for immediate payout
            </div>
          </div>

          {/* Pending Verification */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-500 group-hover:scale-110 transition-transform">
              <Clock className="w-20 h-20" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Pending Verification</p>
            <p className="text-3xl font-extrabold text-white mb-2">${pendingBal.toFixed(2)}</p>
            <p className="text-xs text-gray-500">In 7-day holding return window</p>
          </div>

          {/* Lifetime Withdrawn */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-20 h-20" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Lifetime Withdrawn</p>
            <p className="text-3xl font-extrabold text-white mb-2">${totalWithdrawn.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Successfully paid out</p>
          </div>

          {/* Lifetime Earnings */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500 group-hover:scale-110 transition-transform">
              <DollarSign className="w-20 h-20" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">Lifetime Earnings</p>
            <p className="text-3xl font-extrabold text-white mb-2">${lifetimeEarned.toFixed(2)}</p>
            <p className="text-xs text-gray-500">Accumulated earnings</p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl mb-8">
          <div className="flex border-b border-gray-800 scrollbar-none overflow-x-auto">
            <button
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'wallet'
                  ? 'text-orange-500 border-orange-500 bg-orange-500/5'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Wallet Ledger
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'withdrawals'
                  ? 'text-orange-500 border-orange-500 bg-orange-500/5'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Withdrawals History
            </button>
            <button
              onClick={() => setActiveTab('commissions')}
              className={`flex-1 py-4 px-6 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'commissions'
                  ? 'text-orange-500 border-orange-500 bg-orange-500/5'
                  : 'text-gray-400 border-transparent hover:text-gray-200'
              }`}
            >
              Orders Summary
            </button>
          </div>

          <div className="p-6">
            {/* TAB: Wallet Ledger */}
            {activeTab === 'wallet' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Recent Transactions</h3>
                  <span className="text-xs text-gray-500">Shows credits and debits to your wallet</span>
                </div>
                
                {transactions.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-black text-gray-400 uppercase text-xs border-b border-gray-800">
                        <tr>
                          <th className="px-6 py-4">Transaction ID</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Source</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {transactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-gray-800/40 transition-colors">
                            <td className="px-6 py-4 font-mono text-gray-300">#{tx.id}</td>
                            <td className="px-6 py-4 font-semibold">
                              {tx.type === 'credit' ? (
                                <span className="inline-flex items-center gap-1 text-green-400">
                                  <ArrowDownLeft className="w-4 h-4" /> Credit
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-400">
                                  <ArrowUpRight className="w-4 h-4" /> Debit
                                </span>
                              )}
                            </td>
                            <td className={`px-6 py-4 font-bold text-base ${tx.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                              {tx.type === 'credit' ? '+' : '-'}${parseFloat(tx.amount.toString()).toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-gray-300 capitalize">
                              {tx.source.replace('_', ' ')}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                tx.status === 'completed' ? 'bg-green-950/65 text-green-400 border border-green-900' :
                                tx.status === 'pending' ? 'bg-yellow-950/65 text-yellow-400 border border-yellow-900' :
                                tx.status === 'failed' ? 'bg-red-950/65 text-red-400 border border-red-900' :
                                'bg-gray-800 text-gray-400'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-gray-400 max-w-xs truncate">{tx.description}</td>
                            <td className="px-6 py-4 text-gray-400">
                              {new Date(tx.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black rounded-xl border border-gray-800">
                    <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No ledger transactions found yet</p>
                    <p className="text-xs text-gray-600 mt-1">Earnings will post here when order checkouts are verified</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Withdrawals History */}
            {activeTab === 'withdrawals' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">Withdrawal History</h3>
                  <button
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={availableBal <= 0}
                    className="text-xs text-orange-400 hover:text-orange-300 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Request Payout
                  </button>
                </div>

                {withdrawals.length > 0 ? (
                  <div className="space-y-4">
                    {withdrawals.map((req) => (
                      <div key={req.id} className="border border-gray-800 rounded-xl p-5 bg-black hover:border-gray-700 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-xl font-bold text-white">
                                ${parseFloat(req.amount.toString()).toFixed(2)}
                              </span>
                              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                req.payout_method === 'stripe_connect' ? 'bg-blue-950 text-blue-400 border border-blue-900' : 'bg-purple-950 text-purple-400 border border-purple-900'
                              }`}>
                                {req.payout_method.replace('_', ' ')}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Requested: {new Date(req.created_at).toLocaleString()}</p>
                          </div>
                          
                          <div>
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase border ${
                              req.status === 'completed' ? 'bg-green-950 text-green-400 border-green-800' :
                              req.status === 'pending' ? 'bg-yellow-950 text-yellow-400 border-yellow-800' :
                              req.status === 'processing' ? 'bg-blue-950 text-blue-400 border-blue-800' :
                              'bg-red-950 text-red-400 border-red-900'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                        </div>

                        {/* Detailed expansion */}
                        <div className="text-xs text-gray-400 border-t border-gray-900 pt-3 space-y-2">
                          {req.payout_method === 'manual_bank_transfer' && req.metadata && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-950 p-2.5 rounded-lg border border-gray-900">
                              <div>
                                <span className="text-gray-600 block">Bank Name</span>
                                <span className="font-semibold text-gray-300">{req.metadata.bankName}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 block">Holder</span>
                                <span className="font-semibold text-gray-300">{req.metadata.accountHolderName}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 block">Routing No.</span>
                                <span className="font-semibold text-gray-300">******{req.metadata.routingNumber?.slice(-4)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 block">Account No.</span>
                                <span className="font-semibold text-gray-300">******{req.metadata.accountNumber?.slice(-4)}</span>
                              </div>
                            </div>
                          )}
                          
                          {req.stripe_payout_id && (
                            <p className="flex items-center gap-1 font-mono text-gray-500">
                              Stripe Reference: <span className="text-gray-300">{req.stripe_payout_id}</span>
                            </p>
                          )}

                          {req.admin_notes && (
                            <p className="bg-gray-950 p-2.5 rounded border border-gray-900 text-gray-300">
                              <strong>Admin Notes:</strong> {req.admin_notes}
                            </p>
                          )}

                          {req.rejection_reason && (
                            <div className="bg-red-950/20 border border-red-900/50 p-3 rounded-lg flex gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                              <p className="text-red-300">
                                <strong>Rejection Reason:</strong> {req.rejection_reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-black rounded-xl border border-gray-800">
                    <Landmark className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No payout requests submitted yet</p>
                    <p className="text-xs text-gray-600 mt-1">Submit your first transfer by clicking "Withdraw Funds" above</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB: Commissions & Orders Summary */}
            {activeTab === 'commissions' && (
              <div className="space-y-6">
                {/* How Commission Tracking Works Accordion */}
                <button
                  onClick={() => setShowCommissionInfo(!showCommissionInfo)}
                  className="w-full text-left hover:opacity-90 transition-opacity"
                >
                  <div className="bg-black border border-gray-800 rounded-xl p-4 flex items-center gap-3">
                    <Info className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-200 flex-1">Understanding Whitelabel Earnings</span>
                    <span className="text-gray-400">{showCommissionInfo ? '−' : '+'}</span>
                  </div>
                </button>

                {showCommissionInfo && (
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-5 animate-in fade-in duration-300">
                    <h4 className="font-bold text-white mb-2 text-sm">Earnings Calculations Breakdown:</h4>
                    <ul className="text-xs text-gray-400 space-y-2 list-disc list-inside">
                      <li>
                        <strong>Supplier Cost:</strong> The base wholesale cost of the product + shipping.
                      </li>
                      <li>
                        <strong>Wholesale Price:</strong> The wholesale base cost displayed to you. It includes Loka's 35% platform markup.
                      </li>
                      <li>
                        <strong>Retail Price:</strong> The final customer-facing selling price, controlled by your markup percentage.
                      </li>
                      <li>
                        <strong>Your Commission:</strong> You earn the full difference between the Customer Retail Price and the Loka Wholesale Cost. Earnings clear to Available Balance after the return period (7 days) passes.
                      </li>
                    </ul>
                  </div>
                )}

                {/* Printify Orders (white-labeled) */}
                {printifyOrders.length > 0 ? (
                  <div>
                    <h4 className="font-bold text-white mb-4 text-base">Recent Order Commission Status</h4>
                    <div className="space-y-3">
                      {printifyOrders.map((order) => (
                        <div key={order.id} className="bg-black rounded-xl p-5 border border-gray-800 hover:border-gray-700 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="font-bold text-white">Order {order.order_number}</span>
                                {order.printify_status && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                    order.printify_status.status === 'fulfilled' ? 'bg-green-950 text-green-400 border border-green-900' :
                                    order.printify_status.status === 'inprocess' ? 'bg-blue-950 text-blue-400 border border-blue-900' :
                                    'bg-yellow-950 text-yellow-400 border border-yellow-900'
                                  }`}>
                                    {order.printify_status.status}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mb-2">{order.estimated_earnings.description}</p>
                              
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                  order.estimated_earnings.confidence === 'confirmed' ? 'bg-green-950 text-green-400' : 'bg-gray-800 text-gray-400'
                                }`}>
                                  {order.estimated_earnings.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className="text-lg font-extrabold text-green-400">
                                ${order.estimated_earnings.commission.toFixed(2)}
                              </p>
                              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Your Profit</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 border border-gray-800 rounded-xl">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No orders found</p>
                    <p className="text-xs text-gray-600 mt-1">Earnings will appear once customers place orders on your store</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Request Modal */}
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-white">Withdraw Funds</h3>
                </div>
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                {/* Available balance notification */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-gray-400 text-xs block">Max Available to Withdraw</span>
                    <span className="text-xl font-extrabold text-white">${availableBal.toFixed(2)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(availableBal.toString())}
                    className="text-xs font-bold text-orange-400 hover:text-orange-300 uppercase tracking-wider"
                  >
                    Withdraw All
                  </button>
                </div>

                {/* Amount input */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Withdraw Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">$</span>
                    <input
                      type="number"
                      required
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-3 bg-black border border-gray-800 rounded-xl text-white font-semibold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                      min="0.01"
                      max={availableBal}
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Payout method select */}
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Payout Method</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('manual_bank_transfer')}
                      className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-all ${
                        payoutMethod === 'manual_bank_transfer'
                          ? 'border-orange-500 bg-orange-500/5 text-white'
                          : 'border-gray-800 bg-black text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Landmark className="w-5 h-5" />
                      <span className="text-sm">Bank Transfer</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setPayoutMethod('stripe_connect')}
                      className={`p-4 border rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-all ${
                        payoutMethod === 'stripe_connect'
                          ? 'border-orange-500 bg-orange-500/5 text-white'
                          : 'border-gray-800 bg-black text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <Building className="w-5 h-5" />
                      <span className="text-sm">Stripe Connect</span>
                    </button>
                  </div>
                </div>

                {/* Stripe onboarding warning if needed */}
                {payoutMethod === 'stripe_connect' && (
                  <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                    {stripeStatus?.onboardingComplete ? (
                      <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
                        <Check className="w-5 h-5 flex-shrink-0" />
                        Stripe Connect account connected: <span className="font-mono text-gray-400 text-xs">...{stripeStatus.stripeConnectId?.slice(-6)}</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-yellow-500 flex items-start gap-1.5 font-medium leading-relaxed">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-yellow-500 mt-0.5" />
                          To withdraw via Stripe Connect, you must link your Stripe Connect account first. You will be redirected to Stripe to complete registration.
                        </p>
                        <button
                          type="button"
                          onClick={handleLinkStripe}
                          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-1.5"
                        >
                          <ExternalLink className="w-4 h-4" /> Link Stripe Account
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Bank account transfer input fields */}
                {payoutMethod === 'manual_bank_transfer' && (
                  <div className="space-y-3 p-4 bg-black rounded-xl border border-gray-800">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-gray-500 mb-2">Recipient Bank Details</p>
                    
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Bank Name (e.g. Chase, Wells Fargo)"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        required
                        placeholder="Account Holder Name"
                        value={accountHolderName}
                        onChange={(e) => setAccountHolderName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Routing Number"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Account Number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 flex gap-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingWithdrawal || (payoutMethod === 'stripe_connect' && !stripeStatus?.onboardingComplete)}
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingWithdrawal ? 'Requesting...' : 'Request Payout'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
