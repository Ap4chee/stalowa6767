"use client";

import { useState, useEffect, useRef } from "react";
import { X, BatteryCharging, Navigation as NavIcon, Settings2, Trash2, RotateCcw, AlertTriangle, Droplet, Flame } from "lucide-react";
import { CriticalNode, DeployedSystem } from "../types";
import { WEAPONS } from "../data/weapons";
import { Panel, StatusPill, Button, HealthBar } from "../ui";

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
  onRelocateSystem?: (sysId: string, lat: number, lon: number, seconds: number) => void;
  onFlyTo: (lat: number, lon: number, name: string) => void;
  leftSidebarCollapsed?: boolean;
  onStartRelocationDrag?: (sysId: string) => void;
  onCancelRelocationDrag?: () => void;
  isRelocationDragging?: boolean;
}

const typeLabelPl: Record<CriticalNode["type"], string> = {
  power: "Elektrownia",
  water: "Ujęcie wody",
  industrial: "Przemysł",
  electrical: "Energetyka",
  logistic: "Logistyka",
  transit: "Tranzyt",
  hq: "Sztab"
};

function statusTone(status: string): "ok" | "warn" | "error" {
  if (status === "OPERATIONAL") return "ok";
  if (status === "DEGRADED")   return "warn";
  return "error";
}

