/**
 * Printify API Client
 * Direct server-side calls to api.printify.com/v1
 * Uses PRINTIFY_API_KEY and PRINTIFY_SHOP_ID from environment
 */

import type {
  PrintifyProduct,
  PrintifyProductsResponse,
  PrintifyBlueprint,
  PrintifyBlueprintDetail,
  PrintifyPrintProvider,
  PrintifyBlueprintVariant,
  PrintifyOrder,
  PrintifyCreateOrderRequest,
  PrintifyUploadedImage,
  PrintifyUploadImageRequest,
  PrintifyShippingRequest,
  PrintifyShippingResponse,
  PrintifyWebhook,
  PrintifyWebhookTopic,
  PrintifyShop,
} from '@/types/printify';

const PRINTIFY_BASE_URL = 'https://api.printify.com/v1';

function getConfig() {
  const apiKey = process.env.PRINTIFY_API_KEY;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!apiKey) throw new Error('PRINTIFY_API_KEY is not configured');
  if (!shopId) throw new Error('PRINTIFY_SHOP_ID is not configured');

  return { apiKey, shopId };
}

async function printifyFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiKey } = getConfig();

  const url = `${PRINTIFY_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'LokMedia-Store/1.0',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Printify API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = JSON.parse(errorBody);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
      if (errorJson.errors) {
        errorMessage += ` - Details: ${JSON.stringify(errorJson.errors)}`;
      }
    } catch {
      // Use default message
    }
    throw new Error(errorMessage);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// ============================================================
// SHOP
// ============================================================

export const printifyShopAPI = {
  getShops: (): Promise<PrintifyShop[]> =>
    printifyFetch<PrintifyShop[]>('/shops.json'),

  getShop: async (): Promise<PrintifyShop> => {
    const { shopId } = getConfig();
    const shops = await printifyShopAPI.getShops();
    const shop = shops.find(s => String(s.id) === String(shopId));
    if (!shop) throw new Error(`Shop with ID ${shopId} not found`);
    return shop;
  },
};

// ============================================================
// CATALOG / BLUEPRINTS
// ============================================================

export const printifyCatalogAPI = {
  /** List all available blueprints (product templates) */
  getBlueprints: (): Promise<PrintifyBlueprint[]> =>
    printifyFetch<PrintifyBlueprint[]>('/catalog/blueprints.json'),

  /** Get blueprint details */
  getBlueprint: (blueprintId: number): Promise<PrintifyBlueprintDetail> =>
    printifyFetch<PrintifyBlueprintDetail>(`/catalog/blueprints/${blueprintId}.json`),

  /** Get print providers for a blueprint */
  getPrintProviders: (blueprintId: number): Promise<PrintifyPrintProvider[]> =>
    printifyFetch<PrintifyPrintProvider[]>(`/catalog/blueprints/${blueprintId}/print_providers.json`),

  /** Get variants for a blueprint + print provider combination */
  getBlueprintVariants: (blueprintId: number, printProviderId: number): Promise<{ variants: PrintifyBlueprintVariant[] }> =>
    printifyFetch<{ variants: PrintifyBlueprintVariant[] }>(
      `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
    ),

  /** Get shipping profiles for a blueprint + print provider */
  getShippingProfiles: (blueprintId: number, printProviderId: number) =>
    printifyFetch(`/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/shipping.json`),

  /** List of all available print providers worldwide */
  getPrintProvidersList: (): Promise<PrintifyPrintProvider[]> =>
    printifyFetch<PrintifyPrintProvider[]>('/catalog/print_providers.json'),
};

// ============================================================
// SHOP PRODUCTS
// ============================================================

