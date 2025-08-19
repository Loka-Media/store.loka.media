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

    // Only allow access if user is admin OR is a creator with approved status
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (user.role === 'admin') {
      // Admin can always access creator features
      return;
    }
    
    if (user.role !== 'creator' || user.creatorStatus !== 'approved') {
      router.push('/dashboard');
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

  // Don't render children if user is not authorized
  if (!user || (user.role !== 'admin' && (user.role !== 'creator' || user.creatorStatus !== 'approved'))) {
    return null;
  }

  return <>{children}</>;
}