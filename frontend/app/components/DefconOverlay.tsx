"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface DefconOverlayProps {
  defcon: number;
}

const defconNames: Record<number, string> = {
  5: "Stan pokoju — normalny monitoring ochronny",
  4: "Podwyższona czujność — sztab i systemy OPL",
  3: "Gotowość bojowa — pełna mobilizacja węzłów",
  2: "Bezpośrednie zagrożenie atakiem powietrznym",
  1: "Stan wojny — aktywne odparcie nalotu"
};

export function DefconOverlay({ defcon }: DefconOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [prevDefcon, setPrevDefcon] = useState(defcon);

  useEffect(() => {
    if (defcon !== prevDefcon) {
      setVisible(true);
      setPrevDefcon(defcon);
      const timer = setTimeout(() => setVisible(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [defcon, prevDefcon]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!visible) return null;

  const critical = defcon <= 2;
  const warn = defcon === 3;
  const toneClass =
    critical ? "text-error" :
    warn     ? "text-warn"  :
               "text-accent";

  const vignetteClass =
    critical ? "shadow-[inset_0_0_120px_rgba(239,68,68,0.18)] anim-pulse" :
    warn     ? "shadow-[inset_0_0_60px_rgba(245,158,11,0.10)]" :
               "";

  return (
    <div className="fixed inset-0 z-50 pointer-events-none select-none flex justify-center items-start">
      {vignetteClass && (
        <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${vignetteClass}`} />
      )}

      <div className="absolute top-32 anim-slide-down pointer-events-auto">
        <div className="flex items-center gap-3 px-4 py-3 rounded-(--r-lg) bg-surface-2 elev-3 min-w-[360px]">
          <span className={`w-2 h-2 rounded-full ${critical ? "bg-(--error) anim-pulse" : warn ? "bg-(--warn)" : "bg-(--accent)"}`} />
          <div className="flex flex-col leading-tight">
            <span className="text-micro text-muted">Zmiana stanu gotowości</span>
            <span className={`text-heading ${toneClass}`}>
              DEFCON {defcon} · {defconNames[defcon] || `Poziom ${defcon}`}
            </span>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="ml-3 p-1.5 rounded-(--r-sm) text-muted hover:text-primary hover:bg-surface-hover cursor-pointer transition-colors"
            title="Zamknij (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
