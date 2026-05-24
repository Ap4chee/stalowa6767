"use client";

interface HealthBarProps {
  value: number;
  label?: string;
  size?: "xs" | "sm" | "md";
  showValue?: boolean;
  className?: string;
}

function toneFor(value: number): { bar: string; text: string } {
  if (value > 60) return { bar: "bg-[var(--ok)]",    text: "text-ok" };
  if (value > 25) return { bar: "bg-[var(--warn)]",  text: "text-warn" };
  return { bar: "bg-[var(--error)]", text: "text-error" };
}

const heightClass = { xs: "h-1", sm: "h-1.5", md: "h-2" } as const;

export function HealthBar({
  value,
  label,
  size = "sm",
  showValue = true,
  className = ""
}: HealthBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const tone = toneFor(clamped);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between text-micro">
          {label && <span className="text-muted">{label}</span>}
          {showValue && (
            <span className={`text-data ${tone.text}`}>{Math.round(clamped)}%</span>
          )}
        </div>
      )}
      <div className={`w-full ${heightClass[size]} bg-surface-data rounded-[var(--r-pill)] overflow-hidden`}>
        <div
          className={`h-full rounded-[var(--r-pill)] transition-[width] duration-[var(--dur-slow)] ${tone.bar}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
