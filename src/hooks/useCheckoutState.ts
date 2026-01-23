import { useState, useCallback } from 'react';
import { CheckoutStep, CustomerInfo } from '@/lib/checkout-types';
import { printfulAPI } from '@/lib/printful';
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

    const recipient: any = {
      country_code: address.country, // Required
    };

    // Add state_code only for US, CA, AU, JP (required by Printful)
    if (['US', 'CA', 'AU', 'JP'].includes(address.country) && address.state) {
      recipient.state_code = address.state;
    }

    // Add optional fields only if they exist
    if (address.address1) recipient.address1 = address.address1;
    if (address.address2) recipient.address2 = address.address2;
    if (address.city) recipient.city = address.city;
    if (address.zip) recipient.zip = address.zip;
    if (formattedPhone) recipient.phone = formattedPhone;

    // Map cart items to Printful format
    // Printful Shipping Rate API uses CATALOG variant IDs as STRINGS
    const cartItems = items.map((item) => {
      const variantId = item.printful_catalog_variant_id || item.printful_variant_id || item.variant_id;
      const price = parseFloat(item.price || 0);

      return {
        variant_id: String(variantId), // Printful expects STRING
        quantity: item.quantity,
        value: price.toFixed(2), // Printful expects STRING with 2 decimals
      };
    });

    console.log('🚚 [SHIPPING-RATES] Fetching rates for:', {
      recipient,
      items: cartItems,
      rawItems: items.map(i => ({
        id: i.id,
        name: i.product_name,
        printful_catalog_variant_id: i.printful_catalog_variant_id,
        printful_variant_id: i.printful_variant_id,
        variant_id: i.variant_id
      }))
    });

    const payload = {
      recipient,
      items: cartItems,
      currency: "USD",
      locale: "en_US",
    };

    const response = await printfulAPI.getShippingRates(payload);
    console.log('🚚 [SHIPPING-RATES] Received rates:', response);
    return response;
  };

  const fetchShippingRates = useCallback(
    async (items: any[]) => {
      // Validate address before fetching rates (phone is optional for rates but recommended)
      const validation = validateShippingAddress(customerInfo, { requirePhone: false });

      if (!validation.valid) {
        const errorMsg = getErrorMessage(validation.errors);
        toast.error(errorMsg);
        return;
      }

      // Additional check for minimum requirements
      if (!canFetchShippingRates(customerInfo)) {
        toast.error('Please provide complete address information to calculate shipping rates');
        return;
      }

      setIsFetchingShippingRates(true);
      try {
        const rates = await getShippingRates(customerInfo, items);

        if (!rates.result || rates.result.length === 0) {
          toast.error('No shipping options available for this address');
          setShippingRates([]);
          setSelectedShippingRate(null);
        } else {
          setShippingRates(rates.result);
          setSelectedShippingRate(rates.result[0]); // Auto-select the first rate
          toast.success(`Found ${rates.result.length} shipping option${rates.result.length > 1 ? 's' : ''}`);

          // Extract tax from the shipping rate response
          if (rates.result[0]?.tax) {
            setTaxAmount(parseFloat(rates.result[0].tax));
          }
        }
      } catch (error: any) {
        console.error("Failed to fetch shipping rates:", error);
        const errorMessage = error.response?.data?.result || error.message || 'Failed to fetch shipping rates';
        toast.error(errorMessage);
        setShippingRates([]);
        setSelectedShippingRate(null);
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