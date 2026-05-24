"use client";

import { useState } from "react";
import { HoveredCoords } from "../types";
import { Layers, Map, Target, Shield, Activity, Grid, Waves, Network } from "lucide-react";

interface TelemetryHUDProps {
  hoveredCoords: HoveredCoords;
  mapLayers: {
    baseMap: boolean;
    nodes: boolean;
    relations: boolean;
    domes: boolean;
    threats: boolean;
    tacticalZones: boolean;
    hydrology: boolean;
  };
  onToggleLayer: (key: keyof TelemetryHUDProps["mapLayers"]) => void;
  baseMapType: "standard" | "satellite" | "topo";
  onSetBaseMapType: (type: "standard" | "satellite" | "topo") => void;
}

export function TelemetryHUD({
  hoveredCoords,
  mapLayers,
  onToggleLayer,
  baseMapType,
  onSetBaseMapType
}: TelemetryHUDProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating popover for layer selection - Rendered outside footer to prevent clip-path cutting */}
      {isOpen && (
        <div 
          style={{ bottom: "60px", left: "calc(50% + 100px)", position: "fixed" }}
          className="theme-bg-panel border theme-border p-3 rounded-lg shadow-xl w-64 flex flex-col gap-1.5 z-55 pointer-events-auto animate-fadeIn"
        >
          {/* Popover Header */}
          <div className="text-[9px] theme-text-primary font-bold font-rajdhani tracking-wider border-b theme-border pb-1.5 flex items-center gap-1.5">
            <Activity className="w-3 h-3 theme-neon-text animate-pulse" />
            <span>STW_GRID: WARSTWY TAKTYCZNE</span>
          </div>

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

          {/* Node Relations Toggle */}
          <button
            onClick={() => onToggleLayer("relations")}
            className="flex justify-between items-center text-[10px] px-2 py-1.5 rounded theme-bg-button hover:theme-bg-button-hover transition-all cursor-pointer text-left"
          >
            <div className="flex items-center gap-2">
              <Network className={`w-3.5 h-3.5 ${mapLayers.relations ? "theme-neon-text" : "theme-text-muted"}`} />
              <span className={mapLayers.relations ? "theme-text-primary font-bold" : "theme-text-muted"}>Powiązania Węzłów</span>
            </div>
            <div className={`w-6 h-3 rounded-full border relative transition-all duration-250 ${
              mapLayers.relations ? "bg-cyan-500/20 border-cyan-500" : "theme-bg-app theme-border"
            }`}>
              <div className={`absolute top-0.5 w-1.5 h-1.5 rounded-full transition-all duration-250 ${
                mapLayers.relations ? "right-0.5 bg-cyan-500" : "left-0.5 theme-bg-muted"
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
          {/* Base Map Style Selector */}
          <div className="border-t theme-border pt-2.5 mt-1 space-y-1.5">
            <span className="text-[8px] theme-text-muted font-bold font-rajdhani tracking-wider block">STYL PODKŁADU MAPY</span>
            <div className="grid grid-cols-3 gap-1 theme-bg-app p-0.5 rounded border theme-border">
              <button
                onClick={() => onSetBaseMapType("standard")}
                className={`py-1 text-[8px] font-bold tracking-wider rounded transition-all cursor-pointer text-center ${
                  baseMapType === "standard"
                    ? "bg-cyan-500/20 theme-neon-text border border-cyan-500/30"
                    : "theme-text-muted hover:theme-text-primary border border-transparent"
                }`}
              >
                STANDARD
              </button>
              <button
                onClick={() => onSetBaseMapType("satellite")}
                className={`py-1 text-[8px] font-bold tracking-wider rounded transition-all cursor-pointer text-center ${
                  baseMapType === "satellite"
                    ? "bg-cyan-500/20 theme-neon-text border border-cyan-500/30"
                    : "theme-text-muted hover:theme-text-primary border border-transparent"
                }`}
              >
                SATELITA
              </button>
              <button
                onClick={() => onSetBaseMapType("topo")}
                className={`py-1 text-[8px] font-bold tracking-wider rounded transition-all cursor-pointer text-center ${
                  baseMapType === "topo"
                    ? "bg-cyan-500/20 theme-neon-text border border-cyan-500/30"
                    : "theme-text-muted hover:theme-text-primary border border-transparent"
                }`}
              >
                TOPO
              </button>
            </div>
          </div>
        </div>
      )}

      <footer 
        style={{ bottom: "16px", left: "50%", transform: "translateX(-50%)", position: "fixed" }}
        className="z-50 px-6 py-2 theme-bg-panel border theme-border flex gap-6 text-[10px] font-mono shadow-2xl backdrop-blur-md clip-chamfer theme-text-secondary items-center animate-fadeIn"
      >
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
        
        {/* Interactive GIS Layers Toggle Segment */}
        <div className="flex items-center border-l theme-border pl-6">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`p-1 px-2.5 rounded border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              isOpen 
                ? "theme-neon-text theme-neon-border theme-bg-panel-hover" 
                : "theme-text-muted theme-border hover:theme-text-primary hover:theme-bg-panel-hover"
            }`}
            title="Zarządzaj warstwami mapy"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[9px] font-bold font-rajdhani tracking-wider">WARSTWY</span>
          </button>
        </div>
      </footer>
    </>
  );
}
