"use client";

import { CriticalNode, NodeRelation } from "../types";
import { CollapsibleCard } from "./CollapsibleCard";
import { NodeList } from "./NodeList";

interface LeftSidebarProps {
  nodes: CriticalNode[];
  relations: NodeRelation[];
  onNodeClick: (node: CriticalNode) => void;
  onAddNode: (node: CriticalNode) => void;
  onAddRelation: (rel: NodeRelation) => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function LeftSidebar({
  nodes,
  relations,
  onNodeClick,
  onAddNode,
  onAddRelation,
  isCollapsed,
  onToggle
}: LeftSidebarProps) {
  return (
    <div className={`w-full theme-bg-panel border theme-border clip-chamfer text-[11px] shadow-2xl backdrop-blur-md transition-all duration-300 ${
      isCollapsed ? "flex-initial" : "flex-1 min-h-0 flex flex-col"
    }`}>
      <CollapsibleCard
        title="PANEL DOWODZENIA"
        isCollapsed={isCollapsed}
        onToggle={onToggle}
        className="flex-1 min-h-0 flex flex-col"
        contentClassName="flex-1 min-h-0 flex flex-col"
        badge={
          <span className="text-[8px] theme-text-muted font-bold">
            {nodes.filter(n => n.status === "OPERATIONAL").length}/{String(nodes.length).padStart(2, '0')} WĘZŁÓW
          </span>
        }
        headerClassName="px-3 py-2 border-b theme-border theme-neon-text hover:theme-bg-panel-hover"
        fixedHeight={isCollapsed ? 0 : undefined}
      >
        <div className="p-3 overflow-y-auto terminal-scroll flex-1 min-h-0">
          <NodeList
            nodes={nodes}
            relations={relations}
            onNodeClick={onNodeClick}
            onAddNode={onAddNode}
            onAddRelation={onAddRelation}
          />
        </div>
      </CollapsibleCard>
    </div>
  );
}
