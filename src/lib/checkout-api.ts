import { CheckoutData, ProcessCheckoutData } from './checkout-types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://catalog.loka.media' 
  : 'http://localhost:3003';

export const unifiedCheckoutAPI = {
  createGuestCheckout: async (data: CheckoutData) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/guest/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create guest checkout');
    return response.json();
  },

  processCheckout: async (data: ProcessCheckoutData) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to process checkout');
    return response.json();
  },

  createStripePaymentIntent: async (amount: number, orderNumber: string, customerEmail?: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/stripe/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.toFixed(2), orderNumber, customerEmail })
    });
    if (!response.ok) throw new Error('Failed to create Stripe payment intent');
    return response.json();
  },

  confirmStripePayment: async (paymentIntentId: string, orderNumber: string) => {
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/stripe/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, orderNumber })
    });
    if (!response.ok) throw new Error('Failed to confirm Stripe payment');
    return response.json();
  }
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Login failed');

    return result;
  },

  getUserCart: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to get user cart');
    return response.json();
  },

  addToUserCart: async (token: string, variantId: string, quantity: number) => {
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ variantId, quantity })
    });

    if (!response.ok) throw new Error('Failed to add to user cart');
    return response.json();
  }
};