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
        <UserPlus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-400 group-hover:text-white transition-colors duration-500" />
      ),
      title: "Create Your Account",
      description:
        "Sign up and complete our secure creator verification to get approved in under 24 hours.",
    },
    {
      step: "02",
      icon: (
        <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-emerald-400 group-hover:text-white transition-colors duration-500" />
      ),
      title: "Secure Your Identity",
      description:
        "Our team reviews your application to ensure the highest standards for our marketplace.",
    },
    {
      step: "03",
      icon: (
        <Palette className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-400 group-hover:text-white transition-colors duration-500" />
      ),
      title: "Design & Launch Products",
      description:
        "Access our full product catalog and intuitive design tools to create your first collection.",
    },
    {
      step: "04",
      icon: (
        <Rocket className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-400 group-hover:text-white transition-colors duration-500" />
      ),
      title: "Sell & Get Paid",
      description:
        "Publish your products and get paid instantly for every sale you make on the platform.",
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-950 relative overflow-hidden">
      {/* Refined background elements with iOS-style subtlety */}
      <div className="absolute top-0 left-0 w-48 sm:w-64 md:w-80 lg:w-96 h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-br from-blue-500/8 to-indigo-500/6 rounded-full blur-3xl animate-blob opacity-60"></div>
      <div className="absolute bottom-0 right-0 w-48 sm:w-64 md:w-80 lg:w-96 h-48 sm:h-64 md:h-80 lg:h-96 bg-gradient-to-br from-purple-500/8 to-pink-500/6 rounded-full blur-3xl animate-blob animation-delay-1000 opacity-60"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-gradient-to-br from-orange-500/6 to-red-500/4 rounded-full blur-3xl animate-blob animation-delay-2000 opacity-40"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header with iOS-style typography */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight">
            A Seamless Journey from{" "}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
              Idea to Launch
            </span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-400 max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto leading-relaxed font-light">
            Our streamlined process empowers you to build and grow your brand
            with professional tools and seamless workflows.
          </p>
        </div>

        <div className="relative">
          {/* iOS-style connecting line */}
          <div className="hidden lg:block absolute top-[120px] left-0 right-0 h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-orange-500/30 animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 relative z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group transition-all duration-300 ease-out"
              >
                {/* iOS-style glass card */}
                <div className="relative backdrop-blur-xl bg-white/[0.08] border border-white/[0.12] rounded-3xl p-6 sm:p-7 md:p-8 h-full flex flex-col items-center text-center transition-all duration-300 group-hover:bg-white/[0.12] group-hover:border-white/[0.2] group-hover:shadow-xl group-hover:shadow-black/10 group-hover:-translate-y-1">
                  
                  {/* Subtle inner glow */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.04] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Professional step indicator */}
                  <div className="relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 mb-5 sm:mb-6">
                    {/* Glass background circle */}
                    <div className="absolute inset-0 rounded-full backdrop-blur-md bg-white/[0.06] border border-white/[0.15] shadow-inner transition-all duration-300 group-hover:bg-white/[0.1] group-hover:border-white/[0.25]"></div>
                    
                    {/* Icon container */}
                    <div className="relative w-full h-full flex items-center justify-center z-10">
                      <div className="transition-transform duration-300 group-hover:scale-110">
                        {step.icon}
                      </div>
                    </div>
                  </div>

                  {/* Title with iOS typography */}
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:via-purple-400 group-hover:to-orange-400 group-hover:bg-clip-text transition-all duration-300 leading-tight">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs sm:text-sm md:text-base text-gray-400 leading-relaxed flex-grow font-light group-hover:text-gray-300 transition-colors duration-300">
                    {step.description}
                  </p>
                </div>

                {/* Refined arrow for desktop */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[120px] left-[calc(100%+16px)] transform -translate-y-1/2 items-center justify-center z-20">
                    <div className="w-8 h-8 rounded-full backdrop-blur-md bg-white/[0.06] border border-white/[0.12] flex items-center justify-center group-hover:bg-white/[0.1] group-hover:border-white/[0.2] transition-all duration-300">
                      <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-orange-400 transition-colors duration-300" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Modern minimal CTA section */}
        <div className="mt-16 sm:mt-20 md:mt-24 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight">
              Start Building Your Brand
            </h3>
            <p className="text-sm sm:text-base md:text-lg text-gray-400 mb-8 sm:mb-10 leading-relaxed font-light">
              Join trendsetting creators already earning with our platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <button className="group relative backdrop-blur-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-semibold text-sm sm:text-base transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-orange-500/25 border border-white/10 hover:border-white/20 overflow-hidden w-full sm:w-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative flex items-center justify-center">
                  Get Started Free
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
              
              <button className="group relative backdrop-blur-xl bg-white/5 hover:bg-white/10 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-medium text-sm sm:text-base transition-all duration-300 border border-white/20 hover:border-white/30 w-full sm:w-auto">
                <span className="relative">View Products</span>
              </button>
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

        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-blob {
          animation: blob 8s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }

        .animation-delay-2000 {
          animation-delay: 2000ms;
        }
      `}</style>
    </section>
  );
}
