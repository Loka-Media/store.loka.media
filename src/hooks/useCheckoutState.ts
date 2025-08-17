import { useState, useCallback } from 'react';
import { CheckoutStep, CustomerInfo } from '@/lib/checkout-types';
import { printfulAPI } from '@/lib/printful';
import toast from 'react-hot-toast';

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

  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [selectedShippingRate, setSelectedShippingRate] = useState<any>(null);
  const [isFetchingShippingRates, setIsFetchingShippingRates] = useState(false);

  const updateCustomerInfo = (updates: Partial<CustomerInfo>) => {
    setCustomerInfo(prev => ({ ...prev, ...updates }));
  };

  const getShippingRates = async (address: any, items: any[]) => {
    const recipient = {
      address1: address.address1,
      city: address.city,
      country_code: address.country,
      state_code: address.state,
      zip: address.zip,
      phone: address.phone,
    };

    const cartItems = items.map((item) => ({
      variant_id: item.variant_id,
      quantity: item.quantity,
      value: item.price,
    }));

    const payload = {
      recipient,
      items: cartItems,
      currency: "USD",
      locale: "en_US",
    };

    const response = await printfulAPI.getShippingRates(payload);
    return response;
  };

  const fetchShippingRates = useCallback(
    async (items: any[]) => {
      if (
        customerInfo.address1 &&
        customerInfo.city &&
        customerInfo.state &&
        customerInfo.zip &&
        customerInfo.country
      ) {
        setIsFetchingShippingRates(true);
        try {
          const rates = await getShippingRates(customerInfo, items);
          setShippingRates(rates.result);
          setSelectedShippingRate(rates.result[0]); // Auto-select the first rate
        } catch (error) {
          console.error("Failed to fetch shipping rates:", error);
          toast.error("Could not load shipping options for this address.");
        }
        setIsFetchingShippingRates(false);
      }
    },
    [
      customerInfo,
      getShippingRates,
      setShippingRates,
      setSelectedShippingRate,
      setIsFetchingShippingRates,
    ]
  );

  const calculateTotal = (subtotal: string) => {
    const subtotalAmount = parseFloat(subtotal.replace("$", ""));

    const shipping =
      selectedShippingRate && selectedShippingRate.rate
        ? parseFloat(String(selectedShippingRate.rate)) // Ensure it's a string before parsing
        : 0;
    const tax = subtotalAmount * 0.08;
    return subtotalAmount + shipping + tax;
  };

  const resetCheckoutState = () => {
    setCurrentStep('info');
    setOrderData(null);
    setClientSecret(null);
    setLoading(false);
    setShippingRates([]);
    setSelectedShippingRate(null);
    setIsFetchingShippingRates(false);
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
    shippingRates,
    setShippingRates,
    selectedShippingRate,
    setSelectedShippingRate,
    isFetchingShippingRates,
    setIsFetchingShippingRates,
    fetchShippingRates,
    calculateTotal,
    resetCheckoutState
  };
};