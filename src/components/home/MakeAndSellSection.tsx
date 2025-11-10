"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MakeAndSellSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-gray-900">
              <span className="text-accent">
                Make & Sell
              </span>{" "}
              Custom Products
            </h2>

            <p className="text-xl text-gray-600 leading-relaxed border-l-4 border-l-accent pl-4">
              There are no monthly contracts and no upfront costs. You set your
              prices and choose your margins.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button className="bg-accent hover:bg-accent/90 text-white rounded-xl py-4 px-12 font-semibold text-lg transition-all duration-300 w-full sm:w-auto">
                Start Now
              </button>
              <button className="bg-white hover:bg-gray-50 text-gray-900 rounded-xl border-2 border-gray-200 hover:border-gray-300 py-4 px-12 font-semibold text-lg transition-all duration-300 w-full sm:w-auto">
                Browse All
              </button>
            </div>

            <p className="text-sm text-gray-600 pt-4">
              <strong className="text-gray-900">Premium quality.</strong> Fast
              shipping. No minimums.
            </p>
          </div>

          {/* Right Video */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-gray-200">
              <video className="w-full h-auto" autoPlay muted loop playsInline>
                <source src="/images/v1.webm" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
