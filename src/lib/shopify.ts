import { shopifyAPI, ShopifyConnectionStatus, ShopifyProduct } from './api';

// Shopify utility functions and hooks
export class ShopifyService {
  // Connection management
  static async checkConnection(): Promise<ShopifyConnectionStatus> {
    try {
      return await shopifyAPI.getConnectionStatus();
    } catch (error) {
      console.error('Failed to check Shopify connection:', error);
      return {
        connected: false,
        adminAccount: false,
        shared: false,
        message: 'Failed to check connection status'
      };
    }
  }

  static async initializeConnection(shopDomain: string) {
    try {
      const response = await shopifyAPI.initializeAuth(shopDomain);
      
      if (response.needsAuth && response.authUrl) {
        // Redirect to Shopify OAuth
        window.location.href = response.authUrl;
      }
      
      return response;
    } catch (error) {
      console.error('Failed to initialize Shopify connection:', error);
      throw error;
    }
  }

  static async disconnect() {
    try {
      return await shopifyAPI.disconnect();
    } catch (error) {
      console.error('Failed to disconnect from Shopify:', error);
      throw error;
    }
  }

  // Product management
  static async getAllProducts(limit: number = 50) {
    try {
      return await shopifyAPI.getProducts({ limit });
    } catch (error) {
      console.error('Failed to get Shopify products:', error);
      throw error;
    }
  }

  static async syncProducts() {
    try {
      return await shopifyAPI.syncProducts();
    } catch (error) {
      console.error('Failed to sync Shopify products:', error);
      throw error;
    }
  }

  static async getUserSyncedProducts() {
    try {
      return await shopifyAPI.getUserProducts();
    } catch (error) {
      console.error('Failed to get user synced products:', error);
      throw error;
    }
  }

  // Utility functions
  static extractShopDomain(shopUrl: string): string {
    // Remove protocol and .myshopify.com if present
    return shopUrl
      .replace(/^https?:\/\//, '')
      .replace(/\.myshopify\.com$/, '')
      .replace(/\/$/, '');
  }

  static validateShopDomain(shopDomain: string): boolean {
    // Basic validation for Shopify shop domain
    const shopPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$/;
    return shopPattern.test(shopDomain) && shopDomain.length >= 3 && shopDomain.length <= 60;
  }

  static formatShopifyPrice(price: string | number): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(numPrice);
  }

  static getProductImageUrl(product: ShopifyProduct, size: 'small' | 'medium' | 'large' = 'medium'): string {
    if (!product.images || product.images.length === 0) {
      return '/placeholder-product.png';
    }

    const image = product.images[0];
    const sizeMap = {
      small: '200x200',
      medium: '400x400', 
      large: '800x800'
    };

    // Shopify images can be resized by adding size parameters
    return image.src.replace(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i, `_${sizeMap[size]}.$1$2`);
  }
}

// React hook for Shopify connection status
export const useShopifyConnection = () => {
  const [connectionStatus, setConnectionStatus] = React.useState<ShopifyConnectionStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const checkConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await ShopifyService.checkConnection();
      setConnectionStatus(status);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check connection');
    } finally {
      setLoading(false);
    }
  };

  const connect = async (shopDomain: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ShopifyService.initializeConnection(shopDomain);
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setLoading(true);
      setError(null);
      await ShopifyService.disconnect();
      await checkConnection(); // Refresh status
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    checkConnection();
  }, []);

  return {
    connectionStatus,
    loading,
    error,
    connect,
    disconnect,
    refetch: checkConnection,
  };
};

// React hook for Shopify products
export const useShopifyProducts = () => {
  const [products, setProducts] = React.useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchProducts = async (limit: number = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ShopifyService.getAllProducts(limit);
      setProducts(response.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const syncProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ShopifyService.syncProducts();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync products');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    fetchProducts,
    syncProducts,
  };
};

// Import React for hooks (will be available in Next.js environment)
import React from 'react';

export default ShopifyService;