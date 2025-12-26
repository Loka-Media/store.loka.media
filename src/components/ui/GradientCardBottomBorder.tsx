import React, { ReactNode } from 'react';

interface GradientCardBottomBorderProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card layout component with gradient bottom border
 * Uses an SVG with gradient stroke as the card container
 */
export function GradientCardBottomBorder({
  children,
  className = '',
}: GradientCardBottomBorderProps) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* SVG Background with gradient border */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1760 930"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full absolute inset-0"
        preserveAspectRatio="none"
      >
        <path
          d="M1759.5 0.5V898C1759.5 915.397 1745.4 929.5 1728 929.5H32C14.603 929.5 0.5 915.397 0.5 898V0.5H1759.5Z"
          stroke="url(#paint0_linear_1353_2315)"
          strokeWidth="1"
        />
        <defs>
          <linearGradient
            id="paint0_linear_1353_2315"
            x1="880"
            y1="0"
            x2="880"
            y2="930"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="transparent" />
            <stop offset="1" stopColor="white" />
          </linearGradient>
        </defs>
      </svg>

      {/* Content overlay */}
      <div className="relative z-10 w-full h-full p-3 sm:p-4 md:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
}
