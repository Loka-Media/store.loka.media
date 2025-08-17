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
}: OrderSummaryProps) => {
  const subtotalAmount = parseFloat(summary.subtotal.replace("$", ""));
  const tax = subtotalAmount * 0.08;

  return (
    <div className="bg-gray-900 border border-gray-800 shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-medium text-white flex items-center mb-4">
        <Package className="w-5 h-5 mr-2" />
        Order Summary
      </h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-white">
                {item.product_name}
              </p>
              <p className="text-xs text-gray-400">
                {item.size} • {item.color || "Default"} • Qty: {item.quantity}
              </p>
            </div>
            <p className="font-medium text-white">${item.total_price}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 border-t border-gray-800 pt-6 space-y-2">
        <div className="flex justify-between text-sm">
          <p className="text-gray-400">Subtotal</p>
          <p className="text-white">{summary.subtotal}</p>
        </div>
        {shippingRates && shippingRates.length > 0 ? (
          <div className="text-sm">
            <p className="text-gray-400 mb-2">Shipping Method</p>
            <div className="space-y-2">
              {shippingRates.map((rate) => (
                <div
                  key={rate.id}
                  className={`flex justify-between items-center p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedShippingRate.id === rate.id
                      ? "border-orange-500 bg-gray-800"
                      : "border-gray-700 hover:bg-gray-800"
                  }`}
                  onClick={() => setSelectedShippingRate(rate)}
                >
                  <p className="text-white">{rate.name}</p>
                  <p className="text-white">
                    ${parseFloat(rate.rate.toString()).toFixed(2)}{" "}
                    {rate.currency}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-between text-sm">
            <p className="text-gray-400">Shipping</p>
            <p className="text-white">${shippingCost.toFixed(2)}</p>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <p className="text-gray-400">Tax (8%)</p>
          <p className="text-white">${tax.toFixed(2)}</p>
        </div>
        <div className="border-t border-gray-800 pt-2 flex justify-between font-medium">
          <p className="text-white">Total</p>
          <p className="text-orange-500">${calculateTotal().toFixed(2)}</p>
        </div>
      </div>

      <button
        onClick={onCreateOrder}
        disabled={loading}
        className="w-full mt-6 bg-orange-500 text-black py-3 px-4 rounded-md hover:bg-orange-600 disabled:opacity-50"
      >
        {loading ? "Creating Order..." : "Continue to Payment"}
      </button>
    </div>
  );
};