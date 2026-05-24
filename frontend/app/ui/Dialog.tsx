"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  /** Width preset. */
  width?: "sm" | "md" | "lg";
  /** Optional footer slot (typically buttons). Rendered with top divider. */
  footer?: ReactNode;
  /** Close when backdrop is clicked. Default true. */
  closeOnBackdrop?: boolean;
  /** Close when ESC is pressed. Default true. */
  closeOnEscape?: boolean;
  /** Show the X close button in the top-right. Default true. */
  showCloseButton?: boolean;
  children: ReactNode;
  className?: string;
}

const widthClass = {
  sm: "w-96",
  md: "w-[28rem]",
  lg: "w-[34rem]"
} as const;

export function Dialog({
  open,
  onClose,
  title,
  eyebrow,
  width = "md",
  footer,
  closeOnBackdrop = true,
  closeOnEscape = true,
  showCloseButton = true,
  children,
  className = ""
}: DialogProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, closeOnEscape, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm anim-fade-in"
      onMouseDown={(e) => {
        if (!closeOnBackdrop) return;
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "dialog-title" : undefined}
        className={`relative ${widthClass[width]} max-w-full max-h-[88vh] bg-surface-2 rounded-(--r-xl) elev-3 flex flex-col overflow-hidden anim-slide-down ${className}`}
      >
        {(title || eyebrow || showCloseButton) && (
          <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
            <div className="flex flex-col min-w-0 flex-1">
              {eyebrow && <span className="text-micro text-muted">{eyebrow}</span>}
              {title && (
                <h3 id="dialog-title" className="text-title text-primary truncate">
                  {title}
                </h3>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Zamknij"
                className="p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto scroll-thin px-6 pb-5">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-4 border-t border-subtle bg-surface-1 flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
