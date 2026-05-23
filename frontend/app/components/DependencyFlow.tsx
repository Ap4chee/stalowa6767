"use client";

import React, { useEffect } from "react";
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
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CriticalNode } from "../types";
import { Target, AlertTriangle } from "lucide-react";

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

interface DependencyFlowProps {
  nodes: CriticalNode[];
  onFlyTo?: (lat: number, lon: number, name: string) => void;
  theme?: "light" | "dark";
}

export function DependencyFlow({ nodes, onFlyTo, theme = "light" }: DependencyFlowProps) {
  // Construct initial flow nodes state
  const initialNodes = React.useMemo<Node[]>(() => {
    return nodes.map((node) => ({
      id: node.id,
      type: "criticalNode",
      position: INITIAL_NODE_POSITIONS[node.id] || { x: 100, y: 100 },
      data: { node, onFlyTo }
    }));
  }, [onFlyTo]); // only run once initially

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialNodes);

  // Safely synchronize simulation nodes updates from parent state (health, notes, status)
  useEffect(() => {
    setFlowNodes((prevNodes) =>
      prevNodes.map((flowNode) => {
        const matchingNode = nodes.find((n) => n.id === flowNode.id);
        if (matchingNode) {
          return {
            ...flowNode,
            data: {
              ...flowNode.data,
              node: matchingNode
            }
          };
        }
        return flowNode;
      })
    );
  }, [nodes, setFlowNodes]);

  // Construct active dynamic edges mapping the physical dependencies in Stalowa Wola
  const initialEdges = React.useMemo<Edge[]>(() => {
    const defaultEdges: { source: string; target: string; label: string }[] = [
      { source: "OBJ_03", target: "OBJ_02", label: "CHŁODZIWO" }, // Water Intake -> Power Plant
      { source: "OBJ_05", target: "OBJ_02", label: "PALIWO" },    // Gas Node -> Power Plant
      { source: "OBJ_02", target: "OBJ_03", label: "ZASILANIE" }, // Power Plant -> Water Intake pumps
      { source: "OBJ_02", target: "OBJ_01", label: "ZASILANIE" }, // Power Plant -> HSW Factory
      { source: "OBJ_04", target: "OBJ_07", label: "ZASILANIE" }, // GPZ Substation -> Crisis HQ
      { source: "OBJ_06", target: "OBJ_07", label: "TELCO" }      // San Tower -> Crisis HQ
    ];

    return defaultEdges.map(({ source, target, label }, idx) => {
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
  }, [nodes, theme]);

  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize edges when dependencies update
  useEffect(() => {
    setFlowEdges(initialEdges);
  }, [initialEdges, setFlowEdges]);

  return (
    <div className="w-full h-full min-h-0 theme-bg-app relative select-none">
      {/* Decorative top glass bar */}
      <div className="absolute top-2 left-2 z-10 p-2 border theme-border theme-bg-panel font-mono text-[9px] theme-text-secondary clip-chamfer shadow-lg flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 font-bold font-rajdhani theme-neon-text text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full theme-neon-bg animate-ping" />
          <span>DIAGRAM TOPOLOGII SIECI PRZESYŁOWYCH</span>
        </div>
        <span>Wizualizacja aktywnych kaskadowych powiązań infrastruktury krytycznej.</span>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
            bottom: "10px",
            left: "10px",
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
            bottom: "10px",
            right: "10px",
            border: "1px solid var(--border-panel)",
            background: "var(--bg-app)",
            width: 100,
            height: 70
          }}
        />
      </ReactFlow>
    </div>
  );
}
