import React, { ReactNode } from 'react';

interface GradientCardLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card layout component with gradient border
 * Uses an SVG with gradient stroke as the card container
 */
export function GradientCardLayout({
  children,
  className = '',
}: GradientCardLayoutProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* SVG Background with gradient border */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 563 340"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full absolute inset-0"
        preserveAspectRatio="none"
      >
        <rect
          x="0.5"
          y="0.5"
          width="562"
          height="339"
          rx="31.5"
          stroke="url(#paint0_linear_gradient_card)"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient
            id="paint0_linear_gradient_card"
            x1="281.5"
            y1="0"
            x2="281.5"
            y2="340"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="white" />
            <stop offset="1" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full p-6 sm:p-7 md:p-8">
        {children}
      </div>
    </div>
  );
}
