"use client";

import { Crosshair, RefreshCw, Play, Pause } from "lucide-react";
import { WeaponSystem, DeployedSystem, WeaponType, LogType } from "../types";
import { CollapsibleCard } from "./CollapsibleCard";

interface ArsenalPanelProps {
  weapons: WeaponSystem[];
  deployedSystems: DeployedSystem[];
  selectedWeapon: WeaponType | null;
  onSelectWeapon: (type: WeaponType | null) => void;
  onLaunchScenario: (index: number) => void;
  onReset: () => void;
  simSpeed: number;
  onTogglePause: () => void;
  onAddLog: (text: string, type: LogType) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function ArsenalPanel({
  weapons,
  deployedSystems,
  selectedWeapon,
  onSelectWeapon,
  onLaunchScenario,
  onReset,
  simSpeed,
  onTogglePause,
  onAddLog,
  isCollapsed,
  onToggle
}: ArsenalPanelProps) {
  return (
    <div className={`w-full theme-bg-panel border theme-border clip-chamfer text-[11px] shadow-2xl backdrop-blur-md transition-all duration-300 ${
      isCollapsed ? "flex-initial" : "flex-1 min-h-0 flex flex-col"
    }`}>
      <CollapsibleCard
        title="ARSENAŁ I SYMULACJA"
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        className="flex-1 min-h-0 flex flex-col"
        contentClassName="flex-1 min-h-0 flex flex-col"
        badge={
          <span className="text-[8px] theme-text-muted font-bold">
            {deployedSystems.length} SYSTEMÓW
          </span>
        }
        headerClassName="px-3 py-2 border-b theme-border theme-neon-text hover:theme-bg-panel-hover"
        fixedHeight={isCollapsed ? 0 : undefined}
      >
        <div className="flex-1 min-h-0 p-3 overflow-y-auto terminal-scroll">
          <div className="text-[10px] theme-text-secondary font-rajdhani tracking-wider pb-1 border-b theme-border flex justify-between items-center">
            <span>ARSENAŁ DEFENSYWNY</span>
            <span className="text-[9px] theme-text-muted">3D COVERS</span>
          </div>
          <p className="text-[9px] theme-text-secondary leading-tight mt-2 mb-2">
            Wybierz broń, a następnie kliknij na mapę 3D Cesium, aby rozstawić półprzezroczystą sferę przechwytującą.
          </p>
          <div className="space-y-2">
            {weapons.map((weap) => {
               const count = deployedSystems.filter((s) => s.type === weap.type).length;
               const isSelected = selectedWeapon === weap.type;
               return (
                 <div
                   key={weap.type}
                   onClick={() => {
                     onSelectWeapon(isSelected ? null : weap.type);
                     onAddLog(`DOWÓDZTWO: Wybrano ${weap.name} do instalacji. Wskaż punkt na mapie 3D.`, "info");
                   }}
                   className={`border p-2.5 cursor-pointer transition-all hover:theme-bg-panel-hover flex flex-col gap-1 relative ${
                     isSelected
                       ? "theme-neon-border bg-cyan-500/10 theme-neon-text shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                       : "theme-border theme-bg-app theme-text-primary"
                   }`}
                 >
                   {count > 0 && (
                     <span className="absolute top-2 right-2 text-[8px] theme-bg-panel border theme-border theme-text-primary px-1 py-0.5 font-bold">
                       AKTYWNE: {count}
                     </span>
                   )}
                   <div className="flex items-center gap-1.5 font-bold font-rajdhani text-[12px]">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: weap.color }} />
                     <span>{weap.name}</span>
                   </div>
                   <p className="text-[9px] theme-text-secondary leading-tight mt-0.5">{weap.description}</p>
                   <div className="flex flex-wrap gap-1.5 mt-1 font-sharetech text-[8px] theme-text-muted">
                     <span className="theme-bg-panel px-1 border theme-border">Zasięg: {weap.range}m ({weap.range / 1000}km)</span>
                     <span className="theme-bg-panel px-1 border theme-border">Cele: {weap.threatsCovered.join(", ")}</span>
                   </div>
                   {isSelected && (
                     <div className="mt-2 text-[8px] bg-cyan-500/10 border theme-neon-border theme-neon-text flex items-center gap-1 animate-pulse font-bold">
                       <Crosshair className="w-3.5 h-3.5" />
                       <span>TRYB CELOWANIA AKTYWNY: KLIKNIJ NA MAPĘ</span>
                     </div>
                   )}
                 </div>
               );
            })}
          </div>
        </div>

        <div className="border-t theme-border p-3 flex flex-col gap-2">
          <div className="text-[10px] theme-text-secondary font-rajdhani tracking-wider flex justify-between items-center">
            <span>SYMULACJA ZAGROŻEŃ</span>
            <span className="text-[8px] text-red-500 font-bold">LIVE STRIKE</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={() => onLaunchScenario(1)}
              className="py-1.5 px-2 border theme-border theme-bg-button hover:theme-bg-button-hover hover:border-amber-500/60 text-[9px] font-semibold theme-text-primary font-rajdhani text-left flex flex-col justify-between cursor-pointer">
              <span className="theme-text-muted text-[7px]">SCEN_01</span>
              <span>Rój dronów</span>
            </button>
            <button onClick={() => onLaunchScenario(2)}
              className="py-1.5 px-2 border theme-border theme-bg-button hover:theme-bg-button-hover hover:border-amber-500/60 text-[9px] font-semibold theme-text-primary font-rajdhani text-left flex flex-col justify-between cursor-pointer">
              <span className="theme-text-muted text-[7px]">SCEN_02</span>
              <span>Shahed rzeka</span>
            </button>
            <button onClick={() => onLaunchScenario(3)}
              className="py-1.5 px-2 border theme-border theme-bg-button hover:theme-bg-button-hover hover:border-red-500/60 text-[9px] font-semibold theme-text-primary font-rajdhani text-left flex flex-col justify-between cursor-pointer">
              <span className="theme-text-muted text-[7px]">SCEN_03</span>
              <span>Rakieta takt.</span>
            </button>
            <button onClick={() => onLaunchScenario(4)}
              className="py-1.5 px-2 border theme-border theme-bg-button hover:theme-bg-button-hover hover:border-red-500/60 text-[9px] font-semibold theme-text-primary font-rajdhani text-left flex flex-col justify-between cursor-pointer">
              <span className="theme-text-muted text-[7px]">SCEN_04</span>
              <span>Atak kombinowany</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            <button onClick={onReset}
              className="py-2 px-2 theme-bg-button border theme-border text-[9px] theme-text-primary hover:theme-bg-button-hover flex items-center justify-center gap-1 font-semibold font-rajdhani cursor-pointer">
              <RefreshCw className="w-3 h-3 theme-text-secondary" />
              RESET
            </button>
            <button onClick={onTogglePause}
              className={`py-2 px-2 border text-[9px] font-semibold font-rajdhani flex items-center justify-center gap-1 cursor-pointer ${
                simSpeed === 0 ? "border-amber-500 bg-amber-500/10 text-amber-500 animate-pulse font-bold" : "theme-border theme-bg-button theme-text-primary hover:theme-bg-button-hover"
              }`}>
              {simSpeed === 0 ? <Play className="w-3 h-3 text-amber-500" /> : <Pause className="w-3 h-3 theme-text-secondary" />}
              {simSpeed === 0 ? "WZNÓW" : "PAUZA"}
            </button>
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}
