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
        <UserPlus className="w-8 h-8 text-blue-400 group-hover:text-white transition-colors duration-300" />
      ),
      title: "Create Your Account",
      description:
        "Sign up and complete our secure creator verification to get approved in under 24 hours.",
    },
    {
      step: "02",
      icon: (
        <ShieldCheck className="w-8 h-8 text-green-400 group-hover:text-white transition-colors duration-300" />
      ),
      title: "Secure Your Identity",
      description:
        "Our team reviews your application to ensure the highest standards for our marketplace.",
    },
    {
      step: "03",
      icon: (
        <Palette className="w-8 h-8 text-purple-400 group-hover:text-white transition-colors duration-300" />
      ),
      title: "Design & Launch Products",
      description:
        "Access our full product catalog and intuitive design tools to create your first collection.",
    },
    {
      step: "04",
      icon: (
        <Rocket className="w-8 h-8 text-orange-400 group-hover:text-white transition-colors duration-300" />
      ),
      title: "Sell & Get Paid",
      description:
        "Publish your products and get paid instantly for every sale you make on the platform.",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gray-950 relative overflow-hidden font-sans">
      {/* Background blobs for a modern, ethereal feel */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-blob opacity-40"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-blob animation-delay-1000 opacity-40"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
            A Seamless Journey from Idea to{" "}
            <span className="text-orange-400">Launch</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Our streamlined process empowers you to build and grow your brand
            with ease and confidence.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line with a glowing effect */}
          <div className="hidden lg:block absolute top-[100px] left-0 right-0 h-0.5 bg-gray-800">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-50 animate-pulse"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative group transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* The card container with glassmorphism effect */}
                <div className="relative bg-white/5 backdrop-blur-md border border-gray-800 rounded-2xl p-8 h-full flex flex-col items-center text-center transition-all duration-300 group-hover:border-orange-500/50 group-hover:shadow-2xl group-hover:shadow-orange-500/10 group-hover:-translate-y-2 group-hover:rotate-1">
                  {/* Step number and icon wrapper */}
                  <div className="relative w-24 h-24 mb-6">
                    {/* The circle behind the number */}
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-black transition-all duration-300 transform group-hover:scale-110 shadow-lg`}
                    ></div>

                    {/* The number and icon itself */}
                    <div
                      className={`relative w-full h-full text-white font-bold text-lg flex items-center justify-center`}
                    >
                      <span className="absolute top-2 left-2 text-4xl text-gray-600/70 font-extrabold transition-all duration-300 group-hover:text-gray-500/70">
                        {step.step}
                      </span>
                      <div className="z-10 transition-transform duration-300 transform group-hover:scale-125">
                        {step.icon}
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors duration-300">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed flex-grow">
                    {step.description}
                  </p>
                </div>

                {/* Arrow icon for visual flow, now with a more elegant bounce */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-[100px] left-[calc(100%+8px)] transform -translate-y-1/2 items-center justify-center z-20">
                    <div className="flex items-center space-x-2 animate-bounce-x">
                      <ArrowRight className="w-8 h-8 text-gray-700 group-hover:text-orange-400 transition-colors duration-300" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced CTA section */}
        <div className="mt-20 text-center">
          <div className="relative bg-white/5 backdrop-blur-md border border-gray-800 rounded-3xl p-10 md:p-16 max-w-5xl mx-auto shadow-2xl overflow-hidden group">
            <div className="relative z-10">
              <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
                Ready to Join the Creator Economy?
              </h3>
              <p className="text-gray-400 mb-8 text-lg">
                Start your journey today and turn your passion into a profitable
                brand.
              </p>
              <button className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 hover:scale-105 shadow-xl hover:shadow-orange-500/30 relative overflow-hidden">
                <span className="relative z-10">Start Selling Now</span>
                <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(255,255,255,0)_-50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0)_150%)] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        @keyframes bounce-x {
          0%,
          100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-150%);
          }
          100% {
            transform: translateX(150%);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)
            forwards;
        }

        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-blob {
          animation: blob 7s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }

        .animate-bounce-x {
          animation: bounce-x 1.5s infinite;
        }

        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }

        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </section>
  );
}
