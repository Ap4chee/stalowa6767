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
    5: "5 - FADE OUT (STAN POKOJU / MONITOROWANIE)",
    4: "4 - DOUBLE TAKE (PODWYŻSZONA CZUJNOŚĆ SZTABU)",
    3: "3 - ROUND HOUSE (GOTOWOŚĆ BOJOWA / MOBILIZACJA)",
    2: "2 - FAST PACE (BEZPOŚREDNIE ZAGROŻENIE ATAKIEM)",
    1: "1 - COCKED PISTOL (STAN WOJNY / ODPARCIE NALOTU)",
  };

  const isCritical = defcon <= 3;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* High-intensity vignette background overlay */}
      <div 
        onClick={() => setVisible(false)}
        className={`absolute inset-0 transition-opacity duration-700 cursor-pointer ${
          isCritical 
            ? "bg-red-950/40 shadow-[inset_0_0_100px_rgba(239,68,68,0.6)] animate-pulse" 
            : "bg-black/30 shadow-[inset_0_0_60px_rgba(245,158,11,0.35)]"
        }`} 
      />

      {/* Futuristic Tactical Warning Box */}
      <div className="relative w-[480px] theme-bg-panel border-2 border-red-500/80 p-6 clip-chamfer shadow-[0_0_40px_rgba(239,68,68,0.4)] backdrop-blur-xl flex flex-col items-center gap-4 animate-scaleUp pointer-events-auto">
        {/* Tech Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-red-500" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-red-500" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-red-500" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-red-500" />

        {/* Header bar */}
        <div className="flex items-center justify-between w-full border-b border-red-900/30 pb-2.5">
          <div className="flex items-center gap-2 text-red-500 font-extrabold tracking-wider text-[11px] font-sharetech animate-pulse">
            <ShieldAlert className="w-5 h-5" />
            <span>ALARM KRYZYSOWY SZTABU C2</span>
          </div>
          
          <button
            onClick={() => setVisible(false)}
            className="p-1 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded transition-colors cursor-pointer"
            title="Zamknij okno"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="flex flex-col items-center text-center gap-2 mt-2">
          <span className="text-[9px] theme-text-secondary tracking-widest font-mono uppercase">
            ZMIANA POZIOMU GOTOWOŚCI TAKTYCZNEJ
          </span>
          <span className="text-3xl font-black text-red-500 tracking-wider font-rajdhani animate-pulse">
            DEFCON {defcon}
          </span>
          <span className="text-[10px] font-bold font-sharetech theme-text-primary px-3 py-1 border border-red-500/30 bg-red-500/5 mt-1 rounded uppercase">
            {defconNames[defcon] || `POZIOM ${defcon}`}
          </span>
        </div>

        {/* Dismiss Controls Footer */}
        <div className="w-full flex items-center justify-between border-t border-red-900/20 pt-4 mt-2">
          <span className="text-[8px] theme-text-muted font-mono uppercase">
            KLIKNIJ TŁO LUB [ESC] ABY ODRAZU SKASOWAĆ
          </span>
          
          <button
            onClick={() => setVisible(false)}
            className="px-4 py-1.5 border border-red-500 bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-all font-bold text-[9px] tracking-widest clip-chamfer cursor-pointer"
          >
            ZATWIERDŹ I ZAMKNIJ [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
