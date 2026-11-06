'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';

interface CreatorProtectedRouteProps {
  children: React.ReactNode;
}

// How often to re-check the creator's status with the server while they are
// inside the Creator Hub, so an admin reject/remove takes effect without a reload.
const CREATOR_STATUS_RECHECK_MS = 60_000;

export default function CreatorProtectedRoute({ children }: CreatorProtectedRouteProps) {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();

  // refreshUser is recreated on every render of AuthProvider; keep the latest in a ref
  const refreshUserRef = useRef(refreshUser);
  refreshUserRef.current = refreshUser;

  // The cached user in AuthContext can be stale (e.g. the admin rejected or removed
  // this creator while they were logged in). Re-fetch from the server on entry,
  // whenever the tab regains focus, and periodically.
  useEffect(() => {
    const recheck = () => {
      refreshUserRef.current().catch(() => null);
    };
    recheck();

    const onVisible = () => {
      if (document.visibilityState === 'visible') recheck();
    };
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(recheck, CREATOR_STATUS_RECHECK_MS);

    return () => {
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

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
      if (user.creatorStatus === 'rejected') {
        toast.error('Your creator application has been rejected. You no longer have access to the Creator Hub.', {
          id: 'creator-rejected',
        });
      } else if (user.creatorStatus === 'pending') {
        toast('Your creator application is still under review.', { id: 'creator-pending' });
      }
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
  if (!user || user.role !== 'creator' || user.creatorStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
