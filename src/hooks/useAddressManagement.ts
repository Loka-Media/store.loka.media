import { useState, useCallback } from 'react';
import { Address, CustomerInfo } from '@/lib/checkout-types';
import { addressAPI } from '@/lib/api';

export const useAddressManagement = () => {
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveNewAddress, setSaveNewAddress] = useState(true);

  const loadUserAddresses = useCallback(async () => {
    try {
      const addresses = await addressAPI.getAddresses();
      setSavedAddresses(addresses.addresses || []);
      
      const defaultShipping = addresses.addresses?.find((addr: Address) => 
        addr.is_default && (addr.address_type === 'shipping' || addr.address_type === 'both')
      );
      
      if (defaultShipping) {
        setSelectedAddressId(defaultShipping.id);
        console.log('✅ Loaded default shipping address');
        return defaultShipping;
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
      state: address.state || '',
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
    console.log('✅ Creating new address');
  }, []);

  const saveAddress = useCallback(async (customerInfo: CustomerInfo) => {
    if (!saveNewAddress || !showNewAddressForm) return null;
    
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
      console.log('✅ Saved new address:', newAddress.address?.id);
      return newAddress;
    } catch (error) {
      console.error('Failed to save address:', error);
      return null;
    }
  }, [saveNewAddress, showNewAddressForm, savedAddresses.length]);

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