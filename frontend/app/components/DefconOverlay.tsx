"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, X } from "lucide-react";

interface DefconOverlayProps {
  defcon: number;
}

export function DefconOverlay({ defcon }: DefconOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [prevDefcon, setPrevDefcon] = useState(defcon);

  // Trigger overlay when DEFCON level changes (and is not normal DEFCON 5 on initial load)
  useEffect(() => {
    if (defcon !== prevDefcon) {
      setVisible(true);
      setPrevDefcon(defcon);
      
      // Auto-hide after 6 seconds so it doesn't clog the dashboard
      const timer = setTimeout(() => {
        setVisible(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [defcon, prevDefcon]);

  // Support Escape key to close the overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setVisible(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!visible) return null;

  const defconNames: Record<number, string> = {
    5: "STAN POKOJU / NORMALNY MONITORING OCHRONNY",
    4: "PODWYŻSZONA CZUJNOŚĆ SZTABU I SYSTEMÓW OPL",
    3: "GOTOWOŚĆ BOJOWA / PEŁNA MOBILIZACJA WĘZŁÓW",
    2: "BEZPOŚREDNIE ZAGROŻENIE ATAKIEM POWIETRZNYM",
    1: "STAN WOJNY / AKTYWNE ODPARCIE NALOTU saturacyjnego",
  };

  const isCritical = defcon <= 3;

  return (
    <div className="fixed inset-0 z-[50] pointer-events-none select-none flex justify-center items-start">
      {/* Subtly pulsed screen-edge vignette (pure visual overlay, no clicks blocked) */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${
          isCritical 
            ? "shadow-[inset_0_0_50px_rgba(239,68,68,0.35)] animate-pulse" 
            : "shadow-[inset_0_0_25px_rgba(245,158,11,0.15)]"
        }`} 
      />

      {/* Futuristic, non-blocking Top-Center Alert Ribbon (only this bar captures hover/clicks) */}
      <div className="absolute top-[78px] w-[420px] theme-bg-panel border border-red-500/40 p-2 py-1.5 px-3.5 clip-chamfer shadow-[0_4px_20px_rgba(0,0,0,0.6)] backdrop-blur-md flex items-center justify-between gap-3 animate-slideDown pointer-events-auto relative">
        {/* Sleek tactical left bar indicator */}
        <div className={`absolute top-0 bottom-0 left-0 w-1 ${isCritical ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />

        {/* Warning Information display */}
        <div className="flex items-center gap-2.5">
          <ShieldAlert className={`w-4 h-4 ${isCritical ? "text-red-500 animate-pulse" : "text-amber-550"}`} />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-red-500 tracking-wider font-rajdhani uppercase">
              STATUS GOTOWOŚCI: DEFCON {defcon}
            </span>
            <span className="text-[7.5px] theme-text-secondary font-sharetech font-bold uppercase tracking-wide">
              {defconNames[defcon] || `GOTOWOŚĆ POZIOM ${defcon}`}
            </span>
          </div>
        </div>

        {/* Small Action and Dismiss controls */}
        <div className="flex items-center gap-1.5 border-l theme-border pl-2.5">
          <button
            onClick={() => setVisible(false)}
            className="px-1.5 py-0.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded transition-all cursor-pointer text-[7.5px] font-bold font-sharetech uppercase tracking-widest border border-red-500/20"
          >
            ZATWIERDŹ
          </button>
          
          <button
            onClick={() => setVisible(false)}
            className="p-0.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded transition-colors cursor-pointer"
            title="Zamknij alarm (ESC)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
