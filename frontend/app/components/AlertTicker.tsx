"use client";

import { Threat } from "../types";

interface AlertTickerProps {
  threats: Threat[];
}

export function AlertTicker({ threats }: AlertTickerProps) {
  const hasActiveThreats = threats.filter(t => t.status === "FLYING").length > 0;

  return (
    <div className="fixed top-12 left-0 w-full h-6 bg-slate-900 border-b border-slate-800 z-[55] flex items-center font-mono">
      <div className="bg-slate-800 px-3 h-full flex items-center text-[9px] text-slate-300 font-bold border-r border-slate-700 font-rajdhani tracking-wider">
        TACTICAL FEED
      </div>
      <div className="ticker-wrap flex-1">
        <div className="ticker text-[10px] text-slate-400 py-1 font-sharetech select-none">
          {hasActiveThreats ? (
            <span className="text-red-500 animate-pulse font-bold">
              ⚠️ ALARM BOJOWY: WYKRYTO ZBLIŻAJĄCE SIĘ POCISKI I DRONY NIEPRZYJACIELA !!! STREFA OBRONY PILICA PRZECHODZI W TRYB STRZELANIA OSTRĄ AMUNICJĄ...
            </span>
          ) : (
            <span>
              SAT FEED: STALOWA WOLA NOMINALNA /// HUTA STALOWA WOLA S.A. SPRAWNA /// GPZ MAZIARNIA TRANZYTUJE PRĄD BEZ ZAKŁÓCEŃ /// MOST SAN DRĄŻONY RADARAMI /// CESIUM 3D TERRAIN RENDERER AKTYWNY
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
