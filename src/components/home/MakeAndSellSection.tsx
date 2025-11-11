"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MakeAndSellSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden border-y border-black">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-black">
              <span className="text-black">
                Make & Sell
              </span>{" "}
              Custom Products
            </h2>

            <p className="text-xl text-black leading-relaxed border-l-4 border-l-black pl-4 font-medium bg-yellow-100 p-4 rounded-r-xl">
              There are no monthly contracts and no upfront costs. You set your
              prices and choose your margins.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button className="bg-black hover:bg-gray-900 text-white rounded-xl py-4 px-12 font-extrabold text-lg transition-all duration-300 w-full sm:w-auto border border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                Start Now
              </button>
              <button className="bg-white hover:bg-gray-50 text-black rounded-xl border border-black hover:border-black py-4 px-12 font-extrabold text-lg transition-all duration-300 w-full sm:w-auto hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                Browse All
              </button>
            </div>

            <p className="text-sm text-black pt-4 font-bold">
              <span className="bg-pink-200 px-2 py-1 rounded">Premium quality.</span> <span className="bg-yellow-200 px-2 py-1 rounded">Fast
              shipping.</span> <span className="bg-green-200 px-2 py-1 rounded">No minimums.</span>
            </p>
          </div>

          {/* Right Video */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-lg border border-black hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
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
