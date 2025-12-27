"use client";

import React from "react";
import { Sparkles, Package, Palette, Zap } from "lucide-react";

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
          iconColor: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
          defaultMessage: "Loading products...",
        };
      case "design":
        return {
          icon: Palette,
          iconColor: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
          defaultMessage: "Loading design canvas...",
        };
      case "shipping":
        return {
          icon: Package,
          iconColor: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
          defaultMessage: "Processing order...",
        };
      case "small":
        return {
          icon: Sparkles,
          iconColor: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
          defaultMessage: "Loading...",
        };
      default:
        return {
          icon: Sparkles,
          iconColor: "text-orange-400",
          bgColor: "bg-orange-500/20",
          borderColor: "border-orange-500/30",
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
          className={`${loader.bgColor} ${loader.borderColor} border rounded-lg p-3 animate-spin`}
        >
          <Icon className={`w-5 h-5 ${loader.iconColor}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 bg-black min-h-screen">
      {/* Animated Icon Container */}
      <div className="relative mb-8">
        {/* Spinning gradient border background */}
        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100"
          style={{
            width: "140px",
            height: "140px",
            background: "conic-gradient(from 0deg, #f97316, #0ea5e9, #f97316)",
            animation: "spin 3s linear infinite",
            borderRadius: "1rem",
          }}
        />

        {/* Inner icon container with dark theme */}
        <div
          className={`relative ${loader.bgColor} ${loader.borderColor} border rounded-2xl p-8 flex items-center justify-center`}
          style={{ width: "140px", height: "140px" }}
        >
          <Icon className={`w-16 h-16 ${loader.iconColor} animate-pulse`} />
        </div>

        {/* Floating accent dots */}
        <div className="absolute -top-3 -right-3 animate-bounce">
          <div className={`${loader.bgColor} ${loader.borderColor} border rounded-full p-2`}>
            <Sparkles className={`w-4 h-4 ${loader.iconColor}`} />
          </div>
        </div>
        <div
          className="absolute -bottom-3 -left-3 animate-bounce"
          style={{ animationDelay: "0.2s" }}
        >
          <div className={`${loader.bgColor} ${loader.borderColor} border rounded-full p-2`}>
            <Zap className={`w-4 h-4 ${loader.iconColor}`} />
          </div>
        </div>
      </div>

      {/* Loading Message */}
      <div className="gradient-border-white-bottom rounded-lg bg-black px-8 py-4 text-center">
        <p className="text-lg font-bold text-white">
          {message || loader.defaultMessage}
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div
            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: "0s" }}
          />
          <div
            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CreativeLoader;
