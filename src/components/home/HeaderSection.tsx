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
    <section className="relative py-20 md:py-32 px-4 md:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 leading-tight">
          Go from zero to $1
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Loka Media helps creators earn a living. Start selling products in minutes and keep 90% of your earnings.
        </p>

        {/* CTA Buttons */}
        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/auth/register"
              className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              Start selling
            </Link>
            <Link
              href="/products"
              className="text-gray-700 hover:text-gray-900 px-8 py-4 text-lg font-medium transition-colors underline decoration-gray-300 hover:decoration-gray-900"
            >
              Explore marketplace
            </Link>
          </div>
        )}

        {/* Stats - Gumroad style social proof */}
        <div className="mt-16 pt-16 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">$2M+</div>
              <div className="text-sm text-gray-600">Paid to creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">10K+</div>
              <div className="text-sm text-gray-600">Active creators</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 mb-2">90%</div>
              <div className="text-sm text-gray-600">You keep</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
