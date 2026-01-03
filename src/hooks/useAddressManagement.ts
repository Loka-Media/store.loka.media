import { useState, useCallback } from 'react';
import { Address, CustomerInfo } from '@/lib/checkout-types';
import { addressAPI } from '@/lib/api';

// Normalize state names to state codes
const normalizeStateName = (state: string | null | undefined): string => {
  if (!state) return '';

  const nameToCodeMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
    // Canadian provinces
    'alberta': 'AB', 'british columbia': 'BC', 'manitoba': 'MB', 'new brunswick': 'NB',
    'newfoundland and labrador': 'NL', 'nova scotia': 'NS', 'ontario': 'ON',
    'prince edward island': 'PE', 'quebec': 'QC', 'saskatchewan': 'SK',
    'northwest territories': 'NT', 'nunavut': 'NU', 'yukon': 'YT'
  };

  const lowerState = state.toLowerCase().trim();

  // If already a code (2 letters, uppercase), return as-is
  if (state.length === 2 && state === state.toUpperCase()) {
    return state;
  }

  // Try to find in map
  return nameToCodeMap[lowerState] || state;
};

export const useAddressManagement = () => {
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const loadUserAddresses = useCallback(async () => {
    try {
      const addresses = await addressAPI.getAddresses();
      const addressList = addresses.addresses || [];
      setSavedAddresses(addressList);

      // If user has no addresses, default to saving new addresses
      if (addressList.length === 0) {
        setSaveNewAddress(true);
        setShowNewAddressForm(true);
      }

      const defaultShipping = addressList.find((addr: Address) =>
        addr.is_default && (addr.address_type === 'shipping' || addr.address_type === 'both')
      );

      if (defaultShipping) {
        setSelectedAddressId(defaultShipping.id);
        // Normalize state name if it's stored as full name
        const normalizedAddress = {
          ...defaultShipping,
          state: normalizeStateName(defaultShipping.state)
        };
        console.log('✅ Loaded default shipping address');
        return normalizedAddress;
      }

      return null;
    } catch (error) {
      console.error('Failed to load addresses:', error);
      return null;
    }
  }, []);

  const handleAddressSelect = useCallback((address: Address, updateCustomerInfo: (updates: Partial<CustomerInfo>) => void) => {
    setSelectedAddressId(address.id);
    updateCustomerInfo({
      address1: address.address1,
      address2: address.address2 || '',
      city: address.city,
      state: normalizeStateName(address.state),
      zip: address.zip,
      country: address.country
    });
    setShowNewAddressForm(false);
    console.log('✅ Selected saved address:', address.id);
  }, []);

  const handleNewAddress = useCallback((updateCustomerInfo: (updates: Partial<CustomerInfo>) => void) => {
    setSelectedAddressId(null);
    updateCustomerInfo({
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      country: 'US'
    });
    setShowNewAddressForm(true);
    setSaveNewAddress(true); // Default to saving new addresses
    console.log('✅ Creating new address');
  }, []);

  const saveAddress = useCallback(async (customerInfo: CustomerInfo) => {
    // Save address if user wants to save it AND:
    // 1. They're creating a new address, OR
    // 2. They have no saved addresses (first time), OR  
    // 3. They're not using an existing saved address
    const shouldSaveAddress = saveNewAddress && (
      showNewAddressForm || 
      savedAddresses.length === 0 ||
      selectedAddressId === null
    );

    if (!shouldSaveAddress) return null;
    
    // Check if this address already exists to avoid duplicates
    const addressExists = savedAddresses.some(addr => 
      addr.address1.toLowerCase() === customerInfo.address1.toLowerCase() &&
      addr.city.toLowerCase() === customerInfo.city.toLowerCase() &&
      addr.zip === customerInfo.zip &&
      addr.country === customerInfo.country
    );

    if (addressExists) {
      console.log('✅ Address already exists, skipping save');
      return null;
    }
    
    try {
      const newAddress = await addressAPI.createAddress({
        name: customerInfo.name,
        address1: customerInfo.address1,
        address2: customerInfo.address2,
        city: customerInfo.city,
        state: customerInfo.state,
        zip: customerInfo.zip,
        country: customerInfo.country,
        phone: customerInfo.phone,
        address_type: 'shipping',
        is_default: savedAddresses.length === 0
      });
      
      // Update local state to include the new address
      if (newAddress.address) {
        setSavedAddresses(prev => [...prev, newAddress.address]);
        console.log('✅ Saved new address:', newAddress.address.id);
      }
      
      return newAddress;
    } catch (error) {
      console.error('Failed to save address:', error);
      return null;
    }
  }, [saveNewAddress, showNewAddressForm, savedAddresses, selectedAddressId]);

  const resetAddressState = useCallback(() => {
    setSavedAddresses([]);
    setSelectedAddressId(null);
    setShowNewAddressForm(false);
    setSaveNewAddress(true);
  }, []);

  return {
    savedAddresses,
    setSavedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    showNewAddressForm,
    setShowNewAddressForm,
    saveNewAddress,
    setSaveNewAddress,
    loadUserAddresses,
    handleAddressSelect,
    handleNewAddress,
    saveAddress,
    resetAddressState
  };
};