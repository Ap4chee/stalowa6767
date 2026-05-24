"use client";

import { ReactNode } from "react";

interface DataFieldProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  /** mono = numeric/coordinate (uses JetBrains Mono). text = label text. */
  format?: "mono" | "text";
  /** Layout: row stacks label/value; col is label on top. */
  orientation?: "row" | "col";
  align?: "left" | "right";
  className?: string;
}

export function DataField({
  label,
  value,
  hint,
  format = "mono",
  orientation = "col",
  align = "left",
  className = ""
}: DataFieldProps) {
  const valueClass = format === "mono" ? "text-data text-primary" : "text-body text-primary";
  const alignClass = align === "right" ? "items-end text-right" : "items-start text-left";

  if (orientation === "row") {
    return (
      <div className={`flex items-center justify-between gap-3 ${className}`}>
        <span className="text-micro text-muted uppercase tracking-wider">{label}</span>
        <span className={valueClass}>{value}</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-[2px] ${alignClass} ${className}`}>
      <span className="text-micro text-muted uppercase tracking-wider">{label}</span>
      <span className={valueClass}>{value}</span>
      {hint && <span className="text-micro text-muted">{hint}</span>}
    </div>
  );
}
