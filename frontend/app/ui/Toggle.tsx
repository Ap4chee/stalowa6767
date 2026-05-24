"use client";

import { ReactNode } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  size?: "sm" | "md";
  tone?: "accent" | "ok" | "warn" | "error";
  className?: string;
}

const toneClass = {
  accent: "bg-[var(--accent)]",
  ok:     "bg-[var(--ok)]",
  warn:   "bg-[var(--warn)]",
  error:  "bg-[var(--error)]"
};

const sizes = {
  sm: { track: "w-7 h-4", thumb: "w-3 h-3", thumbOn: "translate-x-3" },
  md: { track: "w-9 h-5", thumb: "w-4 h-4", thumbOn: "translate-x-4" }
} as const;

export function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
  size = "sm",
  tone = "accent",
  className = ""
}: ToggleProps) {
  const s = sizes[size];

  if (!label && !icon) {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          "relative inline-flex items-center rounded-[var(--r-pill)]",
          "border border-subtle transition-colors duration-[var(--dur-fast)]",
          s.track,
          checked ? toneClass[tone] : "bg-surface-data",
          className
        ].join(" ")}
      >
        <span
          className={[
            "absolute left-[2px] rounded-full bg-white shadow-sm",
            "transition-transform duration-[var(--dur-fast)]",
            s.thumb,
            checked ? s.thumbOn : "translate-x-0"
          ].join(" ")}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        "group flex items-center justify-between w-full gap-3 px-2.5 py-1.5",
        "rounded-[var(--r-md)] border border-transparent hover:border-subtle hover:bg-surface-hover",
        "transition-colors duration-[var(--dur-fast)] cursor-pointer text-left",
        className
      ].join(" ")}
    >
      <span className="flex items-center gap-2 min-w-0">
        {icon && (
          <span className={`shrink-0 transition-colors ${checked ? "text-accent" : "text-muted"}`}>
            {icon}
          </span>
        )}
        <span className="flex flex-col min-w-0">
          {label && (
            <span className={`text-caption truncate ${checked ? "text-primary font-medium" : "text-secondary"}`}>
              {label}
            </span>
          )}
          {description && (
            <span className="text-micro text-muted truncate">{description}</span>
          )}
        </span>
      </span>

      <span
        className={[
          "relative inline-flex items-center rounded-[var(--r-pill)] shrink-0",
          "border border-subtle transition-colors duration-[var(--dur-fast)]",
          s.track,
          checked ? toneClass[tone] : "bg-surface-data"
        ].join(" ")}
      >
        <span
          className={[
            "absolute left-[2px] rounded-full bg-white shadow-sm",
            "transition-transform duration-[var(--dur-fast)]",
            s.thumb,
            checked ? s.thumbOn : "translate-x-0"
          ].join(" ")}
        />
      </span>
    </button>
  );
}
