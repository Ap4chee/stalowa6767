"use client";

import { Shield, Zap, Droplet, Flame, Wifi, Network, Navigation } from "lucide-react";
import { CriticalNode } from "../types";

const iconMap: Record<string, React.ReactNode> = {
  power: <Zap className="w-3.5 h-3.5 text-cyan-500" />,
  water: <Droplet className="w-3.5 h-3.5 text-blue-500" />,
  industrial: <Flame className="w-3.5 h-3.5 text-orange-500" />,
  electrical: <Wifi className="w-3.5 h-3.5 text-cyan-400" />,
  logistic: <Network className="w-3.5 h-3.5 text-slate-400" />,
  transit: <Navigation className="w-3.5 h-3.5 text-slate-450" />,
  hq: <Shield className="w-3.5 h-3.5 text-emerald-500" />
};

interface NodeListProps {
  nodes: CriticalNode[];
  onNodeClick: (node: CriticalNode) => void;
}

export function NodeList({ nodes, onNodeClick }: NodeListProps) {
  return (
    <div className="flex-1 overflow-y-auto space-y-2 pr-1 terminal-scroll">
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-rajdhani tracking-wider pb-1 border-b border-slate-900">
        <span>WĘZŁY INFRASTRUKTURY</span>
        <span>{nodes.filter(n => n.status === "OPERATIONAL").length}/07 NOMINAL</span>
      </div>
      <div className="space-y-1.5">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onNodeClick(node)}
            className={`border p-2 cursor-pointer transition-all hover:bg-slate-900/50 flex flex-col gap-1 ${
              node.status === "DESTROYED"
                ? "border-red-950 bg-red-950/10 text-red-400"
                : node.status === "DEGRADED"
                ? "border-amber-900/60 bg-amber-900/5 text-amber-300"
                : "border-slate-800/80 bg-slate-950 text-slate-300"
            }`}
          >
            <div className="flex justify-between items-center font-bold">
              <div className="flex items-center gap-1.5">
                {iconMap[node.type]}
                <span className="text-[11px] truncate font-rajdhani">{node.name}</span>
              </div>
              <span className={`text-[9px] px-1 font-bold ${
                node.status === "OPERATIONAL" ? "text-emerald-400" : node.status === "DEGRADED" ? "text-amber-400" : "text-red-500"
              }`}>
                {node.status}
              </span>
            </div>
            <p className="text-[9px] text-slate-400 leading-tight">{node.description}</p>
            <div className="mt-1">
              <div className="flex justify-between text-[8px] text-slate-500 mb-0.5 font-sharetech">
                <span>FIZYCZNA SPRAWNOŚĆ</span>
                <span>{Math.round(node.health)}%</span>
              </div>
              <div className="h-1 bg-slate-900 border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    node.health > 50 ? "bg-emerald-500" : node.health > 15 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${node.health}%` }}
                />
              </div>
            </div>
            {node.notes && (
              <span className="text-[8px] text-slate-400/80 mt-1 italic leading-tight block border-t border-slate-900 pt-1">
                {node.notes}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
