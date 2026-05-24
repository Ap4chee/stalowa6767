"use client";

import { ReactNode } from "react";

interface KbdProps {
  children: ReactNode;
  className?: string;
}

export function Kbd({ children, className = "" }: KbdProps) {
  return (
    <kbd
      className={[
        "inline-flex items-center justify-center min-w-[1.25rem] h-[1.25rem]",
        "px-1 rounded-[var(--r-sm)] border border-subtle bg-surface-data",
        "text-micro text-secondary font-mono leading-none",
        className
      ].join(" ")}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {children}
    </kbd>
  );
}
