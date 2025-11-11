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
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black mb-6 sm:mb-8 md:mb-10 leading-[0.95] tracking-tighter">
                Quality products
                <br />
                <span className="text-foreground-muted">
                  without the headache
                </span>
              </h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {/* Create beautiful products */}
              <div className="group relative bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-black hover:shadow-lg">
                <button
                  onClick={() => toggleSection("create")}
                  className="relative w-full flex items-center justify-between p-5 sm:p-6 md:p-8 text-left"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-black group-hover:text-accent transition-all duration-300 tracking-tight">
                    Create beautiful products
                  </h3>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out p-2 sm:p-3 rounded-full bg-gray-100 group-hover:bg-accent/20">
                      {expandedSection === "create" ? (
                        <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-black group-hover:text-accent transition-colors duration-200 stroke-[3]" />
                      ) : (
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-black group-hover:text-accent transition-colors duration-200 stroke-[3]" />
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
                  <div className="px-5 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8">
                    <p className="text-foreground-muted text-base sm:text-lg md:text-xl leading-relaxed mb-5 sm:mb-6 md:mb-7 font-medium">
                      From apparel to makeup to your own product lines, we've teamed up with top brands and manufacturers to bring your ideas to life. No minimums required.
                    </p>
                    <button className="bg-accent hover:bg-accent-hover text-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-4 rounded-xl font-bold transition-all duration-300 text-base sm:text-lg hover:scale-105 shadow-lg hover:shadow-xl">
                      Create your first product
                    </button>
                  </div>
                </div>
              </div>

              {/* Launch your own shop */}
              <div className="group relative bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-black hover:shadow-lg">
                <button
                  onClick={() => toggleSection("shop")}
                  className="relative w-full flex items-center justify-between p-5 sm:p-6 md:p-8 text-left"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-black group-hover:text-accent transition-all duration-300 tracking-tight">
                    Launch your own shop
                  </h3>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out p-2 sm:p-3 rounded-full bg-gray-100 group-hover:bg-accent/20">
                      {expandedSection === "shop" ? (
                        <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-black group-hover:text-accent transition-colors duration-200 stroke-[3]" />
                      ) : (
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-black group-hover:text-accent transition-colors duration-200 stroke-[3]" />
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
                  <div className="px-5 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8">
                    <p className="text-foreground-muted text-base sm:text-lg md:text-xl leading-relaxed font-medium">
                      Set up your free custom shop and start selling your products with our easy-to-use platform across all social platforms. Full customization available. Ask us about your own fully branded website.
                    </p>
                  </div>
                </div>
              </div>

              {/* We handle shipping & support */}
              <div className="group relative bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:border-black hover:shadow-lg">
                <button
                  onClick={() => toggleSection("shipping")}
                  className="relative w-full flex items-center justify-between p-5 sm:p-6 md:p-8 text-left"
                >
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black text-black group-hover:text-accent transition-all duration-300 tracking-tight">
                    We handle shipping & support
                  </h3>
                  <div className="relative">
                    <div className="relative transform transition-all duration-300 ease-out p-2 sm:p-3 rounded-full bg-gray-100 group-hover:bg-accent/20">
                      {expandedSection === "shipping" ? (
                        <Minus className="w-5 h-5 sm:w-6 sm:h-6 text-black group-hover:text-accent transition-colors duration-200 stroke-[3]" />
                      ) : (
                        <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-black group-hover:text-accent transition-colors duration-200 stroke-[3]" />
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
                  <div className="px-5 sm:px-6 md:px-8 pb-5 sm:pb-6 md:pb-8">
                    <p className="text-foreground-muted text-base sm:text-lg md:text-xl leading-relaxed font-medium">
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
