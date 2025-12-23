import React, { ReactNode, CSSProperties } from 'react';

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  gradient?: string;
  style?: CSSProperties;
}

/**
 * Generic gradient text component
 * Default gradient: linear-gradient(91.77deg, #FFFFFF 0%, #000000 136.03%)
 * Can be customized with different gradients via the gradient prop
 */
export function GradientText({
  children,
  className = '',
  gradient = 'linear-gradient(91.77deg, #FFFFFF 0%, #000000 136.03%)',
  style = {},
}: GradientTextProps) {
  return (
    <span
      className={className}
      style={{
        background: gradient,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
