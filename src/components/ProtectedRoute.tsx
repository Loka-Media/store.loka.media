'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type UserRole = 'user' | 'creator' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requiresAuth?: boolean;
  bypassEnabled?: boolean;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  allowedRoles = ['admin', 'creator'], // Default to creator/admin only
  requiresAuth = true,
  bypassEnabled = false,
  redirectTo = '/auth/login',
  loadingComponent,
  unauthorizedComponent
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If bypass is enabled, allow access without any checks
    if (bypassEnabled) {
      return;
    }

    // If authentication is required but user is not logged in
    if (requiresAuth && !user) {
      router.push(redirectTo);
      return;
    }

    // If user is logged in but doesn't have required role
    if (requiresAuth && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Special handling for creators - check approval status
      if (user.role === 'creator' && allowedRoles.includes('creator')) {
        if (user.creatorStatus !== 'approved') {
          router.push('/dashboard');
          return;
        }
      } else {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, loading, router, allowedRoles, requiresAuth, bypassEnabled, redirectTo]);

  // Show loading while checking authentication
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Checking access...</p>
        </div>
      </div>
    );
  }

  // If bypass is enabled, show content regardless of auth status
  if (bypassEnabled) {
    return <>{children}</>;
  }

  // Check if user should have access
  const hasAccess = () => {
    // If no auth required and no specific roles needed
    if (!requiresAuth && allowedRoles.length === 0) {
      return true;
    }

    // If auth required but user not logged in
    if (requiresAuth && !user) {
      return false;
    }

    // If no specific roles required but auth is required
    if (requiresAuth && allowedRoles.length === 0) {
      return !!user;
    }

    // Check role-based access
    if (user && allowedRoles.includes(user.role)) {
      // Special check for creators - must be approved
      if (user.role === 'creator') {
        return user.creatorStatus === 'approved';
      }
      return true;
    }

    return false;
  };

  // Don't render children if user doesn't have access
  if (!hasAccess()) {
    if (unauthorizedComponent) {
      return <>{unauthorizedComponent}</>;
    }
    return null;
  }

  return <>{children}</>;
}

// Helper hook for programmatic access checks
export function useAccessControl() {
  const { user, loading } = useAuth();

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user) return false;
    
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    
    if (rolesArray.includes(user.role)) {
      // Special check for creators
      if (user.role === 'creator') {
        return user.creatorStatus === 'approved';
      }
      return true;
    }
    
    return false;
  };

  const isCreatorOrAdmin = () => hasRole(['creator', 'admin']);
  const isAdmin = () => hasRole('admin');
  const isApprovedCreator = () => user?.role === 'creator' && user.creatorStatus === 'approved';

  return {
    user,
    loading,
    hasRole,
    isCreatorOrAdmin,
    isAdmin,
    isApprovedCreator,
    isAuthenticated: !!user
  };
}