'use client';

import { useState } from 'react';
import { unifiedCheckoutAPI } from '@/lib/checkout-api';

interface CartItem {
  variant_id: string | number;
  printful_variant_id?: string;
  printify_variant_id?: number | string | null;
  printify_product_id?: number | string | null;
  product_id?: number | string;
  quantity: number;
  product_name: string;
}

interface AvailabilityResult {
  available: boolean;
  checks?: Array<{
    variant_id: number | string;
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
      // Filter items
      const printfulItems = items.filter(item =>
        item.printful_variant_id || (item as any).source === 'printful'
      );
      const printifyItems = items.filter(item =>
        item.printify_variant_id || (item as any).source === 'printify'
      );

      if (printfulItems.length === 0 && printifyItems.length === 0) {
        const result = { available: true, message: 'No fulfillable items to check' };
        setLastCheck(result);
        return result;
      }

      const checks: Array<{ variant_id: number | string; available: boolean; name?: string; reason?: string }> = [];

      // 1. Check Printful items (mocked as available as before)
      if (printfulItems.length > 0) {
        printfulItems.forEach(item => {
          checks.push({
            variant_id: item.printful_variant_id || item.variant_id,
            available: true,
            name: item.product_name
          });
        });
      }

      // 2. Check Printify items (using real-time Printify API check)
      if (printifyItems.length > 0) {
        const printifyVariants = printifyItems.map(item => ({
          variant_id: item.printify_variant_id as number | string,
          product_id: (item as any).printify_product_id || item.product_id,
          quantity: item.quantity
        }));

        try {
          const response = await unifiedCheckoutAPI.checkVariantAvailability(printifyVariants) as any;
          if (response?.success && Array.isArray(response.checks)) {
            response.checks.forEach((c: any) => {
              const matchedItem = printifyItems.find(item =>
                String(item.printify_variant_id || item.variant_id) === String(c.variant_id)
              );
              checks.push({
                variant_id: c.variant_id,
                available: c.available,
                name: matchedItem ? matchedItem.product_name : c.name,
                reason: c.reason
              });
            });
          } else {
            // Fallback if API returned non-success response
            printifyItems.forEach(item => {
              checks.push({
                variant_id: item.printify_variant_id || item.variant_id,
                available: true,
                name: item.product_name
              });
            });
          }
        } catch (err) {
          console.error('Failed to check Printify availability:', err);
          // Fallback if API call threw error
          printifyItems.forEach(item => {
            checks.push({
              variant_id: item.printify_variant_id || item.variant_id,
              available: true,
              name: item.product_name
            });
          });
        }
      }

      const allAvailable = checks.every(c => c.available);
      const unavailableCount = checks.filter(c => !c.available).length;

      const result: AvailabilityResult = {
        available: allAvailable,
        checks,
        message: allAvailable
          ? 'All items are available'
          : `${unavailableCount} item(s) unavailable`
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
