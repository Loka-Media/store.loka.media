'use client';

interface GradientTitleProps {
  text: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * GradientTitle Component
 *
 * A reusable title component with SVG-inspired gradient styling.
 * Default gradient: linear-gradient(273.09deg, #9E4719 0.41%, #FFFFFF 100%)
 * Perfect for hero sections and prominent headings.
 *
 * @param text - The title text to display
 * @param size - Size variant: 'sm' (4xl), 'md' (5xl), 'lg' (6xl), 'xl' (7xl)
 * @param className - Additional CSS classes to apply
 */
export default function GradientTitle({
  text,
  size = 'lg',
  className = '',
}: GradientTitleProps) {
  const sizeMap = {
    sm: 'text-4xl',
    md: 'text-5xl',
    lg: 'text-5xl xl:text-6xl',
    xl: 'text-6xl xl:text-7xl',
  };

  return (
    <div
      className={`font-extrabold tracking-tight leading-[1.1] ${sizeMap[size]} ${className}`}
      style={{
        backgroundImage: 'linear-gradient(273.09deg, #9E4719 0.41%, #FFFFFF 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
      }}
    >
      {text}
    </div>
  );
}
