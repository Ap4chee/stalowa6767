"use client";

import { Activity } from "lucide-react";
import { MutableRefObject } from "react";

interface CesiumViewportProps {
  cesiumContainerRef: MutableRefObject<HTMLDivElement | null>;
  isSplitScreen?: boolean;
}

export function CesiumViewport({ cesiumContainerRef, isSplitScreen = false }: CesiumViewportProps) {
  return (
    <main className={`fixed inset-0 pt-[72px] z-10 bg-slate-950 transition-all duration-500 ease-in-out ${
      isSplitScreen ? "opacity-0 pointer-events-none invisible" : "opacity-100"
    }`}>
      <div
        ref={cesiumContainerRef}
        className="w-full h-full cursor-crosshair relative"
      />
      <div className="absolute top-16 left-6 pointer-events-none z-30 font-mono flex flex-col gap-1 border theme-border theme-bg-panel p-2.5 clip-chamfer theme-text-secondary shadow-lg">
        <div className="text-[9px] theme-text-muted flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 theme-neon-text animate-pulse" />
          <span>CESIUM_GIS_LINK</span>
        </div>
        <div className="font-bold text-[10px] theme-text-primary">STW_GRID: 3D TERRAIN ACTIVE</div>
      </div>
    </main>
  );
}
