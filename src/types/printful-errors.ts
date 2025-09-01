/**
 * Printful API Error Types and Interfaces
 * Based on Printful API v2 documentation and RFC 9457: Problem Details for HTTP APIs
 */

// Base Printful API Error (v1 format)
export interface PrintfulAPIErrorV1 {
  code: number;
  result: string;
  error: {
    reason: string;
    message: string;
  };
}

// Printful API Error v2 (RFC 9457 format)
export interface PrintfulAPIErrorV2 {
  type: string;
  status: number;
  title: string;
  detail: string;
  instance?: string;
  invalid_params?: Array<{
    name: string;
    reason: string;
    pointer?: string;
  }>;
  valid_values?: string[];
}

// Union type for all possible Printful errors
export type PrintfulAPIError = PrintfulAPIErrorV1 | PrintfulAPIErrorV2;

// Order creation specific error codes
export enum PrintfulOrderErrorCodes {
  INVALID_REQUEST = 400,
  AUTHENTICATION_FAILED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  MISSING_ORDER_ELEMENT = 406,
  VALIDATION_ERROR = 422,
  RATE_LIMIT_EXCEEDED = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
}

// Common order validation errors
export interface OrderValidationError {
  field: string;
  message: string;
  code: string;
  suggestion?: string;
}

// Order creation error context
export interface OrderCreationErrorContext {
  orderId?: string;
  step: 'draft_creation' | 'item_addition' | 'order_confirmation' | 'payment_processing';
  orderData?: any;
  itemData?: any;
}

// Enhanced error information for UI display
export interface PrintfulOrderError {
  code: number;
  message: string;
  userMessage: string;
  field?: string;
  validationErrors?: OrderValidationError[];
  context?: OrderCreationErrorContext;
  recoverable: boolean;
  suggestedAction?: string;
}

// Order prerequisite validation
export interface OrderPrerequisites {
  hasRecipientAddress: boolean;
  hasValidItems: boolean;
  hasValidDesigns: boolean;
  hasValidVariants: boolean;
  allItemsAvailable: boolean;
  designsWithinLimits: boolean;
}

// Order item validation
export interface OrderItemValidation {
  catalogVariantId: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  placements: PlacementValidation[];
}

export interface PlacementValidation {
  placement: string;
  technique: string;
  isValid: boolean;
  errors: string[];
  layers: LayerValidation[];
}

export interface LayerValidation {
  type: 'file' | 'text';
  isValid: boolean;
  errors: string[];
  url?: string;
  position?: {
    area_width: number;
    area_height: number;
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

// Error categorization for different handling strategies
export enum PrintfulErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RESOURCE_NOT_FOUND = 'resource_not_found',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  NETWORK_ERROR = 'network_error',
  DESIGN_ERROR = 'design_error',
  INVENTORY_ERROR = 'inventory_error',
  PAYMENT_ERROR = 'payment_error',
}

// Helper function type definitions
export type ErrorHandler = (error: PrintfulAPIError, context?: OrderCreationErrorContext) => PrintfulOrderError;
export type ValidationHandler = (orderData: any) => Promise<OrderValidationError[]>;

// Common error messages for user display
export const PRINTFUL_ERROR_MESSAGES = {
  MISSING_ORDER_ELEMENT: {
    message: "Order data is incomplete or malformed",
    userMessage: "There's an issue with your order information. Please try again.",
    suggestedAction: "Verify all required fields are filled and try submitting again"
  },
  INVALID_VARIANT: {
    message: "Invalid catalog variant ID provided",
    userMessage: "Selected product variant is not available",
    suggestedAction: "Please select a different size or color option"
  },
  DESIGN_VALIDATION_FAILED: {
    message: "Design does not meet placement requirements",
    userMessage: "Your design needs to be adjusted to fit the product",
    suggestedAction: "Resize or reposition your design and try again"
  },
  INSUFFICIENT_INVENTORY: {
    message: "Selected variant is out of stock",
    userMessage: "This product is currently out of stock",
    suggestedAction: "Try a different size or color, or check back later"
  },
  RATE_LIMIT_EXCEEDED: {
    message: "Too many requests sent in a short period",
    userMessage: "You're submitting orders too quickly",
    suggestedAction: "Please wait a moment and try again"
  },
  AUTHENTICATION_FAILED: {
    message: "Invalid API credentials",
    userMessage: "There's an issue with your account connection",
    suggestedAction: "Please log out and log back in"
  },
  SERVER_ERROR: {
    message: "Printful server error occurred",
    userMessage: "Printful services are temporarily unavailable",
    suggestedAction: "Please try again in a few minutes"
  }
} as const;

export default PrintfulAPIError;