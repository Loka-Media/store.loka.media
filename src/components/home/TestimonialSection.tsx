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
            Real stories from creators who've built successful businesses with
            our platform
          </p>
        </div>

        {/* Modern testimonial card */}
        <div className="max-w-4xl mx-auto">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            className="testimonial-card relative backdrop-blur-2xl bg-white/[0.06] border border-white/[0.12] rounded-[28px] p-6 sm:p-8 md:p-10 lg:p-12 shadow-2xl shadow-black/20 overflow-hidden group"
          >
            {/* Avatar as background */}
            <div
              className="absolute inset-0 bg-cover bg-right opacity-30"
              style={{
                backgroundImage: `url(${testimonials[currentTestimonial].avatar})`,
              }}
            ></div>
            {/* Gradient overlay to blend */}
            <div className="absolute inset-0 bg-gradient-to-l from-gray-950 via-gray-950/80 to-transparent"></div>

            {/* Quote icon */}
            <div className="relative z-10 mb-6 sm:mb-8">
              <Quote className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400/60" />
            </div>

            {/* Testimonial content */}
            <div className="relative z-10">
              <blockquote className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium leading-relaxed mb-6 sm:mb-8 text-white">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>

              {/* Author info */}
              <div className="text-center">
                {testimonials[currentTestimonial].avatar && (
                  <img
                    src={testimonials[currentTestimonial].avatar}
                    alt={testimonials[currentTestimonial].author}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white/20 mx-auto mb-4"
                  />
                )}
                <div className="font-semibold text-base sm:text-lg text-white">
                  {testimonials[currentTestimonial].author}
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
        .testimonial-card::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(
            circle at var(--x) var(--y),
            rgba(255, 255, 255, 0.1),
            transparent 20%
          );
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }

        .testimonial-card:hover::before {
          opacity: 1;
        }

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
