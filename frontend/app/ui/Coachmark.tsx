"use client";

import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";

interface CoachmarkProps {
  storageKey?: string;
  hideWhen?: boolean;
  title: string;
  steps: { num: number; label: string; hint?: string }[];
  footer?: ReactNode;
  position?: "top-right" | "top-center" | "bottom-center";
  className?: string;
}

export function Coachmark({
  storageKey,
  hideWhen = false,
  title,
  steps,
  footer,
  position = "top-center",
  className = ""
}: CoachmarkProps) {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (storageKey && typeof window !== "undefined") {
      const v = sessionStorage.getItem(storageKey);
      if (v === "dismissed") setDismissed(true);
    }
  }, [storageKey]);

  if (!mounted || dismissed || hideWhen) return null;

  const dismiss = () => {
    setDismissed(true);
    if (storageKey && typeof window !== "undefined") {
      sessionStorage.setItem(storageKey, "dismissed");
    }
  };

  const posClass = {
    "top-right":     "top-32 right-[22rem]",
    "top-center":    "top-32 left-1/2 -translate-x-1/2",
    "bottom-center": "bottom-24 left-1/2 -translate-x-1/2"
  }[position];

  return (
    <div className={`fixed z-55 pointer-events-auto ${posClass} anim-slide-down ${className}`}>
      <div className="relative bg-surface-2 elev-3 rounded-(--r-xl) px-5 py-4 min-w-80 max-w-[420px]">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover transition-colors cursor-pointer"
          aria-label="Zamknij podpowiedź"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-micro text-accent">Pierwsze kroki</span>
            <h3 className="text-title text-primary">{title}</h3>
          </div>

          <ol className="flex flex-col gap-2.5">
            {steps.map((s) => (
              <li key={s.num} className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-surface-data text-primary text-caption font-semibold flex items-center justify-center">
                  {s.num}
                </span>
                <div className="flex flex-col leading-snug pt-0.5">
                  <span className="text-body text-primary">{s.label}</span>
                  {s.hint && <span className="text-micro text-muted">{s.hint}</span>}
                </div>
              </li>
            ))}
          </ol>

          {footer && (
            <div className="pt-2 border-t border-subtle text-micro text-muted leading-snug">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
