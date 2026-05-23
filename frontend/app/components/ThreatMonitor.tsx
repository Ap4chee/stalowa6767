"use client";

import { Threat, CriticalNode } from "../types";

interface ThreatMonitorProps {
  threats: Threat[];
  nodes: CriticalNode[];
  isOpen: boolean;
}

export function ThreatMonitor({ threats, nodes, isOpen }: ThreatMonitorProps) {
  const activeCount = threats.filter(t => t.status === "FLYING").length;

  return (
    <section className={`fixed left-4 bottom-4 w-80 h-36 z-40 font-mono bg-slate-950/90 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md flex flex-col transition-all duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-[340px]"
    }`}>
      <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center mb-1">
        <span>MONITOR WYKRYWANIA RADAROWEGO</span>
        <span className="text-[9px] bg-red-950/20 px-1 border border-red-550/40 text-red-500 font-bold font-sharetech">
          {activeCount} ECHO CELE
        </span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1 terminal-scroll">
        {threats.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[10px] text-slate-600 font-sharetech italic select-none">
            BRAK AKTYWNYCH ECH W ZAKRESIE RADAROWYM
          </div>
        ) : (
          [...threats].reverse().map((threat) => {
            const targetNode = nodes.find(n => n.id === threat.targetId);
            return (
              <div key={threat.id}
                className={`p-1.5 border flex items-center justify-between ${
                  threat.status === "FLYING" ? "border-red-950 bg-red-950/10 text-red-400"
                    : threat.status === "INTERCEPTED" ? "border-emerald-950 bg-emerald-950/10 text-emerald-400 font-semibold"
                    : threat.status === "JAMMED" ? "border-blue-950 bg-blue-950/10 text-blue-400"
                    : "border-slate-900 bg-slate-900/50 text-slate-550 line-through"
                }`}>
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-[9px] font-sharetech">{threat.name} ({threat.type})</span>
                  <span className="text-[8px] text-slate-400/80">Zmierza ku: {targetNode?.name || "Nieznany"}</span>
                </div>
                <span className="text-[9px] font-bold font-rajdhani px-1 py-0.5">
                  {threat.status === "FLYING" && "AKTYWNY"}
                  {threat.status === "INTERCEPTED" && "ZESTRZELONY"}
                  {threat.status === "JAMMED" && "ZAKŁÓCONY"}
                  {threat.status === "IMPACTED" && "TRAFIENIE"}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
