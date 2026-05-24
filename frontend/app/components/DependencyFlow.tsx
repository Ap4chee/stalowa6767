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
import { CriticalNode, NodeRelation } from "../types";
import { Target, AlertTriangle, Settings, Plus, Link as LinkIcon, X, Sliders } from "lucide-react";
import { Panel, Button, StatusPill, HealthBar, Dialog } from "../ui";

/* ============================================================
 * VISUAL VARIANT FLAG
 * "soft"   — v2 soft-SaaS, zgodny z app/CLAUDE.md (domyślny)
 * "legacy" — stary tactical-cyan styl (zostawiony do szybkiego rollbacku)
 * Zmień tę stałą, by przełączyć cały widok schematu sieci.
 * ============================================================ */
const VISUAL: "soft" | "legacy" = "soft";

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

const typeLabelPl: Record<CriticalNode["type"], string> = {
  power: "Elektrownia",
  water: "Ujęcie wody",
  industrial: "Przemysł",
  electrical: "Energetyka",
  logistic: "Logistyka",
  transit: "Tranzyt",
  hq: "Sztab"
};

/* ============================================================
 *  SOFT NODE CARD — v2
 * ============================================================ */
function CriticalNodeCardSoft({ data }: { data: { node: CriticalNode; onFlyTo?: (lat: number, lon: number, name: string) => void } }) {
  const { node, onFlyTo } = data;
  const isDestroyed = node.status === "DESTROYED";
  const isDegraded  = node.status === "DEGRADED";

  const tone: "ok" | "warn" | "error" =
    isDestroyed ? "error" : isDegraded ? "warn" : "ok";

  const ringClass =
    isDestroyed ? "ring-1 ring-(--error)/40" :
    isDegraded  ? "ring-1 ring-(--warn)/35"  : "";

  const handleColor =
    isDestroyed ? "var(--error)" :
    isDegraded  ? "var(--warn)"  : "var(--accent)";

  return (
    <div className={`w-64 bg-surface-1 rounded-(--r-md) elev-1 px-4 py-3 flex flex-col gap-2.5 ${ringClass}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: handleColor,
          width: 8,
          height: 8,
          border: "1px solid var(--border-subtle)"
        }}
      />

      {/* Header: eyebrow + name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-micro text-muted">
            {node.id} · {typeLabelPl[node.type] ?? node.type}
          </span>
          <span className="text-heading text-primary truncate mt-0.5">{node.name}</span>
        </div>
        <StatusPill tone={tone} size="xs" dot pulse={node.status !== "OPERATIONAL"}>
          {node.status === "OPERATIONAL" ? "Sprawny" : isDegraded ? "Uszkodzony" : "Zniszczony"}
        </StatusPill>
      </div>

      <HealthBar value={node.health} label="Sprawność" size="xs" />

      {node.notes && (
        <p className="text-caption text-secondary leading-snug line-clamp-2">
          {node.notes}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        {onFlyTo && (
          <Button
            size="sm"
            variant="secondary"
            icon={<Target className="w-3.5 h-3.5" />}
            onClick={() => onFlyTo(node.lat, node.lon, node.name)}
            className="flex-1"
          >
            Pokaż na mapie
          </Button>
        )}
        {isDestroyed && (
          <StatusPill tone="error" size="xs" dot pulse>
            Awaria gridu
          </StatusPill>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: handleColor,
          width: 8,
          height: 8,
          border: "1px solid var(--border-subtle)"
        }}
      />
    </div>
  );
}

/* ============================================================
 *  LEGACY NODE CARD — zachowane do szybkiego rollbacku (VISUAL = "legacy")
 * ============================================================ */
export function CriticalNodeCard({ data }: { data: { node: CriticalNode; onFlyTo?: (lat: number, lon: number, name: string) => void } }) {
  const { node, onFlyTo } = data;
  const isJammed = node.status === "DEGRADED";
  const isDestroyed = node.status === "DESTROYED";

  const colorClass = isDestroyed
    ? "border-red-500 bg-red-950/80 text-red-200 shadow-[0_0_15px_rgba(239,68,68,0.25)]"
    : isJammed
    ? "border-amber-500 bg-amber-950/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
    : "theme-border theme-bg-panel theme-text-primary hover:theme-neon-border hover:shadow-[0_0_12px_rgba(6,182,212,0.15)]";

  return (
    <div className={`p-3 rounded border w-60 font-mono text-[10px] backdrop-blur-md transition-all ${colorClass}`}>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: isDestroyed ? "#ef4444" : isJammed ? "#f59e0b" : "var(--neon-cyan)", width: "8px", height: "8px", border: "1px solid var(--border-panel)" }}
      />
      <div className="flex justify-between items-center pb-2 border-b theme-border font-rajdhani font-extrabold text-[12px] tracking-wider">
        <span className={isDestroyed ? "text-red-400" : isJammed ? "text-amber-500 dark:text-amber-400" : "theme-neon-text"}>{node.name}</span>
        <span className="text-[8px] opacity-70 px-1 py-0.5 theme-bg-app border theme-border theme-text-secondary">{node.id}</span>
      </div>
      <div className="mt-2.5 space-y-1.5 font-sharetech text-[9px]">
        <div className="flex justify-between items-center">
          <span>SPRAWNOŚĆ AKTYWNA:</span>
          <span className={`font-bold ${isDestroyed ? "text-red-500" : isJammed ? "text-amber-500 dark:text-amber-400" : "text-emerald-500"}`}>{node.health}%</span>
        </div>
        <div className="w-full theme-bg-app h-1.5 rounded overflow-hidden border theme-border">
          <div className={`h-full transition-all duration-700 ${isDestroyed ? "bg-red-500" : isJammed ? "bg-amber-500" : "bg-cyan-500"}`} style={{ width: `${node.health}%` }} />
        </div>
        <p className={`text-[8px] leading-relaxed italic ${isDestroyed ? "text-red-300/80" : isJammed ? "text-amber-600 dark:text-amber-300/80" : "theme-text-muted"}`}>
          {node.notes || "Brak aktywnych zaburzeń strukturalnych węzła."}
        </p>
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
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: isDestroyed ? "#ef4444" : isJammed ? "#f59e0b" : "var(--neon-cyan)", width: "8px", height: "8px", border: "1px solid var(--border-panel)" }}
      />
    </div>
  );
}

const nodeTypes = {
  criticalNode: VISUAL === "soft" ? CriticalNodeCardSoft : CriticalNodeCard
};

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
  // Editor panel
  const [showEditor, setShowEditor] = useState(false);
  const [activeForm, setActiveForm] = useState<"node" | "relation">("node");

  // Node form state
  const [nodeName, setNodeName] = useState("");
  const [nodeType, setNodeType] = useState<CriticalNode["type"]>("industrial");
  const [nodeLat, setNodeLat] = useState("50.5630");
  const [nodeLon, setNodeLon] = useState("22.0490");
  const [nodeDesc, setNodeDesc] = useState("");
  const [nodeNotes, setNodeNotes] = useState("");

  // Relation form state
  const [relSource, setRelSource] = useState("");
  const [relTarget, setRelTarget] = useState("");
  const [relLabel, setRelLabel] = useState("ZASILANIE");
  const [customLabel, setCustomLabel] = useState("");

  const resetNodeForm = () => {
    setNodeName(""); setNodeType("industrial");
    setNodeLat("50.5630"); setNodeLon("22.0490");
    setNodeDesc(""); setNodeNotes("");
  };
  const resetRelForm = () => {
    setRelSource(""); setRelTarget("");
    setRelLabel("ZASILANIE"); setCustomLabel("");
  };

  const handleAddNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim() || !onAddNode) return;

    const latNum = parseFloat(nodeLat) || 50.5630;
    const lonNum = parseFloat(nodeLon) || 22.0490;
    const newId = `OBJ_${(nodes.length + 1).toString().padStart(2, "0")}`;

    onAddNode({
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
    });

    resetNodeForm();
  };

  const handleAddRelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddRelation) return;
    const source = relSource || (nodes[0]?.id || "");
    const target = relTarget || (nodes[1]?.id || "");
    if (!source || !target || source === target) return;

    const finalLabel = relLabel === "CUSTOM" ? customLabel : relLabel;
    if (!finalLabel.trim()) return;

    onAddRelation({ source, target, label: finalLabel.toUpperCase() });
    resetRelForm();
  };

  // Connection confirmation
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

  // Initial flow nodes
  const initialNodes = React.useMemo<Node[]>(() => {
    let savedPositions: Record<string, { x: number; y: number }> = {};
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sentinel_node_positions");
      if (stored) {
        try { savedPositions = JSON.parse(stored); } catch (e) { console.error("Failed to parse saved positions:", e); }
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

  useEffect(() => {
    if (typeof window !== "undefined" && flowNodes.length > 0) {
      const positions: Record<string, { x: number; y: number }> = {};
      flowNodes.forEach((fn) => { positions[fn.id] = fn.position; });
      localStorage.setItem("sentinel_node_positions", JSON.stringify(positions));
    }
  }, [flowNodes]);

  useEffect(() => {
    setFlowNodes((prevNodes) => {
      let savedPositions: Record<string, { x: number; y: number }> = {};
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("sentinel_node_positions");
        if (stored) {
          try { savedPositions = JSON.parse(stored); } catch (e) { console.error("Failed to parse saved positions:", e); }
        }
      }

      const updatedNodes = prevNodes.map((fn) => {
        const matching = nodes.find((n) => n.id === fn.id);
        if (matching) {
          return { ...fn, data: { ...fn.data, node: matching } };
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

  const initialEdges = React.useMemo<Edge[]>(() => {
    return relations.map(({ source, target, label }, idx) => {
      const sourceNode = nodes.find((n) => n.id === source);
      const isSourceOperational = sourceNode?.status === "OPERATIONAL";
      const isSourceDegraded = sourceNode?.status === "DEGRADED";

      // Soft palette uses CSS token colors so it follows the active theme
      const strokeColor =
        sourceNode?.status === "DESTROYED" ? "var(--error)"
        : isSourceDegraded ? "var(--warn)"
        : "var(--accent)";

      return {
        id: `e-${source}-${target}-${idx}`,
        source,
        target,
        animated: isSourceOperational,
        label,
        labelStyle: {
          fill: "var(--text-2)",
          fontSize: VISUAL === "soft" ? 10 : 7,
          fontFamily: VISUAL === "soft" ? "var(--font-mono)" : "monospace",
          fontWeight: VISUAL === "soft" ? 500 : "bold",
          letterSpacing: VISUAL === "soft" ? "0.02em" : "0.05em"
        },
        labelBgStyle: VISUAL === "soft"
          ? { fill: "var(--surface-1)", stroke: "var(--border-subtle)", strokeWidth: 1 }
          : undefined,
        labelBgPadding: VISUAL === "soft" ? [6, 3] : undefined,
        labelBgBorderRadius: VISUAL === "soft" ? 6 : undefined,
        style: {
          stroke: strokeColor,
          strokeWidth: isSourceOperational ? 2 : 1.5,
          opacity: isSourceOperational ? 0.9 : 0.45
        }
      };
    });
  }, [relations, nodes]);

  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setFlowEdges(initialEdges);
  }, [initialEdges, setFlowEdges]);

  const onConnect = React.useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || params.source === params.target) return;
      setPendingConnection(params);
      setPendingLabel("ZASILANIE");
      setCustomPendingLabel("");
    },
    []
  );

  /* ---------- SOFT CHROME (header chip + manage button) ---------- */
  if (VISUAL === "soft") {
    return (
      <div className="w-full h-full min-h-0 bg-canvas relative select-none">
        {/* Top-left header chip */}
        <Panel
          variant="floating"
          rounded="md"
          className="absolute top-3 left-3 z-10 px-4 py-2.5 flex flex-col gap-0.5 max-w-sm"
        >
          <span className="text-micro text-muted">Schemat sieci</span>
          <span className="text-heading text-primary leading-tight">Diagram topologii sieci przesyłowych</span>
          <span className="text-caption text-secondary leading-snug">
            Wizualizacja aktywnych kaskadowych powiązań infrastruktury krytycznej.
          </span>
        </Panel>

        {/* Top-right manage button */}
        <div className="absolute top-3 right-3 z-30">
          <Button
            variant="secondary"
            size="sm"
            icon={<Sliders className="w-3.5 h-3.5" />}
            onClick={() => setShowEditor(true)}
          >
            Zarządzanie węzłami
          </Button>
        </div>

        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.3}
          maxZoom={1.5}
          className="w-full h-full"
        >
          <Background
            color={theme === "light" ? "#cbd5e1" : "#334155"}
            gap={28}
            size={1}
            variant={BackgroundVariant.Dots}
          />
          <Controls
            style={{ bottom: "24px", left: "24px", display: "flex", flexDirection: "row", gap: 2 }}
          />
          <MiniMap
            nodeColor={(n) => {
              const status = (n.data as { node?: { status?: string } } | undefined)?.node?.status;
              return status === "DESTROYED" ? "var(--error)" : status === "DEGRADED" ? "var(--warn)" : "var(--accent)";
            }}
            maskColor={theme === "light" ? "rgba(248, 250, 252, 0.65)" : "rgba(2, 6, 23, 0.7)"}
            style={{
              bottom: "24px",
              right: "24px",
              border: "1px solid var(--border-subtle)",
              background: "var(--surface-1)",
              borderRadius: 10,
              width: 110,
              height: 76
            }}
          />
        </ReactFlow>

        {/* Editor dialog */}
        <Dialog
          open={showEditor}
          onClose={() => setShowEditor(false)}
          eyebrow="Schemat sieci"
          title="Kreator elementów sieci"
          width="md"
        >
          <div className="flex flex-col gap-4">
            {/* Tabs */}
            <div className="inline-flex rounded-(--r-md) bg-surface-data p-1 self-start">
              <button
                type="button"
                onClick={() => setActiveForm("node")}
                className={[
                  "px-3 py-1.5 text-label rounded-(--r-sm) transition-colors cursor-pointer",
                  activeForm === "node"
                    ? "bg-surface-1 text-primary elev-1"
                    : "text-secondary hover:text-primary"
                ].join(" ")}
              >
                Nowy obiekt
              </button>
              <button
                type="button"
                onClick={() => setActiveForm("relation")}
                className={[
                  "px-3 py-1.5 text-label rounded-(--r-sm) transition-colors cursor-pointer",
                  activeForm === "relation"
                    ? "bg-surface-1 text-primary elev-1"
                    : "text-secondary hover:text-primary"
                ].join(" ")}
              >
                Nowe powiązanie
              </button>
            </div>

            {activeForm === "node" ? (
              <form id="dep-flow-node-form" onSubmit={handleAddNodeSubmit} className="flex flex-col gap-4">
                <SoftField label="Nazwa obiektu">
                  <input
                    type="text" required
                    placeholder="np. Elektrownia Stalowa Wola"
                    value={nodeName} onChange={(e) => setNodeName(e.target.value)}
                    className={inputClass}
                  />
                </SoftField>

                <SoftField label="Klasyfikacja sektora">
                  <select value={nodeType} onChange={(e) => setNodeType(e.target.value as CriticalNode["type"])} className={inputClass}>
                    <option value="industrial">Przemysł</option>
                    <option value="power">Elektrownia</option>
                    <option value="water">Ujęcie wody</option>
                    <option value="electrical">Energetyka</option>
                    <option value="logistic">Logistyka</option>
                    <option value="transit">Tranzyt</option>
                    <option value="hq">Sztab</option>
                  </select>
                </SoftField>

                <div className="grid grid-cols-2 gap-3">
                  <SoftField label="Szerokość (lat)">
                    <input type="text" required value={nodeLat} onChange={(e) => setNodeLat(e.target.value)} className={inputClass} />
                  </SoftField>
                  <SoftField label="Długość (lon)">
                    <input type="text" required value={nodeLon} onChange={(e) => setNodeLon(e.target.value)} className={inputClass} />
                  </SoftField>
                </div>

                <SoftField label="Opis (opcjonalnie)">
                  <textarea
                    placeholder="Główny sektor zaopatrzenia, kluczowe podstacje…"
                    value={nodeDesc} onChange={(e) => setNodeDesc(e.target.value)} rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </SoftField>

                <SoftField label="Notatki o powiązaniach (opcjonalnie)">
                  <textarea
                    placeholder="np. Brak aktywnych zaburzeń strukturalnych."
                    value={nodeNotes} onChange={(e) => setNodeNotes(e.target.value)} rows={2}
                    className={`${inputClass} resize-none`}
                  />
                </SoftField>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="ghost" size="md" type="button" onClick={() => setShowEditor(false)}>Anuluj</Button>
                  <Button variant="primary" size="md" type="submit" icon={<Plus className="w-3.5 h-3.5" />}>
                    Dodaj węzeł
                  </Button>
                </div>
              </form>
            ) : (
              <form id="dep-flow-rel-form" onSubmit={handleAddRelSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <SoftField label="Węzeł źródłowy">
                    <select value={relSource} onChange={(e) => setRelSource(e.target.value)} className={inputClass}>
                      <option value="">Wybierz węzeł…</option>
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.id} · {n.name}</option>
                      ))}
                    </select>
                  </SoftField>
                  <SoftField label="Węzeł docelowy">
                    <select value={relTarget} onChange={(e) => setRelTarget(e.target.value)} className={inputClass}>
                      <option value="">Wybierz węzeł…</option>
                      {nodes.map((n) => (
                        <option key={n.id} value={n.id}>{n.id} · {n.name}</option>
                      ))}
                    </select>
                  </SoftField>
                </div>

                <SoftField label="Typ przepływu">
                  <select value={relLabel} onChange={(e) => setRelLabel(e.target.value)} className={inputClass}>
                    <option value="ZASILANIE">Zasilanie energetyczne</option>
                    <option value="PALIWO">Paliwo / gaz</option>
                    <option value="CHŁODZIWO">Woda / chłodziwo</option>
                    <option value="TELCO">Telco / światłowód</option>
                    <option value="DOWODZENIE">Dowodzenie (C2)</option>
                    <option value="LOGISTYKA">Logistyka / amunicja</option>
                    <option value="CUSTOM">Inny…</option>
                  </select>
                </SoftField>

                {relLabel === "CUSTOM" && (
                  <SoftField label="Własna etykieta">
                    <input
                      type="text" required placeholder="np. SENSORY"
                      value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                      className={`${inputClass} uppercase`}
                    />
                  </SoftField>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="ghost" size="md" type="button" onClick={() => setShowEditor(false)}>Anuluj</Button>
                  <Button variant="primary" size="md" type="submit" icon={<LinkIcon className="w-3.5 h-3.5" />}>
                    Połącz węzły
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Dialog>

        {/* Pending connection confirmation */}
        <Dialog
          open={!!pendingConnection}
          onClose={() => setPendingConnection(null)}
          eyebrow="Schemat sieci"
          title="Klasyfikacja powiązania"
          width="sm"
        >
          <form id="dep-flow-pending-form" onSubmit={handleConfirmConnection} className="flex flex-col gap-4">
            {pendingConnection && (
              <p className="text-caption text-secondary leading-relaxed">
                Łączysz: <span className="text-primary">{nodes.find(n => n.id === pendingConnection.source)?.name ?? pendingConnection.source}</span>
                {" → "}
                <span className="text-primary">{nodes.find(n => n.id === pendingConnection.target)?.name ?? pendingConnection.target}</span>
              </p>
            )}

            <SoftField label="Typ przepływu">
              <select value={pendingLabel} onChange={(e) => setPendingLabel(e.target.value)} className={inputClass}>
                <option value="ZASILANIE">Zasilanie energetyczne</option>
                <option value="PALIWO">Paliwo / gaz</option>
                <option value="CHŁODZIWO">Woda / chłodziwo</option>
                <option value="TELCO">Telco / światłowód</option>
                <option value="DOWODZENIE">Dowodzenie (C2)</option>
                <option value="LOGISTYKA">Logistyka / amunicja</option>
                <option value="CUSTOM">Inny…</option>
              </select>
            </SoftField>

            {pendingLabel === "CUSTOM" && (
              <SoftField label="Własna etykieta">
                <input
                  type="text" required placeholder="np. SENSORY / WIDEO"
                  value={customPendingLabel} onChange={(e) => setCustomPendingLabel(e.target.value)}
                  className={`${inputClass} uppercase`}
                />
              </SoftField>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="ghost" size="md" type="button" onClick={() => setPendingConnection(null)}>Anuluj</Button>
              <Button variant="primary" size="md" type="submit" icon={<LinkIcon className="w-3.5 h-3.5" />}>
                Potwierdź połączenie
              </Button>
            </div>
          </form>
        </Dialog>
      </div>
    );
  }

  /* ---------- LEGACY CHROME (rollback path) ---------- */
  return (
    <div className="w-full h-full min-h-0 theme-bg-app relative select-none">
      <div className="absolute top-3 left-3 z-10 p-2 border theme-border theme-bg-panel font-mono text-[9px] theme-text-secondary clip-chamfer shadow-lg flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 font-bold font-rajdhani theme-neon-text text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full theme-neon-bg animate-ping" />
          <span>DIAGRAM TOPOLOGII SIECI PRZESYŁOWYCH</span>
        </div>
        <span>Wizualizacja aktywnych kaskadowych powiązań infrastruktury krytycznej.</span>
      </div>

      <div className="absolute top-3 right-3 z-30 flex flex-col items-end pointer-events-auto">
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="px-3 py-1.5 border border-cyan-500/30 theme-bg-panel hover:theme-neon-border text-[9px] font-bold font-rajdhani theme-neon-text tracking-wider shadow-lg flex items-center gap-1.5 clip-chamfer cursor-pointer transition-all hover:bg-cyan-500/10"
        >
          <Settings className="w-3.5 h-3.5 animate-spin-slow" style={{ animationDuration: '6s' }} />
          <span>{showEditor ? "ZAMKNIJ EDYTOR WĘZŁÓW" : "ZARZĄDZANIE WĘZŁAMI"}</span>
        </button>

        {showEditor && (
          <div className="mt-2 w-80 theme-bg-panel border theme-border p-3.5 rounded shadow-2xl backdrop-blur-md text-[10px] font-mono theme-text-primary clip-chamfer max-h-[80vh] overflow-y-auto terminal-scroll">
            <div className="flex justify-between items-center pb-2 border-b theme-border mb-3">
              <span className="font-rajdhani font-extrabold tracking-wider text-[11px] theme-neon-text">KREATOR ELEMENTÓW SIECI</span>
              <button onClick={() => setShowEditor(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 mb-4">
              <button onClick={() => setActiveForm("node")} className={`py-1 text-center border font-bold text-[8px] tracking-wide rounded cursor-pointer transition-all ${activeForm === "node" ? "bg-cyan-500/20 border-cyan-500 theme-neon-text" : "theme-bg-button theme-border theme-text-secondary hover:theme-text-primary hover:theme-neon-border"}`}>+ REJESTRUJ OBIEKT</button>
              <button onClick={() => setActiveForm("relation")} className={`py-1 text-center border font-bold text-[8px] tracking-wide rounded cursor-pointer transition-all ${activeForm === "relation" ? "bg-cyan-500/20 border-cyan-500 theme-neon-text" : "theme-bg-button theme-border theme-text-secondary hover:theme-text-primary hover:theme-neon-border"}`}>+ UTWÓRZ POWIĄZANIE</button>
            </div>

            <div className="text-[9px] theme-text-muted">Legacy editor — przełącz VISUAL = &quot;soft&quot; w pliku, by uzyskać nowy formularz.</div>
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
        <Background color={theme === "light" ? "#94a3b8" : "#475569"} gap={24} size={1.5} variant={BackgroundVariant.Cross} />
        <Controls className="theme-bg-panel border theme-border theme-neon-text shadow-md font-mono text-[10px]" style={{ bottom: "24px", left: "24px", display: "flex", flexDirection: "row", gap: "2px" }} />
        <MiniMap
          nodeColor={(n) => {
            const status = (n.data as { node?: { status?: string } } | undefined)?.node?.status;
            return status === "DESTROYED" ? "#ef4444" : status === "DEGRADED" ? "#f59e0b" : "#06b6d4";
          }}
          maskColor={theme === "light" ? "rgba(248, 250, 252, 0.6)" : "rgba(2, 6, 23, 0.7)"}
          style={{ bottom: "24px", right: "24px", border: "1px solid var(--border-panel)", background: "var(--bg-app)", width: 100, height: 70 }}
        />
      </ReactFlow>

      {pendingConnection && (
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
          <div className="w-80 theme-bg-panel border border-cyan-500/50 p-4 rounded shadow-2xl font-mono text-[10px] theme-text-primary clip-chamfer">
            <div className="flex justify-between items-center pb-2 border-b theme-border mb-3">
              <span className="font-rajdhani font-extrabold tracking-wider text-[11px] theme-neon-text">KLASYFIKACJA POWIĄZANIA</span>
              <button onClick={() => setPendingConnection(null)} className="text-slate-400 hover:theme-text-primary cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <form onSubmit={handleConfirmConnection} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button type="button" onClick={() => setPendingConnection(null)} className="w-full py-1.5 theme-bg-app border theme-border hover:theme-neon-border text-slate-400 hover:theme-text-primary font-bold text-[9px] tracking-wider clip-chamfer transition-all cursor-pointer">ANULUJ</button>
                <button type="submit" className="w-full py-1.5 theme-bg-app border border-cyan-500 hover:bg-cyan-500/20 theme-neon-text font-bold text-[9px] tracking-wider clip-chamfer transition-all cursor-pointer flex items-center justify-center gap-1">
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

/* ============================================================
 *  Soft form helpers (lokalne do tego pliku, podobne do NodeList.tsx)
 * ============================================================ */
const inputClass =
  "w-full text-body px-3.5 py-2.5 rounded-(--r-md) bg-surface-data text-primary " +
  "focus:outline-none focus:ring-2 focus:ring-(--accent) placeholder:text-muted";

function SoftField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-micro text-muted">{label}</span>
      {children}
    </label>
  );
}
