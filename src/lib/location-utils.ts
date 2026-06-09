import { PrintfulCountry, PrintfulState } from './checkout-types';
import { getCountryCallingCode, CountryCode } from 'libphonenumber-js';

export const getZipCodeConfig = (countryCode: string): { maxLength: number; placeholder: string; helperText: string } => {
  const configs: Record<string, { maxLength: number; placeholder: string; helperText: string }> = {
    'US': { maxLength: 10, placeholder: 'ZIP Code (e.g. 90210) *', helperText: '5 digits or 5+4 digits (ZIP+4)' },
    'CA': { maxLength: 7, placeholder: 'Postal Code (e.g. M5V 3A8) *', helperText: 'A1A 1A1 format' },
    'GB': { maxLength: 8, placeholder: 'Postcode (e.g. SW1A 1AA) *', helperText: 'UK postcode format' },
    'IN': { maxLength: 6, placeholder: 'PIN Code (e.g. 110001) *', helperText: '6 digits (PIN code)' },
    'CN': { maxLength: 6, placeholder: 'Postal Code (e.g. 100000) *', helperText: '6 digits' },
    'SG': { maxLength: 6, placeholder: 'Postal Code (e.g. 018956) *', helperText: '6 digits' },
    'BR': { maxLength: 9, placeholder: 'Postal Code (e.g. 01310-100) *', helperText: '8-9 characters (5+3 digits)' },
    'JP': { maxLength: 8, placeholder: 'Postal Code (e.g. 100-0001) *', helperText: '7 characters (3-4 digits)' },
    'PL': { maxLength: 6, placeholder: 'Postal Code (e.g. 00-001) *', helperText: '6 characters (2-3 digits)' },
    'CZ': { maxLength: 6, placeholder: 'Postal Code (e.g. 110 00) *', helperText: '6 characters (3-2 digits)' },
  };

  const defaultConfig = { maxLength: 10, placeholder: 'ZIP/Postal Code *', helperText: 'Enter valid ZIP/Postal code' };

  if (!countryCode) return defaultConfig;

  // For 4 digit countries (AU, NZ, BE, CH, NO, DK, AT)
  if (['AU', 'NZ', 'BE', 'CH', 'NO', 'DK', 'AT'].includes(countryCode)) {
    return { maxLength: 4, placeholder: 'Postcode (e.g. 2000) *', helperText: '4 digits' };
  }

  // For 5 digit countries (DE, FR, IT, ES, SE, MX)
  if (['DE', 'FR', 'IT', 'ES', 'SE', 'MX'].includes(countryCode)) {
    return { maxLength: 5, placeholder: 'Postal Code (e.g. 10115) *', helperText: '5 digits' };
  }

  return configs[countryCode] || defaultConfig;
};

