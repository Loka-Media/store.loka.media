'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, DollarSign, TrendingUp, Search, Loader, ArrowUpDown } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { adminAPI } from '@/lib/auth';

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

      setEarnings(data.earnings || []);
      setTotalCount(data.total || 0);
      setFilteredEarnings(data.earnings || []);
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Creators Earnings</h1>
          <p className="text-gray-600">View all creators' commission earnings and payout status</p>
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
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by creator name or ID..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as SortBy)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-gray-700"
                >
                  <option value="total_earned">Sort by Total Earned</option>
                  <option value="pending">Sort by Pending Amount</option>
                  <option value="processed">Sort by Processed Amount</option>
                </select>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg border-l-4 border-orange-500 p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Active Creators</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
                  </div>
                  <Users className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-green-500 p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Total Processed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${earnings.reduce((sum, e) => sum + e.processedAmount, 0).toFixed(2)}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white rounded-lg border-l-4 border-blue-500 p-6 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">Pending Payment</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${earnings.reduce((sum, e) => sum + e.pendingAmount, 0).toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Earnings Table */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {filteredEarnings.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    {searchQuery ? 'No creators found' : 'No earnings data available'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Creator</th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          <button
                            onClick={() => handleSortChange('total_earned')}
                            className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                          >
                            Total Earned
                            {sortBy === 'total_earned' && <ArrowUpDown className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          <button
                            onClick={() => handleSortChange('pending')}
                            className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                          >
                            Pending
                            {sortBy === 'pending' && <ArrowUpDown className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          <button
                            onClick={() => handleSortChange('processed')}
                            className="flex items-center gap-1 hover:text-orange-600 transition-colors"
                          >
                            Processed
                            {sortBy === 'processed' && <ArrowUpDown className="w-4 h-4" />}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Commissions
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Stripe
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                          Last Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredEarnings.map((earning) => (
                        <tr key={earning.creatorId} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-gray-900">Creator #{earning.creatorId}</p>
                              {earning.creatorName && (
                                <p className="text-sm text-gray-500">{earning.creatorName}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-semibold text-lg text-gray-900">
                              ${earning.totalEarned.toFixed(2)}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium border border-yellow-300">
                                ${earning.pendingAmount.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium border border-green-300">
                                ${earning.processedAmount.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-600">{earning.commissionsCount}</p>
                          </td>
                          <td className="px-6 py-4">
                            {earning.stripeConnected ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium border border-green-300">
                                ✓ Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium border border-gray-300">
                                Not Connected
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
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
              <div className="mt-6 flex items-center justify-between">
                <p className="text-gray-600 text-sm">
                  Showing {page * itemsPerPage + 1} to{' '}
                  {Math.min((page + 1) * itemsPerPage, totalCount)} of {totalCount} creators
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page === 0}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    ← Previous
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      const pageNum = Math.max(0, page - 2) + i;
                      if (pageNum >= totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-orange-500 text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
