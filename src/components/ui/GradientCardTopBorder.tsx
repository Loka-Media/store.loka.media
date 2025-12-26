import React, { ReactNode } from 'react';

interface GradientCardTopBorderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card layout component with gradient top border
 * Uses an SVG with gradient stroke as the card container
 * Fully dynamic and scalable to any size with crisp 1px border
 */
export function GradientCardTopBorder({
  children,
  className = '',
}: GradientCardTopBorderProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* SVG Background with gradient border - fully dynamic */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full absolute inset-0"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="paint0_linear_gradient_card"
            x1="0.5"
            y1="0"
            x2="0.5"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <rect
          x="0.5"
          y="0.5"
          width="99"
          height="99"
          rx="5"
          fill="none"
          stroke="url(#paint0_linear_gradient_card)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full p-3 sm:p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
