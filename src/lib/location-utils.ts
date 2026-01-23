import { PrintfulCountry, PrintfulState } from './checkout-types';
import { getCountryCallingCode, CountryCode } from 'libphonenumber-js';

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
 * Format phone number for Printful API using libphonenumber-js
 * Printful requires phone numbers in international format with + prefix
 */
export const formatPhoneForPrintful = (phone: string, countryCode: string): string => {
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

export const getPrintfulCountries = async (): Promise<PrintfulCountry[]> => {
  try {
    const API_URL = typeof window !== 'undefined'
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '')
      : 'http://localhost:3001';

    const response = await fetch(`${API_URL}/api/printful/countries`);
    if (!response.ok) throw new Error('Failed to fetch countries');

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Failed to fetch Printful countries:', error);
    return [];
  }
};