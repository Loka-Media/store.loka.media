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
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-32 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-24">
          <div className="inline-block mb-6 sm:mb-8">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-accent px-4 py-2 rounded-full border border-accent/30 bg-white">
              Testimonials
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight tracking-tight">
            Loved by Creators
            <br />
            <span className="text-accent">
              Worldwide
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mt-6 sm:mt-8">
            Join thousands of creators who are earning and growing their audience with Loka
          </p>
        </div>

        {/* Testimonial card */}
        <div className="max-w-5xl mx-auto px-0 sm:px-4">
          <div
            className="relative bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 md:p-14 lg:p-16 shadow-lg overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-xl"
          >
            {/* Quote icon */}
            <div className="relative z-10 mb-8 sm:mb-10">
              <div className="inline-block p-3 sm:p-4 bg-accent/10 border border-accent/30 rounded-xl">
                <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-accent" />
              </div>
            </div>

            {/* Testimonial content */}
            <div className="relative z-10">
              <blockquote className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed mb-8 sm:mb-10 text-gray-900 tracking-tight">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>

              {/* Author info */}
              <div className="flex items-center gap-4 sm:gap-5">
                {testimonials[currentTestimonial].avatar && (
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].author}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-gray-200 shadow-md"
                  />
                )}
                <div>
                  <div className="font-bold text-lg sm:text-xl text-gray-900">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-sm text-accent font-semibold">
                    Creator on Loka
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 sm:mt-12 relative z-10 pt-6 sm:pt-8 border-t border-gray-200">
              {/* Testimonial indicators */}
              <div className="flex space-x-2 sm:space-x-3">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentTestimonial(index);
                    }}
                    className={`rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? "w-8 h-3 sm:w-10 sm:h-3 bg-accent"
                        : "w-2.5 h-2.5 sm:w-3 sm:h-3 bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              <div className="flex space-x-3 sm:space-x-4">
                <button
                  onClick={prevTestimonial}
                  className="w-11 h-11 sm:w-13 sm:h-13 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-full flex items-center justify-center transition-all duration-300"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-11 h-11 sm:w-13 sm:h-13 bg-accent hover:bg-accent/90 border border-accent rounded-full flex items-center justify-center transition-all duration-300"
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
