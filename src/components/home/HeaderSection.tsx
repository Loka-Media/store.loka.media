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
    <section className="relative py-24 md:py-40 px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto text-center">
        {/* Heading - Gumroad style: very large, bold, tight spacing */}
        <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-8 text-black leading-[0.9] tracking-tighter">
          Go from zero to $1
        </h1>

        {/* Subheading - Gumroad style: larger, more prominent */}
        <p className="text-2xl md:text-3xl lg:text-4xl text-foreground-muted mb-12 max-w-3xl mx-auto font-medium leading-snug tracking-tight">
          Loka Media helps creators earn a living. Start selling products in minutes and keep 90% of your earnings.
        </p>

        {/* CTA Buttons - Gumroad style: larger, bolder */}
        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5 mb-8">
            <Link
              href="/auth/register"
              className="bg-accent hover:bg-accent-hover text-white px-12 py-5 rounded-xl text-xl font-bold transition-all hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Start selling
            </Link>
            <Link
              href="/products"
              className="text-black hover:text-foreground-muted px-12 py-5 text-xl font-semibold transition-colors underline decoration-2 decoration-black/20 hover:decoration-black/40 underline-offset-4"
            >
              Explore marketplace
            </Link>
          </div>
        )}

        {/* Stats - Gumroad style: clean and minimal */}
        <div className="mt-24 pt-20 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-black mb-3 tracking-tight">$2M+</div>
              <div className="text-base md:text-lg text-foreground-muted font-medium">Paid to creators</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-black mb-3 tracking-tight">10K+</div>
              <div className="text-base md:text-lg text-foreground-muted font-medium">Active creators</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-black mb-3 tracking-tight">90%</div>
              <div className="text-base md:text-lg text-foreground-muted font-medium">You keep</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
