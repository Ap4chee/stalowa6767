"use client";

import { Crosshair } from "lucide-react";
import { WeaponSystem, DeployedSystem, WeaponType, LogType } from "../types";
import { Panel, StatusPill, Kbd } from "../ui";

interface ArsenalPanelProps {
  weapons: WeaponSystem[];
  deployedSystems: DeployedSystem[];
  selectedWeapon: WeaponType | null;
  onSelectWeapon: (type: WeaponType | null) => void;
  onAddLog: (text: string, type: LogType) => void;
}

const KBD_FOR_WEAPON: Record<WeaponType, string> = {
  PILICA: "Q",
  WRE: "W",
  RADAR: "E",
  PATRIOT: "R"
};

const SHORT_NAME: Record<WeaponType, string> = {
  PILICA: "Pilica",
  WRE: "WRE Jammer",
  RADAR: "Radar LSS",
  PATRIOT: "Patriot PAC-3"
};

const SHORT_HINT: Record<WeaponType, string> = {
  PILICA: "Kinetyczny VSHORAD",
  WRE: "Walka elektroniczna",
  RADAR: "Tylko detekcja",
  PATRIOT: "Daleki zasięg"
};

export function ArsenalPanel({
  weapons,
  deployedSystems,
  selectedWeapon,
  onSelectWeapon,
  onAddLog
}: ArsenalPanelProps) {
  const totalDeployed = deployedSystems.length;
  const armed = selectedWeapon !== null;

  return (
    <Panel variant="floating" rounded="xl" className="flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex flex-col">
          <span className="text-micro text-muted">Rozstawianie</span>
          <span className="text-title text-primary">Arsenał obronny</span>
        </div>
        {armed ? (
          <StatusPill tone="accent" size="xs" dot pulse>Tryb celowania</StatusPill>
        ) : totalDeployed > 0 ? (
          <StatusPill tone="ok" size="xs">{totalDeployed} na pozycji</StatusPill>
        ) : (
          <span className="text-micro text-muted">0 na pozycji</span>
        )}
      </div>

      {armed && (
        <div className="mx-3 mb-3 px-3 py-2 rounded-(--r-md) bg-accent-soft flex items-center gap-2.5">
          <Crosshair className="w-4 h-4 text-accent anim-pulse shrink-0" />
          <span className="text-caption text-accent flex-1">
            Kliknij na mapie 3D, aby rozstawić
          </span>
          <Kbd>Esc</Kbd>
        </div>
      )}

      <div className="flex flex-col px-3 pb-3 gap-1">
        {weapons.map((weap) => {
          const count = deployedSystems.filter(s => s.type === weap.type).length;
          const isSelected = selectedWeapon === weap.type;
          const kbd = KBD_FOR_WEAPON[weap.type];

          return (
            <button
              key={weap.type}
              type="button"
              onClick={() => {
                const next = isSelected ? null : weap.type;
                onSelectWeapon(next);
                if (next) onAddLog(`Wybrano ${SHORT_NAME[weap.type]} — wskaż punkt na mapie.`, "info");
              }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-(--r-md) text-left cursor-pointer transition-colors ${
                isSelected ? "bg-accent-soft" : "hover:bg-surface-hover"
              }`}
            >
              <Kbd>{kbd}</Kbd>

              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-body text-primary truncate">{SHORT_NAME[weap.type]}</span>
                  <span className="text-micro text-muted shrink-0">{(weap.range / 1000).toFixed(1)} km</span>
                </div>
                <span className="text-micro text-muted block truncate">{SHORT_HINT[weap.type]}</span>
              </div>

              {count > 0 ? (
                <span className="shrink-0 text-data text-primary tabular-nums">
                  {count}<span className="text-muted">×</span>
                </span>
              ) : (
                <span
                  className="shrink-0 w-2 h-2 rounded-full"
                  style={{ backgroundColor: weap.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
