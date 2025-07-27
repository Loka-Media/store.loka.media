
'use client';

import { 
  Package, 
  ExternalLink
} from 'lucide-react';




export default function PrintfulConnectionPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Setup Printful Integration</h3>
      <p className="mt-1 text-sm text-gray-500">
        One-time admin setup required to enable Printful for all creators
      </p>
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          This is a one-time setup that will enable Printful access for ALL creators on the platform. 
          You&apos;ll be redirected to Printful to authorize the admin account.
        </p>
      </div>
      <div className="mt-6">
        <button
          onClick={onConnect}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Setup Printful Integration
        </button>
      </div>
    </div>
  );
}
