/**
 * Printify API v1 - Complete TypeScript Type Definitions
 * Base URL: https://api.printify.com/v1
 */

// ============================================================
// CATALOG / BLUEPRINTS
// ============================================================

export interface PrintifyBlueprint {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  images: string[];
}

export interface PrintifyBlueprintDetail extends PrintifyBlueprint {
  print_provider_id?: number;
}

export interface PrintifyPrintProvider {
  id: number;
  title: string;
  location: {
    address1: string;
    address2?: string;
    city: string;
    country: string;
    region: string;
    zip: string;
  };
}

export interface PrintifyBlueprintVariant {
  id: number;
  title: string; // e.g. "Black / S"
  options: {
    color: string;
    size: string;
  };
  placeholders: Array<{
    position: string; // "front", "back", "left_sleeve", etc.
    height: number;
    width: number;
  }>;
}

// ============================================================
// SHOP PRODUCTS
// ============================================================

export interface PrintifyVariantOption {
  id: number;
  value: string;
}

export interface PrintifyVariant {
  id: number;
  sku: string;
  cost: number;        // In cents
  price: number;       // In cents (retail price)
  title: string;       // "Black / S"
  grams: number;
  is_enabled: boolean;
  is_default: boolean;
  is_available: boolean;
  is_printify_express_eligible?: boolean;
  options: number[];   // Array of option IDs
}

export interface PrintifyProductImage {
  src: string;
  variant_ids: number[];
  position: string;    // "front", "back", "other"
  is_default: boolean;
  is_selected_for_publishing?: boolean;
}

export interface PrintifyPrintAreaPlaceholder {
  position: string;    // "front", "back", "left_sleeve", "right_sleeve", "label_outside_back", etc.
  height: number;
  width: number;
  images: Array<{
    id: string;
    name: string;
    type: string;
    height: number;
    width: number;
    x: number;
    y: number;
    scale: number;
    angle: number;
  }>;
}

export interface PrintifyPrintArea {
  variant_ids: number[];
  placeholders: PrintifyPrintAreaPlaceholder[];
  background?: string;
}

export interface PrintifyProductOption {
  name: string;        // "Colors", "Sizes"
  type: string;        // "color", "size"
  values: Array<{
    id: number;
    title: string;
    colors?: string[];
  }>;
}

export interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: PrintifyProductOption[];
  variants: PrintifyVariant[];
  images: PrintifyProductImage[];
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  user_id: number;
  shop_id: number;
  print_provider_id: number;
  print_areas: PrintifyPrintArea[];
  print_details?: unknown;
  sales_channel_properties?: unknown[];
  is_printify_express_eligible?: boolean;
  is_printify_express_enabled?: boolean;
  is_economy_shipping_eligible?: boolean;
  is_economy_shipping_enabled?: boolean;
  twodaydelivery_enabled?: boolean;
}