// ZIP/Postal code format validation for different countries
export const validateZipCode = (zipCode: string, countryCode: string): { valid: boolean; message?: string } => {
  if (!zipCode || !countryCode) {
    return { valid: false, message: 'ZIP code and country are required' };
  }

  const trimmedZip = zipCode.trim();

  // Country-specific validation patterns
  const zipPatterns: Record<string, { pattern: RegExp; example: string; description: string }> = {
    // North America
    'US': {
      pattern: /^\d{5}(?:-\d{4})?$/,
      example: '90210 or 90210-1234',
      description: '5 digits or 5+4 digits (ZIP+4)'
    },
    'CA': {
      pattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i,
      example: 'M5V 3A8',
      description: 'A1A 1A1 format'
    },
    // Europe
    'GB': {
      pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i,
      example: 'SW1A 1AA',
      description: 'UK postcode format'
    },
    'DE': {
      pattern: /^\d{5}$/,
      example: '10115',
      description: '5 digits'
    },
    'FR': {
      pattern: /^\d{5}$/,
      example: '75001',
      description: '5 digits'
    },
    'IT': {
      pattern: /^\d{5}$/,
      example: '00100',
      description: '5 digits'
    },
    'ES': {
      pattern: /^\d{5}$/,
      example: '28001',
      description: '5 digits'
    },
    'NL': {
      pattern: /^\d{4}\s?[A-Z]{2}$/i,
      example: '1012 AB',
      description: '4 digits + 2 letters'
    },
    'BE': {
      pattern: /^\d{4}$/,
      example: '1000',
      description: '4 digits'
    },
    'CH': {
      pattern: /^\d{4}$/,
      example: '8001',
      description: '4 digits'
    },
    'SE': {
      pattern: /^\d{5}$/,
      example: '10216',
      description: '5 digits'
    },
    'NO': {
      pattern: /^\d{4}$/,
      example: '0150',
      description: '4 digits'
    },
    'DK': {
      pattern: /^\d{4}$/,
      example: '1000',
      description: '4 digits'
    },
    'AT': {
      pattern: /^\d{4}$/,
      example: '1010',
      description: '4 digits'
    },
    'CZ': {
      pattern: /^\d{3}\s?\d{2}$/,
      example: '110 00',
      description: '3 digits + 2 digits'
    },
    'PL': {
      pattern: /^\d{2}-\d{3}$/,
      example: '00-001',
      description: '2 digits-3 digits'
    },
    // Asia-Pacific
    'AU': {
      pattern: /^\d{4}$/,
      example: '2000',
      description: '4 digits'
    },
    'JP': {
      pattern: /^\d{3}-\d{4}$/,
      example: '100-0001',
      description: '3 digits-4 digits'
    },
    'NZ': {
      pattern: /^\d{4}$/,
      example: '1010',
      description: '4 digits'
    },
    'CN': {
      pattern: /^\d{6}$/,
      example: '100000',
      description: '6 digits'
    },
    'IN': {
      pattern: /^\d{6}$/,
      example: '110001',
      description: '6 digits (PIN code)'
    },
    'SG': {
      pattern: /^\d{6}$/,
      example: '018956',
      description: '6 digits'
    },
    // South America
    'BR': {
      pattern: /^\d{5}-?\d{3}$/,
      example: '01310-100',
      description: '5 digits-3 digits'
    },
    'AR': {
      pattern: /^[A-Z]?\d{4}[A-Z]?$/i,
      example: 'C1425',
      description: '4 digits, optional letter prefix/suffix'
    },
    'MX': {
      pattern: /^\d{5}$/,
      example: '01000',
      description: '5 digits'
    }
  };

  const countryPattern = zipPatterns[countryCode];

  // If country not in our patterns, allow any input (for countries without postal codes)
  if (!countryPattern) {
    return { valid: true }; // Accept any format for unsupported countries
  }

  // Validate against the pattern
  if (!countryPattern.pattern.test(trimmedZip)) {
    return {
      valid: false,
      message: `Invalid ${countryCode} postal code format. Expected: ${countryPattern.description} (e.g., ${countryPattern.example})`
    };
  }

  return { valid: true };
};

export const lookupZipCode = async (zipCode: string, countryCode: string = 'US') => {
  if (!zipCode || zipCode.length < 4) return null;
  
  try {
    if (countryCode === 'US' && zipCode.length === 5) {
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation']
        };
      }
    }
    
    if (countryCode === 'CA' && zipCode.length >= 6) {
      const response = await fetch(`https://api.zippopotam.us/ca/${zipCode.substring(0, 3)}`);
      if (response.ok) {
        const data = await response.json();
        return {
          city: data.places[0]['place name'],
          state: data.places[0]['state abbreviation']
        };
      }
    }
    
    return null;
  } catch (error) {
    console.warn('ZIP code lookup failed:', error);
    return null;
  }
};

/**
 * Format phone number for international shipping using libphonenumber-js
 * Requires phone numbers in international format with + prefix
 */
export const formatPhoneForShipping = (phone: string, countryCode: string): string => {
  if (!phone) return '';

  let cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  try {
    const callingCode = getCountryCallingCode(countryCode as CountryCode);

    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }

    return `+${callingCode}${cleaned}`;
  } catch (error) {
    console.warn(`Unable to get calling code for country: ${countryCode}`);
    return phone.startsWith('+') ? phone : `+${cleaned}`;
  }
};

export const getShippingCountries = async (): Promise<PrintfulCountry[]> => {
  try {
    const API_URL = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
      : 'http://localhost:3001';

    // First try the new Printify shipping countries endpoint
    try {
      const response = await fetch(`/api/printify/shipping/countries`);
      if (response.ok) {
        const data = await response.json();
        return data.result || [];
      }
    } catch {
      // Fallback to backend
    }

    const response = await fetch(`${API_URL}/api/printify/shipping/countries`);
    if (!response.ok) throw new Error('Failed to fetch countries');
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Failed to fetch shipping countries:', error);
    return [];
  }
};

// Backwards-compatible alias
export const getPrintfulCountries = getShippingCountries;
// Backwards-compatible alias
export const formatPhoneForPrintful = formatPhoneForShipping;