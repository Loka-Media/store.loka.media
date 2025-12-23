import Link from "next/link";
import { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function Button({
  children,
  variant = "primary",
  href,
  onClick,
  disabled = false,
}: ButtonProps) {
  const baseClasses = "font-medium transition-all duration-300 hover:shadow-lg active:scale-95 px-4 py-2 sm:px-14 sm:py-4 text-sm sm:text-base lg:text-lg rounded-full";

  const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: "#FF6D1F",
      color: "#000000",
    },
    secondary: {
      color: "#FF6D1F",
      backgroundColor: "rgba(250, 243, 225, 0.2)",
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
      onClick={onClick}
      disabled={disabled}
      className={baseClasses}
      style={style}
    >
      {children}
    </button>
  );
}

