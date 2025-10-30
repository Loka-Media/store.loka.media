"use client";

import { BackgroundPattern } from "@/components/home/BackgroundPattern";
import { Footer } from "@/components/home/Footer";
import { HeroSection } from "@/components/home/HeaderSection";
import { QualityProductsSection } from "@/components/home/QualityProductsSection";
import { MakeAndSellSection } from "@/components/home/MakeAndSellSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { TestimonialSection } from "@/components/home/TestimonialSection";
import { FAQSection } from "@/components/home/FAQSection";
import { useAuth } from "@/contexts/AuthContext";
import { CustomizableShopsSection } from "@/components/home/CustomizableShopsSection";

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
      <BackgroundPattern />

      <div className="relative z-10">
        <HeroSection isAuthenticated={isAuthenticated} user={user} />
        <QualityProductsSection />
        <CustomizableShopsSection />
        <MakeAndSellSection />
        <HowItWorksSection />
        <TestimonialSection />
        <FAQSection />
      </div>
    </div>
  );
}
