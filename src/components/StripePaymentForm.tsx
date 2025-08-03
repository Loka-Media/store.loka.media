'use client';

import React from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

// API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://store-api-loka-media.vercel.app' 
  : 'http://localhost:3003';

const stripePromise = loadStripe('pk_test_51RrcfkGofdJ5lBg3bgODkRSZGgRXPccoOzctQ55xRmNmQU8tqAnu46f2d0x5cfnNtzPx3oGGuhPaStjCqHmBFxtQ00NNdS84s8');

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

  const confirmStripePayment = async (paymentIntentId: string, orderNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/stripe/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-gray-600 mt-2">Order #{orderData.orderNumber}</p>
        </div>

        <div className="bg-white shadow-sm rounded-lg p-6 max-w-md mx-auto">
          <div className="text-center mb-6">
            <CreditCard className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
            <h2 className="text-lg font-medium text-gray-900">Secure Payment</h2>
            <p className="text-2xl font-bold text-indigo-600 mt-2">${totalAmount.toFixed(2)}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Powered by Stripe - Accept payments worldwide
            </p>
            
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card', 'link']
              }}
            />
            
            <button
              type="submit"
              disabled={loading || !stripe || !elements}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
            </button>
            
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Test card: 4242 4242 4242 4242 | Any future date | Any CVC
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main component that wraps PaymentForm with Elements
export default function StripePaymentForm({ clientSecret, ...props }: StripePaymentFormProps) {
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#4f46e5',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentForm {...props} />
    </Elements>
  );
}