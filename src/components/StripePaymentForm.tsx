'use client';

import React from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import GradientTitle from '@/components/ui/GradientTitle';
import { getApiUrl } from '@/lib/getApiUrl';
import { useCurrency } from '@/contexts/CurrencyContext';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RrcfkGofdJ5lBg3bgODkRSZGgRXPccoOzctQ55xRmNmQU8tqAnu46f2d0x5cfnNtzPx3oGGuhPaStjCqHmBFxtQ00NNdS84s8';
const stripePromise = loadStripe(stripePublishableKey);

interface OrderData {
  orderNumber: string;
}

interface StripePaymentFormProps {
  orderData: OrderData;
  clientSecret: string;
  onPaymentSuccess: () => void;
  totalAmount: number;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Payment form component that uses Stripe hooks
function PaymentForm({ orderData, onPaymentSuccess, totalAmount, loading, setLoading }: Omit<StripePaymentFormProps, 'clientSecret'>) {
  const stripe = useStripe();
  const elements = useElements();
  const { formatPrice } = useCurrency();
  const [elementReady, setElementReady] = React.useState(false);
  const [elementError, setElementError] = React.useState<string | null>(null);

  React.useEffect(() => {
    console.log('💳 [PaymentForm] stripe loaded:', !!stripe, 'elements loaded:', !!elements);
  }, [stripe, elements]);

  const confirmStripePayment = async (paymentIntentId: string, orderNumber: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const response = await fetch('/api/unified-checkout/stripe/confirm-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ paymentIntentId, orderNumber })
    });
    if (!response.ok) throw new Error('Failed to confirm Stripe payment');
    return response.json();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    try {
      setLoading(true);

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/checkout/success',
        },
        redirect: 'if_required'
      });

      if (error) {
        toast.error('Payment failed: ' + error.message);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Confirm payment on the backend
        await confirmStripePayment(paymentIntent.id, orderData.orderNumber);

        onPaymentSuccess();
        toast.success('Payment successful! Order placed.');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Payment error:', error);
      toast.error('Payment failed: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <GradientTitle text="Complete Payment" size="sm" />
          <Link href="/cart" className="inline-flex items-center px-4 py-2 border border-gray-700 text-sm font-medium rounded-lg text-gray-300 bg-gray-900 hover:bg-gray-800 hover:border-gray-600 transition-all duration-300">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
        </div>

        {/* Payment Card */}
        <div className="gradient-border-white-top rounded-xl overflow-hidden bg-gray-900 p-8 max-w-md mx-auto">
          {/* Order Info */}
          <div className="text-center mb-8">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-full p-4 inline-block mb-4">
              <CreditCard className="w-8 h-8 text-orange-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Secure Payment</h2>
            <p className="text-gray-400 text-sm font-medium mt-2">Order #{orderData.orderNumber}</p>
            <p className="text-4xl font-bold text-orange-400 mt-4">{formatPrice(totalAmount)}</p>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Stripe Payment Element */}
            <div className="stripe-payment-element">
              {elementError && (
                <div className="p-3 mb-4 text-xs bg-red-500/20 border border-red-500/40 rounded-lg text-red-300">
                  Failed to load payment options: {elementError}
                </div>
              )}
              <PaymentElement
                options={{
                  layout: 'tabs',
                  paymentMethodOrder: ['card', 'link']
                }}
                onReady={() => {
                  console.log('✅ [PaymentElement] Mounted & Ready!');
                  setElementReady(true);
                }}
                onLoadError={(err: any) => {
                  console.error('❌ [PaymentElement] Load error:', err);
                  setElementError(err?.message || 'Failed to load Stripe Payment Element');
                }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-[0_10px_30px_rgba(255,133,27,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                  Processing...
                </span>
              ) : (
                `Pay ${formatPrice(totalAmount)}`
              )}
            </button>

            {/* Test Card Info */}
            <div className="text-center">
              <p className="text-xs text-gray-400 font-medium">
                Test card: 4242 4242 4242 4242 | Any future date | Any CVC
              </p>
            </div>

            {/* Powered by Stripe */}
            <p className="text-xs text-gray-500 text-center">
              Powered by <span className="text-gray-400">Stripe</span> - Accept payments worldwide
            </p>
          </form>
        </div>

        {/* Security Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 font-medium">
            Your payment information is secure and encrypted
          </p>
        </div>
      </div>

      {/* Stripe Elements Styling */}
      <style>{`
        .stripe-payment-element ::-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #1f2937 inset !important;
          -webkit-text-fill-color: #ffffff !important;
        }
      `}</style>
    </div>
  );
}

// Main component that wraps PaymentForm with Elements
export default function StripePaymentForm({ clientSecret, ...props }: StripePaymentFormProps) {
  const [stripePromise, setStripePromise] = React.useState<any>(null);

  React.useEffect(() => {
    async function initStripeKey() {
      try {
        const res = await fetch('/api/unified-checkout/stripe/config');
        if (res.ok) {
          const config = await res.json();
          if (config.publishableKey) {
            console.log('✅ [Stripe] Dynamically loaded matching publishableKey from local backend:', config.publishableKey);
            setStripePromise(loadStripe(config.publishableKey));
            return;
          }
        }
      } catch (err) {
        console.warn('⚠️ Could not fetch Stripe config from local backend, using fallback:', err);
      }

      const fallbackKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51RrcfkGofdJ5lBg3bgODkRSZGgRXPccoOzctQ55xRmNmQU8tqAnu46f2d0x5cfnNtzPx3oGGuhPaStjCqHmBFxtQ00NNdS84s8';
      console.log('🔑 [Stripe] Using fallback publishableKey:', fallbackKey);
      setStripePromise(loadStripe(fallbackKey));
    }

    initStripeKey();
  }, []);

  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'night' as const,
      variables: {
        colorPrimary: '#f97316',
        colorBackground: '#111827',
        colorText: '#ffffff',
        colorDanger: '#ef4444',
        borderRadius: '8px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSizeBase: '16px',
      },
      rules: {
        '.Input': {
          backgroundColor: '#1f2937',
          borderColor: '#374151',
          color: '#ffffff',
        },
        '.Input:focus': {
          borderColor: '#f97316',
          boxShadow: '0 0 0 2px rgba(249, 115, 22, 0.1)',
        },
        '.Label': {
          color: '#e5e7eb',
        },
        '.Tab': {
          backgroundColor: '#1f2937',
          color: '#9ca3af',
          borderColor: '#374151',
        },
        '.Tab--selected': {
          backgroundColor: '#1f2937',
          color: '#ffffff',
          borderColor: '#f97316',
        },
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}