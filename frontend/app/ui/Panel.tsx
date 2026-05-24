"use client";

import { ReactNode, forwardRef, HTMLAttributes } from "react";

type PanelVariant = "solid" | "ghost" | "floating" | "data";
type PanelDensity = "compact" | "regular" | "comfortable";

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
  density?: PanelDensity;
  interactive?: boolean;
  /** Big rounded panel for hero/dashboard panels. Default true. */
  rounded?: "md" | "lg" | "xl";
  children: ReactNode;
}

const variantClass: Record<PanelVariant, string> = {
  solid:    "bg-surface-1 elev-1",
  ghost:    "bg-transparent",
  floating: "bg-surface-2 elev-2",
  data:     "bg-surface-data"
};

const densityClass: Record<PanelDensity, string> = {
  compact:    "p-3",
  regular:    "p-4",
  comfortable:"p-5"
};

const roundedClass: Record<NonNullable<PanelProps["rounded"]>, string> = {
  md: "rounded-(--r-md)",
  lg: "rounded-(--r-lg)",
  xl: "rounded-(--r-xl)"
};

export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  {
    variant = "solid",
    density,
    rounded = "lg",
    interactive = false,
    className = "",
    children,
    ...rest
  },
  ref
) {
  const interactiveClass = interactive
    ? "cursor-pointer transition-colors duration-(--dur-fast) bg-surface-hover-h focus:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
    : "";

  return (
    <div
      ref={ref}
      className={[
        "relative",
        roundedClass[rounded],
        variantClass[variant],
        density ? densityClass[density] : "",
        interactiveClass,
        className
      ].filter(Boolean).join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
});
