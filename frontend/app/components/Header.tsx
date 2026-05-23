"use client";

import { Shield, Compass, Volume2, VolumeX } from "lucide-react";
import { LogType } from "../types";

interface HeaderProps {
  defcon: number;
  clockTime: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAddLog: (text: string, type: LogType) => void;
}

export function Header({ defcon, clockTime, soundEnabled, onToggleSound }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-[60] flex justify-between items-center px-4 h-12 border-b border-slate-800 bg-slate-950 font-rajdhani">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-500 animate-pulse" />
          <span className="font-extrabold tracking-widest text-[14px] text-cyan-500">STEEL SENTINEL</span>
          <span className="text-[9px] bg-slate-800 border border-slate-700 px-1.5 py-0.5 text-slate-400 font-mono tracking-normal">
            CESIUM_COP v4.0.2
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 border-l border-slate-800 pl-6 h-8 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            <span>STALOWA WOLA DIGITAL TWIN / REAL 3D GIS</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <div className={`flex items-center gap-2 px-3 py-1 border transition-all ${
          defcon === 1
            ? "border-red-600 bg-red-950/20 text-red-500 animate-pulse font-bold"
            : defcon === 2
            ? "border-orange-500 bg-orange-950/20 text-orange-500 animate-pulse"
            : defcon === 3
            ? "border-amber-400 bg-amber-900/10 text-amber-400"
            : "border-emerald-500 bg-emerald-950/10 text-emerald-400"
        }`}>
          <span className="text-[10px] font-bold tracking-widest">DEFCON {defcon}</span>
          <span className={`w-2 h-2 rounded-full ${
            defcon === 1 ? "bg-red-500" : defcon === 2 ? "bg-orange-500" : defcon === 3 ? "bg-amber-400" : "bg-emerald-500"
          }`} />
        </div>
        <div className="text-[11px] text-slate-400 tabular-nums border-l border-slate-800 pl-4 h-12 flex items-center">
          {clockTime || "--:--:--"} UTC
        </div>
        <button
          onClick={onToggleSound}
          className={`p-1.5 border transition-all flex items-center justify-center hover:bg-slate-900 ${
            soundEnabled ? "border-cyan-500 text-cyan-400 bg-cyan-950/10" : "border-slate-800 text-slate-500"
          }`}
          title="Włącz/Wyłącz sygnały dźwiękowe"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
