"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";
import { Kbd } from "./Kbd";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  kbd?: string;
  fullWidth?: boolean;
  active?: boolean;
  loading?: boolean;
}

const sizeClass: Record<ButtonSize, string> = {
  sm: "text-caption h-7 px-2.5 gap-1.5",
  md: "text-body h-9 px-3.5 gap-2",
  lg: "text-heading h-11 px-4 gap-2"
};

const baseClass =
  "inline-flex items-center justify-center font-medium rounded-[var(--r-md)] " +
  "border transition-[background-color,border-color,color,box-shadow] duration-[var(--dur-fast)] " +
  "select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--canvas)] " +
  "whitespace-nowrap";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--accent)] border-[var(--accent)] text-[var(--text-on-accent)] " +
    "hover:bg-[var(--accent-strong)] hover:border-[var(--accent-strong)]",
  secondary:
    "bg-surface-1 border-subtle text-primary " +
    "hover:bg-surface-hover hover:border-strong",
  ghost:
    "bg-transparent border-transparent text-secondary " +
    "hover:bg-surface-hover hover:text-primary",
  danger:
    "bg-error-soft border-error/40 text-error " +
    "hover:bg-[var(--error)] hover:text-white hover:border-[var(--error)]",
  success:
    "bg-ok-soft border-ok/40 text-ok " +
    "hover:bg-[var(--ok)] hover:text-white hover:border-[var(--ok)]",
  warning:
    "bg-warn-soft border-warn/40 text-warn " +
    "hover:bg-[var(--warn)] hover:text-white hover:border-[var(--warn)]"
};

const activeClass: Record<ButtonVariant, string> = {
  primary:   "bg-[var(--accent-strong)] border-[var(--accent-strong)]",
  secondary: "bg-accent-soft border-accent text-accent",
  ghost:     "bg-accent-soft text-accent",
  danger:    "bg-[var(--error)] text-white border-[var(--error)]",
  success:   "bg-[var(--ok)] text-white border-[var(--ok)]",
  warning:   "bg-[var(--warn)] text-white border-[var(--warn)]"
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    icon,
    iconRight,
    kbd,
    fullWidth = false,
    active = false,
    loading = false,
    className = "",
    children,
    disabled,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        baseClass,
        sizeClass[size],
        active ? activeClass[variant] : variantClass[variant],
        fullWidth ? "w-full" : "",
        className
      ].join(" ")}
      {...rest}
    >
      {icon && <span className="shrink-0 [&>svg]:w-[1.05em] [&>svg]:h-[1.05em]">{icon}</span>}
      {children && <span className="truncate">{children}</span>}
      {iconRight && <span className="shrink-0 [&>svg]:w-[1.05em] [&>svg]:h-[1.05em]">{iconRight}</span>}
      {kbd && <Kbd className="ml-1 -mr-1">{kbd}</Kbd>}
    </button>
  );
});
