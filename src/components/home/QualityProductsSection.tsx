"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCards, Autoplay } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-cards';



export function QualityProductsSection() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "create"
  );
  const images = ["/images/1.jpeg", "/images/2.jpeg", "/images/3.jpeg", "/images/4.jpeg", "/images/5.jpeg"];

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <section
      className="relative bg-black py-8 sm:py-12 md:py-16 lg:py-24 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12 md:space-y-16">
        {/* Top - Heading */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-4xl">
            <h2
              className="
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
              Quality Products
              <br />
              <span
                className="
    block
    md:text-center
    lg:text-end
  "
              >
                without the Headache
              </span>
            </h2>
          </div>
        </div>

        {/* Bottom - Content Grid */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 sm:gap-8 md:gap-10 lg:gap-0">
          {/* Left side - Scrolling Images */}
          <div className="relative w-full lg:w-[33%]">
            <Swiper
              effect={'cards'}
              grabCursor={true}
              modules={[EffectCards, Autoplay]}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              className="w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] mx-auto"
            >
              {images.map((image, index) => (
                <SwiperSlide key={index} className="rounded-2xl overflow-hidden border border-white/20">
                  <img
                    src={image}
                    alt={`Product showcase ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* Right side - Content */}
          <div className="w-full lg:w-[60%] space-y-2 sm:space-y-3">
            {/* Create beautiful products */}
            <div className="group relative bg-white/10 border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <button
                onClick={() => toggleSection("create")}
                className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
              >
                <span className="text-lg sm:text-lg md:text-lg font-extrabold text-white transition-all duration-300" style={{color:"#EB1DEF"}}>
                  Create beautiful products
                </span>
                <div className="relative">
                  <div className="relative transform transition-all duration-300 ease-out">
                    {expandedSection === "create" ? (
                      <Minus className="w-5 h-5 text-white transition-colors duration-200" />
                    ) : (
                      <Plus className="w-5 h-5 text-white transition-colors duration-200" />
                    )}
                  </div>
                </div>
              </button>

              <div
                className={`relative overflow-hidden transition-all duration-500 ease-out ${expandedSection === "create"
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
                  }`}
              >
                <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                  <p className="text-white/90 text-base sm:text-lg leading-relaxed mb-4 sm:mb-5 font-medium">
                    From apparel to makeup to your own product lines, we've teamed up with top brands and manufacturers to bring your ideas to life. No minimums required.
                  </p>
                  <Button variant="primary" href="/dashboard/creator/catalog">
                    Create your first product
                  </Button>
                </div>
              </div>
            </div>

            {/* Launch your own shop */}
            <div className="group relative bg-white/10 border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <button
                onClick={() => toggleSection("shop")}
                className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
              >
                <span className="text-lg sm:text-lg md:text-lg font-extrabold text-white transition-all duration-300"  style={{color:"#FFF085"}}>
                  Launch your own shop
                </span>
                <div className="relative">
                  <div className="relative transform transition-all duration-300 ease-out">
                    {expandedSection === "shop" ? (
                      <Minus className="w-5 h-5 text-white transition-colors duration-200" />
                    ) : (
                      <Plus className="w-5 h-5 text-white transition-colors duration-200" />
                    )}
                  </div>
                </div>
              </button>

              <div
                className={`relative overflow-hidden transition-all duration-500 ease-out ${expandedSection === "shop"
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
                  }`}
              >
                <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                  <p className="text-white/90 text-base sm:text-lg leading-relaxed font-medium">
                    Set up your free custom shop and start selling your products with our easy-to-use platform across all social platforms. Full customization available. Ask us about your own fully branded website.
                  </p>
                </div>
              </div>
            </div>

            {/* We handle shipping & support */}
            <div className="group relative bg-white/10 border border-white/20 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-[6px_6px_0_0_rgba(255,255,255,0.1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
              <button
                onClick={() => toggleSection("shipping")}
                className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
              >
                <span className="text-lg sm:text-lg md:text-lg font-extrabold text-white transition-all duration-300"  style={{color:"#29FB8A"}}>
                  We handle shipping & support
                </span>
                <div className="relative">
                  <div className="relative transform transition-all duration-300 ease-out">
                    {expandedSection === "shipping" ? (
                      <Minus className="w-5 h-5 text-white transition-colors duration-200" />
                    ) : (
                      <Plus className="w-5 h-5 text-white transition-colors duration-200" />
                    )}
                  </div>
                </div>
              </button>

              <div
                className={`relative overflow-hidden transition-all duration-500 ease-out ${expandedSection === "shipping"
                  ? "max-h-96 opacity-100"
                  : "max-h-0 opacity-0"
                  }`}
              >
                <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                  <p className="text-white/90 text-base sm:text-lg leading-relaxed font-medium">
                    Join trendsetting creators already earning across all socials with our platform.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
