"use client";

import { ReactNode } from "react";

export type StatusTone = "ok" | "warn" | "error" | "critical" | "info" | "accent" | "neutral";

interface StatusPillProps {
  tone?: StatusTone;
  size?: "xs" | "sm" | "md";
  icon?: ReactNode;
  dot?: boolean;
  pulse?: boolean;
  children: ReactNode;
  className?: string;
}

const toneStyle: Record<StatusTone, { bg: string; text: string; border: string; dot: string }> = {
  ok:       { bg: "bg-ok-soft",       text: "text-ok",       border: "border-ok/40",       dot: "bg-[var(--ok)]" },
  warn:     { bg: "bg-warn-soft",     text: "text-warn",     border: "border-warn/40",     dot: "bg-[var(--warn)]" },
  error:    { bg: "bg-error-soft",    text: "text-error",    border: "border-error/40",    dot: "bg-[var(--error)]" },
  critical: { bg: "bg-critical-soft", text: "text-critical", border: "border-critical/50", dot: "bg-[var(--critical)]" },
  info:     { bg: "bg-info-soft",     text: "text-info",     border: "border-info/40",     dot: "bg-[var(--info)]" },
  accent:   { bg: "bg-accent-soft",   text: "text-accent",   border: "border-accent/40",   dot: "bg-[var(--accent)]" },
  neutral:  { bg: "bg-surface-data",  text: "text-secondary",border: "border-subtle",      dot: "bg-[var(--text-3)]" }
};

const sizeStyle = {
  xs: "text-micro px-1.5 py-[2px] gap-1",
  sm: "text-caption px-2 py-[3px] gap-1.5",
  md: "text-label px-2.5 py-1 gap-2"
};

export function StatusPill({
  tone = "neutral",
  size = "sm",
  icon,
  dot = false,
  pulse = false,
  children,
  className = ""
}: StatusPillProps) {
  const s = toneStyle[tone];
  return (
    <span
      className={[
        "inline-flex items-center font-medium rounded-[var(--r-sm)] border",
        s.bg, s.text, s.border,
        sizeStyle[size],
        pulse ? "anim-pulse" : "",
        className
      ].join(" ")}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${pulse ? "anim-pulse" : ""}`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
