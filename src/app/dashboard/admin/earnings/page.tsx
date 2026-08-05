'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Users, DollarSign, TrendingUp, Search, Loader, ArrowUpDown, Wallet } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/auth';
import Navigation from '@/components/Navigation';

interface CreatorEarning {
  creatorId: number;
  creatorName?: string;
  totalEarned: number;
  pendingAmount: number;
  processedAmount: number;
  commissionsCount: number;
  lastEarningDate?: string;
  stripeConnected: boolean;
}

type SortBy = 'total_earned' | 'pending' | 'processed';

function AdminEarningsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState<CreatorEarning[]>([]);
  const [filteredEarnings, setFilteredEarnings] = useState<CreatorEarning[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('total_earned');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchEarnings();
  }, [page, sortBy]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);

      const data = await adminAPI.getCreatorEarnings({
        limit: itemsPerPage,
        offset: page * itemsPerPage,
        sortBy: sortBy,
      });

      setEarnings(data.data || []);
      setTotalCount(data.pagination?.total || 0);
      setFilteredEarnings(data.data || []);
      setSearchQuery('');
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredEarnings(earnings);
    } else {
      const filtered = earnings.filter(
        (earning) =>
          earning.creatorId.toString().includes(query) ||
          earning.creatorName?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEarnings(filtered);
    }
  };

  const handleSortChange = (newSort: SortBy) => {
    setSortBy(newSort);
    setPage(0);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  return (
    <div className="min-h-screen bg-black text-white pb-12">
      <Navigation />
      <div className="max-w-7xl mt-16 mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Creators Earnings</h1>
            <p className="text-gray-400 text-sm">View all creators' commission earnings and payout status</p>
          </div>
          <Link
            href="/dashboard/admin/payouts"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl shadow-lg hover:opacity-90 transition-all self-start md:self-auto"
          >
            <Wallet className="w-5 h-5" />
            Manage Payouts & Requests
          </Link>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <>
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by creator name or ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortBy)}
                  className="px-4 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-medium cursor-pointer"
                >
                  <option value="total_earned" className="bg-neutral-900">Sort by Total Earned</option>
                  <option value="pending" className="bg-neutral-900">Sort by Pending Amount</option>
                  <option value="processed" className="bg-neutral-900">Sort by Processed Amount</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-orange-500 group-hover:scale-110 transition-transform">
                  <Users className="w-20 h-20" />
                </div>
                <p className="text-sm font-medium text-gray-400 mb-1">Active Creators</p>
                <p className="text-3xl font-extrabold text-white">{totalCount}</p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-green-500 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-20 h-20" />
                </div>
                <p className="text-sm font-medium text-gray-400 mb-1">Total Processed</p>
                <p className="text-3xl font-extrabold text-green-400">
                  ${earnings.reduce((sum, e) => sum + e.processedAmount, 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 p-6 rounded-2xl shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-500 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-20 h-20" />
                </div>
                <p className="text-sm font-medium text-gray-400 mb-1">Pending Payment</p>
                <p className="text-3xl font-extrabold text-blue-400">
                  ${earnings.reduce((sum, e) => sum + e.pendingAmount, 0).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Earnings Table */}
            <div className="bg-neutral-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
              {filteredEarnings.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-600 mx-auto mb-4 animate-pulse" />
                  <p className="text-gray-400 text-lg font-medium">
                    {searchQuery ? 'No creators found' : 'No earnings data available'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#141414] border-b border-white/10 text-gray-400 text-xs uppercase font-bold tracking-wider">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold text-gray-300">Creator</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-300">
                          <button
                            onClick={() => handleSortChange('total_earned')}
                            className="flex items-center gap-1 hover:text-orange-500 transition-colors uppercase font-bold"
                          >
                            Total Earned
                            {sortBy === 'total_earned' && <ArrowUpDown className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-gray-300">
                          <button
                            onClick={() => handleSortChange('pending')}
                            className="flex items-center gap-1 hover:text-orange-500 transition-colors uppercase font-bold"
                          >
                            Pending
                            {sortBy === 'pending' && <ArrowUpDown className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-gray-300">
                          <button
                            onClick={() => handleSortChange('processed')}
                            className="flex items-center gap-1 hover:text-orange-500 transition-colors uppercase font-bold"
                          >
                            Processed
                            {sortBy === 'processed' && <ArrowUpDown className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-gray-300">
                          Commissions
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-gray-300">
                          Stripe
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-gray-300">
                          Last Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredEarnings.map((earning) => (
                        <tr key={earning.creatorId} className="hover:bg-neutral-950/40 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-white text-sm">Creator #{earning.creatorId}</p>
                              {earning.creatorName && (
                                <p className="text-xs text-gray-400">{earning.creatorName}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-base text-white">
                              ${earning.totalEarned.toFixed(2)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-950/40 text-yellow-400 text-sm font-semibold border border-yellow-900/50">
                              ${earning.pendingAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-950/40 text-green-400 text-sm font-semibold border border-green-900/50">
                              ${earning.processedAmount.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-300">
                            {earning.commissionsCount}
                          </td>
                          <td className="px-6 py-4">
                            {earning.stripeConnected ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-950/40 text-green-400 text-sm font-semibold border border-green-900/50">
                                Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-800 text-gray-400 text-sm font-semibold border border-white/5">
                                Not Connected
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {earning.lastEarningDate
                              ? new Date(earning.lastEarningDate).toLocaleDateString()
                              : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">
                  Showing {page * itemsPerPage + 1} to{' '}
                  {Math.min((page + 1) * itemsPerPage, totalCount)} of {totalCount} creators
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-xl text-white font-medium hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-colors"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = Math.max(0, page - 2) + i;
                      if (pageNum >= totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-xl font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                              : 'border border-white/10 text-white bg-neutral-900 hover:bg-neutral-800'
                          }`}
                        >
                          {pageNum + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                    disabled={page >= totalPages - 1}
                    className="px-4 py-2 bg-neutral-900 border border-white/10 rounded-xl text-white font-medium hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-neutral-900 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminEarningsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminEarningsPageContent />
    </ProtectedRoute>
  );
}
