
'use client';

import { 
  Package, 
  ExternalLink
} from 'lucide-react';




export default function PrintfulConnectionPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="gradient-border-white-top p-8 sm:p-12 text-center">
      <div className="text-orange-400 mb-6 inline-block">
        <Package className="w-16 h-16 sm:w-20 sm:h-20" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">Connect Your Printful Account</h3>
      <p className="text-sm sm:text-base text-gray-400 mb-8 max-w-xl mx-auto">
        Unlock your full potential! Connect your Printful account to start selling products, manage inventory, and handle print-on-demand production seamlessly.
      </p>

      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 sm:p-8 mb-8">
        <p className="text-sm sm:text-base text-orange-200">
          <strong className="text-orange-300">✨ What You'll Get:</strong>
          <br/>
          <span className="block text-gray-400 mt-2">
            • Access to thousands of products • Real-time inventory sync • Automated order fulfillment • Dedicated support
          </span>
        </p>
      </div>

      <button
        onClick={onConnect}
        className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-[0_10px_30px_rgba(255,99,71,0.3)] transition-all text-sm sm:text-base"
      >
        <ExternalLink className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
        Connect Printful Now
      </button>
    </div>
  );
}
