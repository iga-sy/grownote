import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "ai";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-dark disabled:opacity-50",
  secondary: "bg-accent-soft text-ink hover:bg-accent/15",
  ghost: "bg-transparent text-ink-soft hover:bg-accent-soft",
  danger: "bg-transparent text-red-600 hover:bg-red-50",
  ai: "bg-gradient-to-r from-accent to-accent-2 text-white shadow-md shadow-accent/30 hover:brightness-110 disabled:opacity-60 disabled:hover:brightness-100",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
