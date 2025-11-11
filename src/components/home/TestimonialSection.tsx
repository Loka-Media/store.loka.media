"use client";

import { useState, useEffect, useRef } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

export function TestimonialSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      cardRef.current.style.setProperty("--x", `${x}px`);
      cardRef.current.style.setProperty("--y", `${y}px`);
    }
  };

  const testimonials = [
    {
      quote: "Loka is a gamechanger! LFG 🔥",
      author: "Joty Kay",
      avatar:
        "https://live.staticflickr.com/65535/52955514230_8e34ee16c7_z.jpg",
    },
    {
      quote: "Monetization Made Easy 💰",
      author: "Rupan Bal",
      avatar:
        "https://thepersonage.com/wp-content/uploads/2020/07/Rupan-Bal-Images.jpg",
    },
    {
      quote: "The platform for ALL platforms. Love it! ❤️",
      author: "Sejal Puri",
      avatar:
        "https://i0.wp.com/tellyflight.com/wp-content/uploads/2023/07/345687233_702675861629777_76830047465931681_n.jpg",
    },
  ];

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, testimonials.length]);

  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonial(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length
    );
  };

  return (
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-32 bg-gradient-to-br from-pink-100 via-yellow-50 to-pink-100 overflow-hidden border-y border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-24">
          <div className="inline-block mb-6 sm:mb-8">
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-black px-4 py-2 rounded-full border border-black bg-yellow-200">
              Testimonials
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-black mb-4 sm:mb-6 leading-tight tracking-tight">
            Loved by Creators
            <br />
            <span className="font-normal">
              Worldwide
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-black max-w-2xl mx-auto leading-relaxed mt-6 sm:mt-8 font-medium">
            Join thousands of creators who are earning and growing their audience with Loka
          </p>
        </div>

        {/* Testimonial card */}
        <div className="max-w-5xl mx-auto px-0 sm:px-4">
          <div
            className="relative bg-white border border-black rounded-2xl p-8 sm:p-10 md:p-14 lg:p-16 shadow-lg overflow-hidden transition-all duration-300 hover:shadow-[12px_12px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
          >
            {/* Quote icon */}
            <div className="relative z-10 mb-8 sm:mb-10">
              <div className="inline-block p-3 sm:p-4 bg-pink-200 border border-black rounded-xl">
                <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-black" />
              </div>
            </div>

            {/* Testimonial content */}
            <div className="relative z-10">
              <blockquote className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-relaxed mb-8 sm:mb-10 text-black tracking-tight">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex items-center gap-4 sm:gap-5">
                {testimonials[currentTestimonial].avatar && (
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].author}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-black shadow-md border border-black"
                  />
                )}
                <div>
                  <div className="font-extrabold text-lg sm:text-xl text-black">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-sm text-black font-bold">
                    Creator on Loka
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 sm:mt-12 relative z-10 pt-6 sm:pt-8 border-t border-black">
              {/* Testimonial indicators */}
              <div className="flex space-x-2 sm:space-x-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentTestimonial(index);
                    }}
                    className={`rounded-full transition-all duration-300 border border-black ${
                      index === currentTestimonial
                        ? "w-8 h-3 sm:w-10 sm:h-3 bg-black"
                        : "w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white hover:bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              <div className="flex space-x-3 sm:space-x-4">
                <button
                  onClick={prevTestimonial}
                  className="w-11 h-11 sm:w-13 sm:h-13 bg-white hover:bg-gray-50 border border-black rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-black" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-11 h-11 sm:w-13 sm:h-13 bg-black hover:bg-gray-900 border border-black rounded-full flex items-center justify-center transition-all duration-300 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
