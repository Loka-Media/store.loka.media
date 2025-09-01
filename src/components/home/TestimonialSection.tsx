"use client";

import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";

export function TestimonialSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const testimonials = [
    {
      quote:
        "Loka Media transformed my side hustle into a six-figure business. The quality is incredible and my customers love every product. I've never looked back!",
      author: "Maya Patel",
      title: "Content Creator & Entrepreneur",
      platform: "@mayacreates",
      revenue: "$180K",
      timeframe: "8 months",
      avatar:
        "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face",
      rating: 5,
    },
    {
      quote:
        "The print quality exceeded my expectations. My art looks stunning on their products and the shipping is lightning fast. My fans are obsessed!",
      author: "Jake Thompson",
      title: "Digital Artist",
      platform: "@jakeart",
      revenue: "$95K",
      timeframe: "4 months",
      avatar:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face",
      rating: 5,
    },
    {
      quote:
        "Finally, a platform that gets creators. No upfront costs, amazing margins, and they handle everything. I focus on content, they handle the business.",
      author: "Zoe Williams",
      title: "Lifestyle Influencer",
      platform: "@zoeliving",
      revenue: "$250K",
      timeframe: "1 year",
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      rating: 5,
    },
    {
      quote:
        "My merch sales went through the roof! The analytics dashboard helps me understand what my audience wants. This is the future of creator commerce.",
      author: "Marcus Johnson",
      title: "Gaming Content Creator",
      platform: "@marcusgames",
      revenue: "$320K",
      timeframe: "10 months",
      avatar:
        "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
      rating: 5,
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
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-950 overflow-hidden">
      {/* Subtle background elements */}
      <div className="absolute top-0 left-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-gradient-to-br from-blue-500/6 to-purple-500/4 rounded-full blur-3xl animate-blob opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-gradient-to-br from-orange-500/6 to-pink-500/4 rounded-full blur-3xl animate-blob animation-delay-1000 opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Creators Worldwide
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed font-light">
            Real stories from creators who've built successful businesses with our platform
          </p>
        </div>

        {/* Modern testimonial card */}
        <div className="max-w-4xl mx-auto">
          <div className="relative backdrop-blur-2xl bg-white/[0.06] border border-white/[0.12] rounded-[28px] p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl shadow-black/20 overflow-hidden group">
            
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-orange-500/[0.02] opacity-50"></div>
            
            {/* Quote icon */}
            <div className="relative z-10 mb-6 sm:mb-8">
              <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400/60" />
            </div>
            
            {/* Testimonial content */}
            <div className="relative z-10">
              <blockquote className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed mb-6 sm:mb-8 text-white">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>

              {/* Rating stars */}
              <div className="flex items-center justify-center sm:justify-start mb-6 sm:mb-8">
                {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400 fill-current" />
                ))}
              </div>

              {/* Author info and stats */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 sm:gap-8">
                <div className="flex items-center space-x-4 text-center sm:text-left">
                  <div className="relative">
                    <img
                      src={testimonials[currentTestimonial].avatar}
                      alt={testimonials[currentTestimonial].author}
                      className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full object-cover ring-2 ring-white/20"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full border-2 border-gray-950"></div>
                  </div>
                  <div>
                    <div className="font-semibold text-base sm:text-lg text-white">
                      {testimonials[currentTestimonial].author}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">
                      {testimonials[currentTestimonial].title}
                    </div>
                    <div className="text-xs sm:text-sm text-orange-400 font-medium">
                      {testimonials[currentTestimonial].platform}
                    </div>
                  </div>
                </div>
                
                {/* Success metrics */}
                <div className="flex gap-4 sm:gap-6">
                  <div className="text-center backdrop-blur-md bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-400">
                      {testimonials[currentTestimonial].revenue}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Revenue</div>
                  </div>
                  <div className="text-center backdrop-blur-md bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                    <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">
                      {testimonials[currentTestimonial].timeframe}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400">Timeframe</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 sm:mt-10 relative z-10">
              {/* Testimonial indicators */}
              <div className="flex space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentTestimonial(index);
                    }}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${
                      index === currentTestimonial 
                        ? "bg-orange-400 scale-125" 
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              <div className="flex space-x-2 sm:space-x-3">
                <button
                  onClick={prevTestimonial}
                  className="w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/[0.2] rounded-full flex items-center justify-center transition-all duration-300 group"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-10 h-10 sm:w-12 sm:h-12 backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/[0.2] rounded-full flex items-center justify-center transition-all duration-300 group"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-white transition-colors duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(20px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-15px, 15px) scale(0.95);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 8s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </section>
  );
}
