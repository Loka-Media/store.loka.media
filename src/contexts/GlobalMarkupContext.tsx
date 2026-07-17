'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
  calculateSellingPrice, 
  getProductPriceRange, 
  getVariantSellingPrice 
} from '@/lib/pricing';

interface GlobalMarkupContextType {
  globalMarkup: number;
  categoryMarkup: Record<string, number>;
  loading: boolean;
  updateGlobalMarkup: (newMarkup: number) => Promise<boolean>;
  updateCategoryMarkup: (newCategoryMarkup: Record<string, number>) => Promise<boolean>;
  updatePricingSettings: (globalMarkup: number, categoryMarkup: Record<string, number>) => Promise<boolean>;
  calculateSellingPrice: (baseCost: number, category?: string) => number;
  getProductPriceRange: (product: any, category?: string) => { minPrice: number; maxPrice: number };
  getVariantSellingPrice: (variant: any, product: any, category?: string) => number;
}

const GlobalMarkupContext = createContext<GlobalMarkupContextType | undefined>(undefined);

export function GlobalMarkupProvider({ children }: { children: React.ReactNode }) {
  const [globalMarkup, setGlobalMarkup] = useState<number>(35);
  const [categoryMarkup, setCategoryMarkup] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch the current markup from our local settings API
  const fetchMarkup = useCallback(async () => {
    try {
      setLoading(true);
      console.log('[Pricing] Fetching pricing settings from DB...');
      const res = await fetch('/api/admin/settings/pricing');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          const loadedGlobal = data.globalMarkup !== undefined ? data.globalMarkup : 35;
          const loadedCategories: Record<string, number> = data.categoryMarkup || {};

          console.log(`[Pricing] Loaded Global Markup: ${loadedGlobal}`);
          Object.entries(loadedCategories).forEach(([cat, val]) => {
            console.log(`[Pricing] Loaded ${cat}: ${val}`);
          });
          console.log('[Pricing] DB Load Status: success');

          setGlobalMarkup(loadedGlobal);
          setCategoryMarkup(loadedCategories);
        }
      } else {
        console.warn('[Pricing] DB Load Status: failed —', res.status, res.statusText);
      }
    } catch (error) {
      console.error('[Pricing] DB Load Status: error —', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkup();
  }, [fetchMarkup]);

  // Helper to post settings update — single clean fetch to the correct endpoint
  const saveSettings = async (markup: number, catMarkup: Record<string, number>, toastId: string): Promise<boolean> => {
    try {
      const payload = { globalMarkup: markup, categoryMarkup: catMarkup };
      console.log('[Pricing] Saving → Global:', markup, '| Categories:', catMarkup);

      const res = await fetch('/api/admin/settings/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        console.log('[Pricing] DB Save Status: Saved Successfully');
        setGlobalMarkup(markup);
        setCategoryMarkup(catMarkup);
        return true;
      } else {
        console.error('[Pricing] DB Save Status: failed —', data.error || res.statusText);
        throw new Error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('[Pricing] DB Save Status: error —', error);
      return false;
    }
  };

  // Update global markup setting
  const updateGlobalMarkup = async (newMarkup: number): Promise<boolean> => {
    const toastId = toast.loading('Saving global pricing settings...');
    const success = await saveSettings(newMarkup, categoryMarkup, toastId);
    if (success) {
      toast.success(`Global markup updated to ${newMarkup}%`, { id: toastId });
      return true;
    } else {
      toast.error('Failed to save settings. Please try again.', { id: toastId });
      return false;
    }
  };

  // Update category markup settings
  const updateCategoryMarkup = async (newCategoryMarkup: Record<string, number>): Promise<boolean> => {
    const toastId = toast.loading('Saving category pricing settings...');
    const success = await saveSettings(globalMarkup, newCategoryMarkup, toastId);
    if (success) {
      toast.success('Category markups saved successfully', { id: toastId });
      return true;
    } else {
      toast.error('Failed to save category markups. Please try again.', { id: toastId });
      return false;
    }
  };

  // Update both global and category markups in one transaction
  const updatePricingSettings = async (newGlobalMarkup: number, newCategoryMarkup: Record<string, number>): Promise<boolean> => {
    const toastId = toast.loading('Saving pricing settings...');
    const success = await saveSettings(newGlobalMarkup, newCategoryMarkup, toastId);
    if (success) {
      toast.success('Pricing settings saved successfully', { id: toastId });
      return true;
    } else {
      toast.error('Failed to save settings. Please try again.', { id: toastId });
      return false;
    }
  };

  // Pure functions bound to the current context markup
  const boundCalculateSellingPrice = useCallback((baseCost: number, category?: string) => {
    return calculateSellingPrice(baseCost, category, categoryMarkup, globalMarkup);
  }, [globalMarkup, categoryMarkup]);

  const boundGetProductPriceRange = useCallback((product: any, category?: string) => {
    return getProductPriceRange(product, category, categoryMarkup, globalMarkup);
  }, [globalMarkup, categoryMarkup]);

  const boundGetVariantSellingPrice = useCallback((variant: any, product: any, category?: string) => {
    return getVariantSellingPrice(variant, product, category, categoryMarkup, globalMarkup);
  }, [globalMarkup, categoryMarkup]);

  return (
    <GlobalMarkupContext.Provider
      value={{
        globalMarkup,
        categoryMarkup,
        loading,
        updateGlobalMarkup,
        updateCategoryMarkup,
        updatePricingSettings,
        calculateSellingPrice: boundCalculateSellingPrice,
        getProductPriceRange: boundGetProductPriceRange,
        getVariantSellingPrice: boundGetVariantSellingPrice,
      }}
    >
      {children}
    </GlobalMarkupContext.Provider>
  );
}

export function useGlobalMarkup() {
  const context = useContext(GlobalMarkupContext);
  if (context === undefined) {
    throw new Error('useGlobalMarkup must be used within a GlobalMarkupProvider');
  }
  return context;
}
