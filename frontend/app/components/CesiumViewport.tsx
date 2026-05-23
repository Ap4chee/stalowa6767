"use client";

import { MutableRefObject } from "react";

interface CesiumViewportProps {
  cesiumContainerRef: MutableRefObject<HTMLDivElement | null>;
  isSplitScreen?: boolean;
}

export function CesiumViewport({
  cesiumContainerRef,
  isSplitScreen = false
}: CesiumViewportProps) {
  return (
    <main className={`fixed inset-0 z-10 bg-slate-950 transition-all duration-500 ease-in-out ${
      isSplitScreen ? "opacity-0 pointer-events-none invisible" : "opacity-100"
    }`}>
      <div
        ref={cesiumContainerRef}
        className="w-full h-full cursor-crosshair relative"
      />
    </main>
  );
}
