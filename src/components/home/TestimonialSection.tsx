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
    <section className="relative py-12 sm:py-16 md:py-20 lg:py-32 bg-gradient-to-b from-gray-950 via-gray-950 to-black overflow-hidden">
      {/* Enhanced background with gradient glow */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-72 sm:w-96 md:w-[500px] h-72 sm:h-96 md:h-[500px] bg-gradient-to-br from-orange-500/15 to-pink-500/10 rounded-full blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-72 sm:w-96 md:w-[500px] h-72 sm:h-96 md:h-[500px] bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/3 right-0 w-96 h-96 bg-gradient-to-l from-orange-500/8 to-transparent rounded-full blur-3xl opacity-30"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section header - Enhanced */}
        <div className="text-center mb-12 sm:mb-16 md:mb-24">
          <div className="inline-block mb-6 sm:mb-8">
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-400 px-4 py-2 rounded-full border border-orange-400/30 backdrop-blur-sm">
              ⭐ Testimonials
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-white via-orange-200 to-pink-200 bg-clip-text text-transparent">
              Loved by Creators
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
              Worldwide
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed font-light mt-6 sm:mt-8">
            Join thousands of creators who are earning and growing their audience with Loka
          </p>
        </div>

        {/* Modern testimonial card */}
        <div className="max-w-5xl mx-auto px-0 sm:px-4">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className="testimonial-card relative backdrop-blur-3xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] border border-white/[0.2] rounded-3xl p-8 sm:p-10 md:p-14 lg:p-16 shadow-2xl shadow-orange-500/10 overflow-hidden group transition-all duration-500 hover:border-white/[0.3] hover:shadow-orange-500/20"
          >
            {/* Animated gradient border glow */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/20 via-transparent to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Avatar as background - Enhanced */}
            <div
              className="absolute inset-0 bg-cover bg-right opacity-25 group-hover:opacity-35 transition-opacity duration-500"
              style={{
                backgroundImage: `url(${testimonials[currentTestimonial].avatar})`,
              }}
            ></div>
            {/* Premium gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/60 to-transparent"></div>

            {/* Quote icon - Enhanced */}
            <div className="relative z-10 mb-8 sm:mb-10">
              <div className="inline-block p-3 sm:p-4 bg-gradient-to-br from-orange-500/20 to-pink-500/10 border border-orange-400/30 rounded-2xl">
                <Quote className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
              </div>
            </div>

            {/* Testimonial content */}
            <div className="relative z-10">
              <blockquote className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-relaxed mb-8 sm:mb-10 text-white tracking-tight">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>

              {/* Author info - Enhanced */}
              <div className="flex items-center gap-4 sm:gap-5">
                {testimonials[currentTestimonial].avatar && (
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].author}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-3 ring-gradient-to-r ring-orange-400/50 shadow-lg"
                  />
                )}
                <div>
                  <div className="font-bold text-lg sm:text-xl text-white">
                    {testimonials[currentTestimonial].author}
                  </div>
                  <div className="text-sm text-orange-400 font-semibold">
                    Creator on Loka
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-10 sm:mt-12 relative z-10 pt-6 sm:pt-8 border-t border-white/[0.1]">
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
                        ? "w-8 h-3 sm:w-10 sm:h-3 bg-gradient-to-r from-orange-400 to-pink-400"
                        : "w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white/30 hover:bg-white/60"
                    }`}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              <div className="flex space-x-3 sm:space-x-4">
                <button
                  onClick={prevTestimonial}
                  className="w-11 h-11 sm:w-13 sm:h-13 backdrop-blur-md bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] hover:border-orange-400/50 rounded-full flex items-center justify-center transition-all duration-300 group/btn hover:shadow-lg hover:shadow-orange-500/20"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-hover/btn:text-orange-400 transition-colors duration-300" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-11 h-11 sm:w-13 sm:h-13 backdrop-blur-md bg-gradient-to-r from-orange-500/20 to-pink-500/20 hover:from-orange-500/40 hover:to-pink-500/40 border border-orange-400/40 hover:border-orange-400/70 rounded-full flex items-center justify-center transition-all duration-300 group/btn hover:shadow-lg hover:shadow-orange-500/30"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-orange-300 group-hover/btn:text-orange-200 transition-colors duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .testimonial-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at var(--x) var(--y),
            rgba(251, 146, 60, 0.15),
            transparent 30%
          );
          opacity: 0;
          transition: opacity 0.4s ease-in-out;
          pointer-events: none;
          border-radius: 24px;
        }

        .testimonial-card:hover::before {
          opacity: 1;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.6;
          }
        }

        .testimonial-card {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
