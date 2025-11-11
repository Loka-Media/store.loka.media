"use client";

import {
  UserPlus,
  ShieldCheck,
  Palette,
  Rocket,
  ArrowRight,
} from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: (
        <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black transition-colors duration-300" />
      ),
      title: "Sign up for free",
      description:
        "Create your account in seconds. No credit card required.",
      bgColor: "bg-yellow-200",
    },
    {
      step: "02",
      icon: (
        <Palette className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black transition-colors duration-300" />
      ),
      title: "Design your products",
      description:
        "Use our easy design tools or upload your own artwork. Pick from thousands of products.",
      bgColor: "bg-pink-200",
    },
    {
      step: "03",
      icon: (
        <Rocket className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-black transition-colors duration-300" />
      ),
      title: "Start earning",
      description:
        "Share your store link and get paid. We handle production, shipping, and customer service.",
      bgColor: "bg-green-200",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-yellow-50 via-pink-50 to-yellow-50 relative overflow-hidden border-y border-black">
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-black mb-4 sm:mb-6 leading-tight tracking-tight">
            Sell products in minutes
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-black max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-medium">
            Build your product business the simple way. No inventory, no shipping, no hassle.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-[120px] left-0 right-0 h-1 bg-black/10"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group transition-all duration-300 ease-out"
              >
                {/* Clean card */}
                <div className={`relative ${step.bgColor} border border-black rounded-2xl p-6 sm:p-7 md:p-8 h-full flex flex-col items-center text-center transition-all duration-300 hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]`}>

                  {/* Step indicator */}
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mb-5 sm:mb-6">
                    {/* Background circle */}
                    <div className="absolute inset-0 rounded-full bg-white border border-black transition-all duration-300"></div>

                    {/* Icon container */}
                    <div className="relative w-full h-full flex items-center justify-center z-10">
                      <div className="transition-transform duration-300 group-hover:scale-110">
                        {step.icon}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-black mb-3 sm:mb-4 transition-all duration-300 leading-tight">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm md:text-base text-black leading-relaxed flex-grow font-medium">
                    {step.description}
                  </p>
                </div>

                {/* Arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[120px] left-[calc(100%+16px)] transform -translate-y-1/2 items-center justify-center z-20">
                    <div className="w-8 h-8 rounded-full bg-white border border-black flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-black" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="mt-16 sm:mt-20 md:mt-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-black mb-4 sm:mb-6 leading-tight tracking-tight">
              Start Building Your Brand
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-black mb-8 sm:mb-10 leading-relaxed font-medium">
              Join trendsetting creators already earning with our platform
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button className="group bg-black hover:bg-gray-900 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-extrabold text-sm sm:text-base transition-all duration-300 w-full sm:w-auto border border-black hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <span className="flex items-center justify-center">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>

              <button className="group bg-white hover:bg-gray-50 text-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-extrabold text-sm sm:text-base transition-all duration-300 border border-black w-full sm:w-auto hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]">
                <span>View Products</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
