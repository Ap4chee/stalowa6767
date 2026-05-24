"use client";

import { useState } from "react";
import { Plus, Link as LinkIcon } from "lucide-react";
import { CriticalNode, NodeRelation } from "../types";
import { StatusPill, Button, Dialog } from "../ui";
import { NODE_COLORS } from "../data/nodes";

const typeLabelPl: Record<CriticalNode["type"], string> = {
  power: "Elektrownia",
  water: "Ujęcie wody",
  industrial: "Przemysł",
  electrical: "Energetyka",
  logistic: "Logistyka",
  transit: "Tranzyt",
  hq: "Sztab"
};

interface NodeListProps {
  nodes: CriticalNode[];
  relations: NodeRelation[];
  onNodeClick: (node: CriticalNode) => void;
  onAddNode: (node: CriticalNode) => void;
  onAddRelation: (rel: NodeRelation) => void;
  selectedNodeId?: string | null;
  hoveredNodeId?: string | null;
  onHoverNode?: (id: string | null) => void;
}

export function NodeList({
  nodes,
  onNodeClick,
  onAddNode,
  onAddRelation,
  selectedNodeId,
  hoveredNodeId,
  onHoverNode
}: NodeListProps) {
  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [relDialogOpen, setRelDialogOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full">
      {/* Add actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setNodeDialogOpen(true)}
        >
          Obiekt
        </Button>
        <Button
          size="sm"
          variant="ghost"
          icon={<LinkIcon className="w-3.5 h-3.5" />}
          onClick={() => setRelDialogOpen(true)}
        >
          Relacja
        </Button>
      </div>

      {/* Node cards */}
      <div className="flex flex-col gap-2 overflow-y-auto scroll-thin pr-1 min-h-0">
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isHovered  = hoveredNodeId === node.id;
          const tone =
            node.status === "DESTROYED" ? "error" :
            node.status === "DEGRADED"  ? "warn"  : "ok";

          const markerColor = NODE_COLORS[node.type] ?? "#16a34a";
          const clampedHealth = Math.max(0, Math.min(100, node.health));

          return (
            <button
              key={node.id}
              type="button"
              onClick={() => onNodeClick(node)}
              onMouseEnter={() => onHoverNode?.(node.id)}
              onMouseLeave={() => onHoverNode?.(null)}
              className={[
                "group flex flex-col gap-2.5 p-4 rounded-(--r-md) text-left",
                "transition-colors duration-(--dur-fast) cursor-pointer",
                isSelected
                  ? "bg-accent-soft"
                  : isHovered
                  ? "bg-surface-hover"
                  : "bg-surface-data hover:bg-surface-hover"
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-micro text-muted inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: markerColor }}
                      aria-hidden
                    />
                    {node.id} · {typeLabelPl[node.type]}
                  </span>
                  <span className="text-heading text-primary truncate mt-0.5">{node.name}</span>
                </div>
                <StatusPill tone={tone} size="xs" dot pulse={node.status !== "OPERATIONAL"}>
                  {node.status === "OPERATIONAL" ? "Sprawny" :
                   node.status === "DEGRADED" ? "Uszkodzony" : "Zniszczony"}
                </StatusPill>
              </div>

              <div className="w-full h-1 bg-surface-data rounded-(--r-pill) overflow-hidden">
                <div
                  className="h-full rounded-(--r-pill) transition-[width] duration-(--dur-slow)"
                  style={{ width: `${clampedHealth}%`, backgroundColor: markerColor }}
                />
              </div>

              {node.description && (
                <p className="text-caption text-secondary leading-snug line-clamp-2">{node.description}</p>
              )}
            </button>
          );
        })}
      </div>

      <AddNodeDialog
        open={nodeDialogOpen}
        onClose={() => setNodeDialogOpen(false)}
        nodesCount={nodes.length}
        onAdd={(n) => { onAddNode(n); setNodeDialogOpen(false); }}
      />

      <AddRelationDialog
        open={relDialogOpen}
        onClose={() => setRelDialogOpen(false)}
        nodes={nodes}
        onAdd={(r) => { onAddRelation(r); setRelDialogOpen(false); }}
      />
    </div>
  );
}

/* ============================================================
   ADD NODE DIALOG
   ============================================================ */

interface AddNodeDialogProps {
  open: boolean;
  onClose: () => void;
  nodesCount: number;
  onAdd: (node: CriticalNode) => void;
}

