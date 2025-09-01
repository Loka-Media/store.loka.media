// components/home/HeroSection.tsx
"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Zap } from "lucide-react";
import Threads from "./Threads";

interface HeroSectionProps {
  isAuthenticated: boolean;
  user?: { role: string } | null;
}

export function HeroSection({ isAuthenticated, user }: HeroSectionProps) {
  return (
    <section className="relative pt-12 sm:pt-16 md:pt-20 pb-8 sm:pb-12 md:pb-16 px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden flex items-center mt-4 sm:mt-6 md:mt-9">
      {/* Ballpit Background */}
      <div className="absolute inset-0 w-full h-full">
        <Threads amplitude={1} distance={0} enableMouseInteraction={true} />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-orange-900/40"></div>

      {/* Floating Shapes */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-1/4 left-1/6 sm:left-1/4 w-16 sm:w-20 md:w-32 h-16 sm:h-20 md:h-32 bg-gradient-to-br from-orange-500/20 to-orange-300/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/6 sm:right-1/4 w-20 sm:w-28 md:w-48 h-20 sm:h-28 md:h-48 bg-gradient-to-br from-orange-400/15 to-orange-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/4 sm:left-1/3 w-12 sm:w-16 md:w-24 h-12 sm:h-16 md:h-24 bg-gradient-to-br from-orange-300/25 to-orange-500/15 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 mb-4 sm:mb-6 md:mb-8 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-300/20 backdrop-blur-sm border border-orange-500/30 text-orange-200 text-xs sm:text-sm font-medium animate-bounce">
            <Zap className="w-4 h-4 mr-2 text-orange-400" />
            <span>Now with AI-Powered Analytics</span>
          </div>

          {/* Heading */}
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-8xl font-black mb-4 sm:mb-6 md:mb-8 tracking-tight leading-tight px-2 sm:px-0">
            <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent">
              Turn Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-white via-gray-100 to-orange-100 bg-clip-text text-transparent">
              Following Into Income
            </span>
          </h1>

          {/* Value Prop */}
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-200 mb-6 sm:mb-8 md:mb-12 max-w-xl sm:max-w-2xl lg:max-w-4xl mx-auto leading-relaxed font-light px-3 sm:px-2">
            Your creator journey deserves premium marketing support and maximum
            <span className="text-orange-300 font-medium">
              {" "}
              monetization earnings on
            </span>{" "}
            and
            <span className="text-orange-300 font-medium">
              {" "}
              across all social platforms.
            </span>
            .
          </p>

          {/* Primary CTA */}
          <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 relative flex justify-center px-3 sm:px-0">
            <Link
              href="/products"
              className="relative inline-flex items-center justify-center w-full sm:w-auto max-w-xs sm:max-w-sm md:max-w-md px-6 sm:px-8 md:px-12 lg:px-16 py-3 sm:py-4 md:py-5 lg:py-6 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold text-sm sm:text-base md:text-lg lg:text-xl rounded-full transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <ShoppingBag className="mr-1.5 sm:mr-2 md:mr-3 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative">Explore Marketplace</span>
              <ArrowRight className="ml-1.5 sm:ml-2 md:ml-3 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 mb-2 px-3 sm:px-0">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/auth/register"
                  className="group w-full sm:w-auto sm:flex-1 max-w-xs sm:max-w-sm md:max-w-md px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 border-2 border-orange-400/50 hover:border-orange-400 text-gray-200 hover:text-white font-semibold rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 backdrop-blur-md bg-gradient-to-r from-black/30 to-orange-900/30 hover:from-orange-500/20 hover:to-orange-600/20 relative overflow-hidden text-xs sm:text-sm md:text-base text-center inline-flex items-center justify-center"
                >
                  <span className="relative">Get Started Free</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="group w-full sm:w-auto sm:flex-1 max-w-xs sm:max-w-sm md:max-w-md px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 border-2 border-orange-400/50 hover:border-orange-400 text-gray-200 hover:text-white font-semibold rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 backdrop-blur-md bg-gradient-to-r from-black/30 to-orange-900/30 hover:from-orange-500/20 hover:to-orange-600/20 relative overflow-hidden text-xs sm:text-sm md:text-base text-center inline-flex items-center justify-center"
                >
                  <span className="relative flex items-center">
                    <span className="group-hover:mr-1 sm:group-hover:mr-2 transition-all duration-300">
                      Sign In
                    </span>
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5 sm:ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                </Link>
              </>
            ) : (
              <Link
                href={
                  user?.role === "creator" ? "/dashboard/creator" : "/dashboard"
                }
                className="group w-full sm:w-auto max-w-xs sm:max-w-sm md:max-w-md px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 border-2 border-orange-400/50 hover:border-orange-400 text-gray-200 hover:text-white font-semibold rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 backdrop-blur-md bg-gradient-to-r from-black/30 to-orange-900/30 hover:from-orange-500/20 hover:to-orange-600/20 relative overflow-hidden text-xs sm:text-sm md:text-base text-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-400/10 to-orange-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative">Go to Dashboard</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
