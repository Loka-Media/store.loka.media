import { useState, useCallback } from 'react';
import { CheckoutStep, CustomerInfo } from '@/lib/checkout-types';
import { printifyAPI } from '@/lib/api';
import { formatPhoneForPrintful } from '@/lib/location-utils';
import { validateShippingAddress, getErrorMessage, canFetchShippingRates } from '@/lib/address-validation';
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
  const [taxAmount, setTaxAmount] = useState<number>(0);

  const updateCustomerInfo = (updates: Partial<CustomerInfo>) => {
    setCustomerInfo(prev => ({ ...prev, ...updates }));
  };

  const getShippingRates = async (address: any, items: any[]) => {
    // Format phone number with country code prefix
    const formattedPhone = formatPhoneForPrintful(address.phone || '', address.country || 'US');

    // Split recipient name into first and last name (Printify expects first_name and last_name)
    const nameParts = (address.name || 'Customer Name').trim().split(/\s+/);
    const first_name = nameParts[0] || 'Customer';
    const last_name = nameParts.slice(1).join(' ') || 'Customer';

    const address_to = {
      first_name,
      last_name,
      address1: address.address1 || '',
      address2: address.address2 || '',
      city: address.city || '',
      region: address.state || '', // Printify uses region for state/province
      country: address.country,
      zip: address.zip || '',
      phone: formattedPhone || '',
      email: address.email || 'customer@example.com',
    };

    // Map cart items to Printify format
    const line_items = items.map((item) => {
      const variantId = item.printful_catalog_variant_id || item.printful_variant_id || item.variant_id;
      return {
        product_id: String(item.product_id || ''),
        variant_id: Number(variantId),
        quantity: Number(item.quantity || 1),
      };
    });

    console.log('🚚 [SHIPPING-RATES] Fetching rates for Printify:', {
      address_to,
      line_items
    });

    const payload = {
      address_to,
      line_items,
    };

    const response = await printifyAPI.getShippingRates(payload);
    console.log('🚚 [SHIPPING-RATES] Received rates:', response);
    return response;
  };

  const fetchShippingRates = useCallback(
    async (items: any[], options?: { silent?: boolean }) => {
      const silent = options?.silent ?? true;

      // Validate address before fetching rates (phone is optional for rates but recommended)
      const validation = validateShippingAddress(customerInfo, { requirePhone: false });

      if (!validation.valid) {
        if (!silent) {
          const errorMsg = getErrorMessage(validation.errors);
          toast.error(errorMsg);
        }
        return false;
      }

      // Additional check for minimum requirements
      if (!canFetchShippingRates(customerInfo)) {
        if (!silent) {
          toast.error('Please provide complete address information to calculate shipping rates');
        }
        return false;
      }

      setIsFetchingShippingRates(true);
      try {
        const rates = await getShippingRates(customerInfo, items);

        if (!rates.result || rates.result.length === 0) {
          if (!silent) {
            toast.error('No shipping options available for this address');
          }
          setShippingRates([]);
          setSelectedShippingRate(null);
          return false;
        } else {
          setShippingRates(rates.result);
          setSelectedShippingRate(rates.result[0]); // Auto-select the first rate
          if (!silent) {
            toast.success(`Found ${rates.result.length} shipping option${rates.result.length > 1 ? 's' : ''}`);
          }

          // Extract tax from the shipping rate response
          if (rates.result[0]?.tax) {
            setTaxAmount(parseFloat(rates.result[0].tax));
          }
          return true;
        }
      } catch (error: any) {
        console.error("Failed to fetch shipping rates:", error);
        if (!silent) {
          const errorMessage = error.response?.data?.result || error.message || 'Failed to fetch shipping rates';
          toast.error(errorMessage);
        }
        setShippingRates([]);
        setSelectedShippingRate(null);
        return false;
      } finally {
        setIsFetchingShippingRates(false);
      }
    },
    [customerInfo]
  );

  const calculateTotal = (subtotal: string) => {
    const subtotalAmount = parseFloat(subtotal.replace("$", ""));

    const shipping =
      selectedShippingRate && selectedShippingRate.rate
        ? parseFloat(String(selectedShippingRate.rate)) // Ensure it's a string before parsing
        : 0;

    // Use actual tax if available from Printful, otherwise estimate based on subtotal
    // Note: Final tax will be calculated by backend when order is created
    const tax = taxAmount > 0 ? taxAmount : subtotalAmount * 0.08;

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
    taxAmount,
    setTaxAmount,
    fetchShippingRates,
    calculateTotal,
    resetCheckoutState
  };
};