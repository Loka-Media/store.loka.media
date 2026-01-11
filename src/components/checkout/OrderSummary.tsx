import { Package } from 'lucide-react';

interface CartItem {
  id: number;
  product_name: string;
  size: string;
  color: string;
  quantity: number;
  total_price: string;
}

interface ShippingRate {
  id: string;
  name: string;
  rate: number;
  currency: string;
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
}: OrderSummaryProps) => {
  const subtotalAmount = parseFloat(summary.subtotal.replace("$", ""));
  // Use actual tax if available, otherwise estimate at 8%
  const tax = taxAmount > 0 ? taxAmount : subtotalAmount * 0.08;

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
            <p className="font-bold text-white">${item.total_price}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex justify-between text-sm">
          <p className="text-gray-400 font-medium">Subtotal</p>
          <p className="text-white font-bold">{summary.subtotal}</p>
        </div>
        {shippingRates && shippingRates.length > 0 ? (
          <div className="text-sm">
            <p className="text-gray-400 font-medium mb-2">Shipping Method</p>
            <div className="space-y-2">
              {shippingRates.map((rate) => (
                <div
                  key={rate.id}
                  className={`flex justify-between items-center p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                    selectedShippingRate.id === rate.id
                      ? "border-orange-500 bg-orange-500/10"
                      : "border-gray-700 hover:bg-gray-800/50"
                  }`}
                  onClick={() => setSelectedShippingRate(rate)}
                >
                  <p className="text-white font-medium">{rate.name}</p>
                  <p className="text-white font-bold">
                    ${parseFloat(rate.rate.toString()).toFixed(2)}{" "}
                    {rate.currency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <p className="text-gray-400 font-medium">Shipping</p>
            <p className="text-white font-bold">${shippingCost.toFixed(2)}</p>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <p className="text-gray-400 font-medium">
            Estimated Tax
            <span className="text-xs block text-gray-500">Final tax calculated at checkout</span>
          </p>
          <p className="text-white font-bold">${tax.toFixed(2)}</p>
        </div>
        <div className="border-t border-gray-800 pt-3 mt-3 flex justify-between font-bold">
          <p className="text-white">Estimated Total</p>
          <p className="text-orange-400 text-lg">${calculateTotal().toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={onCreateOrder}
        disabled={loading}
        className="w-full mt-8 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3 px-4 rounded-lg font-bold transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)] disabled:opacity-50"
      >
        {loading ? "Creating Order..." : "Continue to Payment"}
      </button>
    </div>
  );
};