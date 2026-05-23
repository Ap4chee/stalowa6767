"use client";

import { Threat } from "../types";

interface AlertTickerProps {
  threats: Threat[];
}

export function AlertTicker({ threats }: AlertTickerProps) {
  const hasActiveThreats = threats.filter(t => t.status === "FLYING").length > 0;

  return (
    <div className="fixed top-12 left-0 w-full h-6 theme-bg-panel border-b theme-border z-[55] flex items-center font-mono">
      <div className="theme-bg-button px-3 h-full flex items-center text-[9px] theme-text-primary font-bold border-r theme-border font-rajdhani tracking-wider">
        TACTICAL FEED
      </div>
      <div className="ticker-wrap flex-1">
        <div className="ticker text-[10px] theme-text-secondary py-1 font-sharetech select-none">
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
