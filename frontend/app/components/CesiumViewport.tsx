"use client";

import { Activity, Layers, Map, Target, Shield, Grid, Waves } from "lucide-react";
import { MutableRefObject, useState } from "react";

interface CesiumViewportProps {
  cesiumContainerRef: MutableRefObject<HTMLDivElement | null>;
  isSplitScreen?: boolean;
  mapLayers: {
    baseMap: boolean;
    nodes: boolean;
    domes: boolean;
    threats: boolean;
    tacticalZones: boolean;
    hydrology: boolean;
  };
  onToggleLayer: (key: keyof CesiumViewportProps["mapLayers"]) => void;
}

export function CesiumViewport({
  cesiumContainerRef,
  isSplitScreen = false,
  mapLayers,
  onToggleLayer
}: CesiumViewportProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <main className={`fixed inset-0 pt-[72px] z-10 bg-slate-950 transition-all duration-500 ease-in-out ${
      isSplitScreen ? "opacity-0 pointer-events-none invisible" : "opacity-100"
    }`}>
      <div
        ref={cesiumContainerRef}
        className="w-full h-full cursor-crosshair relative"
      />
      
      {/* Interactive Tactical GIS Layer Controller */}
      <div 
        style={{ top: "80px", left: "352px", position: "absolute" }}
        className="z-30 font-mono flex flex-col gap-2 border theme-border theme-bg-panel p-3 rounded-lg theme-text-secondary shadow-xl w-64 pointer-events-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b theme-border pb-2">
          <div className="flex flex-col">
            <div className="text-[9px] theme-text-muted flex items-center gap-1.5">
              <Activity className="w-3 h-3 theme-neon-text animate-pulse" />
              <span>STW_GRID: GIS LINK</span>
            </div>
            <div className="font-bold text-[10px] theme-text-primary tracking-wide">WARSTWY TAKTYCZNE</div>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:theme-bg-panel-hover theme-text-muted hover:theme-text-primary rounded border theme-border transition-all cursor-pointer"
            title="Zarządzaj warstwami"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Collapsible Layer Selector */}
        <div className={`flex flex-col gap-1.5 overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-64 opacity-100 mt-1" : "max-h-0 opacity-0 pointer-events-none"
        }`}>
          {/* Base Map Toggle */}
          <button
            onClick={() => onToggleLayer("baseMap")}
            className="flex justify-between items-center text-[10px] px-2 py-1.5 rounded theme-bg-button hover:theme-bg-button-hover transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Map className={`w-3.5 h-3.5 ${mapLayers.baseMap ? "theme-neon-text" : "theme-text-muted"}`} />
              <span className={mapLayers.baseMap ? "theme-text-primary font-bold" : "theme-text-muted"}>Podkład Satelitarny</span>
            </div>
            <div className={`w-6 h-3 rounded-full border relative transition-all duration-250 ${
              mapLayers.baseMap ? "bg-cyan-500/20 border-cyan-500" : "theme-bg-app theme-border"
            }`}>
              <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-250 ${
                mapLayers.baseMap ? "right-0.5 bg-cyan-500" : "left-0.5 theme-bg-muted"
              }`} />
            </div>
          </button>

          {/* Strategic Nodes Toggle */}
          <button
            onClick={() => onToggleLayer("nodes")}
            className="flex justify-between items-center text-[10px] px-2 py-1.5 rounded theme-bg-button hover:theme-bg-button-hover transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Target className={`w-3.5 h-3.5 ${mapLayers.nodes ? "theme-neon-text" : "theme-text-muted"}`} />
              <span className={mapLayers.nodes ? "theme-text-primary font-bold" : "theme-text-muted"}>Węzły Strategiczne</span>
            </div>
            <div className={`w-6 h-3 rounded-full border relative transition-all duration-250 ${
              mapLayers.nodes ? "bg-cyan-500/20 border-cyan-500" : "theme-bg-app theme-border"
            }`}>
              <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-250 ${
                mapLayers.nodes ? "right-0.5 bg-cyan-500" : "left-0.5 theme-bg-muted"
              }`} />
            </div>
          </button>

          {/* Defense Domes Toggle */}
          <button
            onClick={() => onToggleLayer("domes")}
            className="flex justify-between items-center text-[10px] px-2 py-1.5 rounded theme-bg-button hover:theme-bg-button-hover transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Shield className={`w-3.5 h-3.5 ${mapLayers.domes ? "theme-neon-text" : "theme-text-muted"}`} />
              <span className={mapLayers.domes ? "theme-text-primary font-bold" : "theme-text-muted"}>Kopuły Ochronne</span>
            </div>
            <div className={`w-6 h-3 rounded-full border relative transition-all duration-250 ${
              mapLayers.domes ? "bg-cyan-500/20 border-cyan-500" : "theme-bg-app theme-border"
            }`}>
              <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-250 ${
                mapLayers.domes ? "right-0.5 bg-cyan-500" : "left-0.5 theme-bg-muted"
              }`} />
            </div>
          </button>

          {/* Threat Vectors Toggle */}
          <button
            onClick={() => onToggleLayer("threats")}
            className="flex justify-between items-center text-[10px] px-2 py-1.5 rounded theme-bg-button hover:theme-bg-button-hover transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Activity className={`w-3.5 h-3.5 ${mapLayers.threats ? "text-red-500" : "theme-text-muted"}`} />
              <span className={mapLayers.threats ? "theme-text-primary font-bold" : "theme-text-muted"}>Wektory Zagrożeń</span>
            </div>
            <div className={`w-6 h-3 rounded-full border relative transition-all duration-250 ${
              mapLayers.threats ? "bg-red-500/20 border-red-500" : "theme-bg-app theme-border"
            }`}>
              <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-250 ${
                mapLayers.threats ? "right-0.5 bg-red-500" : "left-0.5 theme-bg-muted"
              }`} />
            </div>
          </button>

          {/* Tactical Zones & Grid Toggle */}
          <button
            onClick={() => onToggleLayer("tacticalZones")}
            className="flex justify-between items-center text-[10px] px-2 py-1.5 rounded theme-bg-button hover:theme-bg-button-hover transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Grid className={`w-3.5 h-3.5 ${mapLayers.tacticalZones ? "theme-neon-text" : "theme-text-muted"}`} />
              <span className={mapLayers.tacticalZones ? "theme-text-primary font-bold" : "theme-text-muted"}>Siatka i Strefy</span>
            </div>
            <div className={`w-6 h-3 rounded-full border relative transition-all duration-250 ${
              mapLayers.tacticalZones ? "bg-cyan-500/20 border-cyan-500" : "theme-bg-app theme-border"
            }`}>
              <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-250 ${
                mapLayers.tacticalZones ? "right-0.5 bg-cyan-500" : "left-0.5 theme-bg-muted"
              }`} />
            </div>
          </button>

          {/* Hydrology Toggle */}
          <button
            onClick={() => onToggleLayer("hydrology")}
            className="flex justify-between items-center text-[10px] px-2 py-1.5 rounded theme-bg-button hover:theme-bg-button-hover transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Waves className={`w-3.5 h-3.5 ${mapLayers.hydrology ? "theme-neon-text" : "theme-text-muted"}`} />
              <span className={mapLayers.hydrology ? "theme-text-primary font-bold" : "theme-text-muted"}>Rzeki i Hydrologia</span>
            </div>
            <div className={`w-6 h-3 rounded-full border relative transition-all duration-250 ${
              mapLayers.hydrology ? "bg-cyan-500/20 border-cyan-500" : "theme-bg-app theme-border"
            }`}>
              <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-250 ${
                mapLayers.hydrology ? "right-0.5 bg-cyan-500" : "left-0.5 theme-bg-muted"
              }`} />
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
