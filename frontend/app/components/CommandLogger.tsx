"use client";

import { LogEntry } from "../types";

interface CommandLoggerProps {
  logs: LogEntry[];
  clockTime: string;
  isOpen: boolean;
}

export function CommandLogger({ logs, clockTime, isOpen }: CommandLoggerProps) {
  return (
    <section className={`fixed right-4 bottom-4 w-96 h-36 z-40 font-mono bg-slate-950/95 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md flex flex-col transition-all duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "translate-x-[420px]"
    }`}>
      <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center mb-1">
        <span>KONSOLA ZDARZEŃ BOJOWYCH I ALARMOWYCH</span>
        <span className="text-[8px] text-slate-500 font-sharetech">SECURE FEED // STW_COP</span>
      </div>
      <div className="flex-1 overflow-y-auto text-[10px] leading-relaxed text-slate-400 space-y-1 terminal-scroll pr-1 font-sharetech">
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-2">
            <span className="text-cyan-500/80 font-bold">[{log.timestamp}]</span>
            <span className={`flex-1 ${
              log.type === "error" ? "text-red-500 font-bold"
                : log.type === "warning" ? "text-amber-400"
                : log.type === "success" ? "text-emerald-400 font-semibold"
                : log.type === "combat" ? "text-red-400 font-bold tracking-wide"
                : "text-slate-300"
            }`}>
              {log.text}
            </span>
          </div>
        ))}
        <div className="flex gap-2">
          <span className="text-cyan-500/80 font-bold">[{clockTime || "--:--:--"}]</span>
          <span className="w-1.5 h-3 bg-cyan-400 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
