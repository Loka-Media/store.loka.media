"use client";

import { useState, useEffect } from "react";

export function TestimonialSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      quote: "Loka is a gamechanger! LFG 🔥",
      author: "Joty Kay",
      role: "Creator Partner",
      avatar: "https://live.staticflickr.com/65535/52955514230_8e34ee16c7_z.jpg",
    },
    {
      quote: "6.5x ROI on merchandise influencer campaign.",
      author: "Rupan Bal",
      role: "Co-Founder",
      avatar: "https://thepersonage.com/wp-content/uploads/2020/07/Rupan-Bal-Images.jpg",
    },
    {
      quote: "The platform for ALL platforms. Love it! ❤️",
      author: "Sejal Puri",
      role: "Creator Partner",
      avatar: "https://i0.wp.com/tellyflight.com/wp-content/uploads/2023/07/345687233_702675861629777_76830047465931681_n.jpg",
    },

  ];

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const getCardIndex = (offset: number) => {
    return (currentIndex + offset + testimonials.length) % testimonials.length;
  };

  return (
    <section className="relative py-16 sm:py-20 md:py-32 bg-black overflow-hidden border-y border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header with navigation buttons */}
        <div className="flex items-start justify-between mb-16 sm:mb-20 gap-6">
          {/* SVG Title */}
          <div className="w-full max-w-3xl flex-1">
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

  lg:!text-[50px]
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
              Real Results From Real Creators

            </h2>
          </div>

          {/* Navigation arrows - Top right (desktop only) */}
          <div className="hidden md:flex gap-3 sm:gap-4 flex-shrink-0">
            <button
              onClick={prevTestimonial}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 hover:opacity-80"
            >
              <svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask0_1248_269" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="62" height="62">
                  <rect x="62" y="2.71011e-06" width="61.9999" height="62" transform="rotate(90 62 2.71011e-06)" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_1248_269)">
                  <path d="M25.3961 30.245C25.1709 30.4581 25.0583 30.7067 25.0583 30.9909C25.0583 31.2751 25.1709 31.5298 25.3961 31.7549L30.805 37.1644C31.127 37.486 31.505 37.5635 31.939 37.3969C32.373 37.2299 32.59 36.9125 32.59 36.445L32.59 25.5317C32.59 25.077 32.373 24.7668 31.939 24.601C31.505 24.4357 31.127 24.5139 30.805 24.8355L25.3961 30.245ZM7.74999 31.0083C7.74999 27.7934 8.36009 24.7707 9.58028 21.9402C10.8005 19.1102 12.4564 16.6483 14.548 14.5545C16.6397 12.4607 19.0994 10.8033 21.9273 9.58223C24.7548 8.36074 27.7762 7.75 30.9916 7.75C34.2066 7.75 37.2293 8.3601 40.0597 9.58029C42.8898 10.8005 45.3517 12.4564 47.4455 14.548C49.5393 16.6397 51.1967 19.0994 52.4178 21.9273C53.6393 24.7548 54.25 27.7762 54.25 30.9916C54.25 34.2065 53.6399 37.2292 52.4197 40.0597C51.1995 42.8897 49.5436 45.3516 47.452 47.4454C45.3603 49.5392 42.9006 51.1966 40.0727 52.4177C37.2452 53.6392 34.2238 54.2499 31.0084 54.2499C27.7934 54.2499 24.7707 53.6398 21.9402 52.4196C19.1102 51.1994 16.6483 49.5435 14.5545 47.4519C12.4607 45.3602 10.8033 42.9005 9.58222 40.0726C8.36074 37.2451 7.74999 34.2237 7.74999 31.0083ZM10.3333 31C10.3333 36.7694 12.3354 41.6562 16.3396 45.6603C20.3437 49.6645 25.2306 51.6666 31 51.6666C36.7694 51.6666 41.6562 49.6645 45.6604 45.6603C49.6646 41.6562 51.6667 36.7694 51.6667 31C51.6667 25.2305 49.6646 20.3437 45.6604 16.3396C41.6562 12.3354 36.7694 10.3333 31 10.3333C25.2306 10.3333 20.3437 12.3354 16.3396 16.3396C12.3354 20.3437 10.3333 25.2305 10.3333 31Z" fill="#FF6D1F"/>
                </g>
              </svg>
            </button>
            <button
              onClick={nextTestimonial}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 hover:opacity-80"
            >
              <svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <mask id="mask0_1248_272" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="62" height="62">
                  <rect y="62" width="61.9999" height="62" transform="rotate(-90 0 62)" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_1248_272)">
                  <path d="M36.6039 31.755C36.8291 31.5419 36.9417 31.2933 36.9417 31.0091C36.9417 30.7249 36.8291 30.4702 36.6039 30.2451L31.195 24.8356C30.873 24.514 30.495 24.4365 30.061 24.6031C29.627 24.7701 29.41 25.0875 29.41 25.555L29.41 36.4683C29.41 36.923 29.627 37.2332 30.061 37.3989C30.495 37.5643 30.873 37.4861 31.195 37.1645L36.6039 31.755ZM54.25 30.9917C54.25 34.2066 53.6399 37.2293 52.4197 40.0598C51.1995 42.8898 49.5436 45.3517 47.452 47.4455C45.3603 49.5393 42.9006 51.1967 40.0727 52.4178C37.2452 53.6393 34.2238 54.25 31.0084 54.25C27.7934 54.25 24.7707 53.6399 21.9402 52.4197C19.1102 51.1995 16.6483 49.5436 14.5545 47.452C12.4607 45.3603 10.8033 42.9006 9.58223 40.0727C8.36074 37.2452 7.75 34.2238 7.75 31.0084C7.75 27.7935 8.3601 24.7708 9.58029 21.9403C10.8005 19.1103 12.4564 16.6484 14.548 14.5546C16.6397 12.4608 19.0994 10.8034 21.9273 9.58232C24.7548 8.36083 27.7762 7.75009 30.9916 7.75009C34.2066 7.75009 37.2293 8.36019 40.0597 9.58038C42.8898 10.8006 45.3517 12.4565 47.4455 14.5481C49.5393 16.6398 51.1967 19.0995 52.4178 21.9274C53.6393 24.7548 54.25 27.7763 54.25 30.9917Z" fill="#FF6D1F"/>
                </g>
              </svg>
            </button>
          </div>
        </div>

        {/* Testimonials carousel - 3 visible cards */}
        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-center">
            {/* Left card - Small */}
            <div className="hidden md:block md:col-span-3">
              <div className="gradient-border-white-top p-6 md:p-8 transition-all duration-300 hover:opacity-80 scale-85 origin-right">
                <div className="flex flex-col h-full">
                  {/* Avatar and Quote in row */}
                  <div className="flex gap-4 mb-4">
                    <img
                      src={testimonials[getCardIndex(-1)].avatar}
                      alt={testimonials[getCardIndex(-1)].author}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 flex-shrink-0"
                    />
                    <p style={{ fontFamily: 'var(--font-family-satoshi)' }} className="text-xs sm:text-sm text-white/90 leading-relaxed flex-grow">
                      "{testimonials[getCardIndex(-1)].quote}"
                    </p>
                  </div>

                  {/* Name and role below */}
                  <div className="flex flex-col ml-16">
                    <div className="text-xs font-bold text-white">
                      {testimonials[getCardIndex(-1)].author}
                    </div>
                    <p style={{ fontFamily: 'var(--font-family-satoshi)' }} className="text-xs text-white/70 font-medium">
                      {testimonials[getCardIndex(-1)].role}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Center card (main) - Large */}
            <div className="md:col-span-6">
              <div className="gradient-border-white-top p-6 md:p-8 scale-100 transition-transform duration-300">
                <div className="flex flex-col h-full">
                  {/* Avatar and Quote in row */}
                  <div className="flex gap-6 mb-8">
                    <img
                      src={testimonials[currentIndex].avatar}
                      alt={testimonials[currentIndex].author}
                      className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover ring-2 ring-white/30 flex-shrink-0"
                    />
                    <p style={{ fontFamily: 'var(--font-family-satoshi)' }} className="text-lg sm:text-xl text-white leading-relaxed flex-grow font-medium">
                      "{testimonials[currentIndex].quote}"
                    </p>
                  </div>

                  {/* Name and role below avatar */}
                  <div className="flex flex-col ml-0">
                    <h3 className="text-2xl sm:text-3xl font-bold text-white">
                      {testimonials[currentIndex].author}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-family-satoshi)' }} className="text-sm text-white/70 font-medium">
                      {testimonials[currentIndex].role}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right card - Small */}
            <div className="hidden md:block md:col-span-3">
              <div className="gradient-border-white-top p-6 md:p-8 transition-all duration-300 hover:opacity-80 scale-85 origin-left">
                <div className="flex flex-col h-full">
                  {/* Avatar and Quote in row */}
                  <div className="flex gap-4 mb-4">
                    <img
                      src={testimonials[getCardIndex(1)].avatar}
                      alt={testimonials[getCardIndex(1)].author}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white/20 flex-shrink-0"
                    />
                    <p className="text-xs sm:text-sm text-white/90 leading-relaxed flex-grow">
                      "{testimonials[getCardIndex(1)].quote}"
                    </p>
                  </div>

                  {/* Name and role below */}
                  <div className="flex flex-col ml-16">
                    <div className="text-xs font-bold text-white">
                      {testimonials[getCardIndex(1)].author}
                    </div>
                    <p className="text-xs text-white/70 font-medium">
                      {testimonials[getCardIndex(1)].role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile navigation and dots indicator */}
          <div className="flex flex-col items-center gap-6 mt-8 md:hidden">
            {/* Navigation arrows - Bottom (mobile only) */}
            <div className="flex gap-3 sm:gap-4">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 hover:opacity-80"
              >
                <svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <mask id="mask0_1248_269" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="62" height="62">
                    <rect x="62" y="2.71011e-06" width="61.9999" height="62" transform="rotate(90 62 2.71011e-06)" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_1248_269)">
                    <path d="M25.3961 30.245C25.1709 30.4581 25.0583 30.7067 25.0583 30.9909C25.0583 31.2751 25.1709 31.5298 25.3961 31.7549L30.805 37.1644C31.127 37.486 31.505 37.5635 31.939 37.3969C32.373 37.2299 32.59 36.9125 32.59 36.445L32.59 25.5317C32.59 25.077 32.373 24.7668 31.939 24.601C31.505 24.4357 31.127 24.5139 30.805 24.8355L25.3961 30.245ZM7.74999 31.0083C7.74999 27.7934 8.36009 24.7707 9.58028 21.9402C10.8005 19.1102 12.4564 16.6483 14.548 14.5545C16.6397 12.4607 19.0994 10.8033 21.9273 9.58223C24.7548 8.36074 27.7762 7.75 30.9916 7.75C34.2066 7.75 37.2293 8.3601 40.0597 9.58029C42.8898 10.8005 45.3517 12.4564 47.4455 14.548C49.5393 16.6397 51.1967 19.0994 52.4178 21.9273C53.6393 24.7548 54.25 27.7762 54.25 30.9916C54.25 34.2065 53.6399 37.2292 52.4197 40.0597C51.1995 42.8897 49.5436 45.3516 47.452 47.4454C45.3603 49.5392 42.9006 51.1966 40.0727 52.4177C37.2452 53.6392 34.2238 54.2499 31.0084 54.2499C27.7934 54.2499 24.7707 53.6398 21.9402 52.4196C19.1102 51.1994 16.6483 49.5435 14.5545 47.4519C12.4607 45.3602 10.8033 42.9005 9.58222 40.0726C8.36074 37.2451 7.74999 34.2237 7.74999 31.0083ZM10.3333 31C10.3333 36.7694 12.3354 41.6562 16.3396 45.6603C20.3437 49.6645 25.2306 51.6666 31 51.6666C36.7694 51.6666 41.6562 49.6645 45.6604 45.6603C49.6646 41.6562 51.6667 36.7694 51.6667 31C51.6667 25.2305 49.6646 20.3437 45.6604 16.3396C41.6562 12.3354 36.7694 10.3333 31 10.3333C25.2306 10.3333 20.3437 12.3354 16.3396 16.3396C12.3354 20.3437 10.3333 25.2305 10.3333 31Z" fill="#FF6D1F"/>
                  </g>
                </svg>
              </button>
              <button
                onClick={nextTestimonial}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center transition-all duration-300 hover:opacity-80"
              >
                <svg width="62" height="62" viewBox="0 0 62 62" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <mask id="mask0_1248_272" style={{ maskType: "alpha" }} maskUnits="userSpaceOnUse" x="0" y="0" width="62" height="62">
                    <rect y="62" width="61.9999" height="62" transform="rotate(-90 0 62)" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_1248_272)">
                    <path d="M36.6039 31.755C36.8291 31.5419 36.9417 31.2933 36.9417 31.0091C36.9417 30.7249 36.8291 30.4702 36.6039 30.2451L31.195 24.8356C30.873 24.514 30.495 24.4365 30.061 24.6031C29.627 24.7701 29.41 25.0875 29.41 25.555L29.41 36.4683C29.41 36.923 29.627 37.2332 30.061 37.3989C30.495 37.5643 30.873 37.4861 31.195 37.1645L36.6039 31.755ZM54.25 30.9917C54.25 34.2066 53.6399 37.2293 52.4197 40.0598C51.1995 42.8898 49.5436 45.3517 47.452 47.4455C45.3603 49.5393 42.9006 51.1967 40.0727 52.4178C37.2452 53.6393 34.2238 54.25 31.0084 54.25C27.7934 54.25 24.7707 53.6399 21.9402 52.4197C19.1102 51.1995 16.6483 49.5436 14.5545 47.452C12.4607 45.3603 10.8033 42.9006 9.58223 40.0727C8.36074 37.2452 7.75 34.2238 7.75 31.0084C7.75 27.7935 8.3601 24.7708 9.58029 21.9403C10.8005 19.1103 12.4564 16.6484 14.548 14.5546C16.6397 12.4608 19.0994 10.8034 21.9273 9.58232C24.7548 8.36083 27.7762 7.75009 30.9916 7.75009C34.2066 7.75009 37.2293 8.36019 40.0597 9.58038C42.8898 10.8006 45.3517 12.4565 47.4455 14.5481C49.5393 16.6398 51.1967 19.0995 52.4178 21.9274C53.6393 24.7548 54.25 27.7763 54.25 30.9917Z" fill="#FF6D1F"/>
                  </g>
                </svg>
              </button>
            </div>

            {/* Dots indicator */}
            <div className="flex justify-center gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setIsAutoPlaying(false);
                    setCurrentIndex(index);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? "w-8 bg-orange-600"
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
