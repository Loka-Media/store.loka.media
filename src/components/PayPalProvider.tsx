'use client';

import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { useEffect, useState } from 'react';

interface PayPalProviderProps {
  children: React.ReactNode;
}

// API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://store-api-loka-media.vercel.app' 
  : 'http://localhost:3001';

export default function PayPalProvider({ children }: PayPalProviderProps) {
  const [paypalOptions, setPaypalOptions] = useState<any>(null);

  useEffect(() => {
    // Fetch PayPal configuration from backend
    const fetchPayPalConfig = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/unified-checkout/paypal/config`);
        const config = await response.json();
        
        console.log('PayPal Configuration fetched:', config);
        
        setPaypalOptions({
          clientId: config.clientId,
          currency: "USD",
          intent: "capture",
          locale: "en_US",
          'disable-funding': 'credit,card',
          'data-sdk-integration-source': 'integrationbuilder_sc'
        });
      } catch (error) {
        console.error('Failed to fetch PayPal config:', error);
        // Fallback to hardcoded values for development
        console.log('Using fallback PayPal configuration');
        setPaypalOptions({
          clientId: "ARXJRcWQJ4J9jjE6BsVXOgRJTl2um9w5MCWprCZ9I3ljp0SgpVzEU_MkeJX1qHF6ifElDkM7yw4X_O8y",
          currency: "USD",
          intent: "capture",
          locale: "en_US",
          'disable-funding': 'credit,card',
          'data-sdk-integration-source': 'integrationbuilder_sc'
        });
      }
    };

    fetchPayPalConfig();
  }, []);

  if (!paypalOptions) {
    // Use hardcoded fallback immediately during development to prevent loading issues
    const fallbackOptions = {
      clientId: "ARXJRcWQJ4J9jjE6BsVXOgRJTl2um9w5MCWprCZ9I3ljp0SgpVzEU_MkeJX1qHF6ifElDkM7yw4X_O8y",
      currency: "USD",
      intent: "capture",
      locale: "en_US",
      'disable-funding': 'credit,card',
      'data-sdk-integration-source': 'integrationbuilder_sc'
    };
    
    return (
      <PayPalScriptProvider options={fallbackOptions}>
        {children}
      </PayPalScriptProvider>
    );
  }

  console.log('PayPal Provider initialized with client ID:', paypalOptions.clientId ? 'Set ✓' : 'Missing ✗');

  return (
    <PayPalScriptProvider options={paypalOptions}>
      {children}
    </PayPalScriptProvider>
  );
}