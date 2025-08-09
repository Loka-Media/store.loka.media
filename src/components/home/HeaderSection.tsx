// components/home/HeroSection.tsx
"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Star, Shield, Zap } from "lucide-react";
import Ballpit from './Ballpit';

interface HeroSectionProps {
  isAuthenticated: boolean;
  user?: { role: string } | null;
}

export function HeroSection({ isAuthenticated, user }: HeroSectionProps) {
  return (
    <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden min-h-screen flex items-center mt-9">
      {/* Video Background */}
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%'}}>
          <Ballpit
            count={200}
            gravity={0.02}
            friction={.95}
            wallBounce={0.95}
            followCursor={true}
          />
        </div>
        {/* Gradient overlay with better blending */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-orange-900/40"></div>

      {/* Floating geometric shapes */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-orange-300/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gradient-to-br from-orange-400/15 to-orange-600/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gradient-to-br from-orange-300/25 to-orange-500/15 rounded-full blur-lg animate-pulse delay-500"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <div className="text-center">
          {/* Animated Badge */}
          <div className="inline-flex items-center px-6 py-2 mb-8 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-300/20 backdrop-blur-sm border border-orange-500/30 text-orange-200 text-sm font-medium animate-bounce">
            <Zap className="w-4 h-4 mr-2 text-orange-400" />
            <span>Now with AI-Powered Analytics</span>
          </div>

          {/* Main Brand with enhanced typography */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-8 tracking-tight leading-none">
            <span className="bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 bg-clip-text text-transparent animate-pulse">
              The Ultimate
            </span>
            <br />
            <span className="bg-gradient-to-r from-white via-gray-100 to-orange-100 bg-clip-text text-transparent">
              Marketplace Platform
            </span>
          </h1>

          {/* Enhanced Value Proposition */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-200 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Connect creators with customers. Build, scale, and monetize your
            <span className="text-orange-300 font-medium">
              {" "}
              digital ecosystem
            </span>{" "}
            with
            <span className="text-orange-300 font-medium">
              {" "}
              next-generation tools
            </span>
            .
          </p>

          <div className="mb-12 relative">
            <Link
              href="/products"
              className="relative inline-flex items-center px-12 py-5 sm:px-16 sm:py-6 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 hover:from-orange-600 hover:via-orange-700 hover:to-orange-600 text-white font-bold text-lg sm:text-xl rounded-full transition-all duration-500 transform hover:scale-110 hover:shadow-2xl hover:shadow-orange-500/50 focus:outline-none focus:ring-4 focus:ring-orange-500 focus:ring-opacity-50 group overflow-hidden"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <ShoppingBag className="mr-3 w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative">Explore Marketplace</span>
              <ArrowRight className="ml-3 w-6 h-6 sm:w-7 sm:h-7 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </div>

          {/* Enhanced Secondary Actions with glassmorphism */}
          <div className="flex flex-wrap justify-center gap-6 mb-16">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/auth/register"
                  className="group px-8 py-4 sm:px-10 sm:py-4 border-2 border-orange-400/50 hover:border-orange-400 text-gray-200 hover:text-white font-semibold rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 backdrop-blur-md bg-gradient-to-r from-black/30 to-orange-900/30 hover:from-orange-500/20 hover:to-orange-600/20 relative overflow-hidden"
                >
                  <span className="relative">Get Started Free</span>
                </Link>
                <Link
                  href="/auth/login"
                  className="group px-8 py-4 sm:px-10 sm:py-4 text-gray-300 hover:text-orange-300 font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 relative"
                >
                  <span className="group-hover:mr-2 transition-all duration-300">
                    Sign In
                  </span>
                  <ArrowRight className="inline w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
              </>
            ) : (
              <Link
                href={
                  user?.role === "creator" ? "/dashboard/creator" : "/dashboard"
                }
                className="group px-8 py-4 sm:px-10 sm:py-4 border-2 border-orange-400/50 hover:border-orange-400 text-gray-200 hover:text-white font-semibold rounded-full transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-opacity-50 backdrop-blur-md bg-gradient-to-r from-black/30 to-orange-900/30 hover:from-orange-500/20 hover:to-orange-600/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-400/10 to-orange-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <span className="relative">Go to Dashboard</span>
              </Link>
            )}
          </div>

          {/* Enhanced Trust Indicators with floating animation */}
          <div className="flex flex-wrap justify-center items-center gap-y-6 gap-x-12 text-gray-300 text-sm md:text-base">
            <div className="group flex items-center hover:text-orange-300 transition-all duration-300 cursor-default">
              <div className="relative">
                <Star className="w-5 h-5 text-orange-500 mr-3 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                <div className="absolute inset-0 w-5 h-5 bg-orange-500/30 rounded-full blur-sm group-hover:animate-ping"></div>
              </div>
              <span className="font-medium">Enterprise Ready</span>
            </div>
            <div className="group flex items-center hover:text-orange-300 transition-all duration-300 cursor-default">
              <div className="relative">
                <Shield className="w-5 h-5 text-orange-500 mr-3 group-hover:scale-110 transition-all duration-300" />
                <div className="absolute inset-0 w-5 h-5 bg-orange-500/30 rounded-full blur-sm group-hover:animate-ping"></div>
              </div>
              <span className="font-medium">Bank-Level Security</span>
            </div>
            <div className="group flex items-center hover:text-orange-300 transition-all duration-300 cursor-default">
              <div className="relative">
                <Zap className="w-5 h-5 text-orange-500 mr-3 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300" />
                <div className="absolute inset-0 w-5 h-5 bg-orange-500/30 rounded-full blur-sm group-hover:animate-ping"></div>
              </div>
              <span className="font-medium">Lightning Fast</span>
            </div>
          </div>

          {/* Floating stats cards */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-black/40 to-orange-900/20 backdrop-blur-md border border-orange-500/20 hover:border-orange-500/40 transition-all duration-500 hover:transform hover:scale-105">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                10K+
              </div>
              <div className="text-gray-300 text-sm">Active Creators</div>
            </div>
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-black/40 to-orange-900/20 backdrop-blur-md border border-orange-500/20 hover:border-orange-500/40 transition-all duration-500 hover:transform hover:scale-105">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                $2M+
              </div>
              <div className="text-gray-300 text-sm">Revenue Generated</div>
            </div>
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-black/40 to-orange-900/20 backdrop-blur-md border border-orange-500/20 hover:border-orange-500/40 transition-all duration-500 hover:transform hover:scale-105">
              <div className="text-3xl font-bold text-orange-400 mb-2">
                99.9%
              </div>
              <div className="text-gray-300 text-sm">Uptime Guarantee</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
