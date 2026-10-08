'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle,
  XCircle,
  ExternalLink,
  Clock,
  User,
  Link as LinkIcon,
  Search,
  UserMinus,
  Trash2,
  AlertTriangle,
  X,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import { adminAPI } from '@/lib/auth';
import toast from 'react-hot-toast';

interface CreatorRequest {
  id: number;
  userId?: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  creatorUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export default function CreatorRequestsPage() {
  const [requests, setRequests] = useState<CreatorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [processing, setProcessing] = useState<{
    requestId: number;
    action: 'approve' | 'reject' | 'remove' | 'delete';
  } | null>(null);

  // Remove Creator Modal State
  const [removeModal, setRemoveModal] = useState<{
    isOpen: boolean;
    request: CreatorRequest | null;
    deactivateProducts: boolean;
  }>({
    isOpen: false,
    request: null,
    deactivateProducts: true,
  });

  // Delete Request Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    request: CreatorRequest | null;
  }>({
    isOpen: false,
    request: null,
  });

  const fetchRequests = async () => {
    try {
      const response = await adminAPI.getCreatorRequests();
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Failed to fetch creator requests:', error);
      setRequests([]);
      toast.error('Failed to load creator requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('search') || params.get('q');
      if (q) setSearchQuery(q);
      const status = params.get('status');
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        setStatusFilter(status as any);
      }
    }
  }, []);

  // Filter requests by status tab and search query
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // 1. Status Filter
      if (statusFilter !== 'all' && req.status !== statusFilter) {
        return false;
      }

      // 2. Search Filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        req.name?.toLowerCase().includes(q) ||
        req.username?.toLowerCase().includes(q) ||
        req.email?.toLowerCase().includes(q) ||
        req.creatorUrl?.toLowerCase().includes(q) ||
        req.id?.toString().includes(q)
      );
    });
  }, [requests, statusFilter, searchQuery]);

  // Statistics
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const rejectedCount = requests.filter((r) => r.status === 'rejected').length;

  // Handle Approve / Re-Approve
  const handleApprove = async (requestId: number) => {
    setProcessing({ requestId, action: 'approve' });
    const targetRequest = requests.find((r) => r.id === requestId);
    try {
      await adminAPI.approveCreatorRequest(requestId);
      toast.success(
        targetRequest?.status === 'rejected'
          ? 'Creator successfully re-approved!'
          : 'Creator request approved successfully'
      );

      // Trigger approval email notification via Resend
      if (targetRequest?.email) {
        fetch('/api/notifications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetRequest.email,
            name: targetRequest.name,
            type: 'approved',
            appUrl: window.location.origin,
          }),
        }).catch((e) => console.error('Failed to send approval email:', e));
      }

      fetchRequests();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error('Failed to approve creator request');
    } finally {
      setProcessing(null);
    }
  };

  // Handle Reject (from pending)
  const handleReject = async (requestId: number) => {
    setProcessing({ requestId, action: 'reject' });
    const targetRequest = requests.find((r) => r.id === requestId);
    try {
      await adminAPI.rejectCreatorRequest(requestId);
      toast.success('Creator request rejected');

      // Trigger rejection email notification via Resend
      if (targetRequest?.email) {
        fetch('/api/notifications/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetRequest.email,
            name: targetRequest.name,
            type: 'rejected',
          }),
        }).catch((e) => console.error('Failed to send rejection email:', e));
      }

      fetchRequests();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error('Failed to reject creator request');
    } finally {
      setProcessing(null);
    }
  };

  // Open Remove Creator Modal
  const openRemoveModal = (request: CreatorRequest) => {
    setRemoveModal({
      isOpen: true,
      request,
      deactivateProducts: true,
    });
  };

  // Confirm Remove Creator & Products
  const handleConfirmRemove = async () => {
    if (!removeModal.request) return;
    const req = removeModal.request;
    setProcessing({ requestId: req.id, action: 'remove' });

    try {
      await adminAPI.removeCreator(req.id, {
        userId: req.userId,
        deactivateProducts: true, // Always deactivate all products of creator
      });

      toast.success(`Creator ${req.name} and all their products were successfully removed.`);
      setRemoveModal({ isOpen: false, request: null, deactivateProducts: true });
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to remove creator:', error);
      toast.error(error.message || 'Failed to remove creator');
    } finally {
      setProcessing(null);
    }
  };

  // Open Delete Request Modal
  const openDeleteModal = (request: CreatorRequest) => {
    setDeleteModal({
      isOpen: true,
      request,
    });
  };

  // Confirm Delete Request Record
  const handleConfirmDelete = async () => {
    if (!deleteModal.request) return;
    const req = deleteModal.request;
    setProcessing({ requestId: req.id, action: 'delete' });

    try {
      await adminAPI.deleteCreatorRequest(req.id);
      toast.success('Creator request record deleted');
      setDeleteModal({ isOpen: false, request: null });
      fetchRequests();
    } catch (error: any) {
      console.error('Failed to delete request:', error);
      toast.error(error.message || 'Failed to delete request');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'approved':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'rejected':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="max-w-7xl mt-16 mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="max-w-7xl mt-16 mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Creator Requests</h1>
          <p className="mt-2 text-gray-400">
            Review, approve, and manage creator account access and status
          </p>
        </div>

        {/* Stats Cards (Clickable Filters) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <button
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
            className={`text-left p-6 rounded-xl border transition-all cursor-pointer ${statusFilter === 'pending'
              ? 'bg-yellow-950/40 border-yellow-500 ring-2 ring-yellow-500/20'
              : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 hover:border-gray-600'
              }`}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Pending Requests</p>
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'approved' ? 'all' : 'approved')}
            className={`text-left p-6 rounded-xl border transition-all cursor-pointer ${statusFilter === 'approved'
              ? 'bg-green-950/40 border-green-500 ring-2 ring-green-500/20'
              : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 hover:border-gray-600'
              }`}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-white">{approvedCount}</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setStatusFilter(statusFilter === 'rejected' ? 'all' : 'rejected')}
            className={`text-left p-6 rounded-xl border transition-all cursor-pointer ${statusFilter === 'rejected'
              ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/20'
              : 'bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700/50 hover:border-gray-600'
              }`}
          >
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-900/30 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-white">{rejectedCount}</p>
              </div>
            </div>
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-900/80 border border-gray-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${statusFilter === 'all'
                ? 'bg-orange-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
            >
              All ({requests.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${statusFilter === 'pending'
                ? 'bg-yellow-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${statusFilter === 'approved'
                ? 'bg-green-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
            >
              Approved ({approvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${statusFilter === 'rejected'
                ? 'bg-red-500 text-black shadow-md'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, handle, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Requests Table */}
        <div className="gradient-border-white-top rounded-xl overflow-hidden bg-gray-900">
          {filteredRequests.length === 0 ? (
            <div className="p-12 text-center">
              <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-base font-medium">No creator requests found</p>
              {(searchQuery || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="mt-3 text-xs text-orange-400 hover:underline cursor-pointer"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Creator URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[320px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white flex items-center gap-2">
                            {request.name}
                            <span className="text-[11px] text-gray-500 font-normal">#{request.id}</span>
                          </div>
                          <div className="text-sm text-gray-400">@{request.username}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{request.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <LinkIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                          <a
                            href={request.creatorUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-orange-400 hover:text-orange-300 flex items-center transition-colors truncate max-w-[200px]"
                            title={request.creatorUrl}
                          >
                            {request.creatorUrl || 'No URL provided'}
                            <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(
                            request.status
                          )}`}
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                        {formatDate(request.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* 1. Pending Request Actions */}
                        {request.status === 'pending' && (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleApprove(request.id)}
                              disabled={processing?.requestId === request.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-black bg-green-500 hover:bg-green-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              {processing?.requestId === request.id && processing?.action === 'approve' ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mr-1"></div>
                              ) : (
                                <CheckCircle className="w-4 h-4 mr-1.5" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              disabled={processing?.requestId === request.id}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded-lg text-black bg-red-500 hover:bg-red-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer whitespace-nowrap"
                            >
                              {processing?.requestId === request.id && processing?.action === 'reject' ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-black mr-1"></div>
                              ) : (
                                <XCircle className="w-4 h-4 mr-1.5" />
                              )}
                              Reject
                            </button>
                          </div>
                        )}

                        {/* 2. Approved Creator Actions */}
                        {request.status === 'approved' && (
                          <div className="flex items-center justify-end gap-3 sm:gap-4">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              Approved on {formatDate(request.updatedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => openRemoveModal(request)}
                              disabled={processing?.requestId === request.id}
                              title="Remove creator and deactivate all products"
                              className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-400 bg-red-500/15 hover:bg-red-600 hover:text-white border border-red-500/30 hover:border-red-600 transition-all duration-150 whitespace-nowrap shadow-sm cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <UserMinus className="w-4 h-4 text-red-400 group-hover:text-white transition-colors flex-shrink-0" />
                              <span>Remove Creator</span>
                            </button>
                          </div>
                        )}

                        {/* 3. Rejected Creator Actions */}
                        {request.status === 'rejected' && (
                          <div className="flex items-center justify-end gap-3 sm:gap-4">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              Rejected on {formatDate(request.updatedAt)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApprove(request.id)}
                                disabled={processing?.requestId === request.id}
                                title="Re-approve creator access"
                                className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-green-400 bg-green-500/10 hover:bg-green-500 hover:text-black border border-green-500/30 hover:border-green-500 transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-sm whitespace-nowrap flex-shrink-0"
                              >
                                {processing?.requestId === request.id && processing?.action === 'approve' ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400 mr-1"></div>
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5 text-green-400 group-hover:text-black transition-colors flex-shrink-0" />
                                )}
                                <span>Re-Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteModal(request)}
                                disabled={processing?.requestId === request.id}
                                title="Delete request record permanently"
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Remove Creator & Products Confirmation Popup */}
      {removeModal.isOpen && removeModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#141416] border border-red-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-left">
            {/* Modal Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Remove Creator & Products</h3>
                  <p className="text-xs text-gray-400">Revoke creator privileges and remove products</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRemoveModal({ isOpen: false, request: null, deactivateProducts: true })}
                className="text-gray-500 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Creator Info Card */}
            <div className="bg-neutral-900 border border-white/5 rounded-xl p-3.5 mb-4">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{removeModal.request.name}</span>
                <span className="text-xs text-gray-500 font-normal">#{removeModal.request.id}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">@{removeModal.request.username}</div>
              <div className="text-xs text-gray-500 mt-1">{removeModal.request.email}</div>
              {removeModal.request.creatorUrl && (
                <div className="text-xs text-orange-400/90 truncate mt-1 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{removeModal.request.creatorUrl}</span>
                </div>
              )}
            </div>

            {/* Prominent Warning Callout */}
            <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-red-300">
                    Removing this creator will also remove all of their products from the store!
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Removing this creator will automatically deactivate and remove all of their published products from the marketplace and catalog.
                  </p>
                </div>
              </div>
              <ul className="list-disc list-inside mt-3 space-y-1 text-xs text-gray-400 border-t border-red-500/20 pt-2.5">
                <li>User account role will be reverted from <strong className="text-white">Creator</strong> to regular <strong className="text-white">Customer User</strong>.</li>
                <li>Access to the Creator Studio dashboard, 2D/3D design canvas, and earnings wallet will be blocked.</li>
                <li>All products created by this user will be removed from the store and marketplace.</li>
                <li>Customers will no longer be able to find or order their items.</li>
              </ul>
            </div>

            <p className="text-xs text-gray-300 mb-6 font-medium">
              Are you sure you want to proceed with removing <span className="text-white font-bold">{removeModal.request.name}</span> and all of their products?
            </p>

            {/* Actions: Cancel / Yes */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRemoveModal({ isOpen: false, request: null, deactivateProducts: true })}
                disabled={processing?.action === 'remove'}
                className="px-5 py-2.5 text-xs font-semibold text-gray-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={processing?.action === 'remove'}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing?.action === 'remove' ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                    <span>Removing Creator & Products...</span>
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4" />
                    <span>Yes, Remove Creator & Products</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Request Record Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.request && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#141416] border border-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center flex-shrink-0">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Delete Creator Request</h3>
                  <p className="text-xs text-gray-400">Permanently delete this application entry</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, request: null })}
                className="text-gray-500 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Are you sure you want to permanently delete the application record for{' '}
              <strong className="text-white">{deleteModal.request.name}</strong> (@{deleteModal.request.username})?
              This record cannot be recovered.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal({ isOpen: false, request: null })}
                disabled={processing?.action === 'delete'}
                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={processing?.action === 'delete'}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {processing?.action === 'delete' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}