import { api } from './auth';

export interface PrintfulConnection {
  connected: boolean;
  isExpired?: boolean;
  connectedAt?: string;
  lastUpdated?: string;
  scope?: string;
}

export interface PrintfulProduct {
  id: number;
  name: string;
  description: string;
  image: string;
  variants: PrintfulVariant[];
  files: PrintfulFile[];
  options: PrintfulOption[];
}

export interface PrintfulVariant {
  id: number;
  product_id: number;
  name: string;
  size: string;
  color: string;
  color_code: string;
  image: string;
  price: string;
  in_stock: boolean;
}

export interface PrintfulFile {
  id: number;
  type: string;
  title: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
  width: number;
  height: number;
  thumbnail_url: string;
}

export interface PrintfulOption {
  id: string;
  value: string;
  additional_price: string;
}

export interface SyncProduct {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url: string;
  is_ignored: boolean;
}

export interface CreateSyncProductData {
  sync_product: {
    name: string;
    thumbnail: string;
  };
  sync_variants: Array<{
    external_id: string;
    variant_id: number;
    retail_price: string;
    files: Array<{
      url: string;
    }>;
  }>;
}

export const printfulAPI = {
  // Connection management
  getConnectionStatus: async (): Promise<PrintfulConnection> => {
    const response = await api.get('/api/printful/connection/status');
    return response.data;
  },

  initializeAuth: async (): Promise<{ authUrl: string }> => {
    const response = await api.get('/api/printful/auth/init');
    return response.data;
  },

  disconnect: async (): Promise<{ message: string }> => {
    const response = await api.post('/api/printful/connection/disconnect');
    return response.data;
  },

  // Catalog
  getCatalog: async (params?: { category?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/api/printful/catalog', { params });
    return response.data;
  },

  getProduct: async (productId: string | number) => {
    const response = await api.get(`/api/printful/catalog/product/${productId}`);
    return response.data;
  },

  // File management
  uploadFile: async (fileData: { filename: string; url: string; type?: string }) => {
    const response = await api.post('/api/printful/files', fileData);
    return response.data;
  },

  getFiles: async () => {
    const response = await api.get('/api/printful/files');
    return response.data;
  },

  // Product management
  createSyncProduct: async (productData: CreateSyncProductData) => {
    const response = await api.post('/api/printful/products', productData);
    return response.data;
  },

  getSyncProducts: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/printful/products/sync', { params });
    return response.data;
  },

  getUserProducts: async () => {
    const response = await api.get('/api/printful/products/user');
    return response.data;
  },
};

// Helper functions
export const printfulHelpers = {
  // Format price for display
  formatPrice: (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numPrice);
  },

  // Get variant display name
  getVariantName: (variant: PrintfulVariant): string => {
    return `${variant.name} - ${variant.size} ${variant.color}`;
  },

  // Check if connection needs refresh
  needsReconnection: (connection: PrintfulConnection): boolean => {
    return !connection.connected || connection.isExpired === true;
  },

  // Generate external ID for products
  generateExternalId: (prefix: string = 'custom'): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};