function AddNodeDialog({ open, onClose, nodesCount, onAdd }: AddNodeDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CriticalNode["type"]>("industrial");
  const [lat, setLat] = useState("50.5630");
  const [lon, setLon] = useState("22.0490");
  const [desc, setDesc] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setName(""); setType("industrial"); setLat("50.5630");
    setLon("22.0490"); setDesc(""); setNotes("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const latNum = parseFloat(lat) || 50.5630;
    const lonNum = parseFloat(lon) || 22.0490;
    const newId = `OBJ_${(nodesCount + 1).toString().padStart(2, "0")}`;
    onAdd({
      id: newId, name, type, lat: latNum, lon: lonNum,
      description: desc || `Nowy obiekt infrastruktury: ${name}`,
      health: 100, status: "OPERATIONAL", backupPower: false,
      notes: notes || "Brak zakłóceń strukturalnych."
    });
    reset();
  };

  const formId = "add-node-form";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      eyebrow="Lewy panel"
      title="Nowy obiekt strategiczny"
      width="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={handleClose}>Anuluj</Button>
          <Button form={formId} type="submit" variant="primary" size="md">Zapisz obiekt</Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Nazwa obiektu">
          <input
            type="text" required
            placeholder="np. GPZ Stalowa Wola Południe"
            value={name} onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Typ klasyfikacji">
          <select value={type} onChange={(e) => setType(e.target.value as CriticalNode["type"])} className={inputClass}>
            <option value="industrial">Przemysł</option>
            <option value="power">Elektrownia</option>
            <option value="water">Ujęcie wody</option>
            <option value="electrical">Energetyka</option>
            <option value="logistic">Logistyka</option>
            <option value="transit">Tranzyt</option>
            <option value="hq">Sztab</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Szerokość (lat)">
            <input
              type="number" step="0.0001" required
              value={lat} onChange={(e) => setLat(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Długość (lon)">
            <input
              type="number" step="0.0001" required
              value={lon} onChange={(e) => setLon(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Opis (opcjonalnie)">
          <textarea
            placeholder="Przeznaczenie obiektu, kluczowe parametry…"
            value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
            className={inputClass + " resize-none"}
          />
        </Field>

        <Field label="Zależności / notatki (opcjonalnie)">
          <input
            type="text" placeholder="np. Zasilany z Elektrowni OBJ_02"
            value={notes} onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </Field>
      </form>
    </Dialog>
  );
}

/* ============================================================
   ADD RELATION DIALOG
   ============================================================ */

interface AddRelationDialogProps {
  open: boolean;
  onClose: () => void;
  nodes: CriticalNode[];
  onAdd: (r: NodeRelation) => void;
}

function AddRelationDialog({ open, onClose, nodes, onAdd }: AddRelationDialogProps) {
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("ZASILANIE");
  const [custom, setCustom] = useState("");

  const reset = () => { setSource(""); setTarget(""); setLabel("ZASILANIE"); setCustom(""); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const src = source || nodes[0]?.id || "";
    const tgt = target || nodes[1]?.id || "";
    if (!src || !tgt || src === tgt) return;
    const final = label === "CUSTOM" ? custom : label;
    if (!final.trim()) return;
    onAdd({ source: src, target: tgt, label: final.toUpperCase() });
    reset();
  };

  const formId = "add-rel-form";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      eyebrow="Lewy panel"
      title="Nowe powiązanie"
      width="md"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={handleClose}>Anuluj</Button>
          <Button form={formId} type="submit" variant="primary" size="md">Połącz węzły</Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Węzeł źródłowy">
            <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
              <option value="">Wybierz…</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.id} · {n.name}</option>)}
            </select>
          </Field>
          <Field label="Węzeł docelowy">
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass}>
              <option value="">Wybierz…</option>
              {nodes.map(n => <option key={n.id} value={n.id}>{n.id} · {n.name}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Typ przepływu">
          <select value={label} onChange={(e) => setLabel(e.target.value)} className={inputClass}>
            <option value="ZASILANIE">Zasilanie energetyczne</option>
            <option value="PALIWO">Paliwo / gaz</option>
            <option value="CHŁODZIWO">Woda / chłodziwo</option>
            <option value="TELCO">Telco / światłowód</option>
            <option value="DOWODZENIE">Dowodzenie (C2)</option>
            <option value="LOGISTYKA">Logistyka / amunicja</option>
            <option value="CUSTOM">Inny…</option>
          </select>
        </Field>

        {label === "CUSTOM" && (
          <Field label="Własna etykieta">
            <input
              type="text" required
              placeholder="np. OPTYKA"
              value={custom} onChange={(e) => setCustom(e.target.value)}
              className={inputClass + " uppercase"}
            />
          </Field>
        )}
      </form>
    </Dialog>
  );
}

/* ============================================================
   FIELD WRAPPER
   ============================================================ */

const inputClass =
  "w-full text-body px-3.5 py-2.5 rounded-(--r-md) bg-surface-data text-primary " +
  "focus:outline-none focus:ring-2 focus:ring-(--accent) placeholder:text-muted";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-micro text-muted">{label}</span>
      {children}
    </label>
  );
}
