import { PrintfulCountry, PrintfulState } from './checkout-types';

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

export const getPrintfulCountries = async (): Promise<PrintfulCountry[]> => {
  try {
    const response = await fetch('https://api.printful.com/countries');
    if (!response.ok) throw new Error('Failed to fetch countries');
    
    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('Failed to fetch Printful countries:', error);
    return [
      {
        code: 'US',
        name: 'United States',
        states: [
          { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
          { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
          { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
          { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
          { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
          { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
          { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
          { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
          { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
          { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
          { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
          { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
          { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
          { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
          { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
          { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
          { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
        ],
        region: 'north_america'
      },
      {
        code: 'CA',
        name: 'Canada',
        states: [
          { code: 'AB', name: 'Alberta' }, { code: 'BC', name: 'British Columbia' },
          { code: 'MB', name: 'Manitoba' }, { code: 'NB', name: 'New Brunswick' },
          { code: 'NL', name: 'Newfoundland and Labrador' }, { code: 'NS', name: 'Nova Scotia' },
          { code: 'ON', name: 'Ontario' }, { code: 'PE', name: 'Prince Edward Island' },
          { code: 'QC', name: 'Quebec' }, { code: 'SK', name: 'Saskatchewan' },
          { code: 'NT', name: 'Northwest Territories' }, { code: 'NU', name: 'Nunavut' },
          { code: 'YT', name: 'Yukon' }
        ],
        region: 'north_america'
      }
    ];
  }
};