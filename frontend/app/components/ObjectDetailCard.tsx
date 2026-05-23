"use client";

import { X, BatteryCharging, ShieldAlert, Navigation, Settings2, Trash2 } from "lucide-react";
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
  onFlyTo
}: ObjectDetailCardProps) {
  if (!selectedNode && !selectedSystem) return null;

  const handleBackupClick = () => {
    if (selectedNode && !selectedNode.backupPower) {
      onActivateBackupPower(selectedNode.id);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "OPERATIONAL") return "text-emerald-400 border-emerald-500/30 bg-emerald-950/10";
    if (status === "DEGRADED") return "text-amber-400 border-amber-500/30 bg-amber-950/10";
    return "text-red-400 border-red-500/30 bg-red-950/10";
  };

  return (
    <div className="fixed left-1/2 bottom-44 -translate-x-1/2 w-[480px] z-50 font-mono bg-slate-950/95 border border-slate-800/80 p-4 clip-chamfer shadow-2xl backdrop-blur-md flex flex-col gap-3 transition-all duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b border-slate-900 pb-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-cyan-400/80 font-bold tracking-wider font-rajdhani">
              {selectedNode ? "PROFIL STRATEGICZNEGO WĘZŁA" : "DETALE TARCZY BOJOWEJ"}
            </span>
            <span className="text-[8px] bg-slate-900 border border-slate-850 px-1 py-0.5 text-slate-500">
              {selectedNode ? selectedNode.id : selectedSystem?.id}
            </span>
          </div>
          <h3 className="text-sm font-bold font-rajdhani text-slate-200 tracking-wide uppercase">
            {selectedNode ? selectedNode.name : selectedSystem?.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-900 text-slate-500 hover:text-slate-300 rounded border border-transparent hover:border-slate-850 transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Render Node Details */}
      {selectedNode && (
        <div className="flex flex-col gap-3">
          {/* Status & Coordinates */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className={`border p-2 flex flex-col gap-0.5 ${getStatusColor(selectedNode.status)}`}>
              <span className="text-[8px] text-slate-500">STATUS OPERACYJNY</span>
              <span className="font-bold tracking-wider">{selectedNode.status}</span>
            </div>
            <div className="border border-slate-900 bg-slate-900/40 p-2 flex flex-col gap-0.5 text-slate-300">
              <span className="text-[8px] text-slate-500">POZYCJA GPS</span>
              <span className="font-semibold">{selectedNode.lat.toFixed(5)}°N, {selectedNode.lon.toFixed(5)}°E</span>
            </div>
          </div>

          {/* Health Bar */}
          <div className="flex flex-col gap-1 text-[10px]">
            <div className="flex justify-between items-center text-slate-400 font-sharetech">
              <span>STAN INTEGRALNOŚCI STRUKTURALNEJ</span>
              <span className="font-bold">{selectedNode.health}%</span>
            </div>
            <div className="h-1.5 bg-slate-900 border border-slate-850 rounded-full overflow-hidden">
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
            <div className="bg-slate-950 p-2 border border-slate-900 text-slate-400 leading-normal">
              {selectedNode.description}
            </div>
            {selectedNode.notes && (
              <div className="bg-amber-950/10 border border-amber-900/30 p-2 text-amber-400/90 leading-normal text-[9px]">
                <span className="font-bold">KOMUNIKAT SYSTEMOWY:</span> {selectedNode.notes}
              </div>
            )}
          </div>

          {/* Cascading impact warning */}
          <div className="border border-slate-900 bg-slate-950/80 p-2 flex flex-col gap-1 text-[10px]">
            <div className="text-[8px] text-slate-500 font-bold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>MAPA ZALEŻNOŚCI KASKADOWYCH (ZAGROŻENIA)</span>
            </div>
            <p className="text-[9px] text-slate-450 leading-tight">
              {selectedNode.id === "OBJ_02" ? (
                <>Zniszczenie odcina zasilanie do <span className="text-amber-400">HSW (OBJ_01)</span> (redukcja do 15% mocy pieca) oraz zatrzymuje pompy w <span className="text-amber-400">Ujęciu Wody (OBJ_03)</span>.</>
              ) : selectedNode.id === "OBJ_03" ? (
                <>Brak wody odcina chłodzenie bloku energetycznego w <span className="text-amber-400">Elektrowni (OBJ_02)</span>, wyzwalając awaryjne wygaszenie turbiny.</>
              ) : selectedNode.id === "OBJ_04" ? (
                <>Utrata strefy energetycznej GPZ odcina zasilanie główne <span className="text-amber-400">Centrum Zarządzania Kryzysowego (OBJ_07)</span>.</>
              ) : (
                <>Brak bezpośrednich krytycznych kaskad energetycznych dla innych węzłów.</>
              )}
            </p>
          </div>

          {/* Actions panel */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => onFlyTo(selectedNode.lat, selectedNode.lon, selectedNode.name)}
              className="py-2 border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-cyan-400 transition-all font-semibold font-rajdhani text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
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
                  ? "border-emerald-800 bg-emerald-950/20 text-emerald-400 cursor-not-allowed"
                  : "border-slate-800 bg-slate-900/50 hover:border-amber-500/60 hover:text-amber-400 cursor-pointer"
              }`}
            >
              <BatteryCharging className="w-3.5 h-3.5" />
              {selectedNode.backupPower ? "GENERATORY AKTYWNE" : "URUCHOM GENERATORY"}
            </button>
          </div>

          {/* EMERGENCY TRIGGER BUTTONS (e.g. cooling overrides!) */}
          {selectedNode.id === "OBJ_02" && coolingSecondsLeft !== null && (
            <div className="mt-1 bg-red-950/25 border border-red-900/40 p-2.5 flex flex-col gap-2 rounded animate-pulse">
              <div className="flex justify-between items-center text-[10px] text-red-400 font-bold">
                <span>SEKWENCJA WYGASZANIA TURBINY AKTYWNA: {coolingSecondsLeft.toFixed(0)}s</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <button
                onClick={onResetCooling}
                className="w-full py-2 bg-red-950 border border-red-650 hover:bg-red-900 text-red-200 transition-all font-bold text-[11px] font-rajdhani flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5" />
                DODAJ CHŁODZIWO (RESTART SEK WYLĄCZENIA)
              </button>
            </div>
          )}

          {selectedNode.id === "OBJ_03" && waterSecondsLeft !== null && (
            <div className="mt-1 bg-red-950/25 border border-red-900/40 p-2.5 flex flex-col gap-2 rounded animate-pulse">
              <div className="flex justify-between items-center text-[10px] text-red-400 font-bold">
                <span>DRENAŻ REZERW POMPOWYCH: {waterSecondsLeft.toFixed(0)}s</span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <button
                onClick={onResetWater}
                className="w-full py-2 bg-red-950 border border-red-650 hover:bg-red-900 text-red-200 transition-all font-bold text-[11px] font-rajdhani flex items-center justify-center gap-1.5 cursor-pointer"
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
            <div className="border border-cyan-900/40 bg-cyan-950/10 p-2 flex flex-col gap-0.5 text-cyan-400">
              <span className="text-[8px] text-slate-500">TRYB PRACY TARCZY</span>
              <span className="font-bold tracking-wider">AKTYWNY / SKANOWANIE</span>
            </div>
            <div className="border border-slate-900 bg-slate-900/40 p-2 flex flex-col gap-0.5 text-slate-350">
              <span className="text-[8px] text-slate-500">LOKACJA TARCZY</span>
              <span className="font-semibold">{selectedSystem.lat.toFixed(5)}°N, {selectedSystem.lon.toFixed(5)}°E</span>
            </div>
          </div>

          <div className="bg-slate-950 p-3 border border-slate-900 text-[10px] space-y-2 text-slate-400">
            <div className="flex justify-between">
              <span>Zasięg skuteczny:</span>
              <span className="font-bold text-slate-200">{selectedSystem.radius} metrów ({selectedSystem.radius / 1000} km)</span>
            </div>
            <div className="flex justify-between">
              <span>Zwalczane cele:</span>
              <span className="font-bold text-slate-200">
                {WEAPONS.find(w => w.type === selectedSystem.type)?.threatsCovered.join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Sygnatura WebGL:</span>
              <span className="font-bold text-cyan-500">Cesium dynamic GridSphere Primitive</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => onFlyTo(selectedSystem.lat, selectedSystem.lon, selectedSystem.name)}
              className="py-2 border border-slate-800 bg-slate-900/50 hover:bg-slate-900 text-slate-300 hover:text-cyan-400 transition-all font-semibold font-rajdhani text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              NAMIERZ GPS
            </button>

            <button
              onClick={() => onRemoveSystem(selectedSystem.id)}
              className="py-2 border border-red-950/60 bg-red-950/10 hover:bg-red-950 hover:text-red-200 text-red-400 transition-all font-semibold font-rajdhani text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
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
