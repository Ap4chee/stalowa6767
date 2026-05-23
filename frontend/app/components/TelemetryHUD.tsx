"use client";

import { HoveredCoords } from "../types";

interface TelemetryHUDProps {
  hoveredCoords: HoveredCoords;
}

export function TelemetryHUD({ hoveredCoords }: TelemetryHUDProps) {
  return (
    <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 px-6 py-2 bg-slate-950/90 border border-slate-850 flex gap-6 text-[10px] font-mono shadow-2xl backdrop-blur-md clip-chamfer text-slate-400">
      <div className="flex flex-col">
        <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">CESIUM COORDINATES</span>
        <span className="text-cyan-400 font-bold tabular-nums">
          {hoveredCoords.lat.toFixed(6)}° N / {hoveredCoords.lon.toFixed(6)}° E
        </span>
      </div>
      <div className="flex flex-col border-l border-slate-800 pl-6">
        <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">ALTITUDE (EYE)</span>
        <span className="text-slate-300 font-sharetech font-semibold tabular-nums">{hoveredCoords.alt} m</span>
      </div>
      <div className="flex flex-col border-l border-slate-800 pl-6">
        <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">AZIMUTH (CAMERA)</span>
        <span className="text-slate-300 font-sharetech font-semibold tabular-nums">{hoveredCoords.az}°</span>
      </div>
      <div className="flex flex-col border-l border-slate-800 pl-6">
        <span className="text-slate-500 text-[8px] font-bold font-rajdhani tracking-wider">TACTICAL SCALE</span>
        <span className="text-emerald-450 font-bold font-rajdhani">B2G / STALOWA WOLA DIGITAL TWIN</span>
      </div>
    </footer>
  );
}
