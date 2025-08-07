
'use client';

import { Shield, Truck, Award } from 'lucide-react';

export function ProductShippingInfo() {
  return (
    <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <Shield className="w-5 h-5 mr-2 text-orange-500" />
        Our Promise
      </h3>
      <div className="space-y-4">
        <div className="flex items-center">
          <Truck className="w-5 h-5 text-orange-500 mr-3" />
          <div>
            <p className="text-white font-medium">Free Express Shipping</p>
            <p className="text-gray-400 text-sm">On orders over $50</p>
          </div>
        </div>
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-orange-500 mr-3" />
          <div>
            <p className="text-white font-medium">30-Day Returns</p>
            <p className="text-gray-400 text-sm">Hassle-free return policy</p>
          </div>
        </div>
        <div className="flex items-center">
          <Award className="w-5 h-5 text-orange-500 mr-3" />
          <div>
            <p className="text-white font-medium">Premium Quality</p>
            <p className="text-gray-400 text-sm">Print-on-demand excellence</p>
          </div>
        </div>
      </div>
    </div>
  );
}
