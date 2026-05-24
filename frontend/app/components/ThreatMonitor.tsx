"use client";

import { Threat, CriticalNode } from "../types";
import { Panel, StatusPill } from "../ui";
import { ChevronDown } from "lucide-react";

interface ThreatMonitorProps {
  threats: Threat[];
  nodes: CriticalNode[];
  isCollapsed: boolean;
  onToggle: () => void;
}

const threatLabel: Record<string, string> = {
  DRONE: "Dron",
  SHAHED: "Shahed",
  MISSILE: "Rakieta"
};

const statusMeta: Record<Threat["status"], { tone: "error" | "ok" | "info" | "neutral"; label: string }> = {
  FLYING:      { tone: "error",   label: "Aktywny" },
  INTERCEPTED: { tone: "ok",      label: "Zestrzelony" },
  JAMMED:      { tone: "info",    label: "Zakłócony" },
  IMPACTED:    { tone: "neutral", label: "Trafienie" }
};

export function ThreatMonitor({ threats, nodes, isCollapsed, onToggle }: ThreatMonitorProps) {
  const activeCount = threats.filter(t => t.status === "FLYING").length;

  // Collapsed: compact bar with minimal chrome
  if (isCollapsed) {
    return (
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-(--r-md) bg-surface-1 elev-1 hover:bg-surface-hover cursor-pointer text-left w-full transition-colors shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown className="w-3.5 h-3.5 text-muted -rotate-90 transition-transform duration-(--dur-base)" />
          <span className="text-body text-primary">Wykryte cele</span>
        </div>
        {activeCount > 0 ? (
          <StatusPill tone="error" size="xs" dot pulse>{activeCount} aktywne</StatusPill>
        ) : (
          <span className="text-caption text-muted">brak echa</span>
        )}
      </button>
    );
  }

  // Expanded: full Panel
  return (
    <Panel variant="floating" rounded="xl" className="flex flex-col overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-surface-hover cursor-pointer text-left w-full transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <ChevronDown className="w-4 h-4 text-muted transition-transform duration-(--dur-base)" />
          <div className="flex flex-col leading-tight">
            <span className="text-micro text-muted">Radar</span>
            <span className="text-heading text-primary">Wykryte cele</span>
          </div>
        </div>
        {activeCount > 0 ? (
          <StatusPill tone="error" size="xs" dot pulse>{activeCount} aktywne</StatusPill>
        ) : (
          <span className="text-micro text-muted">brak echa</span>
        )}
      </button>

      <div className="px-3 pb-3 max-h-48 overflow-y-auto scroll-thin">
        {threats.length === 0 ? (
          <div className="px-3 py-6 text-caption text-muted text-center">
            Niebo czyste — brak aktywnych ech radarowych.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {[...threats].reverse().map((threat) => {
              const targetNode = nodes.find(n => n.id === threat.targetId);
              const meta = statusMeta[threat.status];

              return (
                <div
                  key={threat.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-(--r-sm) hover:bg-surface-hover transition-colors"
                >
                  <div className="flex flex-col min-w-0">
                    <span className={`text-caption truncate ${threat.status === "IMPACTED" ? "line-through text-muted" : "text-primary"}`}>
                      {threatLabel[threat.type] || threat.type}
                    </span>
                    <span className="text-micro text-muted truncate">
                      → {targetNode?.name || "nieznany cel"}
                    </span>
                  </div>
                  <StatusPill tone={meta.tone} size="xs" dot pulse={threat.status === "FLYING"}>
                    {meta.label}
                  </StatusPill>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
}
