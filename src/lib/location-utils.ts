import { PrintfulCountry, PrintfulState } from './checkout-types';

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