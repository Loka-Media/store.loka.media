import Link from "next/link";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  disabled = false,
  type = "button",
  className = "",
}: ButtonProps) {
  const baseClasses = "font-medium transition-all duration-300 hover:shadow-lg active:scale-95 px-4 py-2 sm:px-14 sm:py-4 text-sm sm:text-base lg:text-lg rounded-full flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "#FF6D1F",
      color: "#000000",
    },
    secondary: {
      color: "#FF6D1F",
      backgroundColor: "rgba(250, 243, 225, 0.2)",
    },
    tertiary: {
      color: "#FFFFFF",
      backgroundColor: "transparent",
      border: "2px solid #FFFFFF",
    },
  };

  const style = variantStyles[variant];

  if (href) {
    return (
      <Link href={href} className={baseClasses} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${className}`}
      style={disabled ? { ...style, opacity: 0.5, cursor: "not-allowed" } : style}
    >
      {children}
    </button>
  );
}

