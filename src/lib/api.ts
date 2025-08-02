import { api } from './auth';

// API base URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://store-api-loka-media.vercel.app' 
  : 'http://localhost:3003';

// Product interfaces
export interface Product {
  id: number;
  creator_id: number;
  name: string;
  description: string;
  base_price: number;
  markup_percentage: number;
  category: string;
  tags: string[];
  thumbnail_url: string;
  images: string[];
  is_active: boolean;
  creator_name: string;
  creator_username: string;
  variant_count: number;
  min_price: number;
  max_price: number;
  created_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  printful_variant_id?: number;
  shopify_variant_id?: string;
  title: string;
  size?: string;
  color?: string;
  color_code?: string;
  price: number;
  cost?: number;
  stock_status?: string;
  available_for_sale?: boolean;
  inventory_quantity?: number;
  sku: string;
  image_url?: string;
  compare_at_price?: number;
  weight?: number;
  weight_unit?: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  variant_id: number;
  quantity: number;
  price: number;
  product_name: string;
  thumbnail_url: string;
  creator_name: string;
  size: string;
  color: string;
  color_code: string;
  image_url: string;
  stock_status: string;
  total_price: number;
  shopify_variant_id?: string;
}

export interface CartSummary {
  itemCount: number;
  subtotal: string;
  shipping: string;
  total: string;
}

export interface Address {
  id?: number;
  user_id?: number;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state?: string;
  zip: string;
  country: string;
  phone?: string;
  is_default?: boolean;
  address_type?: 'shipping' | 'billing' | 'both';
  created_at?: string;
  updated_at?: string;
}

export interface Order {
  id: number;
  user_id: number;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_address: Address;
  billing_address?: Address;
  payment_status: string;
  payment_method: string;
  created_at: string;
  item_count: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  creator_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  thumbnail_url: string;
  size: string;
  color: string;
  image_url: string;
  creator_name: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  currency: string;
}

// Product API
export const productAPI = {
  // Get all products (public)
  getProducts: async (params?: {
    category?: string;
    search?: string;
    creator?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
    source?: 'printful' | 'shopify' | 'all'; // Filter by product source
  }) => {
    const response = await api.get('/api/products', { params });
    return response.data;
  },

  // Get single product
  getProduct: async (productId: string | number) => {
    const response = await api.get(`/api/products/${productId}`);
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    const response = await api.get('/api/products/categories');
    return response.data;
  },

  // Get creators
  getCreators: async () => {
    const response = await api.get('/api/products/creators');
    return response.data;
  },

  // Creator: Create product
  createProduct: async (productData: {
    name: string;
    description?: string;
    basePrice: number;
    markupPercentage?: number;
    category?: string;
    tags?: string[];
    thumbnailUrl?: string;
    images?: string[];
    printfulSyncProductId: number;
    variants: Array<{
      printfulVariantId: number;
      size: string;
      color: string;
      colorCode: string;
      cost: number;
      sku: string;
      imageUrl?: string;
    }>;
  }) => {
    const response = await api.post('/api/products', productData);
    return response.data;
  },

  // Creator: Get my products
  getCreatorProducts: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/products/creator/my-products', { params });
    return response.data;
  },

  // Creator: Update product
  updateProduct: async (productId: string | number, productData: Partial<Product>) => {
    const response = await api.put(`/api/products/${productId}`, productData);
    return response.data;
  },

  // Creator: Delete product
  deleteProduct: async (productId: string | number) => {
    const response = await api.delete(`/api/products/${productId}`);
    return response.data;
  },
};

// Cart API
export const cartAPI = {
  // Get cart
  getCart: async (): Promise<{ items: CartItem[]; summary: CartSummary }> => {
    const response = await api.get('/api/cart');
    return response.data;
  },

  // Get cart count
  getCartCount: async (): Promise<{ count: number }> => {
    const response = await api.get('/api/cart/count');
    return response.data;
  },

  // Add to cart
  addToCart: async (variantId: number, quantity: number = 1) => {
    const response = await api.post('/api/cart/add', { variantId, quantity });
    return response.data;
  },

  // Update cart item
  updateCartItem: async (cartItemId: number, quantity: number) => {
    const response = await api.put(`/api/cart/items/${cartItemId}`, { quantity });
    return response.data;
  },

  // Remove from cart
  removeFromCart: async (cartItemId: number) => {
    const response = await api.delete(`/api/cart/items/${cartItemId}`);
    return response.data;
  },

  // Clear cart
  clearCart: async () => {
    const response = await api.delete('/api/cart/clear');
    return response.data;
  },
};

