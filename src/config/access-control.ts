// Access Control Configuration
// This file manages route protection settings across the application

export interface RouteConfig {
  path: string;
  allowedRoles: ('user' | 'creator' | 'admin')[];
  requiresAuth: boolean;
  bypassEnabled: boolean;
  redirectTo?: string;
}

// Centralized access control configuration
export const ACCESS_CONTROL_CONFIG: Record<string, RouteConfig> = {
  // Products page - restricted to creators and admin by default
  '/products': {
    path: '/products',
    allowedRoles: ['creator', 'admin'],
    requiresAuth: true,
    bypassEnabled: false, // Set to true to allow public access
    redirectTo: '/auth/login'
  },
  
  // Dashboard routes
  '/dashboard': {
    path: '/dashboard',
    allowedRoles: ['user', 'creator', 'admin'],
    requiresAuth: true,
    bypassEnabled: false,
    redirectTo: '/auth/login'
  },
  
  '/dashboard/creator': {
    path: '/dashboard/creator',
    allowedRoles: ['creator', 'admin'],
    requiresAuth: true,
    bypassEnabled: false,
    redirectTo: '/auth/login'
  },
  
  '/dashboard/admin': {
    path: '/dashboard/admin',
    allowedRoles: ['admin'],
    requiresAuth: true,
    bypassEnabled: false,
    redirectTo: '/auth/login'
  },
  
  // Public routes (examples)
  '/': {
    path: '/',
    allowedRoles: [],
    requiresAuth: false,
    bypassEnabled: true
  },
  
  '/about': {
    path: '/about',
    allowedRoles: [],
    requiresAuth: false,
    bypassEnabled: true
  }
};

// Helper functions for access control management
export class AccessControlManager {
  // Toggle bypass for a specific route
  static toggleBypass(routePath: string, enabled: boolean): void {
    if (ACCESS_CONTROL_CONFIG[routePath]) {
      ACCESS_CONTROL_CONFIG[routePath].bypassEnabled = enabled;
      console.log(`Bypass ${enabled ? 'enabled' : 'disabled'} for ${routePath}`);
    }
  }

  // Get route configuration
  static getRouteConfig(routePath: string): RouteConfig | null {
    return ACCESS_CONTROL_CONFIG[routePath] || null;
  }

  // Check if route is public (no auth required or bypass enabled)
  static isRoutePublic(routePath: string): boolean {
    const config = this.getRouteConfig(routePath);
    if (!config) return false;
    
    return config.bypassEnabled || (!config.requiresAuth && config.allowedRoles.length === 0);
  }

  // Enable global bypass (for emergency access or maintenance)
  static enableGlobalBypass(): void {
    Object.keys(ACCESS_CONTROL_CONFIG).forEach(key => {
      ACCESS_CONTROL_CONFIG[key].bypassEnabled = true;
    });
    console.log('Global bypass enabled for all routes');
  }

  // Disable global bypass
  static disableGlobalBypass(): void {
    Object.keys(ACCESS_CONTROL_CONFIG).forEach(key => {
      ACCESS_CONTROL_CONFIG[key].bypassEnabled = false;
    });
    console.log('Global bypass disabled for all routes');
  }

  // Bulk update route permissions
  static updateRoutePermissions(routePath: string, updates: Partial<RouteConfig>): void {
    if (ACCESS_CONTROL_CONFIG[routePath]) {
      ACCESS_CONTROL_CONFIG[routePath] = {
        ...ACCESS_CONTROL_CONFIG[routePath],
        ...updates
      };
      console.log(`Route permissions updated for ${routePath}:`, updates);
    }
  }
}

// Remove environment-based bypass - using only manual configuration now