export const printifyProductsAPI = {
  /** List all products in the shop */
  getProducts: (params?: { page?: number; limit?: number }): Promise<PrintifyProductsResponse> => {
    const { shopId } = getConfig();
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return printifyFetch<PrintifyProductsResponse>(`/shops/${shopId}/products.json${qs}`);
  },

  /** Get a single product by ID */
  getProduct: (productId: string): Promise<PrintifyProduct> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyProduct>(`/shops/${shopId}/products/${productId}.json`);
  },

  /** Create a new product */
  createProduct: (productData: Partial<PrintifyProduct>): Promise<PrintifyProduct> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyProduct>(`/shops/${shopId}/products.json`, {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  /** Update an existing product */
  updateProduct: (productId: string, productData: Partial<PrintifyProduct>): Promise<PrintifyProduct> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyProduct>(`/shops/${shopId}/products/${productId}.json`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  /** Delete a product */
  deleteProduct: (productId: string): Promise<void> => {
    const { shopId } = getConfig();
    return printifyFetch<void>(`/shops/${shopId}/products/${productId}.json`, {
      method: 'DELETE',
    });
  },

  /** Publish a product to the shop */
  publishProduct: (productId: string, publishData?: {
    title: boolean;
    description: boolean;
    images: boolean;
    variants: boolean;
    tags: boolean;
    keyFeatures: boolean;
    shipping_template: boolean;
  }): Promise<void> => {
    const { shopId } = getConfig();
    return printifyFetch<void>(`/shops/${shopId}/products/${productId}/publish.json`, {
      method: 'POST',
      body: JSON.stringify(publishData || {
        title: true,
        description: true,
        images: true,
        variants: true,
        tags: true,
        keyFeatures: true,
        shipping_template: true,
      }),
    });
  },

  /** Set publishing succeeded */
  setPublishingSucceeded: (productId: string): Promise<void> => {
    const { shopId } = getConfig();
    return printifyFetch<void>(`/shops/${shopId}/products/${productId}/publishing_succeeded.json`, {
      method: 'POST',
      body: JSON.stringify({ external: { id: productId, handle: productId } }),
    });
  },
};

// ============================================================
// ORDERS
// ============================================================

export const printifyOrdersAPI = {
  /** List all orders */
  getOrders: (params?: { page?: number; limit?: number; status?: string }): Promise<{ data: PrintifyOrder[]; total: number }> => {
    const { shopId } = getConfig();
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return printifyFetch<{ data: PrintifyOrder[]; total: number }>(`/shops/${shopId}/orders.json${qs}`);
  },

  /** Get a single order */
  getOrder: (orderId: string): Promise<PrintifyOrder> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyOrder>(`/shops/${shopId}/orders/${orderId}.json`);
  },

  /** Create a new order */
  createOrder: (orderData: PrintifyCreateOrderRequest): Promise<PrintifyOrder> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyOrder>(`/shops/${shopId}/orders.json`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  /** Submit order to production */
  sendToProduction: (orderId: string): Promise<PrintifyOrder> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyOrder>(`/shops/${shopId}/orders/${orderId}/send_to_production.json`, {
      method: 'POST',
    });
  },

  /** Cancel an order */
  cancelOrder: (orderId: string): Promise<PrintifyOrder> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyOrder>(`/shops/${shopId}/orders/${orderId}/cancel.json`, {
      method: 'POST',
    });
  },
};

// ============================================================
// UPLOADS / IMAGES
// ============================================================

export const printifyUploadsAPI = {
  /** Upload an image by URL or base64 */
  uploadImage: (imageData: PrintifyUploadImageRequest): Promise<PrintifyUploadedImage> =>
    printifyFetch<PrintifyUploadedImage>('/uploads/images.json', {
      method: 'POST',
      body: JSON.stringify(imageData),
    }),

  /** Get uploaded image by ID */
  getImage: (imageId: string): Promise<PrintifyUploadedImage> =>
    printifyFetch<PrintifyUploadedImage>(`/uploads/${imageId}.json`),

  /** Archive (delete) an uploaded image */
  archiveImage: (imageId: string): Promise<void> =>
    printifyFetch<void>(`/uploads/${imageId}/archive.json`, {
      method: 'POST',
    }),

  /** List all uploaded images */
  getImages: (params?: { limit?: number; page?: number }): Promise<{ data: PrintifyUploadedImage[]; total: number }> => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.page) query.set('page', String(params.page));
    const qs = query.toString() ? `?${query.toString()}` : '';
    return printifyFetch<{ data: PrintifyUploadedImage[]; total: number }>(`/uploads.json${qs}`);
  },
};

// ============================================================
// SHIPPING
// ============================================================

export const printifyShippingAPI = {
  /** Calculate shipping rates for an order */
  calculateShipping: (shippingData: PrintifyShippingRequest): Promise<PrintifyShippingResponse> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyShippingResponse>(`/shops/${shopId}/orders/shipping.json`, {
      method: 'POST',
      body: JSON.stringify(shippingData),
    });
  },
};

// ============================================================
// WEBHOOKS
// ============================================================

export const printifyWebhooksAPI = {
  /** List all webhooks for the shop */
  getWebhooks: (): Promise<PrintifyWebhook[]> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyWebhook[]>(`/shops/${shopId}/webhooks.json`);
  },

  /** Create a new webhook */
  createWebhook: (topic: PrintifyWebhookTopic, url: string): Promise<PrintifyWebhook> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyWebhook>(`/shops/${shopId}/webhooks.json`, {
      method: 'POST',
      body: JSON.stringify({ topic, url }),
    });
  },

  /** Update a webhook */
  updateWebhook: (webhookId: string, url: string): Promise<PrintifyWebhook> => {
    const { shopId } = getConfig();
    return printifyFetch<PrintifyWebhook>(`/shops/${shopId}/webhooks/${webhookId}.json`, {
      method: 'PUT',
      body: JSON.stringify({ url }),
    });
  },

  /** Delete a webhook */
  deleteWebhook: (webhookId: string): Promise<void> => {
    const { shopId } = getConfig();
    return printifyFetch<void>(`/shops/${shopId}/webhooks/${webhookId}.json`, {
      method: 'DELETE',
    });
  },
};
