'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { printfulAPI, productAPI } from '@/lib/api';
import { 
  Package, 
  Plus, 
  ShoppingBag, 
  Upload, 
  Palette, 
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface ConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
}

interface CreatorProduct {
  id: number;
  is_active: boolean;
  thumbnail_url: string;
  name: string;
  min_price: number;
  max_price: number;
  variant_count: number;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [products, setProducts] = useState<CreatorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalSales: 0,
    revenue: 0
  });

  useEffect(() => {
    if (user?.role !== 'creator' && user?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected === 'true') {
      setConnection({ connected: true, adminAccount: true });
      
      const setup = urlParams.get('setup');
      if (setup === 'complete') {
        toast.success('🎉 Admin setup complete! All creators can now use Printful.');
      } else {
        toast.success('Successfully connected to Printful!');
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/creator');
    } else if (error) {
      toast.error(`Printful connection failed: ${error}`);
      // Clean URL
      window.history.replaceState({}, '', '/dashboard/creator');
    }
    
    checkPrintfulConnection();
    fetchCreatorProducts();
  }, [user, router]);

  const checkPrintfulConnection = async () => {
    try {
      const status = await printfulAPI.getConnectionStatus();
      setConnection(status);
    } catch (error) {
      console.error('Failed to check connection:', error);
      setConnection({ connected: false, adminAccount: true });
    }
  };

  const fetchCreatorProducts = async () => {
    try {
      setLoading(true);
      const response = await productAPI.getCreatorProducts();
      setProducts(response.products);
      
      // Calculate stats
      const totalProducts = response.products.length;
      const activeProducts = response.products.filter((p: CreatorProduct) => p.is_active).length;
      
      setStats({
        totalProducts,
        activeProducts,
        totalSales: 0, // TODO: Implement sales tracking
        revenue: 0 // TODO: Implement revenue tracking
      });
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load your products');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPrintful = async () => {
    try {
      const response = await printfulAPI.initializeAuth();
      
      if (response.connected) {
        setConnection({ connected: true, adminAccount: true });
        toast.success('Connected to Printful admin account');
      } else if (response.needsAuth && response.authUrl) {
        // Need OAuth authorization - redirect to Printful
        toast('🔑 Admin authorization required. Redirecting to Printful...');
        setTimeout(() => {
          window.location.href = response.authUrl;
        }, 1500);
      } else {
        setConnection({ connected: false, adminAccount: true });
        toast.error('Failed to connect to Printful');
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      toast.error('Failed to connect to Printful');
    }
  };

  if (!user || (user.role !== 'creator' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Creator Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your products and Printful integration
              </p>
            </div>
            
            {connection?.connected ? (
              <div className="flex items-center space-x-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Printful Ready (Admin Account)
                </span>
                <Link
                  href="/dashboard/creator/products"
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Package className="w-4 h-4 mr-2" />
                  My Products
                </Link>
                <Link
                  href="/dashboard/creator/products/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Product
                </Link>
              </div>
            ) : (
              <button
                onClick={handleConnectPrintful}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Setup Printful Connection
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {!connection?.connected ? (
            <PrintfulConnectionPrompt onConnect={handleConnectPrintful} />
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Products
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.totalProducts}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Eye className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Active Products
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.activeProducts}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ShoppingBag className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Total Sales
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            {stats.totalSales}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Revenue
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            ${stats.revenue.toFixed(2)}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                <Link
                  href="/dashboard/creator/catalog"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <ShoppingBag className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Browse Catalog</h3>
                        <p className="text-sm text-gray-500">Explore Printful products</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/creator/products/create"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                          <Plus className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Create Product</h3>
                        <p className="text-sm text-gray-500">Add new product</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/creator/files"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                          <Upload className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Upload Files</h3>
                        <p className="text-sm text-gray-500">Manage design files</p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/dashboard/creator/canvas"
                  className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                          <Palette className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">Design Canvas</h3>
                        <p className="text-sm text-gray-500">Create designs</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>

              {/* Recent Products */}
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Your Products</h2>
                    <Link
                      href="/dashboard/creator/products"
                      className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                    >
                      View all
                    </Link>
                  </div>
                </div>
                
                <div className="p-6">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">Loading products...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No products yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating your first product
                      </p>
                      <div className="mt-6">
                        <Link
                          href="/dashboard/creator/products/create"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Product
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {products.slice(0, 6).map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PrintfulConnectionPrompt({ onConnect }: { onConnect: () => void }) {
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

function ProductCard({ product }: { product: CreatorProduct }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden hover:bg-gray-100 transition-colors">
      <div className="aspect-square relative">
        <Image
          src={product.thumbnail_url || '/placeholder-product.png'}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600">
            {formatPrice(product.min_price)}
            {product.max_price > product.min_price && (
              <span> - {formatPrice(product.max_price)}</span>
            )}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-xs text-gray-500">
            {product.variant_count} variants
          </span>
          <div className="flex space-x-2">
            <button className="text-indigo-600 hover:text-indigo-500">
              <Edit className="w-4 h-4" />
            </button>
            <button className="text-red-600 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}