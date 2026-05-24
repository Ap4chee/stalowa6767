"use client";

import { useState, useEffect } from "react";
import { CriticalNode, NodeRelation, DeployedSystem } from "../types";
import { CollapsibleCard } from "./CollapsibleCard";
import { NodeList } from "./NodeList";
import { Shield, Settings, Trash2, Navigation, Check, X, Compass, Zap, Radio } from "lucide-react";

interface LeftSidebarProps {
  nodes: CriticalNode[];
  relations: NodeRelation[];
  onNodeClick: (node: CriticalNode) => void;
  onAddNode: (node: CriticalNode) => void;
  onAddRelation: (rel: NodeRelation) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  deployedSystems: DeployedSystem[];
  onRemoveSystem: (sysId: string) => void;
  onRelocateSystem: (sysId: string, lat: number, lon: number, seconds: number) => void;
}

// Distance helper
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Relocation rate in seconds per kilometer
function getRelocationRate(type: string) {
  switch (type) {
    case "PATRIOT": return 8;
    case "PILICA": return 4;
    case "RADAR": return 3;
    default: return 2;
  }
}

export function LeftSidebar({
  nodes,
  relations,
  onNodeClick,
  onAddNode,
  onAddRelation,
  isCollapsed,
  onToggle,
  deployedSystems,
  onRemoveSystem,
  onRelocateSystem
}: LeftSidebarProps) {
  const [activeTab, setActiveTab] = useState<"nodes" | "opl">("nodes");
  
  // Relocation forms state: key is system ID, value is target lat/lon
  const [relocatingFormId, setRelocatingFormId] = useState<string | null>(null);
  const [targetLat, setTargetLat] = useState("");
  const [targetLon, setTargetLon] = useState("");

  const handleStartRelocation = (sys: DeployedSystem) => {
    setRelocatingFormId(sys.id);
    setTargetLat(sys.lat.toFixed(4));
    setTargetLon(sys.lon.toFixed(4));
  };

  const handleConfirmRelocation = (sys: DeployedSystem) => {
    const latNum = parseFloat(targetLat);
    const lonNum = parseFloat(targetLon);
    if (isNaN(latNum) || isNaN(lonNum)) return;

    const distance = calculateDistanceKm(sys.lat, sys.lon, latNum, lonNum);
    const rate = getRelocationRate(sys.type);
    const seconds = Math.max(3, Math.round(distance * rate)); // At least 3 seconds relocation time

    onRelocateSystem(sys.id, latNum, lonNum, seconds);
    setRelocatingFormId(null);
  };

  // Live distance and time helper for form
  const getRelocationEstimate = (sys: DeployedSystem) => {
    const latNum = parseFloat(targetLat);
    const lonNum = parseFloat(targetLon);
    if (isNaN(latNum) || isNaN(lonNum)) return null;

    const distance = calculateDistanceKm(sys.lat, sys.lon, latNum, lonNum);
    const rate = getRelocationRate(sys.type);
    const seconds = Math.max(3, Math.round(distance * rate));
    return {
      distance: distance.toFixed(2),
      seconds
    };
  };

  const systemIcon = (type: string) => {
    switch (type) {
      case "PATRIOT":
        return <Shield className="w-3.5 h-3.5 text-red-500 animate-pulse" />;
      case "PILICA":
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case "RADAR":
        return <Compass className="w-3.5 h-3.5 text-blue-500" />;
      default:
        return <Radio className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className={`w-full theme-bg-panel border theme-border clip-chamfer text-[11px] shadow-2xl backdrop-blur-md transition-all duration-300 ${
      isCollapsed ? "flex-initial" : "flex-1 min-h-0 flex flex-col"
    }`}>
      <CollapsibleCard
        title="DOWÓDZTWO OBRONY TARCZY"
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        className="flex-1 min-h-0 flex flex-col"
        contentClassName="flex-1 min-h-0 flex flex-col"
        badge={
          <span className="text-[8px] theme-text-muted font-bold">
            {activeTab === "nodes"
              ? `${nodes.filter(n => n.status === "OPERATIONAL").length}/${String(nodes.length).padStart(2, '0')} WĘZŁÓW`
              : `${deployedSystems.filter(s => (s.status || "OPERATIONAL") === "OPERATIONAL").length}/${String(deployedSystems.length).padStart(2, '0')} BATERII`
            }
          </span>
        }
        headerClassName="px-3 py-2 border-b theme-border theme-neon-text hover:theme-bg-panel-hover"
        fixedHeight={isCollapsed ? 0 : undefined}
      >
        {/* Sleek Subtabs */}
        {!isCollapsed && (
          <div className="flex border-b theme-border bg-black/20 select-none">
            <button
              onClick={() => setActiveTab("nodes")}
              className={`flex-1 py-2 text-center font-rajdhani font-bold tracking-widest text-[9px] border-r theme-border transition-all cursor-pointer ${
                activeTab === "nodes"
                  ? "theme-bg-button theme-neon-text border-b border-b-cyan-500"
                  : "theme-text-muted hover:theme-bg-panel-hover hover:theme-text-primary"
              }`}
            >
              [ WĘZŁY INFRASTRUKTURY ]
            </button>
            <button
              onClick={() => setActiveTab("opl")}
              className={`flex-1 py-2 text-center font-rajdhani font-bold tracking-widest text-[9px] transition-all cursor-pointer ${
                activeTab === "opl"
                  ? "theme-bg-button theme-neon-text border-b border-b-cyan-500"
                  : "theme-text-muted hover:theme-bg-panel-hover hover:theme-text-primary"
              }`}
            >
              [ BATERIE OPL TARCZY ]
            </button>
          </div>
        )}

        <div className="p-3 overflow-y-auto terminal-scroll flex-1 min-h-0">
          {!isCollapsed && activeTab === "nodes" && (
            <NodeList
              nodes={nodes}
              relations={relations}
              onNodeClick={onNodeClick}
              onAddNode={onAddNode}
              onAddRelation={onAddRelation}
            />
          )}

          {!isCollapsed && activeTab === "opl" && (
            <div className="flex flex-col gap-3">
              <div className="text-[10px] theme-text-secondary border-b border-slate-700/30 pb-1.5 font-bold uppercase tracking-wider">
                AKTYWNE ROZMIESZCZENIE SIL OPL
              </div>

              {deployedSystems.length === 0 ? (
                <div className="p-4 border border-dashed theme-border text-center text-slate-500 font-mono">
                  BRAK AKTYWNYCH JEDNOSTEK OBRONNYCH.
                  <br />
                  <span className="text-[8px] theme-text-muted">KLIKNIJ U GÓRY BAZĘ SYSTEMÓW I KLIKNIJ NA MAPIE ABY ROZSTAWIĆ BATERIĘ.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {deployedSystems.map((sys) => {
                    const status = sys.status || "OPERATIONAL";
                    const isRelocating = status === "RELOCATING";
                    const isFormOpen = relocatingFormId === sys.id;
                    const est = isFormOpen ? getRelocationEstimate(sys) : null;

                    return (
                      <div
                        key={sys.id}
                        className={`p-2.5 border rounded theme-bg-panel hover:theme-bg-panel-hover transition-all relative ${
                          isRelocating
                            ? "border-amber-500/50 bg-amber-500/5 animate-pulse"
                            : "theme-border"
                        }`}
                      >
                        {/* Upper row: system details */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {systemIcon(sys.type)}
                            <div className="flex flex-col">
                              <span className="font-bold theme-text-primary tracking-wide">{sys.name}</span>
                              <span className="text-[8px] theme-text-secondary font-mono">
                                ID: {sys.id} | POZ: {sys.lat.toFixed(4)}°, {sys.lon.toFixed(4)}°
                              </span>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {isRelocating ? (
                              <span className="text-[7.5px] font-black bg-amber-500/20 text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono animate-pulse">
                                PRZEMIESZCZANIE ({sys.relocationSecondsLeft}S)
                              </span>
                            ) : (
                              <span className="text-[7.5px] font-black bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                                SPRAWNA
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Mid row: description */}
                        <div className="text-[8px] theme-text-muted mt-1.5 font-mono">
                          ZASIĘG OBRONNY KOPUŁY: {sys.radius} METRÓW
                        </div>

                        {/* Action buttons */}
                        {!isRelocating && !isFormOpen && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/20">
                            <button
                              onClick={() => handleStartRelocation(sys)}
                              className="px-2.5 py-1 border border-cyan-550/40 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 hover:text-cyan-300 transition-all font-bold text-[8px] tracking-wider clip-chamfer cursor-pointer flex items-center gap-1"
                            >
                              <Navigation className="w-2.5 h-2.5" />
                              PRZEMIEŚĆ BATERIĘ
                            </button>
                            
                            <button
                              onClick={() => onRemoveSystem(sys.id)}
                              className="px-2.5 py-1 border border-red-500/40 bg-red-500/5 text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all font-bold text-[8px] tracking-wider clip-chamfer cursor-pointer flex items-center gap-1 ml-auto"
                              title="Wycofaj baterię z teatru działań"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                              WYCOFAJ (WYPIERDOL)
                            </button>
                          </div>
                        )}

                        {/* Expandable relocation form */}
                        {isFormOpen && (
                          <div className="mt-2.5 pt-2.5 border-t border-cyan-500/20 flex flex-col gap-2 bg-black/10 p-2 rounded">
                            <span className="text-[8px] text-cyan-400 font-bold uppercase tracking-wider">
                              KONFIGURACJA TRASY PRZEMIESZCZENIA
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="flex flex-col flex-1">
                                <label className="text-[7.5px] theme-text-muted">SZEROKOŚĆ (LAT)</label>
                                <input
                                  type="text"
                                  value={targetLat}
                                  onChange={(e) => setTargetLat(e.target.value)}
                                  className="w-full theme-bg-panel border border-slate-700 p-1 text-[9px] font-mono text-cyan-300 outline-none focus:border-cyan-500"
                                />
                              </div>
                              <div className="flex flex-col flex-1">
                                <label className="text-[7.5px] theme-text-muted">DŁUGOŚĆ (LON)</label>
                                <input
                                  type="text"
                                  value={targetLon}
                                  onChange={(e) => setTargetLon(e.target.value)}
                                  className="w-full theme-bg-panel border border-slate-700 p-1 text-[9px] font-mono text-cyan-300 outline-none focus:border-cyan-500"
                                />
                              </div>
                            </div>

                            {/* Distance & Time Estimate */}
                            {est && (
                              <div className="p-1 px-2 bg-cyan-950/20 border border-cyan-500/20 text-[8px] font-mono theme-text-secondary flex justify-between">
                                <span>DYSTANS: {est.distance} KM</span>
                                <span className="text-cyan-400 font-bold">EST. CZAS DOSTAWY: {est.seconds} SEKUND</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() => handleConfirmRelocation(sys)}
                                className="px-2.5 py-1 border border-emerald-500 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/25 transition-all font-bold text-[8px] clip-chamfer cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-2.5 h-2.5" />
                                ZATWIERDŹ MARSZ
                              </button>
                              <button
                                onClick={() => setRelocatingFormId(null)}
                                className="px-2 py-1 border border-slate-600 bg-slate-500/10 text-slate-400 hover:bg-slate-550/25 transition-all font-bold text-[8px] clip-chamfer cursor-pointer flex items-center gap-1 ml-auto"
                              >
                                <X className="w-2.5 h-2.5" />
                                ANULUJ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
}
