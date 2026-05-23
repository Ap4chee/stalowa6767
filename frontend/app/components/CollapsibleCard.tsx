"use client";

import { ChevronDown } from "lucide-react";
import { ReactNode, useRef, useState, useEffect } from "react";

interface CollapsibleCardProps {
  title: string;
  badge?: ReactNode;
  isCollapsed: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  fixedHeight?: number;
}

export function CollapsibleCard({
  title,
  badge,
  isCollapsed,
  onToggle,
  children,
  className = "",
  headerClassName = "",
  contentClassName = "",
  fixedHeight
}: CollapsibleCardProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  return (
    <div className={`flex flex-col ${className}`}>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full cursor-pointer transition-all text-left ${headerClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-300 ${
              isCollapsed ? "-rotate-90" : "rotate-0"
            }`}
          />
          <span className="text-[10px] font-bold tracking-wider truncate">{title}</span>
        </div>
        {badge && <div className="shrink-0 ml-2">{badge}</div>}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? "overflow-hidden" : "flex-1 min-h-0 flex flex-col"
        }`}
        style={{
          maxHeight: isCollapsed
            ? "0px"
            : fixedHeight
            ? `${fixedHeight}px`
            : "none",
          opacity: isCollapsed ? 0 : 1
        }}
      >
        <div ref={contentRef} className={`w-full ${contentClassName}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