// Wishlist API
export const wishlistAPI = {
  // Get wishlist
  getWishlist: async () => {
    const response = await api.get('/api/wishlist');
    return response.data;
  },

  // Get wishlist count
  getWishlistCount: async () => {
    const response = await api.get('/api/wishlist/count');
    return response.data;
  },

  // Add to wishlist
  addToWishlist: async (productId: number) => {
    const response = await api.post('/api/wishlist/add', { productId });
    return response.data;
  },

  // Remove from wishlist
  removeFromWishlist: async (productId: number) => {
    const response = await api.delete(`/api/wishlist/remove/${productId}`);
    return response.data;
  },

  // Clear wishlist
  clearWishlist: async () => {
    const response = await api.delete('/api/wishlist/clear');
    return response.data;
  },

  // Check if product is in wishlist
  isInWishlist: async (productId: number) => {
    const response = await api.get(`/api/wishlist/check/${productId}`);
    return response.data;
  },
};

// Address API
export const addressAPI = {
  // Get user addresses
  getAddresses: async () => {
    const response = await api.get('/api/addresses');
    return response.data;
  },

  // Create new address
  createAddress: async (addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/api/addresses', addressData);
    return response.data;
  },

  // Update address
  updateAddress: async (addressId: number, addressData: Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const response = await api.put(`/api/addresses/${addressId}`, addressData);
    return response.data;
  },

  // Delete address
  deleteAddress: async (addressId: number) => {
    const response = await api.delete(`/api/addresses/${addressId}`);
    return response.data;
  },

  // Set default address
  setDefaultAddress: async (addressId: number, addressType: 'shipping' | 'billing' | 'both') => {
    const response = await api.put(`/api/addresses/${addressId}/default`, { addressType });
    return response.data;
  },

  // Get default address by type
  getDefaultAddress: async (type: 'shipping' | 'billing') => {
    const response = await api.get(`/api/addresses/default/${type}`);
    return response.data;
  },
};

