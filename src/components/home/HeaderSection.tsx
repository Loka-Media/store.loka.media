// components/home/HeroSection.tsx
"use client";

import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  isAuthenticated: boolean;
  user?: { role: string } | null;
}

export function HeroSection({ isAuthenticated, user }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-black text-white">
      {/* Main Hero Section - Matching Figma Design Exactly */}
      <div
        className="relative w-full flex items-center justify-center px-4 py-16 md:py-24 lg:py-32"
        style={{
          background: "linear-gradient(180deg, #000000 0%, #0a0a0a 100%)",
        }}
      >
        <div className="w-full max-w-6xl mx-auto text-center">
          {/* Main Heading - Gradient from Brown/Orange to White */}
          <h1
            className="font-bold mb-6 md:mb-8 leading-tight tracking-tight"
            style={{
              fontSize: "clamp(2rem, 6vw, 5.5rem)",
              lineHeight: "1.1",
              background:
                "linear-gradient(273.09deg, #9E4719 0.41%, #FFFFFF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: "Clash Display, system-ui, sans-serif",
            }}
          >
            Turn Your Following
            <br />
            Into Income
          </h1>

          {/* Subheading - Gradient from White to Black */}
          <p
            className="mb-10 md:mb-14 leading-relaxed max-w-3xl mx-auto"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.625rem)",
              background:
                "linear-gradient(91.77deg, #FFFFFF 0%, #000000 136.03%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontFamily: "Satoshi, system-ui, sans-serif",
              fontWeight: 400,
            }}
          >
            Your creator journey deserves premium marketing support and maximum
            monetization earnings on and across all social platforms.
          </p>

          {/* CTA Buttons */}
          {!isAuthenticated && (
            <div className="flex flex-row justify-center items-center gap-6 md:gap-8">
              <Button variant="primary" href="/auth/register">
                Start Selling
              </Button>

              <Button variant="secondary" href="/products">
                Explore Marketplace
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Section - Black Background with Accent Cards */}
      <div
        className="py-8 md:py-12 px-4 md:px-6 lg:px-8 border-t"
        style={{
          background: "#000000",
          borderColor: "rgba(255, 255, 255, 0.1)",
          backgroundImage:
            "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Stat Card 1 */}
            <div className="gradient-border-white-top p-6 md:p-8">
              <div className="flex flex-col h-full justify-between items-center text-center">
                <div
                  className="font-medium"
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    letterSpacing: "0.01em",
                  }}
                >
                  Paid to creators
                </div>
                <div
                  className="font-extrabold tracking-wider"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 5rem)",
                    color: "#FF6D1F",
                    lineHeight: "1",
                    letterSpacing: "0.02em",
                  }}
                >
                  $2M+
                </div>
              </div>
            </div>

            {/* Stat Card 2 */}
            <div className="gradient-border-white-top p-6 md:p-8">
              <div className="flex flex-col h-full justify-between items-center text-center">
                <div
                  className="font-medium"
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    letterSpacing: "0.01em",
                  }}
                >
                  Active creators
                </div>
                <div
                  className="font-extrabold tracking-wider"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 5rem)",
                    color: "#FF6D1F",
                    lineHeight: "1",
                    letterSpacing: "0.02em",
                  }}
                >
                  10K+
                </div>
              </div>
            </div>

            {/* Stat Card 3 */}
            <div className="gradient-border-white-top p-6 md:p-8">
              <div className="flex flex-col h-full justify-between items-center text-center">
                <div
                  className="font-medium"
                  style={{
                    fontSize: "0.875rem",
                    color: "rgba(255, 255, 255, 0.8)",
                    letterSpacing: "0.01em",
                  }}
                >
                  You keep
                </div>
                <div
                  className="font-extrabold tracking-wider"
                  style={{
                    fontSize: "clamp(3rem, 8vw, 5rem)",
                    color: "#FF6D1F",
                    lineHeight: "1",
                    letterSpacing: "0.02em",
                  }}
                >
                  90%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
