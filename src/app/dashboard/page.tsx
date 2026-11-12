"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import CreatorApprovalStatus from "@/components/CreatorApprovalStatus";
import {
  LogOut,
  ShoppingBag,
  User,
  Sparkles,
  ArrowRight,
  Package,
  Instagram,
  CheckCircle2,
  Loader2,
  Palette,
} from "lucide-react";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, loading, logout, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  // Creator application inline form state
  const [creatorUrl, setCreatorUrl] = useState("");
  const [submittingApp, setSubmittingApp] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    } else if (!loading && user) {
      // Redirect to role-specific dashboard if user is an approved creator or admin
      if (user.role === "creator" && user.creatorStatus === "approved") {
        router.replace("/dashboard/creator");
      } else if (user.role === "admin") {
        router.replace("/dashboard/admin");
      }
      // Note: Regular customers & users with pending/rejected creator status stay on customer dashboard
    }
  }, [loading, isAuthenticated, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const handleApplyCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorUrl.trim()) {
      toast.error("Please enter your Instagram or social media profile link.");
      return;
    }

    setSubmittingApp(true);
    try {
      const token = localStorage.getItem("accessToken") || "";
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ creatorUrl: creatorUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      toast.success(
        data.message || "Creator application submitted! Our team will review it shortly."
      );
      setCreatorUrl("");
      if (refreshUser) {
        await refreshUser();
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmittingApp(false);
    }
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

  const isPendingCreator = user.creatorStatus === "pending";
  const isApprovedCreator = user.role === "creator" && user.creatorStatus === "approved";

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent mt-8 sm:mt-12 lg:mt-14">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 py-6 sm:py-8">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Dashboard
                </h1>
                <span className="text-[11px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 border border-white/10">
                  {user.role === "creator" && user.creatorStatus === "approved" ? "Creator" : "Customer"}
                </span>
              </div>
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 space-y-8">
        {/* Creator Approval Status Banner (shown when pending or rejected) */}
        <CreatorApprovalStatus />

        {/* Creator Onboarding / Application Card (Shown to regular customers who have not yet applied or whose application was rejected) */}
        {user.role !== "admin" &&
          ((!user.creatorStatus && user.role !== "creator") || user.creatorStatus === "rejected") && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-950/40 via-neutral-900 to-black border border-orange-500/30 p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold mb-4 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{user.creatorStatus === "rejected" ? "Re-apply For Creator Access" : "Create & Sell on Loka"}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
                {user.creatorStatus === "rejected" ? "Re-apply for Creator Access" : "Create Your Own Products & Sell Online"}
              </h2>

              <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6">
                {user.creatorStatus === "rejected"
                  ? "Update your Instagram or social media profile link below to re-submit your application for admin review."
                  : "Turn your designs and ideas into premium custom merchandise with zero upfront costs! Apply for creator access to unlock our built-in Canvas Studio, interactive 360° product previews, and earn up to 90% profit markup on every sale."}
              </p>

              {/* Inline Application Form */}
              <form onSubmit={handleApplyCreator} className="flex flex-col sm:flex-row gap-3 max-w-xl">
                <div className="relative flex-1">
                  <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-500" />
                  <input
                    type="text"
                    value={creatorUrl}
                    onChange={(e) => setCreatorUrl(e.target.value)}
                    placeholder="Instagram link or portfolio URL (e.g. instagram.com/you)"
                    className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/20 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary hover:bg-primary-hover text-black font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {submittingApp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      {user.creatorStatus === "rejected" ? "Re-apply for Creator Access" : "Apply for Creator Access"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-6 text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1.5 text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Free to join
                </span>
                <span className="flex items-center gap-1.5 text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No inventory risk
                </span>
                <span className="flex items-center gap-1.5 text-white/90">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Worldwide fulfillment
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

