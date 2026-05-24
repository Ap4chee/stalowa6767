"use client";

import { CriticalNode, NodeRelation } from "../types";
import { Panel, StatusPill } from "../ui";
import { NodeList } from "./NodeList";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface LeftSidebarProps {
  nodes: CriticalNode[];
  relations: NodeRelation[];
  onNodeClick: (node: CriticalNode) => void;
  onAddNode: (node: CriticalNode) => void;
  onAddRelation: (rel: NodeRelation) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  onHoverNode?: (id: string | null) => void;
}

export function LeftSidebar({
  nodes,
  relations,
  onNodeClick,
  onAddNode,
  onAddRelation,
  isCollapsed,
  onToggle,
  selectedNodeId,
  hoveredNodeId,
  onHoverNode
}: LeftSidebarProps) {
  const operational = nodes.filter(n => n.status === "OPERATIONAL").length;
  const degraded    = nodes.filter(n => n.status === "DEGRADED").length;
  const destroyed   = nodes.filter(n => n.status === "DESTROYED").length;

  return (
    <Panel
      variant="floating"
      rounded="xl"
      className={`flex flex-col min-h-0 overflow-hidden transition-[width] duration-(--dur-base) ${
        isCollapsed ? "w-14 flex-initial" : "w-full flex-1"
      }`}
    >
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-micro text-muted">Lewy panel</span>
            <span className="text-title text-primary truncate">Obiekty chronione</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isCollapsed && (
            <div className="flex items-center gap-1.5">
              <StatusPill tone="ok" size="xs" dot>{operational}</StatusPill>
              {degraded > 0 && <StatusPill tone="warn" size="xs" dot>{degraded}</StatusPill>}
              {destroyed > 0 && <StatusPill tone="error" size="xs" dot pulse>{destroyed}</StatusPill>}
            </div>
          )}
          <button
            onClick={onToggle}
            className="p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors"
            title={isCollapsed ? "Rozwiń panel" : "Zwiń panel"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 min-h-0 overflow-hidden px-4 pb-4">
          <NodeList
            nodes={nodes}
            relations={relations}
            onNodeClick={onNodeClick}
            onAddNode={onAddNode}
            onAddRelation={onAddRelation}
            selectedNodeId={selectedNodeId}
            hoveredNodeId={hoveredNodeId}
            onHoverNode={onHoverNode}
          />
        </div>
      )}
    </Panel>
  );
}
