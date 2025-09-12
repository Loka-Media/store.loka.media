// Utility functions for managing access control dynamically
// These functions can be used in development or by admins to manage route access

import { AccessControlManager, ACCESS_CONTROL_CONFIG } from '@/config/access-control';

// Quick toggle functions for common scenarios
export const AccessControlHelpers = {
  // Enable public access to products page
  enableProductsPublicAccess: () => {
    AccessControlManager.toggleBypass('/products', true);
    console.log('✅ Products page is now publicly accessible');
  },

  // Disable public access to products page (back to creator/admin only)
  disableProductsPublicAccess: () => {
    AccessControlManager.toggleBypass('/products', false);
    console.log('🔒 Products page is now restricted to creators and admins');
  },

  // Get current status of products page access
  getProductsAccessStatus: () => {
    const config = AccessControlManager.getRouteConfig('/products');
    return {
      isPublic: config?.bypassEnabled || false,
      allowedRoles: config?.allowedRoles || [],
      requiresAuth: config?.requiresAuth || false
    };
  },

  // Emergency functions for admins
  enableEmergencyAccess: () => {
    AccessControlManager.enableGlobalBypass();
    console.log('🚨 Emergency access enabled - all routes are now publicly accessible');
  },

  disableEmergencyAccess: () => {
    AccessControlManager.disableGlobalBypass();
    console.log('🔐 Emergency access disabled - normal access controls restored');
  },

  // Display all route configurations
  showAllRouteStatus: () => {
    console.table(Object.entries(ACCESS_CONTROL_CONFIG).map(([path, config]) => ({
      path,
      public: config.bypassEnabled ? 'Yes' : 'No',
      allowedRoles: config.allowedRoles.join(', ') || 'Everyone',
      requiresAuth: config.requiresAuth ? 'Yes' : 'No'
    })));
  }
};

// Browser console helpers (only available in development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Make functions globally available in browser console
  (window as any).accessControl = AccessControlHelpers;
  
  // Display help message
  console.log(`
🔐 Access Control Helpers Available:
- accessControl.enableProductsPublicAccess() - Make products accessible to everyone
- accessControl.disableProductsPublicAccess() - Restrict products to creators/admins
- accessControl.getProductsAccessStatus() - Check current products access status
- accessControl.enableEmergencyAccess() - Enable global bypass (emergency)
- accessControl.disableEmergencyAccess() - Disable global bypass
- accessControl.showAllRouteStatus() - Show all route configurations
  `);
}

// React hook for accessing control helpers in components
export function useAccessControlHelpers() {
  return AccessControlHelpers;
}

// Type definitions for better developer experience
export interface RouteStatus {
  isPublic: boolean;
  allowedRoles: string[];
  requiresAuth: boolean;
}

export interface AccessControlAPI {
  enableProductsPublicAccess: () => void;
  disableProductsPublicAccess: () => void;
  getProductsAccessStatus: () => RouteStatus;
  enableEmergencyAccess: () => void;
  disableEmergencyAccess: () => void;
  showAllRouteStatus: () => void;
}