"use client";

import { Activity } from "lucide-react";
import { MutableRefObject } from "react";

interface CesiumViewportProps {
  cesiumContainerRef: MutableRefObject<HTMLDivElement | null>;
}

export function CesiumViewport({ cesiumContainerRef }: CesiumViewportProps) {
  return (
    <main className="fixed inset-0 pt-[72px] z-10 bg-slate-950">
      <div
        ref={cesiumContainerRef}
        className="w-full h-full cursor-crosshair relative"
      />
      <div className="absolute top-6 left-6 pointer-events-none z-30 font-mono text-slate-500 flex flex-col gap-1 border border-slate-850 bg-slate-950/90 p-2.5 clip-chamfer">
        <div className="text-[9px] text-slate-400 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-500 animate-pulse" />
          <span>CESIUM_GIS_LINK</span>
        </div>
        <div className="font-bold text-[10px] text-slate-300">STW_GRID: 3D TERRAIN ACTIVE</div>
      </div>
    </main>
  );
}
