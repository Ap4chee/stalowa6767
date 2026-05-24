"use client";

import { SidebarTab, CriticalNode, NodeRelation } from "../types";
import { CollapsibleCard } from "./CollapsibleCard";
import { NodeList } from "./NodeList";
import { CascadeGraph } from "./CascadeGraph";
import { PlaybookControls } from "./PlaybookControls";

interface LeftSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  nodes: CriticalNode[];
  relations: NodeRelation[];
  coolingSecondsLeft: number | null;
  waterSecondsLeft: number | null;
  onNodeClick: (node: CriticalNode) => void;
  onAddNode: (node: CriticalNode) => void;
  onAddRelation: (rel: NodeRelation) => void;
  playbookActive: string | null;
  onActivatePlaybook: (id: string, name: string) => void;
  onStopPlaybook: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function LeftSidebar({
  activeTab,
  onTabChange,
  nodes,
  relations,
  coolingSecondsLeft,
  waterSecondsLeft,
  onNodeClick,
  onAddNode,
  onAddRelation,
  playbookActive,
  onActivatePlaybook,
  onStopPlaybook,
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
            {nodes.filter(n => n.status === "OPERATIONAL").length}/07 WĘZŁÓW
          </span>
        }
        headerClassName="px-3 py-2 border-b theme-border theme-neon-text hover:theme-bg-panel-hover"
        fixedHeight={isCollapsed ? 0 : undefined}
      >
        <div className="grid grid-cols-3 border-b theme-border font-rajdhani font-semibold">
          <button
            onClick={() => onTabChange("details")}
            className={`py-2 text-center border-b transition-all text-[10px] cursor-pointer ${
              activeTab === "details" ? "theme-neon-text theme-neon-border" : "theme-text-muted border-transparent hover:theme-text-primary"
            }`}
          >
            SZCZEGÓŁY
          </button>
          <button
            onClick={() => onTabChange("cascades")}
            className={`py-2 text-center border-b transition-all flex items-center justify-center gap-1 text-[10px] cursor-pointer ${
              activeTab === "cascades" ? "theme-neon-text theme-neon-border" : "theme-text-muted border-transparent hover:theme-text-primary"
            }`}
          >
            KASKADY
            {(coolingSecondsLeft !== null || waterSecondsLeft !== null) && (
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            )}
          </button>
          <button
            onClick={() => onTabChange("playbooks")}
            className={`py-2 text-center border-b transition-all text-[10px] cursor-pointer ${
              activeTab === "playbooks" ? "theme-neon-text theme-neon-border" : "theme-text-muted border-transparent hover:theme-text-primary"
            }`}
          >
            ALERT_CMD
          </button>
        </div>

        <div className="p-3 overflow-y-auto terminal-scroll flex-1 min-h-0">
          {activeTab === "details" && (
            <NodeList
              nodes={nodes}
              relations={relations}
              onNodeClick={onNodeClick}
              onAddNode={onAddNode}
              onAddRelation={onAddRelation}
            />
          )}
          {activeTab === "cascades" && (
            <CascadeGraph nodes={nodes} coolingSecondsLeft={coolingSecondsLeft} waterSecondsLeft={waterSecondsLeft} />
          )}
          {activeTab === "playbooks" && (
            <PlaybookControls playbookActive={playbookActive} onActivatePlaybook={onActivatePlaybook} onStopPlaybook={onStopPlaybook} />
          )}
        </div>
      </CollapsibleCard>
    </div>
  );
}
