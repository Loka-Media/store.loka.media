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
          Turn your passion into profit
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Design, sell, and deliver custom products with print-on-demand. No inventory, no upfront costs.
        </p>

        {/* CTA Buttons */}
        {!isAuthenticated && (
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link
              href="/auth/register"
              className="bg-accent hover:bg-accent/90 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors"
            >
              Start selling
            </Link>
            <Link
              href="/products"
              className="text-gray-700 hover:text-gray-900 px-8 py-4 text-lg font-medium transition-colors"
            >
              Explore marketplace
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
