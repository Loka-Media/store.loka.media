/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Printify Mockup API
 *
 * Printify pre-generates mockups when products are created.
 * This service fetches those existing mockups rather than creating tasks.
 *
 * For the creator canvas: when a creator uploads a design and selects
 * variants, we use the product's existing Printify mockup images.
 */

import { printifyAPI } from "./api";

export interface MockupResult {
  url: string;
  placement: string;
  variant_ids: number[];
  title?: string;
  option?: string;
  option_group?: string;
}

class MockupAPI {
  /**
   * Get pre-generated mockups for a Printify product.
   * These are the images that Printify generates when a product is created.
   */
  async getProductMockups(printifyProductId: string): Promise<MockupResult[]> {
    try {
      const response = await printifyAPI.getMockups(printifyProductId);
      const mockups = response?.data?.mockups || [];

      return mockups.map((mockup: any) => ({
        url: mockup.src,
        placement: mockup.position,
        variant_ids: mockup.variantIds || [],
        title: mockup.label || mockup.position,
        option: mockup.position,
        option_group: 'Printify Mockup',
      }));
    } catch (error) {
      console.error('Error fetching Printify mockups:', error);
      throw error;
    }
  }

  /**
   * Generate mockup for creator canvas.
   * Since Printify uses pre-generated mockups, this returns the existing
   * mockup images for the selected product variants.
   *
   * For products with custom print areas (creator-uploaded designs),
   * the mockup URLs come from the product's images after creation.
   */
  async generateProductMockup({
    printifyProductId,
    variantIds,
    onStatusUpdate,
  }: {
    printifyProductId?: string;
    productId?: number;          // Kept for backwards compat, maps to blueprint ID
    variantIds: number[];
    designFiles?: any[];
    format?: 'jpg' | 'png';
    width?: number;
    productOptions?: any;
    optionGroups?: string[];
    options?: string[];
    productTemplateId?: number;
    onStatusUpdate?: (status: string, attempts: number) => void;
    printFiles?: any;
  }): Promise<MockupResult[]> {
    onStatusUpdate?.('Fetching Printify mockups...', 0);

    if (!printifyProductId) {
      console.warn('No printifyProductId provided. Returning empty mockup array.');
      return [];
    }

    try {
      const mockups = await this.getProductMockups(printifyProductId);

      // Filter mockups to only those relevant to selected variants
      const filtered = variantIds.length > 0
        ? mockups.filter(m =>
            m.variant_ids.length === 0 ||
            m.variant_ids.some(vid => variantIds.includes(vid))
          )
        : mockups;

      onStatusUpdate?.('Mockups loaded successfully!', 1);
      return filtered.length > 0 ? filtered : mockups;
    } catch (error) {
      console.error('Error generating Printify mockup:', error);
      throw error;
    }
  }
}

export const mockupAPI = new MockupAPI();
