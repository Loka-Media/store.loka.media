"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Plus, Minus } from "lucide-react";

export function QualityProductsSection() {
  const [expandedSection, setExpandedSection] = useState<string | null>("create");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    "/images/q1.webp",
    "/images/q2.webp",
    "/images/q3.webp"
  ];

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
    <section className="relative py-16 px-4 sm:px-6 lg:px-8 bg-black">
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
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-105'
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
                      index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white mb-6 leading-tight">
                Quality products
                <br />
                <span className="text-gray-300">without the headache</span>
              </h2>
            </div>

            <div className="space-y-4">
              {/* Create beautiful products */}
              <div className="border-b border-gray-800">
                <button
                  onClick={() => toggleSection("create")}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <h3 className="text-lg lg:text-xl font-bold text-white group-hover:text-orange-400 transition-colors duration-200">
                    Create beautiful products
                  </h3>
                  <div className="transform transition-transform duration-300 ease-in-out">
                    {expandedSection === "create" ? (
                      <Minus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                    )}
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSection === "create" 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="pb-5">
                    <p className="text-gray-400 text-base leading-relaxed mb-5">
                      From apparel to plushies to hot sauce, we've teamed up with top
                      manufacturers to bring your ideas to life. No minimums required.
                    </p>
                    <button className="bg-white text-black px-5 py-2.5 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105">
                      Create your first product
                    </button>
                  </div>
                </div>
              </div>

              {/* Launch your own shop */}
              <div className="border-b border-gray-800">
                <button
                  onClick={() => toggleSection("shop")}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <h3 className="text-lg lg:text-xl font-bold text-white group-hover:text-orange-400 transition-colors duration-200">
                    Launch your own shop
                  </h3>
                  <div className="transform transition-transform duration-300 ease-in-out">
                    {expandedSection === "shop" ? (
                      <Minus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                    )}
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSection === "shop" 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="pb-5">
                    <p className="text-gray-400 text-base leading-relaxed">
                      Set up your custom storefront and start selling your products
                      with our easy-to-use platform. Full customization available.
                    </p>
                  </div>
                </div>
              </div>

              {/* We handle shipping & support */}
              <div className="border-b border-gray-800">
                <button
                  onClick={() => toggleSection("shipping")}
                  className="w-full flex items-center justify-between py-5 text-left group"
                >
                  <h3 className="text-lg lg:text-xl font-bold text-white group-hover:text-orange-400 transition-colors duration-200">
                    We handle shipping & support
                  </h3>
                  <div className="transform transition-transform duration-300 ease-in-out">
                    {expandedSection === "shipping" ? (
                      <Minus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-400 group-hover:text-orange-400 transition-colors duration-200" />
                    )}
                  </div>
                </button>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  expandedSection === "shipping" 
                    ? 'max-h-96 opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}>
                  <div className="pb-5">
                    <p className="text-gray-400 text-base leading-relaxed">
                      Focus on creating while we handle order fulfillment, customer
                      service, and worldwide shipping for your products.
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