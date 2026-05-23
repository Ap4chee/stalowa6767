"use client";

import { SidebarTab, CriticalNode } from "../types";
import { NodeList } from "./NodeList";
import { CascadeGraph } from "./CascadeGraph";
import { PlaybookControls } from "./PlaybookControls";

interface LeftSidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  nodes: CriticalNode[];
  coolingSecondsLeft: number | null;
  waterSecondsLeft: number | null;
  onNodeClick: (node: CriticalNode) => void;
  playbookActive: string | null;
  onActivatePlaybook: (id: string, name: string) => void;
  onStopPlaybook: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function LeftSidebar({
  activeTab,
  onTabChange,
  nodes,
  coolingSecondsLeft,
  waterSecondsLeft,
  onNodeClick,
  playbookActive,
  onActivatePlaybook,
  onStopPlaybook,
  isOpen,
  onToggle
}: LeftSidebarProps) {
  return (
    <aside className={`fixed left-4 top-20 w-80 h-[calc(100vh-230px)] z-40 flex flex-col gap-3 font-mono bg-slate-950/90 border border-slate-800/80 p-3 clip-chamfer text-[11px] shadow-2xl backdrop-blur-md transition-all duration-300 ease-in-out ${
      isOpen ? "translate-x-0" : "-translate-x-[340px]"
    }`}>
      {/* Premium vertical pull-out tab */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 -right-8 -translate-y-1/2 w-8 h-24 bg-slate-950/95 border border-slate-800/80 border-l-0 text-cyan-400 hover:text-cyan-300 font-bold font-rajdhani flex items-center justify-center rounded-r-md transition-all shadow-xl z-50 cursor-pointer hover:bg-slate-900/90"
      >
        <span className="transform rotate-90 text-[9px] tracking-[0.2em] whitespace-nowrap">
          {isOpen ? "UKRYJ" : "WĘZŁY"}
        </span>
      </button>

      <div className="grid grid-cols-3 border-b border-slate-800 pb-1 text-slate-400 font-rajdhani font-semibold">
        <button
          onClick={() => onTabChange("details")}
          className={`pb-1 text-center border-b transition-all ${activeTab === "details" ? "text-cyan-400 border-cyan-400" : "border-transparent hover:text-slate-200"}`}
        >
          SZCZEGÓŁY
        </button>
        <button
          onClick={() => onTabChange("cascades")}
          className={`pb-1 text-center border-b transition-all flex items-center justify-center gap-1 ${activeTab === "cascades" ? "text-cyan-400 border-cyan-400" : "border-transparent hover:text-slate-200"}`}
        >
          KASKADY
          {(coolingSecondsLeft !== null || waterSecondsLeft !== null) && (
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
          )}
        </button>
        <button
          onClick={() => onTabChange("playbooks")}
          className={`pb-1 text-center border-b transition-all ${activeTab === "playbooks" ? "text-cyan-400 border-cyan-400" : "border-transparent hover:text-slate-200"}`}
        >
          ALERT_CMD
        </button>
      </div>

      {activeTab === "details" && (
        <NodeList nodes={nodes} onNodeClick={onNodeClick} />
      )}

      {activeTab === "cascades" && (
        <CascadeGraph nodes={nodes} coolingSecondsLeft={coolingSecondsLeft} waterSecondsLeft={waterSecondsLeft} />
      )}

      {activeTab === "playbooks" && (
        <PlaybookControls playbookActive={playbookActive} onActivatePlaybook={onActivatePlaybook} onStopPlaybook={onStopPlaybook} />
      )}
    </aside>
  );
}
