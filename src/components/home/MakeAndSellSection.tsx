"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/ui/GradientText";
import Image from "next/image";

export function MakeAndSellSection() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <section className="relative py-[35px] px-4 sm:py-[35px] sm:px-6 md:py-24 lg:px-8 bg-black overflow-hidden border-y border-white/10">
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Centered Title */}
        <h2
              className="flex justify-center
  text-center
  !text-[34px]
  font-bold
  leading-[1.08]
  tracking-[-0.04em]

  sm:!text-[52px]

  md:!text-[58px]
  md:leading-[1.05]

  lg:!text-[65px]
  lg:text-left
"
              style={{
                background: "linear-gradient(180deg, #FFFFFF 0%, #B94D13 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Make & Sell Custom Products
              
            </h2>

        {/* Description above image */}
        <div className="text-center mb-6 max-w-2xl mx-auto">
          <GradientText className="text-lg sm:text-xl leading-relaxed font-medium">
            There are no monthly contracts and no upfront costs. You set your
            prices and choose your margins.
          </GradientText>
        </div>

        {/* Center Product Image with Floating Badges */}
        <div className="flex flex-col items-center relative mb-16">
          {/* Floating Badges Container */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Left Middle Badge - Fast Shipping (Yellow) */}
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-3 sm:translate-x-12 pointer-events-auto z-10">
              <div className="bg-[#FFF085] rounded-sm px-1 py-0.5 sm:px-4 sm:py-2 shadow text-center text-xs sm:text-base font-bold text-black">
                <p className="whitespace-nowrap leading-none">Fast Shipping</p>
              </div>
            </div>

            {/* Right Top Badge - Premium Quality (Pink) */}
            <div className="absolute right-0 top-1/3 transform translate-x-3 sm:-translate-x-12 pointer-events-auto z-10">
              <div className="bg-pink-300 rounded-sm px-1 py-0.5 sm:px-4 sm:py-2 shadow text-center text-xs sm:text-base font-bold text-black">
                <p className="whitespace-nowrap leading-none">Premium Quality</p>
              </div>
            </div>

            {/* Right Bottom Badge - No Minimums (Green) */}
            <div className="absolute right-0 bottom-1/4 transform translate-x-3 sm:-translate-x-12 pointer-events-auto z-10">
              <div className="bg-green-300 rounded-sm px-1 py-0.5 sm:px-4 sm:py-2 shadow text-center text-xs sm:text-base font-bold text-black">
                <p className="whitespace-nowrap leading-none">No Minimums</p>
              </div>
            </div>
          </div>

          {/* Product Image */}
          <div className="relative w-full max-w-64 sm:max-w-xs md:max-w-sm lg:max-w-md">
            <Image src="/t-shirt-animation.gif" alt="Custom Products" width={500} height={500} className="w-full h-auto" />
          </div>
        </div>

        {/* Buttons - Centered Below */}
        <div className="flex flex-row gap-3 sm:gap-6 md:gap-8 justify-center items-center">
          <Button variant="primary" href="/dashboard/creator/catalog">
            Start Now
          </Button>
          <Button variant="secondary" href="/products">
            Browse All
          </Button>
        </div>
      </div>
    </section>
  );
}