function statusLabel(status: string): string {
  if (status === "OPERATIONAL") return "Sprawny";
  if (status === "DEGRADED")   return "Uszkodzony";
  if (status === "DESTROYED")  return "Zniszczony";
  if (status === "RELOCATING") return "W marszu";
  return status;
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
  leftSidebarCollapsed = false,
  onStartRelocationDrag,
  onCancelRelocationDrag,
  isRelocationDragging = false
}: ObjectDetailCardProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({ startX: 0, startY: 0, posX: 0, posY: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  // Load persisted position
  useEffect(() => {
    try {
      const saved = localStorage.getItem("spaceshield_detail_card_pos");
      if (saved) setPosition(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load detail card position", e);
    }
  }, []);

  const savePosition = (pos: { x: number; y: number } | null) => {
    setPosition(pos);
    try {
      if (pos) localStorage.setItem("spaceshield_detail_card_pos", JSON.stringify(pos));
      else localStorage.removeItem("spaceshield_detail_card_pos");
    } catch (e) {
      console.error("Failed to save detail card position", e);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("a") || target.closest("svg")) return;
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      dragStartRef.current = { startX: e.clientX, startY: e.clientY, posX: rect.left, posY: rect.top };
      setIsDragging(true);
      e.preventDefault();
      target.setPointerCapture(e.pointerId);
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      const deltaX = e.clientX - dragStartRef.current.startX;
      const deltaY = e.clientY - dragStartRef.current.startY;
      const padding = 16;
      const cardWidth = 400;
      const newX = Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, dragStartRef.current.posX + deltaX));
      const newY = Math.max(padding, Math.min(window.innerHeight - 100, dragStartRef.current.posY + deltaY));
      setPosition({ x: newX, y: newY });
    };
    const handleUp = () => {
      setIsDragging(false);
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        savePosition({ x: rect.left, y: rect.top });
      }
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  // Click-outside dismiss: closes the card when user clicks anywhere outside it.
  // Skipped during relocation drag because the user must click the map to set the target position.
  useEffect(() => {
    if (!selectedNode && !selectedSystem) return;
    if (isRelocationDragging) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!cardRef.current) return;
      const target = e.target as Node;
      if (cardRef.current.contains(target)) return;
      // Defer to any open modal dialog (relocation confirmation, add node, etc.)
      if (document.querySelector('[role="dialog"]')) return;
      onClose();
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [selectedNode, selectedSystem, isRelocationDragging, onClose]);

  if (!selectedNode && !selectedSystem) return null;

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
      className={`fixed w-[400px] z-50 ${
        position ? "" : `top-32 transition-all duration-300 ${leftSidebarCollapsed ? "left-24" : "left-[22.5rem]"}`
      } ${isDragging ? "select-none" : ""}`}
    >
      <Panel variant="floating" rounded="xl" className="flex flex-col overflow-hidden">
        {/* Drag handle / header */}
        <div
          onPointerDown={handlePointerDown}
          onDoubleClick={() => savePosition(null)}
          className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 cursor-grab active:cursor-grabbing select-none"
          title="Przeciągnij, aby przesunąć. Kliknij dwukrotnie, aby zresetować pozycję."
        >
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-micro text-muted">
              {selectedNode
                ? `${selectedNode.id} · ${typeLabelPl[selectedNode.type]}`
                : `${selectedSystem?.id} · System obronny`}
            </span>
            <h3 className="text-title text-primary truncate mt-0.5">
              {selectedNode ? selectedNode.name : selectedSystem?.name}
            </h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {position && (
              <button
                onClick={() => savePosition(null)}
                className="p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors"
                title="Zresetuj pozycję"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* NODE MODE */}
        {selectedNode && (
          <div className="flex flex-col gap-4 px-5 pb-5">
            {/* Status row */}
            <div className="flex items-center justify-between gap-3">
              <StatusPill tone={statusTone(selectedNode.status)} size="sm" dot pulse={selectedNode.status !== "OPERATIONAL"}>
                {statusLabel(selectedNode.status)}
              </StatusPill>
              <span className="text-data text-muted">
                {selectedNode.lat.toFixed(4)}°N · {selectedNode.lon.toFixed(4)}°E
              </span>
            </div>

            {/* Health */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-caption text-muted">Integralność strukturalna</span>
                <span className="text-data text-primary">{Math.round(selectedNode.health)}%</span>
              </div>
              <HealthBar value={selectedNode.health} showValue={false} size="sm" />
            </div>

            {/* Description */}
            <p className="text-body text-secondary leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Notes */}
            {selectedNode.notes && (
              <div className="px-4 py-3 rounded-(--r-md) bg-warn-soft text-warn">
                <span className="text-micro font-semibold block mb-0.5">Komunikat systemowy</span>
                <span className="text-caption">{selectedNode.notes}</span>
              </div>
            )}

            {/* Cascading impact */}
            <div className="px-4 py-3 rounded-(--r-md) bg-surface-data">
              <span className="text-micro text-muted block mb-1">Wpływ kaskadowy</span>
              <p className="text-caption text-secondary leading-snug">
                {selectedNode.id === "OBJ_02" ? (
                  <>Zniszczenie odcina zasilanie do <span className="text-warn font-medium">Huty (OBJ_01)</span> (redukcja do 15% mocy pieca) oraz zatrzymuje pompy w <span className="text-warn font-medium">Ujęciu Wody (OBJ_03)</span>.</>
                ) : selectedNode.id === "OBJ_03" ? (
                  <>Brak wody odcina chłodzenie bloku w <span className="text-warn font-medium">Elektrowni (OBJ_02)</span>, wyzwalając awaryjne wygaszenie turbiny.</>
                ) : selectedNode.id === "OBJ_04" ? (
                  <>Utrata GPZ odcina zasilanie główne <span className="text-warn font-medium">Centrum Zarządzania Kryzysowego (OBJ_07)</span>.</>
                ) : (
                  <>Brak bezpośrednich krytycznych kaskad energetycznych dla innych węzłów.</>
                )}
              </p>
            </div>

            {/* Cooling alert (OBJ_02) */}
            {selectedNode.id === "OBJ_02" && coolingSecondsLeft !== null && (
              <div className="px-4 py-3 rounded-(--r-md) bg-error-soft flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-error">
                  <Flame className="w-4 h-4 anim-pulse" />
                  <span className="text-caption font-semibold flex-1">
                    Wygaszanie turbiny: <span className="text-data">{coolingSecondsLeft.toFixed(0)}s</span>
                  </span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  icon={<Settings2 className="w-3.5 h-3.5" />}
                  onClick={onResetCooling}
                >
                  Dodaj chłodziwo
                </Button>
              </div>
            )}

            {/* Water alert (OBJ_03) */}
            {selectedNode.id === "OBJ_03" && waterSecondsLeft !== null && (
              <div className="px-4 py-3 rounded-(--r-md) bg-error-soft flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-error">
                  <Droplet className="w-4 h-4 anim-pulse" />
                  <span className="text-caption font-semibold flex-1">
                    Drenaż pomp: <span className="text-data">{waterSecondsLeft.toFixed(0)}s</span>
                  </span>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  icon={<Settings2 className="w-3.5 h-3.5" />}
                  onClick={onResetWater}
                >
                  Doładuj pompy awaryjne
                </Button>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                icon={<NavIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  onFlyTo(selectedNode.lat, selectedNode.lon, selectedNode.name);
                  onClose();
                }}
              >
                Namierz GPS
              </Button>
              <Button
                variant={selectedNode.backupPower ? "success" : "secondary"}
                size="sm"
                icon={<BatteryCharging className="w-3.5 h-3.5" />}
                disabled={selectedNode.backupPower}
                onClick={() => onActivateBackupPower(selectedNode.id)}
              >
                {selectedNode.backupPower ? "Generator aktywny" : "Uruchom generator"}
              </Button>
            </div>
          </div>
        )}

        {/* SYSTEM MODE */}
        {selectedSystem && (
          <div className="flex flex-col gap-4 px-5 pb-5">
            <div className="flex items-center justify-between gap-3">
              <StatusPill
                tone={selectedSystem.status === "RELOCATING" ? "warn" : "accent"}
                size="sm"
                dot
                pulse={selectedSystem.status === "RELOCATING"}
              >
                {selectedSystem.status === "RELOCATING"
                  ? `W marszu · ${selectedSystem.relocationSecondsLeft}s`
                  : "Aktywny · skanowanie"}
              </StatusPill>
              <span className="text-data text-muted">
                {selectedSystem.lat.toFixed(4)}°N · {selectedSystem.lon.toFixed(4)}°E
              </span>
            </div>

            {selectedSystem.status === "RELOCATING" && (
              <div className="px-4 py-3 rounded-(--r-md) bg-warn-soft text-warn">
                <span className="text-caption font-semibold block">Bateria w tranzycie</span>
                <span className="text-caption block mt-0.5">
                  Wszystkie systemy bojowe są wyłączone do czasu dotarcia.
                </span>
                <span className="text-micro text-warn/80 mt-1.5 italic block">
                  Na potrzeby demo czas marszu skrócono do 5 s.
                </span>
              </div>
            )}

            <div className="px-4 py-3 rounded-(--r-md) bg-surface-data flex flex-col gap-2">
              <div className="flex justify-between text-caption">
                <span className="text-muted">Zasięg skuteczny</span>
                <span className="text-data text-primary">{selectedSystem.radius} m · {(selectedSystem.radius / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between text-caption">
                <span className="text-muted">Zwalczane cele</span>
                <span className="text-primary">
                  {WEAPONS.find(w => w.type === selectedSystem.type)?.threatsCovered.join(" · ")}
                </span>
              </div>
              {selectedSystem.status === "RELOCATING" && selectedSystem.targetLat && selectedSystem.targetLon && (
                <div className="flex justify-between text-caption pt-2 mt-1 border-t border-subtle text-warn">
                  <span>Pozycja docelowa</span>
                  <span className="text-data">{selectedSystem.targetLat.toFixed(4)}°N · {selectedSystem.targetLon.toFixed(4)}°E</span>
                </div>
              )}
            </div>

            {!isRelocationDragging && selectedSystem.status !== "RELOCATING" && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button
                  variant="secondary" size="sm"
                  icon={<NavIcon className="w-3.5 h-3.5" />}
                  onClick={() => {
                    onFlyTo(selectedSystem.lat, selectedSystem.lon, selectedSystem.name);
                    onClose();
                  }}
                >
                  GPS
                </Button>
                <Button
                  variant="secondary" size="sm"
                  icon={<Settings2 className="w-3.5 h-3.5" />}
                  onClick={() => onStartRelocationDrag && onStartRelocationDrag(selectedSystem.id)}
                >
                  Przemieść
                </Button>
                <Button
                  variant="danger" size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => onRemoveSystem(selectedSystem.id)}
                >
                  Demontuj
                </Button>
              </div>
            )}

            {isRelocationDragging && (
              <div className="px-4 py-3 rounded-(--r-md) bg-warn-soft flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-warn">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-caption font-semibold">Tryb wyznaczania pozycji</span>
                </div>
                <p className="text-caption text-secondary leading-snug">
                  Przesuń kursor nad mapę, aby przesunąć duszek baterii. Kliknij lewy przycisk myszy w nowym miejscu, aby zatwierdzić rozkaz marszu.
                </p>
                <Button
                  variant="ghost" size="sm" fullWidth
                  onClick={() => onCancelRelocationDrag && onCancelRelocationDrag()}
                >
                  Anuluj wyznaczanie
                </Button>
              </div>
            )}
          </div>
        )}
      </Panel>
    </div>
  );
}
