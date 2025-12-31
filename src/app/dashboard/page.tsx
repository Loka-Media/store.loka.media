"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CreatorApprovalStatus from "@/components/CreatorApprovalStatus";
import {
  LogOut,
} from "lucide-react";

export default function DashboardPage() {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    } else if (!loading && user) {
      // Redirect to role-specific dashboard
      if (user.role === "creator" && user.creatorStatus === "approved") {
        router.push("/dashboard/creator");
      } else if (user.role === "admin") {
        router.push("/dashboard/admin");
      } else if (user.role === "user" && !user.creatorStatus) {
        router.push("/");
      }
      // Users with pending/rejected creator status stay on main dashboard
    }
  }, [loading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-400 font-medium">
                Welcome back, {user.name}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 text-gray-400 hover:text-red-400 rounded-lg text-sm font-semibold transition-colors border border-gray-700 hover:bg-red-900/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8">
        <CreatorApprovalStatus />

        {/* Dashboard Content */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700/50 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-white mb-4">Your Dashboard</h2>
          <p className="text-gray-400">
            Welcome to your dashboard. You can browse products, manage your profile, and track your orders from here.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
            >
              Browse Products
            </Link>
            <Link
              href="/profile"
              className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors border border-gray-700"
            >
              Manage Profile
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
