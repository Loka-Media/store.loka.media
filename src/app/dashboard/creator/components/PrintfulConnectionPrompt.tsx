
'use client';

import { 
  Package, 
  ExternalLink
} from 'lucide-react';




export default function PrintfulConnectionPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-orange-500/20">
      <Package className="mx-auto h-12 w-12 text-orange-500" />
      <h3 className="mt-2 text-lg font-medium text-white">Admin Setup Required</h3>
      <p className="mt-1 text-sm text-gray-400">
        Contact admin to configure Printful integration for all creators
      </p>
      <div className="mt-4 p-4 bg-orange-900/30 border border-orange-500/50 rounded-lg">
        <p className="text-sm text-orange-200">
          <strong>Admin Action Required:</strong> The Printful integration needs to be configured by an administrator. 
          Once set up, all creators will have access to Printful features automatically.
        </p>
      </div>
      <div className="mt-6">
        <button
          onClick={onConnect}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Contact Admin
        </button>
      </div>
    </div>
  );
}
