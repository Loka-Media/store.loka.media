"use client";

import { useState } from "react";

export function TestimonialSection() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  
  const testimonials = [
    {
      quote: "Thank you for making launching a shop so easy. I cannot stress enough how phenomenal this process has been, or how much time Loka Media has saved us. I am a huge fan.",
      author: "Shannon Maglera",
      title: "Head of VIP and Onboarding Operations",
      website: "shop.kalshi.com"
    },
    {
      quote: "The platform has revolutionized how we approach e-commerce. The customization options are endless and the support team is incredible.",
      author: "Alex Rodriguez",
      title: "Creative Director",
      website: "creativestore.com"
    },
    {
      quote: "From zero to hero in just a few clicks. This platform made our dream store a reality without any technical headaches.",
      author: "Sarah Chen",
      title: "Founder & CEO",
      website: "trendsetter.shop"
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="relative py-20 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-0 items-stretch min-h-[600px]">
          {/* Left side - Product showcase with mockup browser */}
          <div className="relative bg-gray-50 flex items-center justify-center p-8">
            {/* Browser mockup container */}
            <div className="w-full max-w-lg">
              {/* Browser header */}
              <div className="bg-white rounded-t-xl p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">kalshi.com</div>
                  <div className="w-16"></div>
                </div>
              </div>
              
              {/* Browser content */}
              <div className="bg-white rounded-b-xl p-8 relative">
                {/* Header with logo */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-green-400 text-black px-6 py-2 rounded-lg font-bold text-lg mb-4">
                    Kalshi
                  </div>
                  <div className="flex justify-center space-x-4 text-sm text-gray-600">
                    <span>Home</span>
                    <span>Browse all</span>
                  </div>
                </div>
                
                {/* Product grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Top row */}
                  <div className="bg-gray-100 rounded-lg p-4 aspect-square relative">
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <div className="text-xs text-gray-500">Product Image</div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-xs">
                      <div className="font-medium">Fire Tee</div>
                      <div className="text-gray-500">$30.00</div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 aspect-square relative">
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <div className="text-xs text-gray-500">Product Image</div>
                    </div>
                    <div className="absolute bottom-2 left-2 text-xs">
                      <div className="font-medium">Fire Sweatshirt</div>
                      <div className="text-gray-500">$60.00</div>
                    </div>
                  </div>
                  
                  {/* Bottom row */}
                  <div className="bg-gray-100 rounded-lg p-4 aspect-square">
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <div className="text-xs text-gray-500">Product Image</div>
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg p-4 aspect-square">
                    <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
                      <div className="text-xs text-gray-500">Product Image</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Testimonial */}
          <div className=" text-white p-12 flex flex-col justify-center relative">
            <div className="relative z-10">
              <blockquote className="text-2xl lg:text-3xl font-medium leading-relaxed mb-8">
                &quot;{testimonials[currentTestimonial].quote}&quot;
              </blockquote>
              
              <div className="space-y-2">
                <div className="font-semibold text-lg">{testimonials[currentTestimonial].author}</div>
                <div className="text-gray-400">{testimonials[currentTestimonial].title}</div>
                <div className="flex items-center text-gray-400">
                  <span>{testimonials[currentTestimonial].website}</span>
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Navigation arrows */}
            <div className="absolute bottom-8 right-8 flex space-x-3">
              <button 
                onClick={prevTestimonial}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                onClick={nextTestimonial}
                className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Testimonial indicators */}
            <div className="absolute bottom-8 left-12 flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-white' : 'bg-white/30'
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