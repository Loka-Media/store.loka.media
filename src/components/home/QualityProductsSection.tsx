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
      className="relative text-white py-8 sm:py-12 md:py-16 lg:py-24 overflow-hidden bg-gray-950"
    >
      <div className="absolute top-0 left-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob opacity-40"></div>
      <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-1000 opacity-40"></div>

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

            {/* Floating accent elements */}
            <div className="absolute -top-2 sm:-top-3 md:-top-4 -right-2 sm:-right-3 md:-right-4 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-br from-purple-500/20 to-orange-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 -left-2 sm:-left-3 md:-left-4 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-gradient-to-br from-orange-500/15 to-purple-500/15 rounded-full blur-2xl"></div>
          </div>

          {/* Right side - Enhanced Content */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white mb-4 sm:mb-6 md:mb-8 leading-tight">
                Quality products
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400">
                  without the headache
                </span>
              </h2>
              <div className="absolute -left-3 sm:-left-4 md:-left-6 top-4 sm:top-6 md:top-8 w-0.5 sm:w-1 h-12 sm:h-16 md:h-20 bg-gradient-to-b from-purple-500 to-orange-500 rounded-full"></div>
            </div>

            <div className="space-y-1 sm:space-y-2">
              {/* Create beautiful products */}
              <div className="group relative backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <button
                  onClick={() => toggleSection("create")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left z-10"
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-orange-400 transition-all duration-300">
                    Create beautiful products
                  </h3>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative transform transition-all duration-300 ease-out p-1.5 sm:p-2 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110">
                      {expandedSection === "create" ? (
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                      ) : (
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" />
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
                    <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-5 md:mb-6 font-light">
                      From apparel to plushies to hot sauce, we've teamed up
                      with top manufacturers to bring your ideas to life. No
                      minimums required.
                    </p>
                    <button className="relative group/btn bg-gradient-to-r from-white to-gray-100 text-black px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-3.5 rounded-full font-semibold overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-white/20 text-sm sm:text-base">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-orange-600 opacity-0 group-hover/btn:opacity-10 transition-opacity duration-300"></div>
                      <span className="relative">
                        Create your first product
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Launch your own shop */}
              <div className="group relative backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <button
                  onClick={() => toggleSection("shop")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left z-10"
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-purple-400 transition-all duration-300">
                    Launch your own shop
                  </h3>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative transform transition-all duration-300 ease-out p-1.5 sm:p-2 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110">
                      {expandedSection === "shop" ? (
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" />
                      ) : (
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
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
                    <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed font-light">
                      Set up your custom storefront and start selling your
                      products with our easy-to-use platform. Full customization
                      available.
                    </p>
                  </div>
                </div>
              </div>

              {/* We handle shipping & support */}
              <div className="group relative backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <button
                  onClick={() => toggleSection("shipping")}
                  className="relative w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left z-10"
                >
                  <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-orange-400 transition-all duration-300">
                    We handle shipping & support
                  </h3>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative transform transition-all duration-300 ease-out p-1.5 sm:p-2 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110">
                      {expandedSection === "shipping" ? (
                        <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                      ) : (
                        <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" />
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
                    <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed font-light">
                      Focus on creating while we handle order fulfillment,
                      customer service, and worldwide shipping for your
                      products.
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
