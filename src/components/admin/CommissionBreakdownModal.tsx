'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, TrendingUp, Package, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/auth';

interface CommissionBreakdown {
  creatorId: number;
  creatorName: string;
  creatorEmail: string;
  creatorUsername: string;
  productsCount: number;
  totalRevenue: number;
  stripeFee: number;
  platformFee: number;
  printfulCost: number;
  commission: number;
  status: string;
  payoutId: number | null;
  firstTrackedAt: string;
  lastUpdatedAt: string;
}

interface CommissionDetail {
  id: number;
  creatorId: number;
  creatorName: string;
  productId: number;
  productName: string;
  orderAmount: number;
  stripeFee: number;
  platformFee: number;
  printfulCost: number;
  commissionAmount: number;
  status: string;
  payoutId: number | null;
  createdAt: string;
  paidAt: string | null;
}

interface CommissionBreakdownData {
  success: boolean;
  orderId: number;
  orderNumber: string;
  orderTotal: number;
  adminFee: number;
  vendorPaymentAmount: number;
  orderStatus: string;
  paymentStatus: string;
  creatorsCount: number;
  breakdown: CommissionBreakdown[];
  details: CommissionDetail[];
}

interface CommissionBreakdownModalProps {
  orderId: number;
  orderNumber: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommissionBreakdownModal({
  orderId,
  orderNumber,
  isOpen,
  onClose
}: CommissionBreakdownModalProps) {
  const [data, setData] = useState<CommissionBreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCreator, setSelectedCreator] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchCommissionBreakdown();
    }
  }, [isOpen, orderId]);

  const fetchCommissionBreakdown = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`/api/unified-checkout/admin/orders/${orderId}/commissions`);
      setData(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load commission breakdown');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/25';
      case 'processing':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/25';
      case 'paid':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25';
      case 'refunded':
        return 'bg-red-500/10 text-red-400 border border-red-500/25';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/25';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getCreatorDetails = (creatorId: number) => {
    return data?.details.filter(d => d.creatorId === creatorId) || [];
  };

  const getCommissionType = () => {
    if (!data) return { type: 'unknown', label: 'Unknown', color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };

    if (data.paymentStatus === 'released' || data.orderStatus === 'fulfilled' || data.orderStatus === 'shipped') {
      return { type: 'confirmed', label: 'Confirmed', color: 'bg-green-500/10 text-green-400 border border-green-500/25' };
    }

    if (data.paymentStatus === 'escrowed' || data.orderStatus === 'processing') {
      return { type: 'estimated', label: 'Estimated', color: 'bg-amber-500/10 text-amber-400 border border-amber-500/25' };
    }

    if (data.breakdown.length === 0) {
      return { type: 'not_tracked', label: 'Not Tracked', color: 'bg-gray-500/10 text-gray-400 border border-gray-500/20' };
    }

    return { type: 'pending', label: 'Pending', color: 'bg-blue-500/10 text-blue-400 border border-blue-500/25' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Commission Breakdown
              </h2>
              <p className="text-orange-100 text-sm mt-1">Order: {orderNumber}</p>
            </div>
            {data && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCommissionType().color}`}>
                {getCommissionType().label}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-black">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {data && !loading && !error && (
            <div className="space-y-6">
              {/* Commission Status Info */}
              {getCommissionType().type === 'estimated' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-amber-400">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Estimated Commissions</h4>
                      <p className="text-sm text-gray-300">
                        Commission amounts shown are <strong>estimates</strong> based on pre-order calculations.
                        Final confirmed amounts will be calculated after payment release, using actual Printful production costs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {getCommissionType().type === 'confirmed' && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-green-400">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Confirmed Commissions</h4>
                      <p className="text-sm text-gray-300">
                        Commission amounts are <strong>confirmed</strong> and calculated using actual Printful production costs after order fulfillment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {getCommissionType().type === 'not_tracked' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-blue-400">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-1">Commissions Not Yet Tracked</h4>
                      <p className="text-sm text-gray-300">
                        Commissions will be tracked after payment verification and order processing. This ensures accurate calculations based on actual production costs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-neutral-900 border border-white/5 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Order Total</p>
                  <p className="text-xl font-bold text-white">{formatCurrency(data.orderTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Platform Fee</p>
                  <p className="text-xl font-bold text-orange-400">{formatCurrency(data.adminFee)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Vendor Cost</p>
                  <p className="text-xl font-bold text-purple-400">{formatCurrency(data.vendorPaymentAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-400" />
                    Creators
                  </p>
                  <p className="text-xl font-bold text-blue-400">{data.creatorsCount}</p>
                </div>
              </div>

              {/* Creator Breakdown */}
              {data.breakdown.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No commission data available for this order yet.</p>
                  <p className="text-sm mt-2">Commissions are tracked after payment release.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#FF6D1F]" />
                    Creator Commissions
                  </h3>

                  {data.breakdown.map((creator) => (
                    <div
                      key={creator.creatorId}
                      className="border border-white/10 bg-neutral-900/60 rounded-lg overflow-hidden hover:shadow-[0_10px_30px_rgba(255,109,31,0.08)] transition"
                    >
                      {/* Creator Summary */}
                      <div
                        className="bg-[#141414] p-4 cursor-pointer"
                        onClick={() =>
                          setSelectedCreator(
                            selectedCreator === creator.creatorId ? null : creator.creatorId
                          )
                        }
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-white">{creator.creatorName}</h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium border ${getStatusBadgeColor(
                                  creator.status
                                )}`}
                              >
                                {creator.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-400">{creator.creatorEmail}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Package className="w-3 h-3 text-orange-400" />
                              {creator.productsCount} product{creator.productsCount !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-400">
                              {formatCurrency(creator.commission)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Revenue: {formatCurrency(creator.totalRevenue)}
                            </p>
                          </div>
                        </div>

                        {/* Fee Breakdown */}
                        <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-neutral-950 border border-white/5 rounded p-2">
                            <p className="text-gray-500">Stripe Fee</p>
                            <p className="font-semibold text-white">
                              {formatCurrency(creator.stripeFee)}
                            </p>
                          </div>
                          <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2 text-orange-400">
                            <p className="text-orange-400">Platform Fee</p>
                            <p className="font-semibold text-white">
                              {formatCurrency(creator.platformFee)}
                            </p>
                          </div>
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded p-2 text-purple-400">
                            <p className="text-purple-400">Production Cost</p>
                            <p className="font-semibold text-white">
                              {formatCurrency(creator.printfulCost)}
                            </p>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-2 text-emerald-400">
                            <p className="text-emerald-400">Net Commission</p>
                            <p className="font-semibold text-white">
                              {formatCurrency(creator.commission)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Product Details (Expandable) */}
                      {selectedCreator === creator.creatorId && (
                        <div className="bg-neutral-950 border-t border-white/10 p-4">
                          <h5 className="text-sm font-semibold text-gray-300 mb-3">Product Breakdown:</h5>
                          <div className="space-y-2">
                            {getCreatorDetails(creator.creatorId).map((detail) => (
                              <div
                                key={detail.id}
                                className="bg-neutral-900 rounded p-3 text-sm border border-white/5"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-white">{detail.productName}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Product ID: {detail.productId}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-emerald-400">
                                      {formatCurrency(detail.commissionAmount)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      from {formatCurrency(detail.orderAmount)}
                                    </p>
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-neutral-950 px-6 py-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full bg-[#FF6D1F] hover:bg-[#ff7d38] text-black py-2.5 px-4 rounded-lg font-bold transition duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
