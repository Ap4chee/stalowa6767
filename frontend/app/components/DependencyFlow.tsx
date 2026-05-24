"use client";

import React, { useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Connection
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CriticalNode } from "../types";
import { Target, AlertTriangle, Settings, Plus, Link as LinkIcon, X, Radio } from "lucide-react";

// Coordinates for the 7 strategic nodes to render as a clear physical topology
const INITIAL_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  OBJ_07: { x: 450, y: 220 }, // Centrum Zarządzania (Crisis HQ) - Center-Right
  OBJ_02: { x: 250, y: 150 }, // Elektrownia - Middle-Left
  OBJ_03: { x: 50, y: 50 },   // Ujęcie Wody - Far-Top-Left
  OBJ_05: { x: 50, y: 250 },  // Węzeł Gazowy - Far-Left
  OBJ_04: { x: 250, y: 350 }, // GPZ Maziarnia - Middle-Bottom
  OBJ_06: { x: 450, y: 50 },  // San Tower (Telco) - Top-Right
  OBJ_01: { x: 650, y: 220 }, // HSW S.A. (Industrial) - Far-Right
};

// Custom Node Card Component to render rich visual details matching the military digital twin theme
export function CriticalNodeCard({ data }: { data: { node: CriticalNode; onFlyTo?: (lat: number, lon: number, name: string) => void } }) {
  const { node, onFlyTo } = data;
  const isHealthy = node.status === "OPERATIONAL";
  const isJammed = node.status === "DEGRADED";
  const isDestroyed = node.status === "DESTROYED";

  const colorClass = isDestroyed
    ? "border-red-500 bg-red-950/80 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
    : isJammed
    ? "border-amber-500 bg-amber-950/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
    : "theme-border theme-bg-panel theme-text-primary hover:theme-neon-border hover:shadow-[0_0_12px_rgba(6,182,212,0.15)]";

  return (
    <div className={`p-3 rounded border w-60 font-mono text-[10px] backdrop-blur-md transition-all ${colorClass}`}>
      {/* Input Handle on Left */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: isDestroyed ? "#ef4444" : isJammed ? "#f59e0b" : "var(--neon-cyan)",
          width: "8px",
          height: "8px",
          border: "1px solid var(--border-panel)"
        }}
      />

      <div className="flex justify-between items-center pb-2 border-b theme-border font-rajdhani font-extrabold text-[12px] tracking-wider">
        <span className={isDestroyed ? "text-red-400" : isJammed ? "text-amber-500 dark:text-amber-400" : "theme-neon-text"}>
          {node.name}
        </span>
        <span className="text-[8px] opacity-70 px-1 py-0.5 theme-bg-app border theme-border theme-text-secondary">
          {node.id}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 font-sharetech text-[9px]">
        <div className="flex justify-between items-center">
          <span>SPRAWNOŚĆ AKTYWNA:</span>
          <span className={`font-bold ${isDestroyed ? "text-red-500" : isJammed ? "text-amber-500 dark:text-amber-400" : "text-emerald-500"}`}>
            {node.health}%
          </span>
        </div>

        {/* Health bar meter */}
        <div className="w-full theme-bg-app h-1.5 rounded overflow-hidden border theme-border">
          <div
            className={`h-full transition-all duration-700 ${
              isDestroyed ? "bg-red-500" : isJammed ? "bg-amber-500" : "bg-cyan-500"
            }`}
            style={{ width: `${node.health}%` }}
          />
        </div>

        {/* Notes log */}
        <p className={`text-[8px] leading-relaxed italic ${isDestroyed ? "text-red-300/80" : isJammed ? "text-amber-600 dark:text-amber-300/80" : "theme-text-muted"}`}>
          {node.notes || "Brak aktywnych zaburzeń strukturalnych węzła."}
        </p>

        {/* Interaction controls */}
        <div className="flex gap-2 pt-1.5 border-t theme-border mt-1">
          {onFlyTo && (
            <button
              onClick={() => onFlyTo(node.lat, node.lon, node.name)}
              className="py-1 px-1.5 theme-bg-button hover:theme-bg-button-hover border theme-border text-[8px] font-semibold theme-text-primary hover:theme-neon-text cursor-pointer flex items-center gap-1 transition-all flex-1 justify-center"
            >
              <Target className="w-3 h-3 theme-neon-text" />
              <span>LOKALIZUJ 3D</span>
            </button>
          )}
          {isDestroyed && (
            <div className="px-1 py-0.5 border border-red-500/30 bg-red-950/20 text-red-400 font-bold flex items-center justify-center gap-0.5 text-[8px] animate-pulse rounded">
              <AlertTriangle className="w-3 h-3 text-red-500" />
              <span>AWARIA GRID</span>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle on Right */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: isDestroyed ? "#ef4444" : isJammed ? "#f59e0b" : "var(--neon-cyan)",
          width: "8px",
          height: "8px",
          border: "1px solid var(--border-panel)"
        }}
      />
    </div>
  );
}

