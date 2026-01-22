'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LinkIcon, Unlink2, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import CreatorProtectedRoute from '@/components/CreatorProtectedRoute';
import { creatorStripeAPI } from '@/lib/api';

interface StripeStatus {
  connected: boolean;
  stripeConnectId?: string;
  verified?: boolean;
  email?: string;
  country?: string;
  accountType?: string;
  verifiedAt?: string;
}

function StripeSettingsPageContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);

  useEffect(() => {
    fetchStripeStatus();
  }, []);

  const fetchStripeStatus = async () => {
    try {
      setLoading(true);

      const data = await creatorStripeAPI.getStripeStatus();
      setStripeStatus(data);
    } catch (error) {
      console.error('Error fetching Stripe status:', error);
      toast.error('Failed to load Stripe account status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    try {
      setConnecting(true);

      const data = await creatorStripeAPI.getStripeAuthUrl();

      // Redirect to Stripe OAuth
      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to connect Stripe account');
      setConnecting(false);
    }
  };

  const handleDisconnectStripe = async () => {
    if (!confirm('Are you sure you want to disconnect your Stripe account? You won\'t be able to receive payouts until you connect again.')) {
      return;
    }

    try {
      setDisconnecting(true);

      await creatorStripeAPI.disconnectStripe();

      toast.success('Stripe account disconnected successfully');
      await fetchStripeStatus();
    } catch (error) {
      console.error('Error disconnecting Stripe:', error);
      toast.error('Failed to disconnect Stripe account');
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Stripe Account Settings</h1>
          <p className="text-gray-600">Connect your Stripe account to receive payouts for your commissions</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin">
              <Loader className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        ) : (
          <>
            {/* Connected State */}
            {stripeStatus?.connected ? (
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-white rounded-lg border-2 border-green-200 p-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-8 h-8 text-green-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Stripe Account Connected</h2>
                      <p className="text-gray-600">Your Stripe account is active and ready to receive payouts</p>
                    </div>
                  </div>
                </div>

                {/* Account Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>

                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stripe Account Email
                      </label>
                      <div className="bg-gray-50 rounded px-4 py-3 text-gray-900">
                        {stripeStatus?.email || 'Not available'}
                      </div>
                    </div>

                    {/* Country */}
                    {stripeStatus?.country && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Country
                        </label>
                        <div className="bg-gray-50 rounded px-4 py-3 text-gray-900">
                          {stripeStatus.country}
                        </div>
                      </div>
                    )}

                    {/* Account Type */}
                    {stripeStatus?.accountType && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Account Type
                        </label>
                        <div className="bg-gray-50 rounded px-4 py-3 text-gray-900">
                          {stripeStatus.accountType}
                        </div>
                      </div>
                    )}

                    {/* Verification Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Verification Status
                      </label>
                      <div className="flex items-center gap-2">
                        {stripeStatus?.verified ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-700 font-medium">Verified</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                            <span className="text-yellow-700 font-medium">Pending Verification</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Stripe Connect ID */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stripe Connect ID
                      </label>
                      <div className="bg-gray-50 rounded px-4 py-3 text-gray-900 font-mono text-sm break-all">
                        {stripeStatus?.stripeConnectId || 'Not available'}
                      </div>
                    </div>

                    {/* Connected Date */}
                    {stripeStatus?.verifiedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Connected Since
                        </label>
                        <div className="bg-gray-50 rounded px-4 py-3 text-gray-900">
                          {new Date(stripeStatus.verifiedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payout Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Payout Information</h3>
                  <ul className="text-blue-800 space-y-2 text-sm">
                    <li>✓ Payouts are processed daily at 9:00 AM UTC</li>
                    <li>✓ Minimum payout threshold: $25</li>
                    <li>✓ Payouts appear in your bank account within 1-2 business days</li>
                    <li>✓ You can track payout status in your Earnings dashboard</li>
                  </ul>
                </div>

                {/* Disconnect Button */}
                <button
                  onClick={handleDisconnectStripe}
                  disabled={disconnecting}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-3 px-4 rounded-lg border border-red-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Unlink2 className="w-5 h-5" />
                  {disconnecting ? 'Disconnecting...' : 'Disconnect Stripe Account'}
                </button>
              </div>
            ) : (
              /* Disconnected State */
              <div className="space-y-6">
                {/* Alert */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0 mt-1" />
                    <div>
                      <h2 className="text-lg font-semibold text-yellow-900 mb-1">Stripe Account Not Connected</h2>
                      <p className="text-yellow-800">
                        You need to connect your Stripe account to receive payouts. This is a secure, one-time setup that takes less than a minute.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Why Connect Stripe?</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <p className="font-medium text-gray-900">Automatic Payouts</p>
                        <p className="text-sm text-gray-600">Get paid daily for your commissions automatically</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <p className="font-medium text-gray-900">Secure & Encrypted</p>
                        <p className="text-sm text-gray-600">Your banking information is secured with Stripe's industry-leading encryption</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <p className="font-medium text-gray-900">Fast Transfers</p>
                        <p className="text-sm text-gray-600">Funds arrive in your bank account within 1-2 business days</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-orange-500 font-bold mt-1">✓</span>
                      <div>
                        <p className="font-medium text-gray-900">Real-time Tracking</p>
                        <p className="text-sm text-gray-600">Monitor your commission status and payout history anytime</p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Connect Button */}
                <button
                  onClick={handleConnectStripe}
                  disabled={connecting}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                >
                  <LinkIcon className="w-6 h-6" />
                  {connecting ? 'Redirecting to Stripe...' : 'Connect Stripe Account'}
                </button>

                {/* Security Notice */}
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <p className="text-sm text-gray-600">
                    We never store your banking details. Stripe is PCI-DSS Level 1 certified and trusted by millions of businesses worldwide.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StripeSettingsPage() {
  return (
    <CreatorProtectedRoute>
      <StripeSettingsPageContent />
    </CreatorProtectedRoute>
  );
}
