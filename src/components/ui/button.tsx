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
  style?: React.CSSProperties;
}

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  disabled = false,
  type = "button",
  className = "",
  style,
}: ButtonProps) {
  const baseClasses =
    "font-medium transition-all duration-300 active:scale-95 px-4 py-2 sm:px-14 sm:py-4 text-sm sm:text-base lg:text-lg rounded-full flex items-center justify-center cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-[#FF6D1F] text-black font-semibold shadow-[0_4px_14px_rgba(255,109,31,0.3)] hover:bg-[#FF7E38] hover:shadow-[0_6px_25px_rgba(255,109,31,0.55)] hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
    secondary:
      "bg-[rgba(250,243,225,0.2)] text-[#FF6D1F] border border-white/10 backdrop-blur-sm hover:bg-[rgba(250,243,225,0.3)] hover:border-[#FF6D1F]/50 hover:text-white hover:shadow-[0_6px_25px_rgba(255,109,31,0.25)] hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
    tertiary:
      "bg-transparent text-white border-2 border-white hover:bg-white/10 hover:border-white hover:scale-[1.02] hover:-translate-y-0.5 active:translate-y-0 active:scale-95",
  };

  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={combinedClasses} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={combinedClasses}
      style={style}
    >
      {children}
    </button>
  );
}

