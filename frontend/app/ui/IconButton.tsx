"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: "ghost" | "solid" | "accent";
  size?: "sm" | "md";
  active?: boolean;
  tooltip?: string;
}

const sizeClass = {
  sm: "w-7 h-7",
  md: "w-8 h-8"
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, variant = "ghost", size = "sm", active = false, className = "", tooltip, ...rest },
  ref
) {
  const variantClass = active
    ? "bg-accent-soft text-accent border-subtle"
    : variant === "solid"
    ? "bg-surface-1 border-subtle text-secondary hover:text-primary hover:bg-surface-hover hover:border-strong"
    : variant === "accent"
    ? "bg-surface-data border-subtle text-accent hover:bg-surface-hover"
    : "bg-transparent border-transparent text-muted hover:text-primary hover:bg-surface-hover";

  return (
    <button
      ref={ref}
      title={tooltip}
      aria-label={tooltip}
      className={[
        "inline-flex items-center justify-center rounded-[var(--r-md)] border cursor-pointer",
        "transition-[background-color,border-color,color] duration-[var(--dur-fast)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--canvas)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClass[size],
        variantClass,
        className
      ].join(" ")}
      {...rest}
    >
      <span className="[&>svg]:w-[1rem] [&>svg]:h-[1rem]">{icon}</span>
    </button>
  );
});
