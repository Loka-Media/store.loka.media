"use client";

import React from "react";
import { Sparkles, Shirt, Palette, Zap, Package } from "lucide-react";

interface CreativeLoaderProps {
  variant?: "default" | "product" | "design" | "shipping" | "small";
  message?: string;
}

const CreativeLoader: React.FC<CreativeLoaderProps> = ({
  variant = "default",
  message,
}) => {
  // Different loader variants based on context
  const getLoaderContent = () => {
    switch (variant) {
      case "product":
        return {
          icon: Package,
          bgGradient: "from-blue-200 to-purple-200",
          iconBg: "from-blue-400 to-purple-400",
          defaultMessage: "Loading products...",
        };
      case "design":
        return {
          icon: Palette,
          bgGradient: "from-yellow-200 to-pink-200",
          iconBg: "from-yellow-400 to-pink-400",
          defaultMessage: "Loading design canvas...",
        };
      case "shipping":
        return {
          icon: Package,
          bgGradient: "from-green-200 to-teal-200",
          iconBg: "from-green-400 to-teal-400",
          defaultMessage: "Processing order...",
        };
      case "small":
        return {
          icon: Sparkles,
          bgGradient: "from-purple-200 to-pink-200",
          iconBg: "from-purple-400 to-pink-400",
          defaultMessage: "Loading...",
        };
      default:
        return {
          icon: Sparkles,
          bgGradient: "from-yellow-200 to-pink-200",
          iconBg: "from-yellow-400 to-pink-400",
          defaultMessage: "Loading...",
        };
    }
  };

  const loader = getLoaderContent();
  const Icon = loader.icon;

  if (variant === "small") {
    return (
      <div className="flex items-center justify-center">
        <div
          className={`bg-gradient-to-r ${loader.iconBg} border-4 border-black rounded-xl p-3 shadow-[4px_4px_0_0_rgba(0,0,0,1)] animate-bounce`}
        >
          <Icon className="w-6 h-6 text-white animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20">
      {/* Animated Icon Container */}
      <div className="relative mb-8">
        {/* Outer rotating square */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${loader.bgGradient} border-4 border-black rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] animate-spin`}
          style={{ width: "120px", height: "120px" }}
        />

        {/* Inner icon container */}
        <div
          className={`relative bg-gradient-to-r ${loader.iconBg} border-4 border-black rounded-2xl p-8 shadow-[6px_6px_0_0_rgba(0,0,0,1)]`}
          style={{ width: "120px", height: "120px" }}
        >
          <Icon className="w-16 h-16 text-white animate-pulse" />
        </div>

        {/* Floating sparkles */}
        <div className="absolute -top-2 -right-2 animate-bounce">
          <div className="bg-yellow-300 border-2 border-black rounded-full p-1">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
        </div>
        <div
          className="absolute -bottom-2 -left-2 animate-bounce"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="bg-pink-300 border-2 border-black rounded-full p-1">
            <Zap className="w-4 h-4 text-black" />
          </div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="bg-white border-4 border-black rounded-2xl px-8 py-4 shadow-[6px_6px_0_0_rgba(0,0,0,1)]">
        <p className="text-xl font-extrabold text-black">
          {message || loader.defaultMessage}
        </p>
        <div className="flex items-center justify-center gap-1 mt-3">
          <div
            className="w-3 h-3 bg-yellow-400 border-2 border-black rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-3 h-3 bg-pink-400 border-2 border-black rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-3 h-3 bg-purple-400 border-2 border-black rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>
    </div>
  );
};

export default CreativeLoader;
