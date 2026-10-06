'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatDate, checkoutAPI } from '@/lib/api';
import { Package, Calendar, CreditCard, Truck, MapPin, ArrowLeft, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface OrderAddress {
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
}

interface OrderDetails {
  id: number | string;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_address: OrderAddress;
  billing_address?: OrderAddress;
  payment_status: string;
  payment_method: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: Array<{
    id: number | string;
    product_name: string;
    thumbnail_url: string;
    size?: string;
    color?: string;
    image_url: string;
    creator_name?: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { id } = use(params);
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const router = useRouter();

  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [fulfillment, setFulfillment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      let rawOrder: any = null;
      let fulfillmentData: any = null;

      // 1. Try direct getOrderDetails endpoint
      try {
        const response = await checkoutAPI.getOrderDetails(id);
        if (response && response.order) {
          rawOrder = response.order;
          fulfillmentData = response.fulfillment;
        } else if (response && (response.id || response.order_number)) {
          rawOrder = response;
          fulfillmentData = response.fulfillment;
        }
      } catch (err) {
        console.warn('Direct order API failed, checking user orders:', err);
      }

      // 2. Fallback: look up in user orders list
      if (!rawOrder) {
        try {
          const userOrdersRes = await checkoutAPI.getUserOrders({ limit: 50 });
          const rawOrders = Array.isArray(userOrdersRes)
            ? userOrdersRes
            : (userOrdersRes?.orders || userOrdersRes?.data || userOrdersRes?.result || []);
          const matched = rawOrders.find((o: any) =>
            String(o.id) === String(id) ||
            String(o.order_number) === String(id) ||
            String(o.orderNumber) === String(id)
          );
          if (matched) {
            rawOrder = matched;
            fulfillmentData = matched.fulfillment || matched.metadata?.fulfillment || null;
          }
        } catch (err) {
          console.warn('User orders fallback lookup failed:', err);
        }
      }

      if (!rawOrder) {
        setOrder(null);
        setLoading(false);
        return;
      }

      const meta = rawOrder.metadata || {};
      const stripeAmountCents = meta.paymentDetails?.amount_received || meta.paymentDetails?.amount || 0;
      const stripeTotal = stripeAmountCents > 0 ? stripeAmountCents / 100 : null;
      const customerPaymentAmount = parseFloat(rawOrder.customer_payment_amount || rawOrder.customerPaymentAmount || '0');
      const backendTotal = parseFloat(rawOrder.total_amount || rawOrder.totalAmount || rawOrder.total || '0');
      const resolvedTotal = customerPaymentAmount > 0 ? customerPaymentAmount : (stripeTotal || backendTotal);

      const rawItems = rawOrder.order_items || rawOrder.orderItems || rawOrder.items || [];
      const mappedOrder: OrderDetails = {
        id: rawOrder.id,
        order_number: rawOrder.order_number || rawOrder.orderNumber || `ORD-${rawOrder.id}`,
        status: (rawOrder.order_status || rawOrder.status || 'pending').toLowerCase(),
        total_amount: resolvedTotal,
        shipping_address: rawOrder.shipping_address || rawOrder.shippingAddress || {},
        billing_address: rawOrder.billing_address || rawOrder.billingAddress,
        payment_status: rawOrder.payment_status || rawOrder.paymentStatus || 'paid',
        payment_method: rawOrder.payment_method || rawOrder.paymentMethod || rawOrder.orderType || 'stripe',
        notes: rawOrder.notes,
        created_at: rawOrder.created_at || rawOrder.createdAt || new Date().toISOString(),
        updated_at: rawOrder.updated_at || rawOrder.updatedAt || new Date().toISOString(),
        items: rawItems.map((item: any) => {
          const uPrice = parseFloat(item.unit_price || item.price || '0');
          const qty = Number(item.quantity) || 1;
          const tPrice = parseFloat(item.total_price || (uPrice * qty).toString());
          const img = item.image_url || item.thumbnail_url || item.product_image || '/placeholder-product.svg';

          return {
            id: item.id || item.product_id || 1,
            product_name: item.product_name || item.productName || item.title || 'Custom Product',
            thumbnail_url: img,
            size: item.size || 'Standard',
            color: item.color || 'Standard',
            image_url: img,
            creator_name: item.creator_name || 'Loka Creator',
            quantity: qty,
            unit_price: uPrice,
            total_price: tPrice,
          };
        }),
      };

      setOrder(mappedOrder);
      setFulfillment(fulfillmentData);
    } catch (error) {
      console.error('Failed to load order:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (isAuthenticated) {
      fetchOrderDetails();
    }
  }, [authLoading, isAuthenticated, fetchOrderDetails, router]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('deliver') || s === 'completed') {
      return { label: 'Delivered', color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', Icon: CheckCircle2 };
    }
    if (s.includes('ship') || s.includes('transit')) {
      return { label: 'Shipped', color: '#38BDF8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.25)', Icon: Truck };
    }
    if (s.includes('product') || s.includes('print') || s.includes('process')) {
      return { label: 'In Production', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', Icon: Clock };
    }
    if (s.includes('cancel')) {
      return { label: 'Cancelled', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', Icon: XCircle };
    }
    return { label: 'Order Placed', color: '#A1A1AA', bg: 'rgba(161,161,170,0.12)', border: 'rgba(161,161,170,0.25)', Icon: Package };
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#080809] flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-3 border-[#FF6D1F]/20 border-t-[#FF6D1F] rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#080809] flex items-center justify-center px-4">
        <div className="text-center max-w-md bg-white/[0.03] border border-white/10 rounded-2xl p-8 backdrop-blur-xl">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-400">
            <Package size={26} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Order Not Found</h2>
          <p className="text-sm text-gray-400 mb-6">
            We could not find the details for this order. It may belong to another account or was placed as a guest.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
            >
              <ArrowLeft size={14} /> Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(order.status);
  const StatusIcon = statusBadge.Icon;

  return (
    <div className="min-h-screen bg-[#080809] text-white pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Order Details</h1>
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.border}` }}
              >
                <StatusIcon size={12} />
                <span>{statusBadge.label}</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Order <span className="text-white font-semibold">#{order.order_number}</span>
            </p>
          </div>

          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 rounded-xl text-xs font-bold text-gray-200 transition-all self-start sm:self-auto"
          >
            <ArrowLeft size={14} />
            <span>Back to Profile</span>
          </Link>
        </div>

        <div className="space-y-6">
          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF6D1F]/10 border border-[#FF6D1F]/20 flex items-center justify-center text-[#FF6D1F] shrink-0">
                <Package size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-gray-500 uppercase font-bold block">Status</span>
                <span className="text-xs sm:text-sm font-bold text-white truncate block capitalize">{order.status}</span>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <CreditCard size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-gray-500 uppercase font-bold block">Payment</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-400 truncate block capitalize">{order.payment_status}</span>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Calendar size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-gray-500 uppercase font-bold block">Date</span>
                <span className="text-xs sm:text-sm font-bold text-white truncate block">{formatDate(order.created_at)}</span>
              </div>
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <Truck size={20} />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-gray-500 uppercase font-bold block">Method</span>
                <span className="text-xs sm:text-sm font-bold text-white truncate block capitalize">{order.payment_method}</span>
              </div>
            </div>
          </div>

          {/* Fulfillment & Live Tracking Details if available */}
          {fulfillment && (
            <div className="bg-white/[0.03] border border-emerald-500/30 rounded-2xl p-5 sm:p-6">
              <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <Truck size={16} /> Live Package Tracking & Fulfillment
              </h3>

              {(() => {
                const data = typeof fulfillment.fulfillment_data === 'string'
                  ? JSON.parse(fulfillment.fulfillment_data)
                  : fulfillment.fulfillment_data;
                const shipments = data?.shipments || [];

                if (shipments.length === 0) {
                  return (
                    <p className="text-xs text-gray-400">
                      Your order is processing in our custom production facility. Tracking numbers will appear here as soon as dispatched.
                    </p>
                  );
                }

                return (
                  <div className="space-y-3 mt-2">
                    {shipments.map((s: any, idx: number) => (
                      <div key={idx} className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-xs text-gray-500 block">Carrier</span>
                          <span className="text-sm font-bold text-white">{s.carrier || 'Courier'}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">Tracking Code</span>
                          <span className="text-sm font-mono text-emerald-400">{s.number}</span>
                        </div>
                        {s.url && (
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all self-start sm:self-auto"
                          >
                            <span>Track on Carrier</span><ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Order Items Section */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Order Items ({order.items.length})</h3>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {order.items.map((item, index) => (
                <div key={index} className="p-4 sm:p-6 flex items-center gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/[0.05] border border-white/10 rounded-xl overflow-hidden relative shrink-0">
                    <Image
                      src={item.image_url}
                      alt={item.product_name}
                      fill
                      className="object-cover"
                      unoptimized={true}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm sm:text-base font-bold text-white truncate">{item.product_name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">by {item.creator_name || 'Loka Creator'}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                      <span>Size: {item.size}</span>
                      <span>•</span>
                      <span>Qty: {item.quantity}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">Unit: {formatPrice(item.unit_price)}</p>
                    <p className="text-sm sm:text-base font-extrabold text-[#FF6D1F] mt-1">{formatPrice(item.total_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Order Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Address */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <MapPin size={16} className="text-[#FF6D1F]" /> Shipping Address
              </h3>
              {order.shipping_address && (order.shipping_address.name || order.shipping_address.address1) ? (
                <div className="text-sm text-gray-300 space-y-1">
                  {order.shipping_address.name && <p className="font-bold text-white">{order.shipping_address.name}</p>}
                  {order.shipping_address.address1 && <p>{order.shipping_address.address1}</p>}
                  {order.shipping_address.address2 && <p>{order.shipping_address.address2}</p>}
                  {(order.shipping_address.city || order.shipping_address.state || order.shipping_address.zip) && (
                    <p>{[order.shipping_address.city, order.shipping_address.state, order.shipping_address.zip].filter(Boolean).join(', ')}</p>
                  )}
                  {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
                  {order.shipping_address.phone && <p className="text-xs text-gray-500 mt-2">Phone: {order.shipping_address.phone}</p>}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No physical shipping address provided.</p>
              )}
            </div>

            {/* Price Summary */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white font-medium">
                    {formatPrice(order.items.reduce((acc, it) => acc + it.total_price, 0))}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-white font-medium">Free</span>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between items-baseline">
                  <span className="text-base font-bold text-white">Total</span>
                  <span className="text-xl font-extrabold text-[#FF6D1F]">
                    {formatPrice(order.total_amount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
