"use client";

import { Users, Shield, Store } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Users,
      title: "Multi-Role Platform",
      description:
        "Seamlessly manage users, creators, and admins with advanced role-based permissions and intuitive workflows.",
    },
    {
      icon: Shield,
      title: "Robust Security",
      description:
        "JWT authentication, email verification, and enterprise-grade security protocols protect your data and transactions.",
    },
    {
      icon: Store,
      title: "Creator Empowerment",
      description:
        "Comprehensive dashboard with analytics, inventory management, and powerful sales optimization tools for creators.",
    },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black text-white border-t border-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-extrabold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Built for Scale, Designed for Impact
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto">
            Enterprise-grade features that empower your business to thrive
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 bg-gray-900 rounded-xl shadow-lg border border-gray-800 transform hover:scale-105 transition-transform duration-300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-600 to-orange-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <feature.icon className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">
                {feature.title}
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
