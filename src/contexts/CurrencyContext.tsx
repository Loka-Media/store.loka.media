'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { shopifyAPI } from '@/lib/api';

export const availableCurrencies = [
  { code: 'USD', name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  { code: 'GBP', name: 'British Pound', flag: '🇬🇧', symbol: '£' },
  { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦', symbol: '$' },
  { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺', symbol: '$' },
  { code: 'EUR', name: 'Euro', flag: '🇪🇺', symbol: '€' },
  { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳', symbol: '₹' },
];

interface CurrencyContextType {
  currency: string;
  loading: boolean;
  formatPrice: (price: number | string) => string;
  convertPrice: (price: number | string) => number;
  setCurrency: (currency: string) => void;
  baseCurrency: string;
  selectedCurrency: { code: string; name: string; flag: string; symbol: string };
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<string>('USD');
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1 });
  const [loading, setLoading] = useState<boolean>(true);

  const selectedCurrency = availableCurrencies.find(c => c.code === currency) || availableCurrencies[0];
  const currencySymbol = selectedCurrency.symbol;

  const convertPrice = (price: number | string): number => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return 0;

    let rate = rates[currency];
    if (!rate && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('currency_rates');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed[currency]) rate = parsed[currency];
        }
      } catch (e) {}
    }
    if (!rate) {
      const fallbacks: Record<string, number> = {
        INR: 91.9,
        EUR: 0.92,
        GBP: 0.79,
        CAD: 1.36,
        AUD: 1.52,
        USD: 1,
      };
      rate = fallbacks[currency] || 1;
    }

    return num * rate;
  };

  const mapCountryToCurrency = (countryCode: string): string => {
    const code = countryCode.toUpperCase();
    const euCountries = [
      'AT', 'BE', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 
      'LV', 'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES', 'HR'
    ];

    if (code === 'IN') return 'INR';
    if (code === 'GB') return 'GBP';
    if (code === 'CA') return 'CAD';
    if (code === 'AU') return 'AUD';
    if (euCountries.includes(code)) return 'EUR';
    return 'USD';
  };

  // Initialize and fetch active currency from Shopify, and exchange rates from free open API
  useEffect(() => {
    const initializeCurrency = async () => {
      try {
        setLoading(true);
        let shopBase = 'USD';
        
        // 1. Fetch default store currency from Shopify if authenticated
        const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (token) {
          try {
            const shopInfo = await shopifyAPI.getShopInfo();
            if (shopInfo && shopInfo.currency) {
              shopBase = shopInfo.currency;
              setBaseCurrency(shopBase);
            }
          } catch (shopErr) {
            console.warn('[Shopify Currency] Failed to fetch shop info, using USD base.');
          }
        }

        // 2. Fetch exchange rates relative to our base currency (e.g. USD)
        const rateResponse = await fetch(`https://open.er-api.com/v6/latest/${shopBase}`);
        if (rateResponse.ok) {
          const rateData = await rateResponse.json();
          if (rateData && rateData.rates) {
            setRates(rateData.rates);
            localStorage.setItem('currency_rates', JSON.stringify(rateData.rates));
            console.log(`[Shopify Currency] Loaded rates for base ${shopBase}:`, rateData.rates);
          }
        }

        // 3. Set dynamic currency based on user choice or automatic IP geolocation
        const savedCurrency = localStorage.getItem('user_currency');
        if (savedCurrency) {
          setCurrencyState(savedCurrency);
          console.log(`[Shopify Currency] Loaded saved currency choice: ${savedCurrency}`);
        } else {
          // No manual choice saved. Geolocate!
          try {
            const geoResponse = await fetch('https://api.country.is/');
            if (geoResponse.ok) {
              const geoData = await geoResponse.json();
              if (geoData && geoData.country) {
                const detectedCurrency = mapCountryToCurrency(geoData.country);
                setCurrencyState(detectedCurrency);
                localStorage.setItem('user_currency', detectedCurrency);
                console.log(`[Shopify Currency] Automatically geolocated country: ${geoData.country}. Set currency to: ${detectedCurrency}`);
              } else {
                setCurrencyState(shopBase);
              }
            } else {
              setCurrencyState(shopBase);
            }
          } catch (geoErr) {
            console.warn('[Shopify Currency] Geolocation failed, using shop base:', geoErr);
            setCurrencyState(shopBase);
          }
        }
      } catch (error) {
        console.error('[Shopify Currency] Setup failed:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeCurrency();
  }, []);

  // Update user selected currency
  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('user_currency', newCurrency);
    console.log(`[Shopify Currency] User switched currency to: ${newCurrency}`);
  };

  const formatPrice = (price: number | string) => {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    if (isNaN(num)) return '';

    // Convert price from base currency to target currency using rates
    const conversionRate = rates[currency] || 1;
    const converted = num * conversionRate;

    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(converted);
    } catch (e) {
      console.warn(`[Shopify Currency] Format error for: ${currency}, falling back to USD`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(num);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, loading, formatPrice, convertPrice, setCurrency, baseCurrency, selectedCurrency, currencySymbol }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
