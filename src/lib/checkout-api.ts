import { CheckoutData, ProcessCheckoutData, AuthenticatedCheckoutData } from './checkout-types';
import { getApiUrl } from './getApiUrl';

export const unifiedCheckoutAPI = {
  createGuestCheckout: async (data: CheckoutData) => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/guest/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create guest checkout');
    return response.json();
  },

  processCheckout: async (data: ProcessCheckoutData) => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error: any = new Error(errorData.message || errorData.error || 'Failed to process checkout');
      // Attach additional error details for inventory errors
      if (errorData.unavailable_items) {
        error.unavailable_items = errorData.unavailable_items;
        error.isInventoryError = true;
      }
      throw error;
    }
    return response.json();
  },

  createStripePaymentIntent: async (amount: number, orderNumber: string, customerEmail?: string) => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/stripe/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.toFixed(2), orderNumber, customerEmail })
    });
    if (!response.ok) throw new Error('Failed to create Stripe payment intent');
    return response.json();
  },

  confirmStripePayment: async (paymentIntentId: string, orderNumber: string) => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/stripe/confirm-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId, orderNumber })
    });
    if (!response.ok) throw new Error('Failed to confirm Stripe payment');
    return response.json();
  },

  processAuthenticatedCheckout: async (data: AuthenticatedCheckoutData, token: string) => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/unified-checkout/process-authenticated`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const error: any = new Error(errorData.message || errorData.error || 'Failed to process authenticated checkout');
      // Attach additional error details for inventory errors
      if (errorData.unavailable_items) {
        error.unavailable_items = errorData.unavailable_items;
        error.isInventoryError = true;
      }
      throw error;
    }
    return response.json();
  },

  checkVariantAvailability: async (variants: Array<{ variant_id: number | string; quantity: number }>) => {
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/printful/variants/check-availability`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants })
    });
    if (!response.ok) throw new Error('Failed to check variant availability');
    return response.json();
  }
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const API_BASE_URL = getApiUrl();
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
    const API_BASE_URL = getApiUrl();
    const response = await fetch(`${API_BASE_URL}/api/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (!response.ok) throw new Error('Failed to get user cart');
    return response.json();
  },

  addToUserCart: async (token: string, variantId: string, quantity: number) => {
    const API_BASE_URL = getApiUrl();
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