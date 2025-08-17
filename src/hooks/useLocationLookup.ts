import { useState, useEffect, useCallback } from 'react';
import { PrintfulCountry, PrintfulState, CustomerInfo } from '@/lib/checkout-types';
import { lookupZipCode, getPrintfulCountries } from '@/lib/location-utils';
import toast from 'react-hot-toast';

export const useLocationLookup = () => {
  const [printfulCountries, setPrintfulCountries] = useState<PrintfulCountry[]>([]);
  const [availableStates, setAvailableStates] = useState<PrintfulState[]>([]);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    const loadPrintfulCountries = async () => {
      const countries = await getPrintfulCountries();
      setPrintfulCountries(countries);
      
      // No default country/state selection
      setAvailableStates([]);
    };
    
    loadPrintfulCountries();
  }, []);

  const updateAvailableStates = useCallback((countryCode: string, currentState: string, updateCustomerInfo: (updates: Partial<CustomerInfo>) => void) => {
    const selectedCountry = printfulCountries.find(c => c.code === countryCode);
    if (selectedCountry) {
      setAvailableStates(selectedCountry.states || []);
      if (currentState && !selectedCountry.states?.find(s => s.code === currentState)) {
        updateCustomerInfo({ state: '' });
      }
    }
  }, [printfulCountries]);

  const handleZipCodeChange = useCallback(async (
    zipCode: string, 
    countryCode: string,
    updateCustomerInfo: (updates: Partial<CustomerInfo>) => void
  ) => {
    updateCustomerInfo({ zip: zipCode });
    
    if (zipCode.length >= 5 && (countryCode === 'US' || countryCode === 'CA')) {
      setIsLoadingLocation(true);
      const locationData = await lookupZipCode(zipCode, countryCode);
      
      if (locationData) {
        const validState = availableStates.find(s => s.code === locationData.state);
        
        updateCustomerInfo({
          city: locationData.city,
          state: validState ? locationData.state : ''
        });
        
        toast.success(`📍 Auto-filled: ${locationData.city}, ${locationData.state}`, {
          duration: 2000
        });
      }
      setIsLoadingLocation(false);
    }
  }, [availableStates]);

  return {
    printfulCountries,
    availableStates,
    isLoadingLocation,
    updateAvailableStates,
    handleZipCodeChange
  };
};