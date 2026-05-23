"use client";

import { AlertTriangle } from "lucide-react";
import { CriticalNode } from "../types";

interface CascadeGraphProps {
  nodes: CriticalNode[];
  coolingSecondsLeft: number | null;
  waterSecondsLeft: number | null;
}

export function CascadeGraph({ nodes, coolingSecondsLeft, waterSecondsLeft }: CascadeGraphProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 terminal-scroll flex flex-col">
      <div className="text-[10px] theme-text-secondary font-rajdhani tracking-wider pb-1 border-b theme-border">
        <span>GRAF ZALEŻNOŚCI MIĘDZYWĘZŁOWYCH</span>
      </div>

      {(coolingSecondsLeft !== null || waterSecondsLeft !== null) && (
        <div className="bg-red-500/10 border border-red-500/40 p-2 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-red-650 dark:text-red-500 font-bold">
            <AlertTriangle className="w-4 h-4 animate-ping" />
            <span>AKTYWNE ODPOWIEDZI KASKADOWE:</span>
          </div>
          {waterSecondsLeft !== null && (
            <div className="text-[10px] text-red-600 dark:text-red-400 flex justify-between">
              <span>Pompy Ujęcia MZK stają za:</span>
              <span className="font-bold text-red-600 dark:text-red-500 animate-pulse">{waterSecondsLeft}h</span>
            </div>
          )}
          {coolingSecondsLeft !== null && (
            <div className="text-[10px] text-red-600 dark:text-red-400 flex justify-between">
              <span>Wyłączenie bloku Elektrowni za:</span>
              <span className="font-bold text-red-600 dark:text-red-500 animate-pulse">{coolingSecondsLeft}h</span>
            </div>
          )}
        </div>
      )}

      <div className="h-44 theme-bg-panel border theme-border flex flex-col relative justify-center items-center overflow-hidden">
        <span className="absolute top-1 left-1 text-[8px] theme-text-muted font-mono">NET_DEPENDENCY_COP</span>
        <svg className="w-full h-full" viewBox="0 0 280 160">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill="var(--text-muted)" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#22c55e" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 2 L 10 5 L 0 8 z" fill="#ef4444" />
            </marker>
          </defs>

          <path d="M 120,40 L 70,80"
            stroke={nodes[1]?.status === "DESTROYED" ? "#ef4444" : "#22c55e"}
            strokeWidth="1.5"
            strokeDasharray={nodes[1]?.status === "DESTROYED" ? "3" : "none"}
            markerEnd={nodes[1]?.status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
          />
          <path d="M 120,40 L 190,40"
            stroke={nodes[1]?.status === "DESTROYED" ? "#ef4444" : "#22c55e"}
            strokeWidth="1.5"
            strokeDasharray={nodes[1]?.status === "DESTROYED" ? "3" : "none"}
            markerEnd={nodes[1]?.status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
          />
          <path d="M 190,50 L 120,50"
            stroke={nodes[2]?.status === "DESTROYED" ? "#ef4444" : "#22c55e"}
            strokeWidth="1.5"
            strokeDasharray={nodes[2]?.status === "DESTROYED" ? "3" : "none"}
            markerEnd={nodes[2]?.status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
          />
          <path d="M 210,105 L 140,105"
            stroke={nodes[3]?.status === "DESTROYED" ? "#ef4444" : "#22c55e"}
            strokeWidth="1.5"
            strokeDasharray={nodes[3]?.status === "DESTROYED" ? "3" : "none"}
            markerEnd={nodes[3]?.status === "DESTROYED" ? "url(#arrow-red)" : "url(#arrow-green)"}
          />

          <g transform="translate(120,45)">
            <circle r="12" fill="var(--bg-app)" stroke={nodes[1]?.status === "DESTROYED" ? "#ef4444" : nodes[1]?.status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="var(--text-primary)" fontSize="8" fontWeight="bold">E2</text>
          </g>
          <g transform="translate(60,85)">
            <circle r="12" fill="var(--bg-app)" stroke={nodes[0]?.status === "DESTROYED" ? "#ef4444" : nodes[0]?.status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="var(--text-primary)" fontSize="8" fontWeight="bold">H1</text>
          </g>
          <g transform="translate(200,45)">
            <circle r="12" fill="var(--bg-app)" stroke={nodes[2]?.status === "DESTROYED" ? "#ef4444" : nodes[2]?.status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="var(--text-primary)" fontSize="8" fontWeight="bold">W3</text>
          </g>
          <g transform="translate(220,105)">
            <circle r="12" fill="var(--bg-app)" stroke={nodes[3]?.status === "DESTROYED" ? "#ef4444" : nodes[3]?.status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="var(--text-primary)" fontSize="8" fontWeight="bold">G4</text>
          </g>
          <g transform="translate(130,105)">
            <circle r="12" fill="var(--bg-app)" stroke={nodes[6]?.status === "DESTROYED" ? "#ef4444" : nodes[6]?.status === "DEGRADED" ? "#eab308" : "#22c55e"} strokeWidth="2" />
            <text textAnchor="middle" dy="4" fill="var(--text-primary)" fontSize="8" fontWeight="bold">K7</text>
          </g>
        </svg>
      </div>

      <div className="flex-1 space-y-1.5 text-[9px] leading-tight theme-text-secondary">
        <div className="border theme-border p-1.5 theme-bg-panel">
          <span className="font-bold theme-text-primary">Elektrownia (E2) ➡️ Huta HSW (H1):</span>
          <p>Utrata zasilania Pieców Hutniczych. Generatory podtrzymują minimalne dogrzanie blach (15% mocy).</p>
        </div>
        <div className="border theme-border p-1.5 theme-bg-panel">
          <span className="font-bold theme-text-primary">Pętla sprzężenia chłodzenia (W3) 🔄 (E2):</span>
          <p>Wodociągi (W3) dostarczają wodę chłodzącą do Elektrowni (E2). Jej odcięcie wygasza blok turbin w 2h. Z kolei brak zasilania z E2 odcina pompy w W3 (bufor zapasów w zbiornikach: 12h).</p>
        </div>
      </div>
    </div>
  );
}
