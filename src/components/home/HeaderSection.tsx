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
    <section className="relative py-20 md:py-32 lg:py-40 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto text-center">
        {/* Heading - Gumroad style: huge, bold, minimal letter-spacing */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-extrabold mb-6 md:mb-8 text-black leading-[0.95] tracking-tight">
          Turn Your Following Into Income
        </h1>

        {/* Subheading - Gumroad style: clean, readable */}
        <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground-muted mb-10 md:mb-12 max-w-4xl mx-auto font-normal leading-tight tracking-normal">
          Your creator journey deserves premium marketing support and maximum monetization earnings on and across all social platforms.
        </p>

        {/* CTA Buttons - Gumroad style: simple, clear */}
        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
            <Link
              href="/auth/register"
              className="bg-accent hover:bg-accent-hover text-white px-10 py-4 rounded-lg text-lg font-bold transition-colors w-full sm:w-auto text-center"
            >
              Start selling
            </Link>
            <Link
              href="/products"
              className="text-black hover:text-foreground-muted px-10 py-4 text-lg font-semibold transition-colors w-full sm:w-auto text-center"
            >
              Explore marketplace →
            </Link>
          </div>
        )}

        {/* Stats - Gumroad style: clean and minimal */}
        <div className="mt-20 md:mt-32 pt-16 md:pt-20 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black mb-2 tracking-tight">$2M+</div>
              <div className="text-base md:text-lg text-foreground-muted font-normal">Paid to creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black mb-2 tracking-tight">10K+</div>
              <div className="text-base md:text-lg text-foreground-muted font-normal">Active creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-black mb-2 tracking-tight">90%</div>
              <div className="text-base md:text-lg text-foreground-muted font-normal">You keep</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
