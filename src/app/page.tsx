"use client";

import { BackgroundPattern } from "@/components/home/BackgroundPattern";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { Footer } from "@/components/home/Footer";
import { HeroSection } from "@/components/home/HeaderSection";
import { MarketplaceSection } from "@/components/home/MarketplaceSection";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      <BackgroundPattern />

      <div className="relative z-10">
        <HeroSection isAuthenticated={isAuthenticated} user={user} />
        <FeaturesSection />
        <MarketplaceSection isAuthenticated={isAuthenticated} />
        <Footer />
      </div>
    </div>
  );
}
