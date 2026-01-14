'use client';

import { useState } from 'react';
import { unifiedCheckoutAPI } from '@/lib/checkout-api';

interface CartItem {
  variant_id: string | number;
  printful_variant_id?: string;
  quantity: number;
  product_name: string;
}

interface AvailabilityResult {
  available: boolean;
  checks?: Array<{
    variant_id: number;
    available: boolean;
    name?: string;
    reason?: string;
  }>;
  message?: string;
}

export function useInventoryCheck() {
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<AvailabilityResult | null>(null);

  const checkAvailability = async (items: CartItem[]): Promise<AvailabilityResult> => {
    setChecking(true);
    try {
      // Filter for Printful items only
      const printfulItems = items.filter(item =>
        item.printful_variant_id || (item as any).source === 'printful'
      );

      if (printfulItems.length === 0) {
        const result = { available: true, message: 'No Printful items to check' };
        setLastCheck(result);
        return result;
      }

      // Prepare variants for checking
      const variants = printfulItems.map(item => ({
        variant_id: item.printful_variant_id || item.variant_id,
        quantity: item.quantity
      }));

      const response = await unifiedCheckoutAPI.checkVariantAvailability(variants);

      const result: AvailabilityResult = {
        available: response.all_available || response.success,
        checks: response.checks,
        message: response.all_available
          ? 'All items are available'
          : `${response.unavailable_count || 0} item(s) unavailable`
      };

      setLastCheck(result);
      return result;
    } catch (error) {
      console.error('Availability check failed:', error);
      const result = {
        available: false,
        message: 'Unable to verify availability. Please try again.'
      };
      setLastCheck(result);
      return result;
    } finally {
      setChecking(false);
    }
  };

  const clearLastCheck = () => {
    setLastCheck(null);
  };

  return {
    checking,
    lastCheck,
    checkAvailability,
    clearLastCheck
  };
}
