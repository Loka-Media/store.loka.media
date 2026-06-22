import { CheckoutData, ProcessCheckoutData, AuthenticatedCheckoutData } from './checkout-types';
import axios from 'axios';
import { getApiUrl } from './getApiUrl';

// Create a separate axios instance for guest checkout (no auth required)
const guestApi = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authenticated axios instance for checkout with token
const createAuthApi = (token: string) => {
  return axios.create({
    baseURL: getApiUrl(),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const unifiedCheckoutAPI = {
  createGuestCheckout: async (data: CheckoutData) => {
    const response = await guestApi.post('/api/unified-checkout/guest/create', data);
    return response.data;
  },

  processCheckout: async (data: ProcessCheckoutData) => {
    try {
      const response = await guestApi.post('/api/unified-checkout/process', data);
      return response.data;
    } catch (error: any) {
      // Preserve error details for inventory errors
      if (error.response?.data?.unavailable_items) {
        const customError: any = new Error(
          error.response.data.message || error.response.data.error || 'Failed to process checkout'
        );
        customError.unavailable_items = error.response.data.unavailable_items;
        customError.isInventoryError = true;
        throw customError;
      }
      throw error;
    }
  },

  createStripePaymentIntent: async (amount: number, orderNumber: string, customerEmail?: string) => {
    const response = await guestApi.post('/api/unified-checkout/stripe/create-payment-intent', {
      amount: amount.toFixed(2),
      orderNumber,
      customerEmail,
    });
    return response.data;
  },

  confirmStripePayment: async (paymentIntentId: string, orderNumber: string) => {
    const response = await guestApi.post('/api/unified-checkout/stripe/confirm-payment', {
      paymentIntentId,
      orderNumber,
    });
    return response.data;
  },

  processAuthenticatedCheckout: async (data: AuthenticatedCheckoutData, token: string) => {
    try {
      console.log('📦 [processAuthenticatedCheckout] Payload:', JSON.stringify(data, null, 2));
      const authApi = createAuthApi(token);
      const response = await authApi.post('/api/unified-checkout/process-authenticated', data);
      return response.data;
    } catch (error: any) {
      // Preserve error details for inventory errors
      console.error('❌ [processAuthenticatedCheckout] Error:', error.response?.data || error.message);
      if (error.response?.data?.unavailable_items) {
        const customError: any = new Error(
          error.response.data.message || error.response.data.error || 'Failed to process authenticated checkout'
        );
        customError.unavailable_items = error.response.data.unavailable_items;
        customError.isInventoryError = true;
        throw customError;
      }
      throw error;
    }
  },

  checkVariantAvailability: async (variants: Array<{ variant_id: number | string; quantity: number }>) => {
    // Return mock success since Printify API doesn't have a bulk availability endpoint
    return {
      success: true,
      all_available: true,
      checks: variants.map(v => ({ variant_id: v.variant_id, available: true }))
    };
  },
};

// Note: authAPI methods (login, getUserCart, addToUserCart) have been removed
// These are now available in /src/lib/auth.ts as authAPI and /src/lib/api.ts as cartAPI
// Use those centralized services instead:
// - authAPI.login() from '@/lib/auth'
// - cartAPI.getCart() from '@/lib/api'
// - cartAPI.addToCart() from '@/lib/api'