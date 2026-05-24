"use client";

import { Shield, Compass, Volume2, VolumeX, Network, Sun, Moon, Crosshair } from "lucide-react";
import { LogType } from "../types";

interface HeaderProps {
  defcon: number;
  clockTime: string;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onAddLog: (text: string, type: LogType) => void;
  schemaModeEnabled: boolean;
  onToggleSchemaMode: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onOpenThreatViewer: () => void;
}

export function Header({
  defcon,
  clockTime,
  soundEnabled,
  onToggleSound,
  schemaModeEnabled,
  onToggleSchemaMode,
  theme,
  onToggleTheme,
  onOpenThreatViewer,
}: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-[60] flex justify-between items-center px-4 h-12 border-b theme-border theme-bg-panel font-rajdhani backdrop-blur-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 theme-neon-text animate-pulse" />
          <span className="font-extrabold tracking-widest text-[14px] theme-neon-text">STEEL SENTINEL</span>
          <span className="text-[9px] theme-bg-app border theme-border px-1.5 py-0.5 theme-text-secondary font-mono tracking-normal">
            CESIUM_COP v4.0.2
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 border-l theme-border pl-6 h-8 text-[11px] font-mono theme-text-secondary">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 theme-text-muted" />
            <span>STALOWA WOLA DIGITAL TWIN / REAL 3D GIS</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 font-mono">
        <button
          onClick={onToggleSchemaMode}
          className={`px-3 py-1 text-[10px] border flex items-center gap-1.5 font-bold tracking-widest transition-all cursor-pointer ${
            schemaModeEnabled
              ? "theme-neon-border bg-cyan-500/10 theme-neon-text animate-pulse"
              : "theme-border theme-text-secondary hover:theme-text-primary hover:theme-bg-panel-hover"
          }`}
          title="Przełącz podgląd grafu powiązań sieciowych"
        >
          <Network className="w-3.5 h-3.5" />
          <span>TRYB SCHEMATU</span>
        </button>
        <button
          onClick={onOpenThreatViewer}
          className="px-3 py-1 text-[10px] border flex items-center gap-1.5 font-bold tracking-widest transition-all cursor-pointer theme-border theme-text-secondary hover:theme-text-primary hover:theme-bg-panel-hover"
          title="Otwórz podgląd 3D modeli zagrożeń"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>ROZPOZNANIE 3D</span>
        </button>
        <div className={`flex items-center gap-2 px-3 py-1 border transition-all ${
          defcon === 1
            ? "border-red-600 bg-red-500/10 text-red-500 animate-pulse font-bold"
            : defcon === 2
            ? "border-orange-500 bg-orange-500/10 text-orange-500 animate-pulse"
            : defcon === 3
            ? "border-amber-400 bg-amber-500/10 text-amber-500"
            : "border-emerald-500 bg-emerald-500/10 text-emerald-500"
        }`}>
          <span className="text-[10px] font-bold tracking-widest">ZAGROŻENIE {defcon}</span>
          <span className={`w-2 h-2 rounded-full ${
            defcon === 1 ? "bg-red-500" : defcon === 2 ? "bg-orange-500" : defcon === 3 ? "bg-amber-400" : "bg-emerald-500"
          }`} />
        </div>
        <div className="text-[11px] theme-text-secondary tabular-nums border-l theme-border pl-4 h-12 flex items-center">
          {clockTime || "--:--:--"} UTC
        </div>
        
        {/* Theme Toggle Button */}
        <button
          onClick={onToggleTheme}
          className={`p-1.5 border transition-all flex items-center justify-center theme-bg-button hover:theme-bg-button/80 cursor-pointer ${
            theme === "light"
              ? "border-amber-500/60 text-amber-600 bg-amber-500/10"
              : "border-cyan-500/60 text-cyan-400 bg-cyan-950/10"
          }`}
          title={theme === "light" ? "Przełącz na Tryb Ciemny" : "Przełącz na Tryb Jasny"}
        >
          {theme === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onToggleSound}
          className={`p-1.5 border transition-all flex items-center justify-center theme-bg-button hover:theme-bg-button/80 cursor-pointer ${
            soundEnabled ? "theme-neon-border theme-neon-text bg-cyan-500/10" : "theme-border theme-text-muted"
          }`}
          title="Włącz/Wyłącz sygnały dźwiękowe"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
}