// Custom Nodes registration in React Flow
const nodeTypes = {
  criticalNode: CriticalNodeCard
};

import { NodeRelation } from "../types";

interface DependencyFlowProps {
  nodes: CriticalNode[];
  relations: NodeRelation[];
  onFlyTo?: (lat: number, lon: number, name: string) => void;
  onAddNode?: (node: CriticalNode) => void;
  onAddRelation?: (rel: NodeRelation) => void;
  theme?: "light" | "dark";
}

export function DependencyFlow({
  nodes,
  relations,
  onFlyTo,
  onAddNode,
  onAddRelation,
  theme = "light"
}: DependencyFlowProps) {
  // Panel States
  const [showPanel, setShowPanel] = useState(false);
  const [activeForm, setActiveForm] = useState<"node" | "relation">("node");

  // Form states for Nowy Obiekt
  const [nodeName, setNodeName] = useState("");
  const [nodeType, setNodeType] = useState<CriticalNode["type"]>("industrial");
  const [nodeLat, setNodeLat] = useState("50.5630");
  const [nodeLon, setNodeLon] = useState("22.0490");
  const [nodeDesc, setNodeDesc] = useState("");
  const [nodeNotes, setNodeNotes] = useState("");

  // Form states for Nowe Powiązanie
  const [relSource, setRelSource] = useState("");
  const [relTarget, setRelTarget] = useState("");
  const [relLabel, setRelLabel] = useState("ZASILANIE");
  const [customLabel, setCustomLabel] = useState("");

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim() || !onAddNode) return;

    const latNum = parseFloat(nodeLat) || 50.5630;
    const lonNum = parseFloat(nodeLon) || 22.0490;
    const newId = `OBJ_${(nodes.length + 1).toString().padStart(2, "0")}`;

    const newNode: CriticalNode = {
      id: newId,
      name: nodeName,
      type: nodeType,
      lat: latNum,
      lon: lonNum,
      description: nodeDesc || `Nowy obiekt: ${nodeName}`,
      health: 100,
      status: "OPERATIONAL",
      backupPower: false,
      notes: nodeNotes || "Brak aktywnych zaburzeń strukturalnych."
    };

    onAddNode(newNode);
    
    // Reset fields
    setNodeName("");
    setNodeType("industrial");
    setNodeLat("50.5630");
    setNodeLon("22.0490");
    setNodeDesc("");
    setNodeNotes("");
  };

  const handleAddRelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddRelation) return;
    const source = relSource || (nodes[0]?.id || "");
    const target = relTarget || (nodes[1]?.id || "");
    
    if (!source || !target || source === target) return;

    const finalLabel = relLabel === "CUSTOM" ? customLabel : relLabel;
    if (!finalLabel.trim()) return;

    const newRelation: NodeRelation = {
      source,
      target,
      label: finalLabel.toUpperCase()
    };

    onAddRelation(newRelation);
    
    // Reset fields
    setRelSource("");
    setRelTarget("");
    setRelLabel("ZASILANIE");
    setCustomLabel("");
  };

  // Connection Confirmation Modal States
  const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
  const [pendingLabel, setPendingLabel] = useState("ZASILANIE");
  const [customPendingLabel, setCustomPendingLabel] = useState("");

  const handleConfirmConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingConnection || !pendingConnection.source || !pendingConnection.target || !onAddRelation) return;

    const labelVal = pendingLabel === "CUSTOM" ? customPendingLabel : pendingLabel;
    if (!labelVal.trim()) return;

    onAddRelation({
      source: pendingConnection.source,
      target: pendingConnection.target,
      label: labelVal.toUpperCase()
    });

    setPendingConnection(null);
  };


  // Construct initial flow nodes state (only runs once on mount)
  const initialNodes = React.useMemo<Node[]>(() => {
    let savedPositions: Record<string, { x: number; y: number }> = {};
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sentinel_node_positions");
      if (stored) {
        try {
          savedPositions = JSON.parse(stored);
        } catch (e) {
          console.error("Failed to parse saved positions:", e);
        }
      }
    }

    return nodes.map((node) => ({
      id: node.id,
      type: "criticalNode",
      position: savedPositions[node.id] || INITIAL_NODE_POSITIONS[node.id] || { x: 100, y: 100 },
      data: { node, onFlyTo }
    }));
  }, [nodes, onFlyTo]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);

  // Save node coordinates to localStorage on update
  useEffect(() => {
    if (typeof window !== "undefined" && flowNodes.length > 0) {
      const positions: Record<string, { x: number; y: number }> = {};
      flowNodes.forEach((fn) => {
        positions[fn.id] = fn.position;
      });
      localStorage.setItem("sentinel_node_positions", JSON.stringify(positions));
    }
  }, [flowNodes]);

  // Synchronize parent state nodes dynamically (including appending newly registered nodes)
  useEffect(() => {
    setFlowNodes((prevNodes) => {
      let savedPositions: Record<string, { x: number; y: number }> = {};
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sentinel_node_positions");
        if (stored) {
          try {
            savedPositions = JSON.parse(stored);
          } catch (e) {
            console.error("Failed to parse saved positions:", e);
          }
        }
      }

      const updatedNodes = prevNodes.map((fn) => {
        const matching = nodes.find((n) => n.id === fn.id);
        if (matching) {
          return {
            ...fn,
            data: { ...fn.data, node: matching }
          };
        }
        return fn;
      });

      const newNodes = nodes.filter((n) => !prevNodes.some((fn) => fn.id === n.id));
      if (newNodes.length === 0) return updatedNodes;

      const nextIndex = prevNodes.length;
      const additionalNodes = newNodes.map((n, i) => {
        const xPos = 250 + ((nextIndex + i) % 3) * 200;
        const yPos = 400 + Math.floor((nextIndex + i) / 3) * 120;
        return {
          id: n.id,
          type: "criticalNode",
          position: savedPositions[n.id] || INITIAL_NODE_POSITIONS[n.id] || { x: xPos, y: yPos },
          data: { node: n, onFlyTo }
        };
      });

      return [...updatedNodes, ...additionalNodes];
    });
  }, [nodes, onFlyTo, setFlowNodes]);

  // Construct active dynamic edges mapping the physical dependencies in Stalowa Wola
  const initialEdges = React.useMemo<Edge[]>(() => {
    return relations.map(({ source, target, label }, idx) => {
      const sourceNode = nodes.find((n) => n.id === source);
      const isSourceOperational = sourceNode?.status === "OPERATIONAL";
      const isSourceDegraded = sourceNode?.status === "DEGRADED";

      let strokeColor = theme === "light" ? "#0284c7" : "#06b6d4"; // Healthy active flow cyan/sky
      if (sourceNode?.status === "DESTROYED") {
        strokeColor = "#ef4444"; // Offline/broken dependency red
      } else if (isSourceDegraded) {
        strokeColor = theme === "light" ? "#d97706" : "#f59e0b"; // Warning amber
      }

      return {
        id: `e-${source}-${target}-${idx}`,
        source,
        target,
        animated: isSourceOperational, // Animated healthy active flows
        label,
        labelStyle: {
          fill: strokeColor,
          fontSize: "7px",
          fontFamily: "monospace",
          fontWeight: "bold",
          background: "var(--bg-app)"
        },
        style: {
          stroke: strokeColor,
          strokeWidth: isSourceOperational ? 2 : 1.5,
          opacity: isSourceOperational ? 0.9 : 0.4
        }
      };
    });
  }, [relations, nodes, theme]);

  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize edges when dependencies update
  useEffect(() => {
    setFlowEdges(initialEdges);
  }, [initialEdges, setFlowEdges]);

  const onConnect = React.useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return;
      // Open interactive confirmation modal to label this new relation flow
      setPendingConnection(params);
      setPendingLabel("ZASILANIE");
      setCustomPendingLabel("");
    },
    []
  );

  return (
    <div className="w-full h-full min-h-0 theme-bg-app relative select-none">
      {/* Decorative top glass bar */}
      <div className="absolute top-3 left-3 z-10 p-2 border theme-border theme-bg-panel font-mono text-[9px] theme-text-secondary clip-chamfer shadow-lg flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 font-bold font-rajdhani theme-neon-text text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full theme-neon-bg animate-ping" />
          <span>DIAGRAM TOPOLOGII SIECI PRZESYŁOWYCH</span>
        </div>
        <span>Wizualizacja aktywnych kaskadowych powiązań infrastruktury krytycznej.</span>
      </div>

      {/* Dynamic Node/Relation Floating Editor Panel */}
      <div className="absolute top-3 right-3 z-30 flex flex-col items-end pointer-events-auto">
        <button
          onClick={() => setShowPanel(!showPanel)}
          className="px-3 py-1.5 border border-cyan-500/30 theme-bg-panel hover:theme-neon-border text-[9px] font-bold font-rajdhani theme-neon-text tracking-wider shadow-lg flex items-center gap-1.5 clip-chamfer cursor-pointer transition-all hover:bg-cyan-500/10"
        >
          <Settings className="w-3.5 h-3.5 animate-spin-slow" style={{ animationDuration: '6s' }} />
          <span>{showPanel ? "ZAMKNIJ EDYTOR WĘZŁÓW" : "ZARZĄDZANIE WĘZŁAMI"}</span>
        </button>

        {showPanel && (
          <div className="mt-2 w-80 theme-bg-panel border theme-border p-3.5 rounded shadow-2xl backdrop-blur-md text-[10px] font-mono theme-text-primary clip-chamfer max-h-[80vh] overflow-y-auto terminal-scroll">
            <div className="flex justify-between items-center pb-2 border-b theme-border mb-3">
              <span className="font-rajdhani font-extrabold tracking-wider text-[11px] theme-neon-text">KREATOR ELEMENTÓW SIECI</span>
              <button onClick={() => setShowPanel(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-4">
              <button
                onClick={() => setActiveForm("node")}
                className={`py-1 text-center border font-bold text-[8px] tracking-wide rounded cursor-pointer transition-all ${
                  activeForm === "node"
                    ? "bg-cyan-500/20 border-cyan-500 theme-neon-text"
                    : "theme-bg-button theme-border theme-text-secondary hover:theme-text-primary hover:theme-neon-border"
                }`}
              >
                + REJESTRUJ OBIEKT
              </button>
              <button
                onClick={() => setActiveForm("relation")}
                className={`py-1 text-center border font-bold text-[8px] tracking-wide rounded cursor-pointer transition-all ${
                  activeForm === "relation"
                    ? "bg-cyan-500/20 border-cyan-500 theme-neon-text"
                    : "theme-bg-button theme-border theme-text-secondary hover:theme-text-primary hover:theme-neon-border"
                }`}
              >
                + UTWÓRZ POWIĄZANIE
              </button>
            </div>

            {activeForm === "node" ? (
              <form onSubmit={handleAddNodeSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[8px] theme-text-muted mb-1">NAZWA WĘZŁA STRATEGICZNEGO:</label>
                  <input
                    type="text"
                    required
                    placeholder="np. ELEKTROWNIA STALOWA WOLA"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px] placeholder:opacity-40"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] theme-text-muted mb-1">KLASYFIKACJA SEKTORA:</label>
                    <select
                      value={nodeType}
                      onChange={(e) => setNodeType(e.target.value as any)}
                      className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px]"
                    >
                      <option value="industrial">Huta / Przemysł</option>
                      <option value="power">Elektrownia / Agregat</option>
                      <option value="water">Ujęcie Wody / Pompownia</option>
                      <option value="electrical">Rozdzielnia GPZ</option>
                      <option value="logistic">Węzeł Gazowy / Paliwowy</option>
                      <option value="transit">Dworzec / Tranzyt</option>
                      <option value="hq">Sztab Kryzysowy / Dowodzenie</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] theme-text-muted mb-1">LOKALIZACJA GPS LUB SEKTOR:</label>
                    <div className="text-[8px] text-cyan-400 font-semibold py-1.5 px-1 bg-slate-950/50 border theme-border rounded text-center">
                      DOMYŚLNE WSPÓŁRZĘDNE
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[8px] theme-text-muted mb-1">SZEROKOŚĆ (LAT):</label>
                    <input
                      type="text"
                      required
                      value={nodeLat}
                      onChange={(e) => setNodeLat(e.target.value)}
                      className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] theme-text-muted mb-1">DŁUGOŚĆ (LON):</label>
                    <input
                      type="text"
                      required
                      value={nodeLon}
                      onChange={(e) => setNodeLon(e.target.value)}
                      className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] theme-text-muted mb-1">OPIS WYWIADOWCZY:</label>
                  <textarea
                    placeholder="Główny sektor zaopatrzenia, kluczowe podstacje zasilające..."
                    value={nodeDesc}
                    onChange={(e) => setNodeDesc(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px] resize-none placeholder:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-[8px] theme-text-muted mb-1">INFORMACJA O POWIĄZANIACH:</label>
                  <textarea
                    placeholder="Brak aktywnych zaburzeń strukturalnych gridu..."
                    value={nodeNotes}
                    onChange={(e) => setNodeNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px] resize-none placeholder:opacity-40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-1.5 theme-bg-app border border-cyan-500 hover:bg-cyan-500/20 theme-neon-text font-bold text-[9px] tracking-widest clip-chamfer transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  <span>DODAJ NOWY WĘZEŁ</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleAddRelSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[8px] theme-text-muted mb-1">WĘZEŁ STRATEGICZNY ŹRÓDŁOWY (DONOR):</label>
                  <select
                    value={relSource}
                    onChange={(e) => setRelSource(e.target.value)}
                    className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px]"
                  >
                    <option value="">Wybierz węzeł dawcę...</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] theme-text-muted mb-1">WĘZEŁ STRATEGICZNY DOCELOWY (AKCEPTOR):</label>
                  <select
                    value={relTarget}
                    onChange={(e) => setRelTarget(e.target.value)}
                    className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px]"
                  >
                    <option value="">Wybierz węzeł biorcę...</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name} ({n.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[8px] theme-text-muted mb-1">KATEGORIA STRUMIENIA PRZEPŁYWU:</label>
                  <select
                    value={relLabel}
                    onChange={(e) => setRelLabel(e.target.value)}
                    className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px]"
                  >
                    <option value="ZASILANIE">ZASILANIE (ELEKTRYCZNE)</option>
                    <option value="PALIWO">PALIWO (GAZ / MAZUT)</option>
                    <option value="CHŁODZIWO">CHŁODZIWO (WODA HYDROGRAFICZNA)</option>
                    <option value="TELCO">TELCO (ŁĄCZNOŚĆ ŚWIATŁOWODOWA)</option>
                    <option value="DOWODZENIE">DOWODZENIE (STRATEGICZNE / C2)</option>
                    <option value="LOGISTYKA">LOGISTYKA (ZAOPATRZENIE SPALNE)</option>
                    <option value="CUSTOM">INNY / ZDEFINIUJ RĘCZNIE...</option>
                  </select>
                </div>

                {relLabel === "CUSTOM" && (
                  <div>
                    <label className="block text-[8px] theme-text-muted mb-1">ZDEFINIUJ WŁASNY TYP PRZEPŁYWU:</label>
                    <input
                      type="text"
                      required
                      placeholder="np. TRANSFER MATERIAŁÓW"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px] uppercase"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-1.5 theme-bg-app border border-cyan-500 hover:bg-cyan-500/20 theme-neon-text font-bold text-[9px] tracking-widest clip-chamfer transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>UTWÓRZ AKTYWNE POWIĄZANIE</span>
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.5}
        className="w-full h-full"
      >
        <Background
          color={theme === "light" ? "#94a3b8" : "#475569"}
          gap={24}
          size={1.5}
          variant={BackgroundVariant.Cross}
        />
        <Controls
          className="theme-bg-panel border theme-border theme-neon-text shadow-md font-mono text-[10px]"
          style={{
            bottom: "24px",
            left: "24px",
            display: "flex",
            flexDirection: "row",
            gap: "2px"
          }}
        />
        <MiniMap
          nodeColor={(n) => {
            const status = (n.data as any)?.node?.status;
            return status === "DESTROYED" ? "#ef4444" : status === "DEGRADED" ? "#f59e0b" : "#06b6d4";
          }}
          maskColor={theme === "light" ? "rgba(248, 250, 252, 0.6)" : "rgba(2, 6, 23, 0.7)"}
          style={{
            bottom: "24px",
            right: "24px",
            border: "1px solid var(--border-panel)",
            background: "var(--bg-app)",
            width: 100,
            height: 70
          }}
        />
      </ReactFlow>

      {/* Interactive Drag-and-Link Confirmation Dialog */}
      {pendingConnection && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
          <div className="w-80 theme-bg-panel border border-cyan-500/50 p-4 rounded shadow-2xl font-mono text-[10px] theme-text-primary clip-chamfer">
            <div className="flex justify-between items-center pb-2 border-b theme-border mb-3">
              <span className="font-rajdhani font-extrabold tracking-wider text-[11px] theme-neon-text">KLASYFIKACJA POWIĄZANIA</span>
              <button onClick={() => setPendingConnection(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="text-[8px] theme-text-muted mb-3 leading-relaxed">
              Utworzono połączenie fizyczne pomiędzy węzłami: <br />
              <span className="theme-text-primary font-bold">{nodes.find(n => n.id === pendingConnection.source)?.name}</span> ➔ <span className="theme-text-primary font-bold">{nodes.find(n => n.id === pendingConnection.target)?.name}</span>
            </p>

            <form onSubmit={handleConfirmConnection} className="space-y-3.5">
              <div>
                <label className="block text-[8px] theme-text-muted mb-1">KATEGORIA STRUMIENIA PRZEPŁYWU:</label>
                <select
                  value={pendingLabel}
                  onChange={(e) => setPendingLabel(e.target.value)}
                  className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px]"
                >
                  <option value="ZASILANIE">ZASILANIE (ELEKTRYCZNE)</option>
                  <option value="PALIWO">PALIWO (GAZ / MAZUT)</option>
                  <option value="CHŁODZIWO">CHŁODZIWO (WODA HYDROGRAFICZNA)</option>
                  <option value="TELCO">TELCO (ŁĄCZNOŚĆ ŚWIATŁOWODOWA)</option>
                  <option value="DOWODZENIE">DOWODZENIE (STRATEGICZNE / C2)</option>
                  <option value="LOGISTYKA">LOGISTYKA (ZAOPATRZENIE SPALNE)</option>
                  <option value="CUSTOM">INNY / ZDEFINIUJ RĘCZNIE...</option>
                </select>
              </div>

              {pendingLabel === "CUSTOM" && (
                <div>
                  <label className="block text-[8px] theme-text-muted mb-1">ZDEFINIUJ WŁASNY TYP PRZEPŁYWU:</label>
                  <input
                    type="text"
                    required
                    placeholder="np. SENSORY / WIDEO"
                    value={customPendingLabel}
                    onChange={(e) => setCustomPendingLabel(e.target.value)}
                    className="w-full bg-slate-950/80 border theme-border rounded px-2 py-1 theme-text-primary outline-none focus:theme-neon-border text-[9px] uppercase"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingConnection(null)}
                  className="w-full py-1.5 theme-bg-app border theme-border hover:theme-neon-border text-slate-400 hover:text-white font-bold text-[9px] tracking-wider clip-chamfer transition-all cursor-pointer"
                >
                  ANULUJ
                </button>
                <button
                  type="submit"
                  className="w-full py-1.5 theme-bg-app border border-cyan-500 hover:bg-cyan-500/20 theme-neon-text font-bold text-[9px] tracking-wider clip-chamfer transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <LinkIcon className="w-3 h-3 text-cyan-400" />
                  <span>POTWIERDŹ</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
