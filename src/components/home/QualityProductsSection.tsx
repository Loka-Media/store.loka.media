"use client";

import { useState, useEffect } from "react";
import { Plus, Minus } from "lucide-react";

export  function QualityProductsSection() {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "create"
  );
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = ["/images/q1.webp", "/images/q2.webp", "/images/q3.webp"];

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
      className="relative text-white py-16 md:py-24 overflow-hidden bg-gray-950"
    >
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob opacity-40"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-1000 opacity-40"></div>

      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left side - Scrolling Images */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-[3/4]">
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
              <div className="absolute bottom-5 left-5 z-10 flex space-x-2">
                {images.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentImageIndex ? "bg-white" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Floating accent elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-orange-500/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-500/15 to-purple-500/15 rounded-full blur-2xl"></div>
          </div>

          {/* Right side - Enhanced Content */}
          <div className="space-y-8">
            <div className="relative">
              <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-100 to-white mb-8 leading-tight">
                Quality products
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-gray-300 to-gray-400">
                  without the headache
                </span>
              </h2>
              <div className="absolute -left-6 top-8 w-1 h-20 bg-gradient-to-b from-purple-500 to-orange-500 rounded-full"></div>
            </div>

            <div className="space-y-2">
              {/* Create beautiful products */}
              <div className="group relative backdrop-blur-sm bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden transition-all duration-500 hover:bg-white/[0.04] hover:border-white/20">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-orange-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <button
                  onClick={() => toggleSection("create")}
                  className="relative w-full flex items-center justify-between p-6 text-left z-10"
                >
                  <h3 className="text-xl lg:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-orange-400 transition-all duration-300">
                    Create beautiful products
                  </h3>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative transform transition-all duration-300 ease-out p-2 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110">
                      {expandedSection === "create" ? (
                        <Minus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" />
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
                  <div className="px-6 pb-6">
                    <p className="text-gray-300 text-lg leading-relaxed mb-6 font-light">
                      From apparel to plushies to hot sauce, we've teamed up
                      with top manufacturers to bring your ideas to life. No
                      minimums required.
                    </p>
                    <button className="relative group/btn bg-gradient-to-r from-white to-gray-100 text-black px-8 py-3.5 rounded-full font-semibold overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-white/20">
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
                  className="relative w-full flex items-center justify-between p-6 text-left z-10"
                >
                  <h3 className="text-xl lg:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-orange-400 group-hover:to-purple-400 transition-all duration-300">
                    Launch your own shop
                  </h3>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative transform transition-all duration-300 ease-out p-2 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110">
                      {expandedSection === "shop" ? (
                        <Minus className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
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
                  <div className="px-6 pb-6">
                    <p className="text-gray-300 text-lg leading-relaxed font-light">
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
                  className="relative w-full flex items-center justify-between p-6 text-left z-10"
                >
                  <h3 className="text-xl lg:text-2xl font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-orange-400 transition-all duration-300">
                    We handle shipping & support
                  </h3>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                    <div className="relative transform transition-all duration-300 ease-out p-2 rounded-full bg-white/5 group-hover:bg-white/10 group-hover:scale-110">
                      {expandedSection === "shipping" ? (
                        <Minus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-200" />
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
                  <div className="px-6 pb-6">
                    <p className="text-gray-300 text-lg leading-relaxed font-light">
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
