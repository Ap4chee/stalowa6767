"use client";

import { useState, useRef, useEffect } from "react";
import { HoveredCoords } from "../types";
import { Layers } from "lucide-react";
import { Panel, Toggle, Button } from "../ui";

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
    effects: boolean;
  };
  onToggleLayer: (key: keyof TelemetryHUDProps["mapLayers"]) => void;
  baseMapType: "standard" | "satellite" | "topo";
  onSetBaseMapType: (type: "standard" | "satellite" | "topo") => void;
  sceneMode: "3d" | "2d";
  onSetSceneMode: (mode: "3d" | "2d") => void;
}

export function TelemetryHUD({
  hoveredCoords,
  mapLayers,
  onToggleLayer,
  baseMapType,
  onSetBaseMapType,
  sceneMode,
  onSetSceneMode
}: TelemetryHUDProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Esc closes the popover
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  // Outside-click closes the popover (ignore clicks on the trigger itself)
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed left-1/2 -translate-x-1/2 z-50"
          style={{ bottom: "68px" }}
        >
          <div className="anim-slide-up">
            <Panel variant="floating" rounded="xl" className="w-72 flex flex-col overflow-hidden">
              <div className="flex flex-col px-4 pt-3 pb-2">
                <span className="text-micro text-muted">HUD</span>
                <span className="text-heading text-primary">Warstwy mapy</span>
              </div>

              <div className="flex flex-col px-2 pb-2">
                <Toggle checked={mapLayers.nodes}     onChange={() => onToggleLayer("nodes")}     label="Obiekty krytyczne" />
                <Toggle checked={mapLayers.domes}     onChange={() => onToggleLayer("domes")}     label="Kopuły obronne" />
                <Toggle checked={mapLayers.threats}   onChange={() => onToggleLayer("threats")}   label="Wektory zagrożeń" tone="error" />
                <Toggle checked={mapLayers.relations} onChange={() => onToggleLayer("relations")} label="Powiązania węzłów" />
                <Toggle checked={mapLayers.hydrology} onChange={() => onToggleLayer("hydrology")} label="Hydrologia" />
              </div>

              <div className="flex flex-col px-2 pb-2 pt-2 border-t border-subtle">
                <div className="px-2 pt-1 pb-1.5 text-micro text-muted">Efekty bojowe</div>
                <Toggle checked={mapLayers.effects} onChange={() => onToggleLayer("effects")} label="Wybuchy i dym 3D" tone="error" />
              </div>

              <div className="px-4 pb-2 pt-2 border-t border-subtle">
                <div className="text-micro text-muted mb-1.5">Widok</div>
                <div className="grid grid-cols-2 gap-0.5 p-0.5 bg-surface-data rounded-(--r-md)">
                  {(["3d", "2d"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => onSetSceneMode(m)}
                      className={[
                        "py-1.5 text-caption rounded-(--r-sm) cursor-pointer transition-colors",
                        sceneMode === m
                          ? "bg-surface-1 text-primary font-medium"
                          : "text-muted hover:text-secondary"
                      ].join(" ")}
                    >
                      {m === "3d" ? "3D · Cesium" : "2D · płaska mapa"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Podkład selector is meaningful only in 2D — the 3D scene is covered
                  by the Google photoreal mesh, which hides whatever basemap sits on
                  the globe underneath. Showing it in 3D would be a dead control. */}
              {sceneMode === "2d" && (
                <div className="px-4 pb-3 pt-2">
                  <div className="text-micro text-muted mb-1.5">Podkład</div>
                  <div className="grid grid-cols-3 gap-0.5 p-0.5 bg-surface-data rounded-(--r-md)">
                    {(["standard", "satellite", "topo"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => onSetBaseMapType(t)}
                        className={[
                          "py-1.5 text-caption rounded-(--r-sm) cursor-pointer transition-colors",
                          baseMapType === t
                            ? "bg-surface-1 text-primary font-medium"
                            : "text-muted hover:text-secondary"
                        ].join(" ")}
                      >
                        {t === "standard" ? "Mapa" : t === "satellite" ? "Satelita" : "Topo"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}

      <footer className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center h-10 bg-surface-2 elev-2 rounded-(--r-pill) overflow-hidden anim-fade-in pl-1 pr-1">
        <div className="flex items-center gap-2 pl-4 pr-3.5 h-full">
          <span className="text-micro text-muted">GPS</span>
          <span className="text-data text-primary">
            {hoveredCoords.lat.toFixed(4)}°N · {hoveredCoords.lon.toFixed(4)}°E
          </span>
        </div>

        <div className="w-px h-5 bg-(--border-subtle)" />

        <div className="flex items-center gap-2 px-3.5 h-full">
          <span className="text-micro text-muted">ALT</span>
          <span className="text-data text-primary">{hoveredCoords.alt} m</span>
        </div>

        <div className="w-px h-5 bg-(--border-subtle)" />

        <div className="flex items-center gap-2 pl-3.5 pr-4 h-full">
          <span className="text-micro text-muted">AZ</span>
          <span className="text-data text-primary">{hoveredCoords.az}°</span>
        </div>

        <div className="w-px h-5 bg-(--border-subtle)" />

        <div className="pl-1.5 pr-0.5">
          <Button
            ref={triggerRef}
            variant="ghost"
            size="sm"
            icon={<Layers />}
            active={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="dialog"
          >
            Warstwy
          </Button>
        </div>
      </footer>
    </>
  );
}
