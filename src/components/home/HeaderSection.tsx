// components/home/HeroSection.tsx
"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Shield, Zap } from "lucide-react";

interface HeroSectionProps {
  isAuthenticated: boolean;
  user?: { role: string } | null;
}

export function HeroSection({ isAuthenticated, user }: HeroSectionProps) {
  return (
    <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          className="w-full h-full object-cover"
          style={{ filter: "invert(2)" }}
          autoPlay
          muted
          loop
          playsInline
        >
          <source
            src="https://cdn.fourthwall.com/sr-creators/resources/5a12e460-1e27-4680-b206-77074242703a/RackMultipart20250320-81-gjs25c.mp4"
            type="video/mp4"
          />
        </video>
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center">
          {/* Main Brand */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black mb-8 mt-16 tracking-tight leading-none">
            <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">
              The Ultimate Marketplace Platform
            </span>
          </h1>

          {/* Value Proposition */}
          <p className="text-lg sm:text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
            Connect creators with customers. Build, scale, and monetize your
            digital ecosystem.
          </p>

          {/* Primary CTA */}
          <div className="mb-8">
            <Link
              href="#marketplace-section"
              className="inline-flex items-center px-10 py-4 sm:px-12 sm:py-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold text-lg sm:text-xl rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50"
            >
              <ShoppingBag className="mr-3 w-5 h-5 sm:w-6 sm:h-6" />
              Explore Marketplace
              <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/auth/register"
                  className="px-6 py-3 sm:px-8 sm:py-3 border-2 border-gray-400 hover:border-orange-500 text-gray-200 hover:text-white font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 backdrop-blur-sm bg-black/20"
                >
                  Get Started Free
                </Link>
                <Link
                  href="/auth/login"
                  className="px-6 py-3 sm:px-8 sm:py-3 text-gray-300 hover:text-white font-semibold transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50"
                >
                  Sign In →
                </Link>
              </>
            ) : (
              <Link
                href={
                  user?.role === "creator" ? "/dashboard/creator" : "/dashboard"
                }
                className="px-6 py-3 sm:px-8 sm:py-3 border-2 border-gray-400 hover:border-orange-500 text-gray-200 hover:text-white font-semibold rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 backdrop-blur-sm bg-black/20"
              >
                Go to Dashboard
              </Link>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-y-4 gap-x-8 text-gray-300 text-sm md:text-base">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-orange-500 mr-2" />
              <span>Enterprise Ready</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 text-orange-500 mr-2" />
              <span>Bank-Level Security</span>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 text-orange-500 mr-2" />
              <span>Lightning Fast</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