export interface PrintifyProductsResponse {
  current_page: number;
  data: PrintifyProduct[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

// Derived types for storefront use
export interface PrintifyColorOption {
  id: number;
  title: string;
  colors: string[];    // Hex color codes
  variantIds: number[];
  image?: string;      // Variant image for this color
}

export interface PrintifySizeOption {
  id: number;
  title: string;
  variantIds: number[];
}

// ============================================================
// ORDERS
// ============================================================

export interface PrintifyOrderAddress {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  country: string;
  region?: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

export interface PrintifyOrderLineItem {
  product_id: string;
  variant_id: number;
  quantity: number;
  print_areas?: Record<string, {
    src: string;
  }>;
  sku?: string;
  cost?: number;
  shipping_cost?: number;
  status?: string;
  metadata?: {
    title: string;
    price: number;
    variant_label: string;
    sku: string;
    country: string;
  };
  sent_to_production_at?: string;
  fulfilled_at?: string;
}

export interface PrintifyShipmentItem {
  carrier: string;
  number: string;
  url: string;
  delivered_at?: string;
}

export interface PrintifyOrder {
  id: string;
  address_to: PrintifyOrderAddress;
  line_items: PrintifyOrderLineItem[];
  metadata?: {
    order_type: string;
    shop_order_id?: string;
    shop_order_label?: string;
    shop_fulfilled_at?: string;
  };
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;          // "idle", "pending", "sending", "in-production", "fulfilled", "cancelled", "on-hold"
  shipping_method: number; // 1=standard, 2=express
  is_printify_express?: boolean;
  is_economy_shipping?: boolean;
  shipments: PrintifyShipmentItem[];
  created_at: string;
  sent_to_production_at?: string;
  fulfilled_at?: string;
}

export interface PrintifyCreateOrderRequest {
  external_id?: string;
  label?: string;
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
    print_areas?: Record<string, {
      src: string;
    }>;
  }>;
  shipping_method: number;
  is_printify_express?: boolean;
  is_economy_shipping?: boolean;
  send_shipping_notification?: boolean;
  address_to: PrintifyOrderAddress;
}

// ============================================================
// UPLOADS / IMAGES
// ============================================================

export interface PrintifyUploadedImage {
  id: string;
  file_name: string;
  height: number;
  width: number;
  size: number;
  mime_type: string;
  preview_url: string;
  upload_time: string;
}

export interface PrintifyUploadImageRequest {
  file_name: string;
  url?: string;          // URL to fetch image from
  contents?: string;     // Base64 encoded image
}

// ============================================================
// SHIPPING
// ============================================================

export interface PrintifyShippingRequest {
  line_items: Array<{
    product_id: string;
    variant_id: number;
    quantity: number;
    blueprint_id?: number;
    print_provider_id?: number;
  }>;
  address_to: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    country: string;
    region?: string;
    address1: string;
    address2?: string;
    city: string;
    zip: string;
  };
}

export interface PrintifyShippingRate {
  id: string;
  title: string;
  carrier: string;
  rate: number;         // In cents
  currency: string;
  minDeliveryDays: number;
  maxDeliveryDays: number;
  minDeliveryDate?: string;
  maxDeliveryDate?: string;
}

export interface PrintifyShippingResponse {
  standard: PrintifyShippingRate[];
  express: PrintifyShippingRate[];
  priority: PrintifyShippingRate[];
  printify_express: PrintifyShippingRate[];
  economy: PrintifyShippingRate[];
}

// ============================================================
// WEBHOOKS
// ============================================================

export type PrintifyWebhookTopic =
  | 'order:created'
  | 'order:updated'
  | 'order:sent-to-production'
  | 'product:created'
  | 'product:updated'
  | 'product:deleted';

export interface PrintifyWebhook {
  id: string;
  topic: PrintifyWebhookTopic;
  url: string;
  shop_id: string;
  secret?: string;
}

export interface PrintifyWebhookPayload {
  type: PrintifyWebhookTopic;
  created_at: string;
  resource: {
    id: string;
    type: string;
    data?: {
      reason?: string;
      shipment?: PrintifyShipmentItem;
    };
  };
}

// ============================================================
// SHOP
// ============================================================

export interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

// ============================================================
// TRANSFORMED TYPES FOR STOREFRONT USE
// ============================================================

/** Storefront-friendly product variant with parsed color/size */
export interface StorefrontVariant {
  id: number;
  sku: string;
  price: number;         // In dollars
  cost: number;          // In dollars
  title: string;
  color: string;
  colorCode: string;     // First hex color
  colorCodes: string[];  // All hex colors (for multi-tone)
  size: string;
  isAvailable: boolean;
  isDefault: boolean;
  imageUrl?: string;
  grams: number;
}

/** Storefront-friendly mockup image */
export interface StorefrontMockup {
  src: string;
  position: string;      // "front", "back", "left_sleeve", etc.
  label: string;         // Human-readable: "Front View", "Back View", etc.
  variantIds: number[];
  isDefault: boolean;
}

/** Fully transformed product for storefront display */
export interface StorefrontProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  blueprintId: number;
  printProviderId: number;
  variants: StorefrontVariant[];
  mockups: StorefrontMockup[];
  colorOptions: PrintifyColorOption[];
  sizeOptions: PrintifySizeOption[];
  defaultVariantId: number;
  defaultMockupUrl: string;
  minPrice: number;
  maxPrice: number;
  printAreas: string[];   // Available print positions
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}
