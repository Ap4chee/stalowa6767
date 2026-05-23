"use client";

import { Threat, CriticalNode } from "../types";
import { CollapsibleCard } from "./CollapsibleCard";

interface ThreatMonitorProps {
  threats: Threat[];
  nodes: CriticalNode[];
  isCollapsed: boolean;
  onToggle: () => void;
}

export function ThreatMonitor({ threats, nodes, isCollapsed, onToggle }: ThreatMonitorProps) {
  const activeCount = threats.filter(t => t.status === "FLYING").length;

  return (
    <div className="w-full font-mono theme-bg-panel border theme-border clip-chamfer shadow-2xl backdrop-blur-md transition-all duration-300">
      <CollapsibleCard
        title="MONITOR RADAROWY"
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        badge={
          <span className={`text-[9px] px-1.5 border font-bold font-sharetech ${
            activeCount > 0
              ? "bg-red-950/20 border-red-550/40 text-red-500"
              : "theme-bg-app border theme-border theme-text-muted"
          }`}>
            {activeCount} CELE
          </span>
        }
        headerClassName={`px-3 py-1.5 transition-all ${
          activeCount > 0
            ? "text-red-400 bg-red-950/10 hover:bg-red-950/20 border-b border-red-900/30 cursor-pointer"
            : "theme-text-secondary hover:theme-bg-panel-hover border-b theme-border cursor-pointer"
        }`}
        fixedHeight={130}
      >
        <div className="overflow-y-auto terminal-scroll" style={{ maxHeight: 130 }}>
          {threats.length === 0 ? (
            <div className="h-[100px] flex items-center justify-center text-[10px] theme-text-muted font-sharetech italic select-none">
              BRAK AKTYWNYCH ECH
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {[...threats].reverse().map((threat) => {
                const targetNode = nodes.find(n => n.id === threat.targetId);
                return (
                  <div key={threat.id}
                    className={`p-1.5 border flex items-center justify-between ${
                      threat.status === "FLYING" ? "border-red-500/60 bg-red-500/10 text-red-700 dark:text-red-400"
                        : threat.status === "INTERCEPTED" ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                        : threat.status === "JAMMED" ? "border-cyan-550 bg-cyan-500/10 text-cyan-750 dark:text-cyan-400"
                        : "theme-border theme-bg-app theme-text-muted line-through"
                    }`}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-[9px] font-sharetech">{threat.name} ({threat.type})</span>
                      <span className="text-[8px] theme-text-secondary font-semibold">Cel: {targetNode?.name || "Nieznany"}</span>
                    </div>
                    <span className="text-[9px] font-bold font-rajdhani px-1 py-0.5">
                      {threat.status === "FLYING" && "AKTYWNY"}
                      {threat.status === "INTERCEPTED" && "ZESTRZELONY"}
                      {threat.status === "JAMMED" && "ZAKŁÓCONY"}
                      {threat.status === "IMPACTED" && "TRAFIENIE"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
}
