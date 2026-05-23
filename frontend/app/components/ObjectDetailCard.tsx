"use client";

import { useState, useEffect, useRef } from "react";
import { X, BatteryCharging, ShieldAlert, Navigation, Settings2, Trash2, RotateCcw } from "lucide-react";
import { CriticalNode, DeployedSystem, WeaponType } from "../types";
import { WEAPONS } from "../data/weapons";

interface ObjectDetailCardProps {
  selectedNode: CriticalNode | null;
  selectedSystem: DeployedSystem | null;
  onClose: () => void;
  onActivateBackupPower: (nodeId: string) => void;
  coolingSecondsLeft: number | null;
  waterSecondsLeft: number | null;
  onResetCooling: () => void;
  onResetWater: () => void;
  onRemoveSystem: (sysId: string) => void;
  onFlyTo: (lat: number, lon: number, name: string) => void;
  leftSidebarCollapsed?: boolean;
}

export function ObjectDetailCard({
  selectedNode,
  selectedSystem,
  onClose,
  onActivateBackupPower,
  coolingSecondsLeft,
  waterSecondsLeft,
  onResetCooling,
  onResetWater,
  onRemoveSystem,
  onFlyTo,
  leftSidebarCollapsed = false
}: ObjectDetailCardProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Load persisted position from localStorage if it exists
  useEffect(() => {
    try {
      const saved = localStorage.getItem("spaceshield_detail_card_pos");
      if (saved) {
        setPosition(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load position from localStorage", e);
    }
  }, []);

  // Sync position to localStorage
  const savePosition = (pos: { x: number; y: number } | null) => {
    setPosition(pos);
    try {
      if (pos) {
        localStorage.setItem("spaceshield_detail_card_pos", JSON.stringify(pos));
      } else {
        localStorage.removeItem("spaceshield_detail_card_pos");
      }
    } catch (e) {
      console.error("Failed to save position to localStorage", e);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag on left click or touch
    if (e.button !== 0) return;
    
    // Don't drag if clicking buttons, links or interactive elements
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("a") || target.closest("svg")) {
      return;
    }

    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      dragStartRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        posX: rect.left,
        posY: rect.top
      };
      setIsDragging(true);
      
      // Prevent text selection while dragging
      e.preventDefault();
      // Capture pointer so it continues tracking even outside the window
      target.setPointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      
      let newX = dragStartRef.current.posX + deltaX;
      let newY = dragStartRef.current.posY + deltaY;

      // Keep it within screen bounds with nice padding
      const padding = 20;
      const cardWidth = 400; // w-[400px]
      
      newX = Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, newX));
      newY = Math.max(padding, Math.min(window.innerHeight - 100, newY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      
      // Save final position to localStorage
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        savePosition({ x: rect.left, y: rect.top });
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  if (!selectedNode && !selectedSystem) return null;

  const handleBackupClick = () => {
    if (selectedNode && !selectedNode.backupPower) {
      onActivateBackupPower(selectedNode.id);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "OPERATIONAL") return "text-emerald-700 dark:text-emerald-400 border-emerald-500/40 bg-emerald-555/10 dark:bg-emerald-950/10";
    if (status === "DEGRADED") return "text-amber-700 dark:text-amber-400 border-amber-500/40 bg-amber-555/10 dark:bg-amber-950/10";
    return "text-red-700 dark:text-red-400 border-red-500/40 bg-red-555/10 dark:bg-red-950/10";
  };

  return (
    <div 
      ref={cardRef}
      style={
        position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              transition: isDragging ? "none" : "left 0.3s ease, top 0.3s ease"
            }
          : {}
      }
      className={`fixed w-[400px] z-50 font-mono theme-bg-panel border theme-border p-4 clip-chamfer shadow-2xl backdrop-blur-md flex flex-col gap-3 ${
        isDragging ? "select-none" : ""
      } ${
        position ? "" : `top-20 transition-all duration-300 ${leftSidebarCollapsed ? "left-6" : "left-[360px]"}`
      }`}
    >
      
      {/* Header */}
      <div 
        onPointerDown={handlePointerDown}
        onDoubleClick={() => savePosition(null)}
        className="flex justify-between items-start border-b theme-border pb-2 cursor-grab select-none active:cursor-grabbing"
        title="Przeciągnij, aby przesunąć. Kliknij dwukrotnie, aby zresetować pozycję."
      >
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] theme-neon-text/80 font-bold tracking-wider font-rajdhani">
              {selectedNode ? "PROFIL STRATEGICZNEGO WĘZŁA" : "DETALE TARCZY BOJOWEJ"}
            </span>
            <span className="text-[8px] theme-bg-app border theme-border px-1 py-0.5 theme-text-muted">
              {selectedNode ? selectedNode.id : selectedSystem?.id}
            </span>
          </div>
          <h3 className="text-sm font-bold font-rajdhani theme-text-primary tracking-wide uppercase">
            {selectedNode ? selectedNode.name : selectedSystem?.name}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          {position && (
            <button
              onClick={() => savePosition(null)}
              className="p-1 hover:theme-bg-panel-hover theme-text-muted hover:theme-text-primary rounded border border-transparent hover:theme-border transition-all cursor-pointer"
              title="Zresetuj pozycję do domyślnej"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 hover:theme-bg-panel-hover theme-text-muted hover:theme-text-primary rounded border border-transparent hover:theme-border transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Render Node Details */}
      {selectedNode && (
        <div className="flex flex-col gap-3">
          {/* Status & Coordinates */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className={`border p-2 flex flex-col gap-0.5 ${getStatusColor(selectedNode.status)}`}>
              <span className="text-[8px] theme-text-muted">STATUS OPERACYJNY</span>
              <span className="font-bold tracking-wider">{selectedNode.status}</span>
            </div>
            <div className="border theme-border theme-bg-app p-2 flex flex-col gap-0.5 theme-text-primary">
              <span className="text-[8px] theme-text-muted">POZYCJA GPS</span>
              <span className="font-semibold">{selectedNode.lat.toFixed(5)}°N, {selectedNode.lon.toFixed(5)}°E</span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between items-center theme-text-secondary font-sharetech">
              <span>STAN INTEGRALNOŚCI STRUKTURALNEJ</span>
              <span className="font-bold">{selectedNode.health}%</span>
            </div>
            <div className="h-1.5 theme-bg-app border theme-border rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${
                  selectedNode.health > 60 ? "bg-emerald-500" : selectedNode.health > 25 ? "bg-amber-500" : "bg-red-500"
                }`}
                style={{ width: `${selectedNode.health}%` }}
              />
            </div>
          </div>

          {/* Desc & Notes */}
          <div className="text-[10px] space-y-1.5">
            <div className="theme-bg-app p-2 border theme-border theme-text-secondary leading-normal">
              {selectedNode.description}
            </div>
            {selectedNode.notes && (
              <div className="bg-amber-500/10 dark:bg-amber-950/10 border border-amber-500/30 dark:border-amber-900/30 p-2 text-amber-700 dark:text-amber-400/90 leading-normal text-[9px]">
                <span className="font-bold">KOMUNIKAT SYSTEMOWY:</span> {selectedNode.notes}
              </div>
            )}
          </div>

          {/* Cascading impact warning */}
          <div className="border theme-border theme-bg-app p-2 flex flex-col gap-1 text-[10px]">
            <div className="text-[8px] theme-text-muted font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 font-bold" />
              <span>MAPA ZALEŻNOŚCI KASKADOWYCH (ZAGROŻENIA)</span>
            </div>
            <p className="text-[9px] theme-text-secondary leading-tight">
              {selectedNode.id === "OBJ_02" ? (
                <>Zniszczenie odcina zasilanie do <span className="text-amber-700 dark:text-amber-400 font-bold">HSW (OBJ_01)</span> (redukcja do 15% mocy pieca) oraz zatrzymuje pompy w <span className="text-amber-700 dark:text-amber-400 font-bold">Ujęciu Wody (OBJ_03)</span>.</>
              ) : selectedNode.id === "OBJ_03" ? (
                <>Brak wody odcina chłodzenie bloku energetycznego w <span className="text-amber-700 dark:text-amber-400 font-bold">Elektrowni (OBJ_02)</span>, wyzwalając awaryjne wygaszenie turbiny.</>
              ) : selectedNode.id === "OBJ_04" ? (
                <>Utrata strefy energetycznej GPZ odcina zasilanie główne <span className="text-amber-700 dark:text-amber-400 font-bold">Centrum Zarządzania Kryzysowego (OBJ_07)</span>.</>
              ) : (
                <>Brak bezpośrednich krytycznych kaskad energetycznych dla innych węzłów.</>
              )}
            </p>
          </div>

          {/* Actions panel */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => onFlyTo(selectedNode.lat, selectedNode.lon, selectedNode.name)}
              className="py-2 border theme-border theme-bg-button hover:theme-bg-button-hover theme-text-primary hover:theme-neon-text transition-all font-semibold font-rajdhani text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              NAMIERZ GPS
            </button>

            {/* Backup generator button */}
            <button
              onClick={handleBackupClick}
              disabled={selectedNode.backupPower}
              className={`py-2 border text-[11px] font-semibold font-rajdhani flex items-center justify-center gap-1.5 transition-all ${
                selectedNode.backupPower
                  ? "border-emerald-700 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 cursor-not-allowed"
                  : "theme-border theme-bg-button hover:theme-bg-button-hover hover:border-amber-500 hover:theme-neon-text theme-text-primary cursor-pointer"
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              {selectedNode.backupPower ? "GENERATORY AKTYWNE" : "URUCHOM GENERATORY"}
            </button>
          </div>

          {/* EMERGENCY TRIGGER BUTTONS (e.g. cooling overrides!) */}
          {selectedNode.id === "OBJ_02" && coolingSecondsLeft !== null && (
            <div className="mt-1 bg-red-500/10 border border-red-500/40 p-2.5 flex flex-col gap-2 rounded animate-pulse">
              <div className="flex justify-between items-center text-[10px] text-red-600 dark:text-red-400 font-bold">
                <span>SEKWENCJA WYGASZANIA TURBINY AKTYWNA: {coolingSecondsLeft.toFixed(0)}s</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <button
                onClick={onResetCooling}
                className="w-full py-2 bg-red-600 dark:bg-red-950 border border-red-500 dark:border-red-650 hover:bg-red-700 dark:hover:bg-red-900 text-white dark:text-red-200 transition-all font-bold text-[11px] font-rajdhani flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                DODAJ CHŁODZIWO (RESTART SEK WYLĄCZENIA)
              </button>
            </div>
          )}

          {selectedNode.id === "OBJ_03" && waterSecondsLeft !== null && (
            <div className="mt-1 bg-red-500/10 border border-red-500/40 p-2.5 flex flex-col gap-2 rounded animate-pulse">
              <div className="flex justify-between items-center text-[10px] text-red-600 dark:text-red-400 font-bold">
                <span>DRENAŻ REZERW POMPOWYCH: {waterSecondsLeft.toFixed(0)}s</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <button
                onClick={onResetWater}
                className="w-full py-2 bg-red-600 dark:bg-red-950 border border-red-500 dark:border-red-650 hover:bg-red-700 dark:hover:bg-red-900 text-white dark:text-red-200 transition-all font-bold text-[11px] font-rajdhani flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                DOŁADUJ POMPY AWARYJNE (NAPEŁNIJ REZERWY)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Render Deployed System Details */}
      {selectedSystem && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="border border-cyan-500/40 bg-cyan-500/10 p-2 flex flex-col gap-0.5 text-cyan-700 dark:text-cyan-400">
              <span className="text-[8px] theme-text-muted">TRYB PRACY TARCZY</span>
              <span className="font-bold tracking-wider">AKTYWNY / SKANOWANIE</span>
            </div>
            <div className="border theme-border theme-bg-app p-2 flex flex-col gap-0.5 theme-text-primary">
              <span className="text-[8px] theme-text-muted">LOKACJA TARCZY</span>
              <span className="font-semibold">{selectedSystem.lat.toFixed(5)}°N, {selectedSystem.lon.toFixed(5)}°E</span>
            </div>
          </div>

          <div className="theme-bg-app p-3 border theme-border text-[10px] space-y-2 theme-text-secondary">
            <div className="flex justify-between">
              <span>Zasięg skuteczny:</span>
              <span className="font-bold theme-text-primary">{selectedSystem.radius} metrów ({selectedSystem.radius / 1000} km)</span>
            </div>
            <div className="flex justify-between">
              <span>Zwalczane cele:</span>
              <span className="font-bold theme-text-primary">
                {WEAPONS.find(w => w.type === selectedSystem.type)?.threatsCovered.join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sygnatura WebGL:</span>
              <span className="font-bold theme-neon-text">Cesium dynamic GridSphere Primitive</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => onFlyTo(selectedSystem.lat, selectedSystem.lon, selectedSystem.name)}
              className="py-2 border theme-border theme-bg-button hover:theme-bg-button-hover theme-text-primary hover:theme-neon-text transition-all font-semibold font-rajdhani text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              NAMIERZ GPS
            </button>

            <button
              onClick={() => onRemoveSystem(selectedSystem.id)}
              className="py-2 border border-red-500/60 dark:border-red-950/60 bg-red-500/10 dark:bg-red-950/10 hover:bg-red-650 dark:hover:bg-red-950 hover:text-white dark:hover:text-red-200 text-red-700 dark:text-red-400 transition-all font-semibold font-rajdhani text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              ZDEMONTUJ SYSTEM
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
