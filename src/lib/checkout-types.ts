export interface PrintfulState {
  code: string;
  name: string;
}

export interface PrintfulCountry {
  code: string;
  name: string;
  states: PrintfulState[];
  region: string;
}

export interface CheckoutData {
  email: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    name: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  cartItems: Array<{
    product_id: string;
    variant_id: string;
    product_name: string;
    price: string;
    quantity: number;
    image_url: string;
    size: string;
    color: string;
    source?: string;
  }>;
}

export interface ProcessCheckoutData {
  sessionToken: string;
  paymentMethod: string;
  loginCredentials?: {
    email: string;
    password: string;
  };
}

export interface AuthenticatedCheckoutData {
  paymentMethod: string;
  shippingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  billingAddress: {
    name: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  cartItems: Array<{
    product_id: string;
    variant_id: string;
    product_name: string;
    price: string;
    quantity: number;
    image_url: string;
    size: string;
    color: string;
    source?: string;
  }>;
  customerNotes: string;
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
  address_type?: "shipping" | "billing" | "both";
  created_at?: string;
  updated_at?: string;
  cart_compatibility?: {
    is_fully_compatible: boolean;
    compatible_items_count: number;
    incompatible_items_count: number;
    incompatible_items: Array<{
      id: number;
      product_name: string;
      available_regions: string[];
    }>;
  };
}

export interface User {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface CartMergeData {
  userCartCount: number;
  guestCartCount: number;
  token: string;
  userInfo: User;
}

export type CheckoutStep = 'info' | 'payment' | 'complete' | 'cart-merge';