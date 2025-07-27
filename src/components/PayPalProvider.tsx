'use client';

import { PayPalScriptProvider } from "@paypal/react-paypal-js";

interface PayPalProviderProps {
  children: React.ReactNode;
}

export default function PayPalProvider({ children }: PayPalProviderProps) {
  // PayPal configuration options following official documentation
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture"
  };
  
  console.log('PayPal Configuration loaded with client ID:', initialOptions.clientId ? 'Set ✓' : 'Missing ✗');

  return (
    <PayPalScriptProvider options={initialOptions}>
      {children}
    </PayPalScriptProvider>
  );
}