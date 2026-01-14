'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, DollarSign, TrendingUp, Package } from 'lucide-react';
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
        return 'bg-gray-100 text-gray-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'paid':
        return 'bg-emerald-100 text-emerald-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
    if (!data) return { type: 'unknown', label: 'Unknown', color: 'bg-gray-100 text-gray-700' };

    // Commissions are confirmed after payment release (when actual Printful costs are known)
    if (data.paymentStatus === 'released' || data.orderStatus === 'fulfilled' || data.orderStatus === 'shipped') {
      return { type: 'confirmed', label: 'Confirmed', color: 'bg-green-100 text-green-700' };
    }

    // Commissions are estimated before payment release
    if (data.paymentStatus === 'escrowed' || data.orderStatus === 'processing') {
      return { type: 'estimated', label: 'Estimated', color: 'bg-yellow-100 text-yellow-700' };
    }

    // No commissions tracked yet
    if (data.breakdown.length === 0) {
      return { type: 'not_tracked', label: 'Not Tracked', color: 'bg-gray-100 text-gray-600' };
    }

    return { type: 'pending', label: 'Pending', color: 'bg-blue-100 text-blue-700' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Commission Breakdown
              </h2>
              <p className="text-blue-100 text-sm mt-1">Order: {orderNumber}</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {data && !loading && !error && (
            <div className="space-y-6">
              {/* Commission Status Info */}
              {getCommissionType().type === 'estimated' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-1">Estimated Commissions</h4>
                      <p className="text-sm text-yellow-800">
                        Commission amounts shown are <strong>estimates</strong> based on pre-order calculations.
                        Final confirmed amounts will be calculated after payment release, using actual Printful production costs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {getCommissionType().type === 'confirmed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-900 mb-1">Confirmed Commissions</h4>
                      <p className="text-sm text-green-800">
                        Commission amounts are <strong>confirmed</strong> and calculated using actual Printful production costs after order fulfillment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {getCommissionType().type === 'not_tracked' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-blue-900 mb-1">Commissions Not Yet Tracked</h4>
                      <p className="text-sm text-blue-800">
                        Commissions will be tracked after payment verification and order processing. This ensures accurate calculations based on actual production costs.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order Total</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(data.orderTotal)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Platform Fee</p>
                  <p className="text-xl font-bold text-orange-600">{formatCurrency(data.adminFee)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vendor Cost</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(data.vendorPaymentAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    Creators
                  </p>
                  <p className="text-xl font-bold text-blue-600">{data.creatorsCount}</p>
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
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Creator Commissions
                  </h3>

                  {data.breakdown.map((creator) => (
                    <div
                      key={creator.creatorId}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                    >
                      {/* Creator Summary */}
                      <div
                        className="bg-white p-4 cursor-pointer"
                        onClick={() =>
                          setSelectedCreator(
                            selectedCreator === creator.creatorId ? null : creator.creatorId
                          )
                        }
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{creator.creatorName}</h4>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(
                                  creator.status
                                )}`}
                              >
                                {creator.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{creator.creatorEmail}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Package className="w-3 h-3" />
                              {creator.productsCount} product{creator.productsCount !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600">
                              {formatCurrency(creator.commission)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Revenue: {formatCurrency(creator.totalRevenue)}
                            </p>
                          </div>
                        </div>

                        {/* Fee Breakdown */}
                        <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-600">Stripe Fee</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(creator.stripeFee)}
                            </p>
                          </div>
                          <div className="bg-orange-50 rounded p-2">
                            <p className="text-orange-600">Platform Fee</p>
                            <p className="font-semibold text-orange-900">
                              {formatCurrency(creator.platformFee)}
                            </p>
                          </div>
                          <div className="bg-purple-50 rounded p-2">
                            <p className="text-purple-600">Production Cost</p>
                            <p className="font-semibold text-purple-900">
                              {formatCurrency(creator.printfulCost)}
                            </p>
                          </div>
                          <div className="bg-emerald-50 rounded p-2">
                            <p className="text-emerald-600">Net Commission</p>
                            <p className="font-semibold text-emerald-900">
                              {formatCurrency(creator.commission)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Product Details (Expandable) */}
                      {selectedCreator === creator.creatorId && (
                        <div className="bg-gray-50 border-t border-gray-200 p-4">
                          <h5 className="text-sm font-semibold text-gray-700 mb-3">Product Breakdown:</h5>
                          <div className="space-y-2">
                            {getCreatorDetails(creator.creatorId).map((detail) => (
                              <div
                                key={detail.id}
                                className="bg-white rounded p-3 text-sm border border-gray-200"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">{detail.productName}</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Product ID: {detail.productId}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-emerald-600">
                                      {formatCurrency(detail.commissionAmount)}
                                    </p>
                                    <p className="text-xs text-gray-500">
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
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
