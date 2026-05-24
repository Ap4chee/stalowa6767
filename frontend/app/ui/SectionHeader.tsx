"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  badge?: ReactNode;
  /** Right-aligned action area (button, link, etc.) */
  actions?: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  /** Visual weight of the header. */
  emphasis?: "regular" | "hero";
  className?: string;
}

export function SectionHeader({
  title,
  eyebrow,
  badge,
  actions,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  children,
  emphasis = "regular",
  className = ""
}: SectionHeaderProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const isHero = emphasis === "hero";

  const HeaderEl = collapsible ? "button" : "div";

  return (
    <div className={`flex flex-col min-h-0 ${className}`}>
      <HeaderEl
        type={collapsible ? "button" : undefined}
        onClick={collapsible ? () => setOpen(!isOpen) : undefined}
        className={`flex items-center justify-between gap-3 w-full text-left ${
          collapsible ? "cursor-pointer hover:bg-surface-hover" : ""
        } ${isHero ? "px-5 pt-4 pb-3" : "px-4 pt-3 pb-2"} rounded-(--r-lg)`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {collapsible && (
            <ChevronDown
              className={`w-4 h-4 shrink-0 text-muted transition-transform duration-(--dur-base) ${
                isOpen ? "rotate-0" : "-rotate-90"
              }`}
            />
          )}
          <div className="flex flex-col min-w-0">
            {eyebrow && (
              <span className="text-micro text-muted">{eyebrow}</span>
            )}
            <span className={`${isHero ? "text-title" : "text-heading"} text-primary truncate`}>
              {title}
            </span>
          </div>
        </div>
        {(badge || actions) && (
          <div className="flex items-center gap-2 shrink-0">
            {badge}
            {actions}
          </div>
        )}
      </HeaderEl>

      {children && (
        <div
          className={`flex flex-col min-h-0 overflow-hidden transition-[max-height,opacity] duration-(--dur-slow) ${
            isOpen ? "flex-1 opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!isOpen}
        >
          {children}
        </div>
      )}
    </div>
  );
}
