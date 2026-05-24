"use client";

import { useState } from "react";
import { Shield, Zap, Droplet, Flame, Wifi, Network, Navigation, Plus, X, Link } from "lucide-react";
import { CriticalNode, NodeRelation } from "../types";

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
  relations: NodeRelation[];
  onNodeClick: (node: CriticalNode) => void;
  onAddNode: (node: CriticalNode) => void;
  onAddRelation: (rel: NodeRelation) => void;
}

export function NodeList({ nodes, relations, onNodeClick, onAddNode, onAddRelation }: NodeListProps) {
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [showRelForm, setShowRelForm] = useState(false);

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
    if (!nodeName.trim()) return;

    const latNum = parseFloat(nodeLat) || 50.5630;
    const lonNum = parseFloat(nodeLon) || 22.0490;
    const newId = `OBJ_${(nodes.length + 1).toString().padStart(2, "0")}`;

    const newNode: CriticalNode = {
      id: newId,
      name: nodeName,
      type: nodeType,
      lat: latNum,
      lon: lonNum,
      description: nodeDesc || `Nowy obiekt infrastruktury: ${nodeName}`,
      health: 100,
      status: "OPERATIONAL",
      backupPower: false,
      notes: nodeNotes || "Brak zakłóceń strukturalnych."
    };

    onAddNode(newNode);
    setShowNodeForm(false);
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
    setShowRelForm(false);
    // Reset fields
    setRelSource("");
    setRelTarget("");
    setRelLabel("ZASILANIE");
    setCustomLabel("");
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-3 pr-1 terminal-scroll">
      {/* Header and Add Action buttons */}
      <div className="flex flex-col gap-1.5 pb-2 border-b theme-border">
        <div className="flex justify-between items-center text-[10px] theme-text-secondary font-rajdhani tracking-wider">
          <span>WĘZŁY INFRASTRUKTURY</span>
          <span className="theme-text-muted">{nodes.filter(n => n.status === "OPERATIONAL").length}/{nodes.length} NOMINAL</span>
        </div>
        
        <div className="grid grid-cols-2 gap-1.5 font-sharetech">
          <button
            onClick={() => {
              setShowNodeForm(!showNodeForm);
              setShowRelForm(false);
            }}
            className={`flex items-center justify-center gap-1 py-1 rounded border text-[8px] font-bold cursor-pointer transition-all ${
              showNodeForm
                ? "bg-cyan-500/20 border-cyan-500 theme-neon-text"
                : "theme-bg-button theme-border theme-text-primary hover:theme-neon-border hover:theme-neon-text"
            }`}
          >
            {showNodeForm ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3 theme-neon-text" />}
            <span>{showNodeForm ? "ZAMKNIJ FORM" : "NOWY OBIEKT"}</span>
          </button>
          
          <button
            onClick={() => {
              setShowRelForm(!showRelForm);
              setShowNodeForm(false);
            }}
            className={`flex items-center justify-center gap-1 py-1 rounded border text-[8px] font-bold cursor-pointer transition-all ${
              showRelForm
                ? "bg-cyan-500/20 border-cyan-500 theme-neon-text"
                : "theme-bg-button theme-border theme-text-primary hover:theme-neon-border hover:theme-neon-text"
            }`}
          >
            {showRelForm ? <X className="w-3 h-3" /> : <Link className="w-3 h-3 theme-neon-text" />}
            <span>{showRelForm ? "ZAMKNIJ FORM" : "POWIĄZANIE"}</span>
          </button>
        </div>
      </div>

      {/* FORM: Add Node */}
      {showNodeForm && (
        <form onSubmit={handleAddNodeSubmit} className="theme-bg-app border border-cyan-500/40 p-2.5 rounded space-y-2 font-mono text-[9px] animate-fadeIn">
          <div className="flex justify-between items-center pb-1 border-b theme-border text-[9px] font-rajdhani font-extrabold text-cyan-500">
            <span>[ REJESTRACJA NOWEGO WĘZŁA STRATEGICZNEGO ]</span>
          </div>

          <div className="space-y-1.5">
            <div>
              <label className="block text-[8px] theme-text-muted mb-0.5">NAZWA WĘZŁA:</label>
              <input
                type="text"
                required
                placeholder="np. GPZ Stalowa Wola Południe"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                className="w-full theme-bg-panel border theme-border px-1.5 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[8px] theme-text-muted mb-0.5">TYP KLASYFIKACJI:</label>
                <select
                  value={nodeType}
                  onChange={(e) => setNodeType(e.target.value as CriticalNode["type"])}
                  className="w-full theme-bg-panel border theme-border px-1 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
                >
                  <option value="industrial">PRZEMYSŁ (HSW)</option>
                  <option value="power">ELEKTROWNIA / BLOK</option>
                  <option value="water">UJĘCIE WODY / MZK</option>
                  <option value="electrical">GPZ / ENERGETYKA</option>
                  <option value="logistic">WĘZEŁ LOGISTYCZNY</option>
                  <option value="transit">TRANZYT / MOSTY</option>
                  <option value="hq">SZTAB DOWODZENIA</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-1">
                <div>
                  <label className="block text-[8px] theme-text-muted mb-0.5">LAT (N):</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={nodeLat}
                    onChange={(e) => setNodeLat(e.target.value)}
                    className="w-full theme-bg-panel border theme-border px-1 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[8px] theme-text-muted mb-0.5">LON (E):</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={nodeLon}
                    onChange={(e) => setNodeLon(e.target.value)}
                    className="w-full theme-bg-panel border theme-border px-1 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[8px] theme-text-muted mb-0.5">OPIS WYWIADOWCZY:</label>
              <textarea
                placeholder="Opis przeznaczenia obiektu..."
                value={nodeDesc}
                onChange={(e) => setNodeDesc(e.target.value)}
                rows={2}
                className="w-full theme-bg-panel border theme-border px-1.5 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono resize-none"
              />
            </div>

            <div>
              <label className="block text-[8px] theme-text-muted mb-0.5">ZALEŻNOŚCI SIECIOWE (NOTATKI):</label>
              <input
                type="text"
                placeholder="np. Zasilany z Elektrowni OBJ_02."
                value={nodeNotes}
                onChange={(e) => setNodeNotes(e.target.value)}
                className="w-full theme-bg-panel border theme-border px-1.5 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1 font-sharetech">
            <button
              type="submit"
              className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-all border border-cyan-500"
            >
              ZAPISZ OBIEKT
            </button>
            <button
              type="button"
              onClick={() => setShowNodeForm(false)}
              className="px-3 py-1 rounded border theme-border theme-bg-button hover:theme-bg-button-hover font-bold cursor-pointer transition-all text-red-500 hover:border-red-500"
            >
              ANULUJ
            </button>
          </div>
        </form>
      )}

      {/* FORM: Add Relation */}
      {showRelForm && (
        <form onSubmit={handleAddRelSubmit} className="theme-bg-app border border-cyan-500/40 p-2.5 rounded space-y-2 font-mono text-[9px] animate-fadeIn">
          <div className="flex justify-between items-center pb-1 border-b theme-border text-[9px] font-rajdhani font-extrabold text-cyan-500">
            <span>[ REJESTRACJA POWIĄZANIA INFRASTRUKTURALNEGO ]</span>
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="block text-[8px] theme-text-muted mb-0.5">WĘZEŁ ŹRÓDŁOWY (DAWCA):</label>
                <select
                  value={relSource}
                  onChange={(e) => setRelSource(e.target.value)}
                  className="w-full theme-bg-panel border theme-border px-1 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
                >
                  <option value="">Wybierz węzeł...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>[{n.id}] {n.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[8px] theme-text-muted mb-0.5">WĘZEŁ DOCELOWY (BIORCA):</label>
                <select
                  value={relTarget}
                  onChange={(e) => setRelTarget(e.target.value)}
                  className="w-full theme-bg-panel border theme-border px-1 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
                >
                  <option value="">Wybierz węzeł...</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>[{n.id}] {n.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[8px] theme-text-muted mb-0.5">TYP POWIĄZANIA / PRZEPŁYWU:</label>
              <select
                value={relLabel}
                onChange={(e) => setRelLabel(e.target.value)}
                className="w-full theme-bg-panel border theme-border px-1 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono"
              >
                <option value="ZASILANIE">ZASILANIE ENERGETYCZNE</option>
                <option value="PALIWO">PALIWO / TRANSMISJA GAZU</option>
                <option value="CHŁODZIWO">WODA / STRUMIEŃ CHŁODZĄCY</option>
                <option value="TELCO">TELCO / ŚWIATŁOWÓD / ŁĄCZNOŚĆ</option>
                <option value="DOWODZENIE">STRUKTURA DOWODZENIA (C2)</option>
                <option value="LOGISTYKA">DOSTAWA AMUNICJI / LOGISTYKA</option>
                <option value="CUSTOM">INNY / NIESTANDARDOWY</option>
              </select>
            </div>

            {relLabel === "CUSTOM" && (
              <div>
                <label className="block text-[8px] theme-text-muted mb-0.5">WŁASNA ETYKIETA PRZEPŁYWU:</label>
                <input
                  type="text"
                  required
                  placeholder="np. OPTYKA"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  className="w-full theme-bg-panel border theme-border px-1.5 py-1 text-[9px] theme-text-primary focus:outline-none focus:border-cyan-500 rounded font-mono uppercase"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-1 font-sharetech">
            <button
              type="submit"
              className="flex-1 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-bold cursor-pointer transition-all border border-cyan-500"
            >
              POŁĄCZ WĘZŁY
            </button>
            <button
              type="button"
              onClick={() => setShowRelForm(false)}
              className="px-3 py-1 rounded border theme-border theme-bg-button hover:theme-bg-button-hover font-bold cursor-pointer transition-all text-red-500 hover:border-red-500"
            >
              ANULUJ
            </button>
          </div>
        </form>
      )}

      {/* Dynamic list of critical nodes */}
      <div className="space-y-1.5">
        {nodes.map((node) => (
          <div
            key={node.id}
            onClick={() => onNodeClick(node)}
            className={`border p-2 cursor-pointer transition-all hover:theme-bg-panel-hover flex flex-col gap-1 ${
              node.status === "DESTROYED"
                ? "border-red-500/60 bg-red-500/10 text-red-600 dark:text-red-400"
                : node.status === "DEGRADED"
                ? "border-amber-500/60 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "theme-border theme-bg-panel theme-text-primary"
            }`}
          >
            <div className="flex justify-between items-center font-bold">
              <div className="flex items-center gap-1.5">
                {iconMap[node.type] || <Shield className="w-3.5 h-3.5 text-slate-400" />}
                <span className="text-[11px] truncate font-rajdhani">{node.name}</span>
              </div>
              <span className={`text-[9px] px-1 font-bold ${
                node.status === "OPERATIONAL" ? "text-emerald-600 dark:text-emerald-400" : node.status === "DEGRADED" ? "text-amber-600 dark:text-amber-400" : "text-red-650 dark:text-red-500"
              }`}>
                {node.status}
              </span>
            </div>
            <p className="text-[9px] theme-text-secondary leading-tight">{node.description}</p>
            <div className="mt-1">
              <div className="flex justify-between text-[8px] theme-text-muted mb-0.5 font-sharetech">
                <span>FIZYCZNA SPRAWNOŚĆ</span>
                <span>{Math.round(node.health)}%</span>
              </div>
              <div className="h-1 theme-bg-button border theme-border">
                <div
                  className={`h-full transition-all duration-300 ${
                    node.health > 50 ? "bg-emerald-500" : node.health > 15 ? "bg-amber-500" : "bg-red-500"
                  }`}
                  style={{ width: `${node.health}%` }}
                />
              </div>
            </div>
            {node.notes && (
              <span className="text-[8px] theme-text-muted mt-1 italic leading-tight block border-t theme-border pt-1">
                {node.notes}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
