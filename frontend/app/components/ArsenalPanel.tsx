"use client";

import { Crosshair, RefreshCw, Play, Pause } from "lucide-react";
import { WeaponSystem, DeployedSystem, WeaponType, LogType } from "../types";

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
  onAddLog
}: ArsenalPanelProps) {
  return (
    <aside className="fixed right-4 top-20 w-80 h-[calc(100vh-230px)] z-40 flex flex-col gap-3 font-mono bg-slate-950/90 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-1.5 flex-1">
        <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center">
          <span>ARSENAŁ DEFENSYWNY (KLIKNIJ I ROZSTAW)</span>
          <span className="text-[9px] text-slate-500">3D COVERS</span>
        </div>
        <p className="text-[9px] text-slate-400 leading-tight">
          Wybierz broń, a następnie **kliknij na mapę 3D Cesium** w rejonie Stalowej Woli, aby rozciągnąć półprzezroczystą sferę przechwytującą.
        </p>
        <div className="space-y-2 mt-1.5">
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
                className={`border p-2.5 cursor-pointer transition-all hover:bg-slate-900/60 flex flex-col gap-1 relative ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-950/20 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                    : "border-slate-800/80 bg-slate-950 text-slate-300"
                }`}
              >
                {count > 0 && (
                  <span className="absolute top-2 right-2 text-[8px] bg-slate-850 border border-slate-750 text-slate-300 px-1 py-0.5">
                    AKTYWNE: {count}
                  </span>
                )}
                <div className="flex items-center gap-1.5 font-bold font-rajdhani text-[12px]">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: weap.color }} />
                  <span>{weap.name}</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-tight mt-0.5">{weap.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-1 font-sharetech text-[8px] text-slate-400">
                  <span className="bg-slate-900 px-1 border border-slate-850">Zasięg: {weap.range}m ({weap.range / 1000}km)</span>
                  <span className="bg-slate-900 px-1 border border-slate-850">Cele: {weap.threatsCovered.join(", ")}</span>
                </div>
                {isSelected && (
                  <div className="mt-2 text-[8px] bg-cyan-950/50 border border-cyan-800 text-cyan-400 flex items-center gap-1 animate-pulse font-bold">
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>TRYB CELOWANIA AKTYWNY: KLIKNIJ NA MAPĘ</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-900 pt-2.5 flex flex-col gap-1.5">
        <div className="text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900 flex justify-between items-center">
          <span>SYMULACJA ZAGROŻEŃ POWIETRZNYCH</span>
          <span className="text-[8px] text-red-500 font-bold">LIVE STRIKE</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => onLaunchScenario(1)}
            className="py-1.5 px-2 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-350 font-rajdhani text-left flex flex-col justify-between">
            <span className="text-slate-500 text-[7px]">SCEN_01 // CYWILNY RÓJ</span>
            <span>Inwazja dronów cywilnych</span>
          </button>
          <button onClick={() => onLaunchScenario(2)}
            className="py-1.5 px-2 border border-slate-800 hover:border-amber-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-355 font-rajdhani text-left flex flex-col justify-between">
            <span className="text-slate-500 text-[7px]">SCEN_02 // SHAHED RZEKA</span>
            <span>Zasłona korytem Sanu</span>
          </button>
          <button onClick={() => onLaunchScenario(3)}
            className="py-1.5 px-2 border border-slate-800 hover:border-red-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-350 font-rajdhani text-left flex flex-col justify-between">
            <span className="text-slate-500 text-[7px]">SCEN_03 // RAKIETA TAKT.</span>
            <span>Wysoka prędkość rakiety</span>
          </button>
          <button onClick={() => onLaunchScenario(4)}
            className="py-1.5 px-2 border border-slate-800 hover:border-red-500/60 hover:bg-slate-900 text-[9px] font-semibold text-slate-350 font-rajdhani text-left flex flex-col justify-between">
            <span className="text-slate-500 text-[7px]">SCEN_04 // CZAS KASKADY</span>
            <span>Kombinowany zmasowany atak</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mt-1 border-t border-slate-900 pt-2">
          <button onClick={onReset}
            className="py-1.5 px-2 bg-slate-900 border border-slate-800 text-[9px] text-slate-300 hover:bg-slate-800 flex items-center justify-center gap-1 font-semibold font-rajdhani">
            <RefreshCw className="w-3 h-3 text-slate-400" />
            RESET SYSTEMU
          </button>
          <button onClick={onTogglePause}
            className={`py-1.5 px-2 border text-[9px] font-semibold font-rajdhani flex items-center justify-center gap-1 ${
              simSpeed === 0 ? "border-amber-500 bg-amber-950/20 text-amber-400 animate-pulse" : "border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800"
            }`}>
            {simSpeed === 0 ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-slate-400" />}
            {simSpeed === 0 ? "WZNÓW SIM" : "PAUZA SIM"}
          </button>
        </div>
      </div>
    </aside>
  );
}
