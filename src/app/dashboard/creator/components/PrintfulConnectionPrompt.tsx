
'use client';

import { 
  Package, 
  ExternalLink
} from 'lucide-react';




export default function PrintfulConnectionPrompt({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="text-center py-12">
      <Package className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-lg font-medium text-gray-900">Admin Setup Required</h3>
      <p className="mt-1 text-sm text-gray-500">
        Contact admin to configure Printful integration for all creators
      </p>
      <div className="mt-4 p-4 bg-amber-50 rounded-lg">
        <p className="text-sm text-amber-800">
          <strong>Admin Action Required:</strong> The Printful integration needs to be configured by an administrator. 
          Once set up, all creators will have access to Printful features automatically.
        </p>
      </div>
      <div className="mt-6">
        <button
          onClick={onConnect}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <ExternalLink className="w-5 h-5 mr-2" />
          Contact Admin
        </button>
      </div>
    </div>
  );
}
