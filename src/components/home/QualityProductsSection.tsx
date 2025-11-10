"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

export  function QualityProductsSection() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "create"
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = ["/images/1.jpeg", "/images/2.jpeg", "/images/3.jpeg", "/images/4.jpeg", "/images/5.jpeg"];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [images.length]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <section
      className="relative bg-gray-50 py-8 sm:py-12 md:py-16 lg:py-24 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-16 items-center">
          {/* Left side - Scrolling Images */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5]">
              {images.map((image, index) => (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    index === currentImageIndex
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-105"
                  }`}
                >
                  <img
                    src={image}
                    alt={`Product showcase ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
              ))}

              {/* Image indicators */}
              <div className="absolute bottom-3 sm:bottom-4 md:bottom-5 left-3 sm:left-4 md:left-5 z-10 flex space-x-1.5 sm:space-x-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-gray-900 mb-4 sm:mb-6 md:mb-8 leading-tight">
                Quality products
                <br />
                <span className="text-gray-600">
                  without the headache
                </span>
              </h2>
            </div>

            <div className="space-y-1 sm:space-y-2">
              {/* Create beautiful products */}
              <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <button
                  onClick={() => toggleSection("create")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-accent transition-all duration-300">
                    Create beautiful products
                  </h3>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out p-1.5 sm:p-2 rounded-full bg-gray-50 group-hover:bg-accent/10">
                      {expandedSection === "create" ? (
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-accent transition-colors duration-200" />
                      ) : (
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-accent transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className={`relative overflow-hidden transition-all duration-700 ease-out ${
                    expandedSection === "create"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-5 md:mb-6">
                      From apparel to makeup to your own product lines, we've teamed up with top brands and manufacturers to bring your ideas to life. No minimums required.
                    </p>
                    <button className="bg-accent hover:bg-accent/90 text-white px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base">
                      Create your first product
                    </button>
                  </div>
                </div>
              </div>

              {/* Launch your own shop */}
              <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <button
                  onClick={() => toggleSection("shop")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-accent transition-all duration-300">
                    Launch your own shop
                  </h3>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out p-1.5 sm:p-2 rounded-full bg-gray-50 group-hover:bg-accent/10">
                      {expandedSection === "shop" ? (
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-accent transition-colors duration-200" />
                      ) : (
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-accent transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className={`relative overflow-hidden transition-all duration-700 ease-out ${
                    expandedSection === "shop"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
                      Set up your free custom shop and start selling your products with our easy-to-use platform across all social platforms. Full customization available. Ask us about your own fully branded website.
                    </p>
                  </div>
                </div>
              </div>

              {/* We handle shipping & support */}
              <div className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 hover:border-gray-300 hover:shadow-md">
                <button
                  onClick={() => toggleSection("shipping")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left"
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-accent transition-all duration-300">
                    We handle shipping & support
                  </h3>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out p-1.5 sm:p-2 rounded-full bg-gray-50 group-hover:bg-accent/10">
                      {expandedSection === "shipping" ? (
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-accent transition-colors duration-200" />
                      ) : (
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 group-hover:text-accent transition-colors duration-200" />
                      )}
                    </div>
                  </div>
                </button>

                <div
                  className={`relative overflow-hidden transition-all duration-700 ease-out ${
                    expandedSection === "shipping"
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
                    <p className="text-gray-600 text-sm sm:text-base md:text-lg leading-relaxed">
                      Join trendsetting creators already earning across all socials with our platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
