'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorProtectedRouteProps {
  children: React.ReactNode;
}

export default function CreatorProtectedRoute({ children }: CreatorProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect unauthenticated users to login
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // Admin is NOT allowed in Creator Hub - redirect directly to Admin Dashboard
    if (user.role === 'admin') {
      router.replace('/dashboard/admin');
      return;
    }
    
    // Only approved creators can access creator routes
    if (user.role !== 'creator' || user.creatorStatus !== 'approved') {
      router.replace('/dashboard');
      return;
    }
  }, [user, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Don't render children if user is admin, unauthenticated, or not an approved creator
  if (!user || user.role === 'admin' || user.role !== 'creator' || user.creatorStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}