// Checkout API
export const checkoutAPI = {
  // Get shipping estimates
  getShippingEstimates: async (address: Address) => {
    const response = await api.post('/api/checkout/shipping-estimates', { address });
    return response.data;
  },

  // Create order
  createOrder: async (orderData: {
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod: string;
    shippingOption?: ShippingOption;
    notes?: string;
  }) => {
    const response = await api.post('/api/checkout/orders', orderData);
    return response.data;
  },

  // Get user orders
  getUserOrders: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/checkout/orders', { params });
    return response.data;
  },

  // Get order details
  getOrderDetails: async (orderId: string | number) => {
    const response = await api.get(`/api/checkout/orders/${orderId}`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (orderId: string | number) => {
    const response = await api.post(`/api/checkout/orders/${orderId}/cancel`);
    return response.data;
  },
};

// User Profile API
export const userAPI = {
  // Update user profile
  updateProfile: async (userData: {
    name?: string;
    phone?: string;
  }) => {
    const response = await api.put('/auth/me', userData);
    return response.data;
  },
};

// Helper functions
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(numPrice);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Printful API
export const printfulAPI = {
  // Initialize OAuth flow
  initializeAuth: async () => {
    const response = await api.get('/api/printful/auth/init');
    return response.data;
  },

  // Get connection status
  getConnectionStatus: async () => {
    const response = await api.get('/api/printful/connection/status');
    return response.data;
  },

  // Get Printful catalog
  getCatalog: async (params?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: string;
  }) => {
    const response = await api.get('/api/printful/catalog', { params });
    return response.data;
  },

  // Get Printful categories
  getCategories: async () => {
    const response = await api.get('/api/printful/categories');
    return response.data;
  },

  // Get product details with variants
  getProductDetails: async (productId: number) => {
    const response = await api.get(`/api/printful/catalog/${productId}`);
    return response.data;
  },

  // Upload file to Printful
  uploadFile: async (fileData: { filename: string; url: string; type?: string }) => {
    try {
      console.log('API uploadFile called with:', fileData);
      
      const response = await api.post('/api/printful/files', fileData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('API uploadFile error:', error);
      
      // Fallback: try with fetch instead of axios
      try {
        console.log('Trying fallback with fetch...');
        const token = localStorage.getItem('accessToken');
        
        const fetchResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/printful/files`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(fileData),
        });
        
        const result = await fetchResponse.json();
        console.log('Fetch response:', result);
        
        if (!fetchResponse.ok) {
          throw new Error(result.error || 'Upload failed');
        }
        
        return result;
      } catch (fetchError) {
        console.error('Fetch fallback also failed:', fetchError);
        throw error; // throw original error
      }
    }
  },

  // Get uploaded files
  getFiles: async () => {
    const response = await api.get('/api/printful/files');
    return response.data;
  },

  // Create sync product
  createSyncProduct: async (productData: {
    sync_product: {
      name: string;
      thumbnail: string;
      external_id?: string;
    };
    sync_variants: Array<{
      variant_id: number;
      retail_price: string;
      external_id?: string;
      files: Array<{
        url: string;
        type: string;
      }>;
    }>;
  }) => {
    const response = await api.post('/api/printful/products', productData);
    return response.data;
  },

  // Get sync products
  getSyncProducts: async () => {
    const response = await api.get('/api/printful/products/sync');
    return response.data;
  },

  // Get single sync product
  getSyncProduct: async (productId: number) => {
    const response = await api.get(`/api/printful/products/sync/${productId}`);
    return response.data;
  },

  // Sync products to database
  syncProductsToDatabase: async () => {
    const response = await api.post('/api/printful/products/sync-to-db');
    return response.data;
  },

  // Access design canvas
  getCanvas: async (productId?: number) => {
    const response = await api.get('/api/printful/canvas', { 
      params: productId ? { productId } : {} 
    });
    return response.data;
  },
};

// Shopify API (NEW - Complete Integration)
export const shopifyAPI = {
  // Authentication & Connection
  initializeAuth: async (shopDomain: string) => {
    const response = await api.post('/api/shopify/auth/initialize', { shop: shopDomain });
    return response.data;
  },

  getConnectionStatus: async () => {
    const response = await api.get('/api/shopify/auth/status');
    return response.data;
  },

  disconnect: async () => {
    const response = await api.post('/api/shopify/auth/disconnect');
    return response.data;
  },

  // Shop Information
  getShopInfo: async () => {
    const response = await api.get('/api/shopify/shop');
    return response.data;
  },

  // Products
  getProducts: async (params?: {
    limit?: number;
    page_info?: string;
    fields?: string;
  }) => {
    const response = await api.get('/api/shopify/products', { params });
    return response.data;
  },

  getProduct: async (productId: string | number) => {
    const response = await api.get(`/api/shopify/products/${productId}`);
    return response.data;
  },

  // Product Sync
  syncProducts: async () => {
    const response = await api.post('/api/shopify/products/sync');
    return response.data;
  },

  getUserProducts: async () => {
    const response = await api.get('/api/shopify/user/products');
    return response.data;
  },

  // Webhooks
  setupWebhooks: async () => {
    const response = await api.post('/api/shopify/webhooks/setup');
    return response.data;
  },

  // Shared Store Functions (Storefront API)
  getAvailableProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await api.get('/api/shopify-storefront/products/available', { params });
    return response.data;
  },

  publishProductsToMarketplace: async (productIds: string[] | number[]) => {
    const response = await api.post('/api/shopify-storefront/products/publish', { productIds });
    return response.data;
  },

  // Admin Functions (Private App - No OAuth)
  testShopifyConnection: async () => {
    const response = await api.post('/api/shopify-storefront/test');
    return response.data;
  },

  syncAllProducts: async () => {
    const response = await api.post('/api/shopify-storefront/sync');
    return response.data;
  },

  getSyncStatus: async () => {
    const response = await api.get('/api/shopify-storefront/status');
    return response.data;
  },
};

// Shopify Types/Interfaces
export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  tags: string[];
  images: ShopifyImage[];
  variants: ShopifyVariant[];
}

export interface ShopifyVariant {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  position: number;
  option1: string;
  option2?: string;
  option3?: string;
  created_at: string;
  updated_at: string;
  taxable: boolean;
  barcode?: string;
  weight: number;
  weight_unit: string;
  inventory_quantity: number;
  image_id?: number;
  compare_at_price?: string;
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt?: string;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}

export interface ShopifyConnectionStatus {
  connected: boolean;
  adminAccount: boolean;
  shared: boolean;
  connectedAt?: string;
  shopInfo?: {
    name: string;
    domain: string;
    email: string;
    country: string;
  };
  message: string;
}

export interface ShopifyAuthResponse {
  message: string;
  connected: boolean;
  adminAccount: boolean;
  needsAuth?: boolean;
  authUrl?: string;
  shopDomain?: string;
  note: string;
}

// Extended Product interface to include source
export interface ExtendedProduct extends Product {
  product_source?: 'printful' | 'shopify' | 'custom';
}

// Shopify Checkout API
export const shopifyCheckoutAPI = {
  // Create checkout session from cart
  createCheckoutSession: async (data?: {
    shippingAddress?: Address;
    discountCode?: string;
  }) => {
    const response = await api.post('/api/shopify-checkout/create', data);
    return response.data;
  },

  // Get checkout session by ID
  getCheckoutSession: async (sessionId: string | number) => {
    const response = await api.get(`/api/shopify-checkout/session/${sessionId}`);
    return response.data;
  },

  // Update checkout session
  updateCheckoutSession: async (sessionId: string | number, data: {
    action: 'update_address' | 'apply_discount' | 'add_items';
    data: unknown;
  }) => {
    const response = await api.put(`/api/shopify-checkout/session/${sessionId}`, data);
    return response.data;
  },

  // Complete checkout (called after successful Shopify payment)
  completeCheckout: async (data: {
    sessionId: string | number;
    shopifyOrderId?: string;
  }) => {
    const response = await api.post('/api/shopify-checkout/complete', data);
    return response.data;
  },

  // Get checkout history
  getCheckoutHistory: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/shopify-checkout/history', { params });
    return response.data;
  }
};

// Shopify Checkout Types
export interface ShopifyCheckoutSession {
  id: string;
  url: string;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
  subtotalPrice: {
    amount: string;
    currencyCode: string;
  };
  totalTax: {
    amount: string;
    currencyCode: string;
  };
  lineItems: ShopifyLineItem[];
  shippingAddress?: ShopifyAddress;
  discountApplications?: ShopifyDiscountApplication[];
}

export interface ShopifyLineItem {
  id: string;
  title: string;
  quantity: number;
  variant: {
    id: string;
    title: string;
    price: {
      amount: string;
      currencyCode: string;
    };
    image?: {
      url: string;
      altText?: string;
    };
  };
  customAttributes?: Array<{
    key: string;
    value: string;
  }>;
}

export interface ShopifyAddress {
  address1: string;
  address2?: string;
  city: string;
  company?: string;
  country: string;
  firstName: string;
  lastName: string;
  phone?: string;
  province: string;
  zip: string;
}

export interface ShopifyDiscountApplication {
  code?: string;
  title: string;
  value: {
    amount?: string;
    percentage?: number;
  };
  targetType: string;
}

export interface CheckoutSessionResponse {
  success: boolean;
  checkout: ShopifyCheckoutSession;
  sessionId: string | number;
}

// Public API (no authentication required - for guest users)
export const publicAPI = {
  // Get product variant details for guest cart
  getProductVariant: async (variantId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/products/variants/${variantId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product variant');
    }
    return response.json();
  }
};