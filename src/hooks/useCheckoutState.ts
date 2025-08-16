import { useState } from 'react';
import { CheckoutStep, CustomerInfo } from '@/lib/checkout-types';

export const useCheckoutState = () => {
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('info');
  const [orderData, setOrderData] = useState<{ orderNumber: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '', 
    email: '', 
    phone: '', 
    address1: '', 
    address2: '',
    city: '', 
    state: '', 
    zip: '', 
    country: 'US'
  });

  const [wantsToSignup, setWantsToSignup] = useState(false);
  const [signupInfo, setSignupInfo] = useState({ 
    password: '', 
    confirmPassword: '' 
  });

  const updateCustomerInfo = (updates: Partial<CustomerInfo>) => {
    setCustomerInfo(prev => ({ ...prev, ...updates }));
  };

  const calculateTotal = (subtotal: string) => {
    const subtotalAmount = parseFloat(subtotal.replace('$', ''));
    const shipping = 5.99;
    const tax = subtotalAmount * 0.08;
    return subtotalAmount + shipping + tax;
  };

  const resetCheckoutState = () => {
    setCurrentStep('info');
    setOrderData(null);
    setClientSecret(null);
    setLoading(false);
  };

  return {
    loading,
    setLoading,
    currentStep,
    setCurrentStep,
    orderData,
    setOrderData,
    clientSecret,
    setClientSecret,
    customerInfo,
    setCustomerInfo,
    updateCustomerInfo,
    wantsToSignup,
    setWantsToSignup,
    signupInfo,
    setSignupInfo,
    calculateTotal,
    resetCheckoutState
  };
};