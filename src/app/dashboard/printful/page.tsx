'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { printfulAPI, PrintfulConnection } from '@/lib/printful';
import { 
  ExternalLink, 
  Package, 
  Upload, 
 
  ShoppingCart, 
  Palette,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

function PrintfulDashboardContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [connection, setConnection] = useState<PrintfulConnection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnection();
    
    // Handle OAuth callback
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    
    if (connected === 'true') {
      toast.success('Printful account connected successfully!');
      checkConnection();
    } else if (error) {
      toast.error('Failed to connect Printful account. Please try again.');
    }
  }, [searchParams]);

  const checkConnection = async () => {
    try {
      setLoading(true);
      const status = await printfulAPI.getConnectionStatus();
      setConnection(status);
    } catch (error) {
      console.error('Failed to check connection:', error);
      toast.error('Failed to check Printful connection status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      const { authUrl } = await printfulAPI.initializeAuth();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      toast.error('Failed to initialize Printful connection');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your Printful account?')) {
      return;
    }

    try {
      await printfulAPI.disconnect();
      setConnection({ connected: false, isExpired: false, scope: '' });
      toast.success('Printful account disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast.error('Failed to disconnect Printful account');
    }
  };

  const ConnectionStatus = () => {
    if (loading) {
      return (
        <div className="flex items-center space-x-2 text-gray-500">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Checking connection...</span>
        </div>
      );
    }

    if (!connection?.connected) {
      return (
        <div className="flex items-center space-x-2 text-red-600">
          <XCircle className="w-4 h-4" />
          <span>Not connected</span>
        </div>
      );
    }

    if (connection.isExpired) {
      return (
        <div className="flex items-center space-x-2 text-orange-600">
          <AlertTriangle className="w-4 h-4" />
          <span>Connection expired</span>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span>Connected</span>
      </div>
    );
  };

  if (user?.role !== 'creator' && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Creator Access Required</h2>
          <p className="text-gray-600">
            Printful integration is only available for creators and admins.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Package className="w-8 h-8 mr-3 text-indigo-600" />
                Printful Integration
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Connect your Printful account to access print-on-demand services
              </p>
            </div>
            <ConnectionStatus />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!connection?.connected || connection.isExpired ? (
            <ConnectPrintfulCard 
              onConnect={handleConnect} 
              isExpired={connection?.isExpired}
            />
          ) : (
            <PrintfulDashboardMain 
              connection={connection}
              onDisconnect={handleDisconnect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrintfulDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrintfulDashboardContent />
    </Suspense>
  );
}

function ConnectPrintfulCard({ onConnect, isExpired }: { onConnect: () => void; isExpired?: boolean }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="text-center">
          <Package className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            {isExpired ? 'Reconnect to Printful' : 'Connect to Printful'}
          </h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            {isExpired 
              ? 'Your Printful connection has expired. Please reconnect to continue using Printful services.'
              : 'Connect your Printful account to access print-on-demand services including product catalog, file uploads, and order management.'
            }
          </p>
          
          {/* Features list */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left max-w-2xl mx-auto">
            <div className="flex items-start space-x-3">
              <ShoppingCart className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Product Catalog</p>
                <p className="text-sm text-gray-500">Browse and access Printful&apos;s product catalog</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Upload className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">File Upload</p>
                <p className="text-sm text-gray-500">Upload design files to Printful</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Package className="w-5 h-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Sync Products</p>
                <p className="text-sm text-gray-500">Create and manage sync products</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Palette className="w-5 h-5 text-orange-500 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">Design Canvas</p>
                <p className="text-sm text-gray-500">Access Printful&apos;s design tools</p>
              </div>
            </div>
          </div>

          <button
            onClick={onConnect}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ExternalLink className="w-5 h-5 mr-2" />
            {isExpired ? 'Reconnect Printful Account' : 'Connect Printful Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PrintfulDashboardMain({ 
  connection, 
  onDisconnect 
}: { 
  connection: PrintfulConnection; 
  onDisconnect: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Connection Info Card */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Printful Connection
              </h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>Connected: {new Date(connection.connectedAt!).toLocaleDateString()}</p>
                <p>Scope: {connection.scope}</p>
              </div>
            </div>
            <button
              onClick={onDisconnect}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <QuickActionCard
          title="Browse Catalog"
          description="Explore Printful product catalog"
          icon={<ShoppingCart className="w-8 h-8" />}
          color="bg-blue-500"
        />
        <QuickActionCard
          title="Upload Files"
          description="Upload design files to Printful"
          icon={<Upload className="w-8 h-8" />}
          color="bg-green-500"
        />
        <QuickActionCard
          title="Sync Products"
          description="Manage your sync products"
          icon={<Package className="w-8 h-8" />}
          color="bg-purple-500"
        />
        <QuickActionCard
          title="Design Canvas"
          description="Access Printful design tools"
          icon={<Palette className="w-8 h-8" />}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Activity or Stats could go here */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Getting Started
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                  <span className="text-sm font-medium text-indigo-600">1</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Browse the Catalog</p>
                <p className="text-sm text-gray-500">Explore available products and variants</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                  <span className="text-sm font-medium text-indigo-600">2</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Upload Your Designs</p>
                <p className="text-sm text-gray-500">Upload artwork and design files</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full">
                  <span className="text-sm font-medium text-indigo-600">3</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Create Sync Products</p>
                <p className="text-sm text-gray-500">Combine products with your designs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({ 
  title, 
  description, 
  icon, 
  color 
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
      <div className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${color} rounded-md p-3 text-white`}>
            {icon}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}