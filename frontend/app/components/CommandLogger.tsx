"use client";

import { LogEntry } from "../types";
import { CollapsibleCard } from "./CollapsibleCard";

interface CommandLoggerProps {
  logs: LogEntry[];
  clockTime: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function CommandLogger({ logs, clockTime, isCollapsed, onToggle }: CommandLoggerProps) {
  return (
    <div className="w-full font-mono theme-bg-panel border theme-border clip-chamfer shadow-2xl backdrop-blur-md transition-all duration-300">
      <CollapsibleCard
        title="KONSOLA ZDARZEŃ"
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        badge={
          <span className="text-[8px] theme-text-muted font-sharetech">SECURE FEED</span>
        }
        headerClassName="px-3 py-1.5 theme-text-secondary hover:theme-bg-panel-hover border-b theme-border"
        fixedHeight={130}
      >
        <div className="overflow-y-auto text-[10px] leading-relaxed theme-text-secondary terminal-scroll font-sharetech" style={{ maxHeight: 130 }}>
          <div className="p-2 space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="flex gap-2">
                <span className="theme-neon-text font-bold shrink-0">[{log.timestamp}]</span>
                <span className={`${
                  log.type === "error" ? "text-red-600 dark:text-red-500 font-bold"
                    : log.type === "warning" ? "text-amber-600 dark:text-amber-400 font-semibold"
                    : log.type === "success" ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                    : log.type === "combat" ? "text-red-500 dark:text-red-400 font-bold tracking-wide"
                    : "theme-text-primary"
                }`}>
                  {log.text}
                </span>
              </div>
            ))}
            <div className="flex gap-2">
              <span className="theme-neon-text font-bold shrink-0">[{clockTime || "--:--:--"}]</span>
              <span className="w-1.5 h-3 theme-neon-bg animate-pulse" />
            </div>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
