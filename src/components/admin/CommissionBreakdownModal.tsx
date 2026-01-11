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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Commission Breakdown
            </h2>
            <p className="text-blue-100 text-sm mt-1">Order: {orderNumber}</p>
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
