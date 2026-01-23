import { CustomerInfo } from './checkout-types';
import { validateZipCode } from './location-utils';

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate shipping address according to Printful requirements
 * - country_code: Always required
 * - state_code: Required for US, CA, AU, JP
 * - phone: Optional parameter (default: true) - can be disabled for saved address scenarios
 * - address1, city, zip: Recommended for accurate rates
 */
export const validateShippingAddress = (
  customerInfo: CustomerInfo,
  options: { requirePhone?: boolean } = {}
): { valid: boolean; errors: ValidationError[] } => {
  const { requirePhone = true } = options;
  const errors: ValidationError[] = [];

  // Required: Country
  if (!customerInfo.country) {
    errors.push({ field: 'country', message: 'Country is required' });
  }

  // Required for US, CA, AU, JP: State
  const countriesRequiringState = ['US', 'CA', 'AU', 'JP'];
  if (customerInfo.country && countriesRequiringState.includes(customerInfo.country)) {
    if (!customerInfo.state) {
      errors.push({
        field: 'state',
        message: `State/Province is required for ${customerInfo.country}`
      });
    }
  }

  // Phone validation (optional based on context)
  if (requirePhone) {
    if (!customerInfo.phone) {
      errors.push({ field: 'phone', message: 'Phone number is required' });
    } else {
      // Basic phone validation - must have at least 7 digits
      const digitsOnly = customerInfo.phone.replace(/\D/g, '');
      if (digitsOnly.length < 7) {
        errors.push({
          field: 'phone',
          message: 'Phone number must have at least 7 digits'
        });
      }
    }
  }

  // Recommended fields for accurate shipping rates
  if (!customerInfo.address1) {
    errors.push({
      field: 'address1',
      message: 'Street address is required for accurate shipping rates'
    });
  }

  if (!customerInfo.city) {
    errors.push({
      field: 'city',
      message: 'City is required for accurate shipping rates'
    });
  }

  if (!customerInfo.zip) {
    errors.push({
      field: 'zip',
      message: 'ZIP/Postal code is required for accurate shipping rates'
    });
  } else if (customerInfo.country) {
    // Validate ZIP code format
    const zipValidation = validateZipCode(customerInfo.zip, customerInfo.country);
    if (!zipValidation.valid) {
      errors.push({
        field: 'zip',
        message: zipValidation.message || 'Invalid ZIP/Postal code format'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Validate customer information
 */
export const validateCustomerInfo = (
  customerInfo: CustomerInfo
): { valid: boolean; errors: ValidationError[] } => {
  const errors: ValidationError[] = [];

  if (!customerInfo.name || customerInfo.name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Full name is required (at least 2 characters)' });
  }

  if (!customerInfo.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get user-friendly error messages for display
 */
export const getErrorMessage = (errors: ValidationError[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  return `Please fix the following:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
};

/**
 * Check if address has minimum required fields for shipping rates
 */
export const canFetchShippingRates = (customerInfo: CustomerInfo): boolean => {
  // Minimum requirements: country and state (for required countries)
  if (!customerInfo.country) return false;

  const countriesRequiringState = ['US', 'CA', 'AU', 'JP'];
  if (countriesRequiringState.includes(customerInfo.country) && !customerInfo.state) {
    return false;
  }

  // Should have at least city and ZIP for meaningful rates
  return !!(customerInfo.city && customerInfo.zip);
};
