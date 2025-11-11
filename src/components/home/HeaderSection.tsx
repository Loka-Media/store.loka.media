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
    <section className="relative overflow-hidden">
      {/* Main Hero with Gradient Background */}
      <div className="relative bg-gradient-to-br from-yellow-300 via-pink-200 to-yellow-100 py-20 md:py-32 lg:py-40 px-4 md:px-6 lg:px-8">
        {/* Decorative Elements - Neubrutalism style */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-black rounded-3xl opacity-10 rotate-12 hidden lg:block"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-pink-500 rounded-full opacity-20 hidden lg:block"></div>
        <div className="absolute top-1/2 right-10 w-24 h-24 bg-yellow-400 rounded-2xl opacity-30 rotate-45 hidden md:block"></div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Heading - Gumroad neubrutalism style: huge, bold, colorful */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold mb-6 md:mb-8 text-black leading-[0.95] tracking-tight drop-shadow-lg">
            Turn Your Following Into Income
          </h1>

          {/* Subheading with background highlight */}
          <div className="inline-block bg-white/80 backdrop-blur-sm px-6 py-4 rounded-2xl border-2 border-black mb-10 md:mb-12">
            <p className="text-xl sm:text-2xl md:text-3xl text-black max-w-3xl font-semibold leading-tight tracking-tight">
              Your creator journey deserves premium marketing support and maximum monetization earnings on and across all social platforms.
            </p>
          </div>

          {/* CTA Buttons - Neubrutalism style with bold shadows */}
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
              <Link
                href="/auth/register"
                className="bg-black hover:bg-gray-900 text-white px-12 py-5 rounded-xl text-xl font-extrabold transition-all border-2 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] w-full sm:w-auto text-center"
              >
                Start selling
              </Link>
              <Link
                href="/products"
                className="bg-white hover:bg-gray-50 text-black px-12 py-5 rounded-xl text-xl font-extrabold transition-all border-2 border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] w-full sm:w-auto text-center"
              >
                Explore marketplace →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section - Colorful Cards with Neubrutalism */}
      <div className="bg-white py-16 md:py-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {/* Stat Card 1 - Yellow */}
            <div className="relative bg-yellow-300 p-8 md:p-10 rounded-3xl border-2 border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-black mb-3 tracking-tight">$2M+</div>
              <div className="text-lg md:text-xl text-black font-bold">Paid to creators</div>
            </div>

            {/* Stat Card 2 - Pink */}
            <div className="relative bg-pink-400 p-8 md:p-10 rounded-3xl border-2 border-black hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-black mb-3 tracking-tight">10K+</div>
              <div className="text-lg md:text-xl text-black font-bold">Active creators</div>
            </div>

            {/* Stat Card 3 - Black */}
            <div className="relative bg-black p-8 md:p-10 rounded-3xl border-2 border-black hover:shadow-[12px_12px_0px_0px_rgba(255,105,180,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
              <div className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-yellow-300 mb-3 tracking-tight">90%</div>
              <div className="text-lg md:text-xl text-white font-bold">You keep</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
