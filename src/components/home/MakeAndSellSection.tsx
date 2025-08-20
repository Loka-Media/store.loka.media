"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MakeAndSellSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 from-gray-900 text-white overflow-hidden">
      {/* Dynamic Background Grids and Particles */}
      <div className="absolute inset-0 z-0 opacity-5">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-transparent to-transparent"></div>
        <div className="absolute inset-0 [mask-image:radial-gradient(white,transparent)]">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <pattern
              id="grid-pattern"
              x="0"
              y="0"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 L 0 10"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.2"
              ></path>
            </pattern>
            <rect
              width="100%"
              height="100%"
              fill="url(#grid-pattern)"
              className="text-gray-700 animate-grid"
            ></rect>
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-xl">
              <span className="relative z-10 before:content-[''] before:absolute before:-bottom-1 before:left-0 before:w-full before:h-2 before:bg-gradient-to-r before:from-purple-500 before:to-blue-500 before:transition-all before:duration-500 hover:before:h-3 hover:before:blur-md">
                Make & Sell
              </span>{" "}
              Custom Products
            </h2>

            <p className="text-xl text-gray-400 leading-relaxed font-light border-l-4 border-l-purple-500 pl-4">
              There are no monthly contracts and no upfront costs. You set your
              prices and choose your margins.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button className="group relative w-full sm:w-auto overflow-hidden rounded-full py-4 px-12 text-black font-semibold text-lg transition-transform duration-300 hover:scale-105">
                <span className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 transition-transform duration-500 ease-out transform -translate-x-full group-hover:translate-x-0"></span>
                <span className="relative z-10 text-white group-hover:text-black transition-colors duration-300">
                  Start Now
                </span>
              </button>
              <button className="group relative w-full sm:w-auto overflow-hidden rounded-full border-2 border-gray-700 py-4 px-12 text-gray-400 font-semibold text-lg transition-transform duration-300 hover:scale-105 hover:border-white">
                <span className="relative z-10">Browse All</span>
              </button>
            </div>

            <p className="text-sm text-gray-500 pt-4">
              <strong className="text-white">Premium quality.</strong> Fast
              shipping. No minimums.
            </p>
          </div>

          {/* Right Video with a Holographic Frame */}
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:shadow-[0_0_80px_rgba(128,0,255,0.2)]">
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
