"use client";

import { LogEntry } from "../types";
import { Panel } from "../ui";
import { ChevronDown } from "lucide-react";

interface CommandLoggerProps {
  logs: LogEntry[];
  clockTime: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

const typeColor: Record<LogEntry["type"], string> = {
  error:   "text-error",
  warning: "text-warn",
  success: "text-ok",
  combat:  "text-error",
  info:    "text-secondary"
};

export function CommandLogger({ logs, clockTime, isCollapsed, onToggle }: CommandLoggerProps) {
  // Collapsed: compact bar with minimal chrome
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-(--r-md) bg-surface-1 elev-1 hover:bg-surface-hover cursor-pointer text-left w-full transition-colors shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown className="w-3.5 h-3.5 text-muted -rotate-90 transition-transform duration-(--dur-base)" />
          <span className="text-body text-primary">Dziennik zdarzeń</span>
        </div>
        <span className="text-caption text-muted">{logs.length}</span>
      </button>
    );
  }

  // Expanded: full Panel with logs
  return (
    <Panel variant="floating" rounded="xl" className="flex flex-col overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown className="w-4 h-4 text-muted transition-transform duration-(--dur-base)" />
          <div className="flex flex-col leading-tight">
            <span className="text-micro text-muted">Konsola</span>
            <span className="text-heading text-primary">Dziennik zdarzeń</span>
          </div>
        </div>
        <span className="text-micro text-muted">{logs.length} wpisów</span>
      </button>

      <div className="px-3 pb-3 max-h-48 overflow-y-auto scroll-thin">
        <div className="flex flex-col gap-1 px-2 pb-1">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-3 text-caption leading-snug">
              <span className="text-muted shrink-0 text-data">{log.timestamp.slice(0, 8)}</span>
              <span className={typeColor[log.type] || "text-secondary"}>{log.text}</span>
            </div>
          ))}
          <div className="flex gap-3 text-caption leading-snug">
            <span className="text-muted shrink-0 text-data">{(clockTime || "--:--:--").slice(0, 8)}</span>
            <span className="w-1.5 h-3.5 bg-accent anim-blink" />
          </div>
        </div>
      </div>
    </Panel>
  );
}
