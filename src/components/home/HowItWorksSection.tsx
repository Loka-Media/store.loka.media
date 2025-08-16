"use client";

import { UserPlus, Shield, Palette, Share2, ArrowRight, ChevronRight } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      step: "01",
      icon: <UserPlus className="w-8 h-8" />,
      title: "Create Your Creator Account",
      description: "Complete registration with business details and verification documents. Quick approval process within 24 hours.",
      color: "from-blue-500 to-blue-600"
    },
    {
      step: "02", 
      icon: <Shield className="w-8 h-8" />,
      title: "Account Verification",
      description: "Our compliance team reviews your application to ensure quality standards and marketplace integrity.",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      step: "03",
      icon: <Palette className="w-8 h-8" />,
      title: "Browse Product Catalog",
      description: "Access 450+ customizable products and 40,000+ ready-to-sell items with comprehensive design tools.",
      color: "from-purple-500 to-purple-600"
    },
    {
      step: "04",
      icon: <Share2 className="w-8 h-8" />,
      title: "Launch & Distribute",
      description: "Publish to our marketplace or generate shareable product links for direct sales to your audience.",
      color: "from-orange-500 to-orange-600"
    }
  ];

  return (
    <section className="py-20 px-4 bg-black relative overflow-hidden">
      {/* Background Animations */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A streamlined process designed for creators and entrepreneurs to build successful product businesses
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line with Animation */}
          <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gray-800">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-50 animate-pulse"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className="relative group"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Step Card */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 h-full flex flex-col items-center text-center transition-all duration-500 hover:border-gray-600 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2 group animate-fade-in-up">
                  {/* Step Number */}
                  <div className={`w-14 h-14 bg-gradient-to-r ${step.color} text-white rounded-full flex items-center justify-center font-bold text-lg mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                    {step.step}
                  </div>
                  
                  {/* Icon */}
                  <div className="w-20 h-20 bg-gray-800 rounded-xl flex items-center justify-center mb-6 group-hover:bg-gray-700 transition-all duration-300">
                    <div className="text-gray-300 group-hover:text-white transition-colors duration-300">
                      {step.icon}
                    </div>
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-blue-400 transition-colors duration-300">
                    {step.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-400 text-sm leading-relaxed flex-grow group-hover:text-gray-300 transition-colors duration-300">
                    {step.description}
                  </p>

                  {/* Hover Glow Effect */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>

                {/* Animated Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-20 -right-6 items-center justify-center z-20">
                    <div className="flex items-center space-x-1 animate-bounce-x">
                      <ChevronRight className="w-5 h-5 text-gray-600 hover:text-blue-400 transition-colors duration-300" />
                      <ChevronRight className="w-5 h-5 text-gray-600 hover:text-blue-400 transition-colors duration-300 animation-delay-150" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced CTA Section */}
        <div className="mt-20 text-center">
          <div className="relative bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-12 max-w-4xl mx-auto shadow-2xl overflow-hidden group">
            {/* Background Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-4">
                Ready to Start Your Business?
              </h3>
              <p className="text-gray-400 mb-8 text-lg">
                Join thousands of creators building profitable businesses with our platform
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-blue-500/25 relative overflow-hidden">
                  <span className="relative z-10">Create Account</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-700 transform -translate-x-full"></div>
                </button>
                <button className="border border-gray-600 text-gray-300 px-10 py-4 rounded-xl font-semibold text-lg hover:bg-gray-800 hover:border-gray-500 transition-all duration-300 hover:scale-105">
                  View Catalog
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes bounce-x {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(5px);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animate-bounce-x {
          animation: bounce-x 2s ease-in-out infinite;
        }
        
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
      `}</style>
    </section>
  );
}