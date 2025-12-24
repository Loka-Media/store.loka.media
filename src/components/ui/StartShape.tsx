'use client';

import { ReactNode } from 'react';

interface StartShapeProps {
  children: ReactNode;
  className?: string;
}

/**
 * StartShape Component
 *
 * A reusable card component with a custom diamond-like rotated shape border.
 * Uses SVG stroke with white-to-black gradient for a modern, premium look.
 *
 * @param children - The content to display inside the card
 * @param className - Additional CSS classes to apply
 */
export default function StartShape({
  children,
  className = '',
}: StartShapeProps) {
  return (
    <div className={`relative ${className}`}>
      {/* SVG Shape Border */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 149 149"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient
            id="shapeGradient"
            x1="74.5"
            y1="0"
            x2="74.5"
            y2="149"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#000000" />
          </linearGradient>
        </defs>
        <path
          d="M122.152 1.35547C137.738 -3.20959 152.21 11.2616 147.645 26.8477L135.461 68.4443C134.303 72.3984 134.303 76.6016 135.461 80.5557L147.645 122.152C152.21 137.738 137.738 152.21 122.152 147.645L80.5557 135.461C76.6016 134.303 72.3984 134.303 68.4443 135.461L26.8477 147.645C11.2616 152.21 -3.20959 137.738 1.35547 122.152L13.5391 80.5557C14.6971 76.6016 14.6971 72.3984 13.5391 68.4443L1.35547 26.8477C-3.20959 11.2616 11.2616 -3.20959 26.8477 1.35547L68.4443 13.5391C72.3984 14.6971 76.6016 14.6971 80.5557 13.5391L122.152 1.35547Z"
          stroke="url(#shapeGradient)"
          strokeWidth="2"
        />
      </svg>

      {/* Content */}
      <div className="relative z-10 p-6">
        {children}
      </div>
    </div>
  );
}
