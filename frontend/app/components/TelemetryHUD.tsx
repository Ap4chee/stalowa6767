"use client";

import { HoveredCoords } from "../types";

interface TelemetryHUDProps {
  hoveredCoords: HoveredCoords;
}

export function TelemetryHUD({ hoveredCoords }: TelemetryHUDProps) {
  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-6 py-2 theme-bg-panel border theme-border flex gap-6 text-[10px] font-mono shadow-2xl backdrop-blur-md clip-chamfer theme-text-secondary">
      <div className="flex flex-col">
        <span className="theme-text-muted text-[8px] font-bold font-rajdhani tracking-wider">CESIUM COORDINATES</span>
        <span className="theme-neon-text font-bold tabular-nums">
          {hoveredCoords.lat.toFixed(6)}° N / {hoveredCoords.lon.toFixed(6)}° E
        </span>
      </div>
      <div className="flex flex-col border-l theme-border pl-6">
        <span className="theme-text-muted text-[8px] font-bold font-rajdhani tracking-wider">ALTITUDE (EYE)</span>
        <span className="theme-text-primary font-sharetech font-semibold tabular-nums">{hoveredCoords.alt} m</span>
      </div>
      <div className="flex flex-col border-l theme-border pl-6">
        <span className="theme-text-muted text-[8px] font-bold font-rajdhani tracking-wider">AZIMUTH (CAMERA)</span>
        <span className="theme-text-primary font-sharetech font-semibold tabular-nums">{hoveredCoords.az}°</span>
      </div>
      <div className="flex flex-col border-l theme-border pl-6">
        <span className="theme-text-muted text-[8px] font-bold font-rajdhani tracking-wider">TACTICAL SCALE</span>
        <span className="text-emerald-600 dark:text-emerald-450 font-bold font-rajdhani">B2G / STALOWA WOLA DIGITAL TWIN</span>
      </div>
    </footer>
  );
}
