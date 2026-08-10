import { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle, RefreshCw, Truck, Info } from 'lucide-react';
import { getShippingCountries } from '@/lib/location-utils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface CartItem {
  id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  total_price: string;
  printful_variant_id?: string;
  source?: string;
  printify_variant_id?: number | string | null;
  variant_id?: number | string | null;
}

interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  currency: string;
}

interface AvailabilityCheck {
  available: boolean;
  message?: string;
  timestamp?: number;
}

interface OrderSummaryProps {
  items: CartItem[];
  summary: { subtotal: string };
  calculateTotal: () => number;
  onCreateOrder: () => void;
  loading: boolean;
  shippingCost: number;
  shippingRates: ShippingRate[];
  selectedShippingRate: any;
  setSelectedShippingRate: any;
  taxAmount?: number;
  availabilityCheck?: AvailabilityCheck | null;
  onCheckAvailability?: () => void;
  checkingAvailability?: boolean;
  countryCode: string;
  isFetchingShippingRates?: boolean;
}

export const OrderSummary = ({
  items,
  summary,
  calculateTotal,
  onCreateOrder,
  loading,
  shippingCost,
  shippingRates,
  selectedShippingRate,
  setSelectedShippingRate,
  taxAmount = 0,
  availabilityCheck = null,
  onCheckAvailability,
  checkingAvailability = false,
  countryCode,
  isFetchingShippingRates = false,
}: OrderSummaryProps) => {
  const { formatPrice } = useCurrency();
  const subtotalAmount = parseFloat(summary.subtotal.replace("$", ""));
  const platformFee = subtotalAmount * 0.049;
  // Use actual tax if available, otherwise estimate at 8%
  const tax = taxAmount > 0 ? taxAmount : subtotalAmount * 0.08;

  // Check if cart has any Printful items
  const hasPrintfulItems = items.some(item =>
    item.printful_variant_id || item.source === 'printful'
  );

  return (
    <div className="gradient-border-white-top rounded-xl overflow-hidden p-6 sm:p-8">
      <div className="text-lg sm:text-xl font-bold text-white flex items-center mb-6">
        <Package className="w-5 h-5 mr-2" />
        Order Summary
      </div>

      <div className="space-y-4 pb-6 border-b border-gray-800">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm text-white">
                {item.product_name}
              </p>
              <p className="text-xs text-gray-400 font-medium">
                {item.size} • {item.color || "Default"} • Qty: {item.quantity}
              </p>
            </div>
            <p className="font-bold text-white">{formatPrice(item.total_price)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <p className="text-gray-400 font-medium">Subtotal</p>
          <p className="text-white font-bold">{formatPrice(subtotalAmount)}</p>
        </div>
        <div className="flex justify-between text-sm">
          <p className="text-gray-400 font-medium">
            Platform Fee
            <span className="text-xs block text-gray-500">Convenience fee (4.9%)</span>
          </p>
          <p className="text-white font-bold">{formatPrice(platformFee)}</p>
        </div>
        {isFetchingShippingRates ? (
          <div className="text-sm">
            <p className="text-gray-400 font-medium mb-2">Shipping Method</p>
            <div className="flex justify-between items-center p-3 border border-orange-500/30 bg-orange-500/5 rounded-lg">
              <p className="text-white font-medium">Calculating Shipping...</p>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent" />
            </div>
          </div>
        ) : shippingRates && shippingRates.length > 0 ? (
          <div className="text-sm">
            <p className="text-gray-400 font-medium mb-2">Shipping Method</p>
            <div className="space-y-2">
              {shippingRates.map((rate) => (
                <div
                  key={rate.id}
                  className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedShippingRate?.id === rate.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-gray-700 hover:bg-gray-800/50"
                  }`}
                  onClick={() => setSelectedShippingRate(rate)}
                >
                  <p className="text-white font-medium">{rate.name}</p>
                  <p className="text-white font-bold">
                    {formatPrice(rate.rate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <p className="text-gray-400 font-medium">Shipping</p>
            <p className="text-white font-bold">{formatPrice(shippingCost)}</p>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <p className="text-gray-400 font-medium">
            Estimated Tax
            <span className="text-xs block text-gray-500">Final tax calculated at checkout</span>
          </p>
          <p className="text-white font-bold">{formatPrice(tax)}</p>
        </div>
        <div className="border-t border-gray-800 pt-3 mt-3 flex justify-between font-bold">
          <p className="text-white">Estimated Total</p>
          <p className="text-orange-400 text-lg">{formatPrice(calculateTotal())}</p>
        </div>
      </div>

      {/* Availability Check Section */}
      {hasPrintfulItems && onCheckAvailability && (
        <div className="mt-6">
          {availabilityCheck ? (
            <div
              className={`flex items-center justify-between p-4 rounded-lg border ${
                availabilityCheck.available
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                {availabilityCheck.available ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span
                  className={`text-sm font-medium ${
                    availabilityCheck.available ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {availabilityCheck.message}
                </span>
              </div>
              <button
                onClick={onCheckAvailability}
                disabled={checkingAvailability}
                className="text-gray-400 hover:text-white transition-colors"
                title="Recheck availability"
              >
                <RefreshCw
                  className={`w-4 h-4 ${checkingAvailability ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          ) : (
            <button
              onClick={onCheckAvailability}
              disabled={checkingAvailability}
              className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-300 border border-gray-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {checkingAvailability ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Checking Availability...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Check Availability</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {items.some(item => item.source === 'printify' || (item as any).printify_blueprint_id) && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-6 space-y-3">
          <div className="flex items-center space-x-2 text-white">
            <Truck className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-bold">Standard Shipping Rates to {countryCode || 'US'}</span>
          </div>

          {isFetchingShippingRates ? (
            <div className="flex items-center space-x-2 text-gray-400 text-xs py-1">
              <div className="animate-spin rounded-full h-3 w-3 border border-orange-500 border-t-transparent" />
              <span>Calculating itemized rates...</span>
            </div>
          ) : (
            <div className="space-y-2 text-xs text-gray-300">
              {items.map((item, index) => {
                const variantId = Number((item as any).printify_variant_id || item.printful_variant_id || item.variant_id);
                const est = selectedShippingRate?.itemized?.[index]
                  || selectedShippingRate?.itemized?.find((r: any) => 
                      Number(r.variant_id) === variantId || 
                      Number(r.variant_id) === Number(item.variant_id) ||
                      Number(r.blueprint_id) === Number((item as any).blueprint_id)
                     );
                
                const firstCost = est ? `$${(est.first_item / 100).toFixed(2)} USD` : '$5.99 USD';
                const addCost = est ? `$${(est.additional_items / 100).toFixed(2)} USD` : '$2.00 USD';

                return (
                  <div key={item.id || index} className="bg-black/40 border border-white/5 p-2 rounded-lg space-y-1">
                    <p className="font-bold text-white text-[11px] truncate">{item.product_name}</p>
                    <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                      <span>First Item: {firstCost}</span>
                      <span>Additional: {addCost}</span>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 mt-1">
                <Info className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                <span>Multiple quantities or items from same print provider are grouped automatically.</span>
              </div>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onCreateOrder}
        disabled={loading}
        className="w-full mt-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)] disabled:opacity-50"
      >
        {loading ? "Creating Order..." : "Continue to Payment"}
      </button>
    </div>
  );
};