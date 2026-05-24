"use client";

import { Threat } from "../types";

interface AlertTickerProps {
  threats: Threat[];
}

export function AlertTicker({ threats }: AlertTickerProps) {
  const active = threats.filter(t => t.status === "FLYING").length;
  const alarm = active > 0;

  return (
    <div className="fixed top-19 left-3 right-3 z-55 h-9 flex items-center rounded-(--r-md) overflow-hidden bg-surface-1 elev-1">
      {alarm && <span className="w-0.5 self-stretch bg-(--error)" />}
      <div className="flex items-center gap-2 h-full px-4">
        {alarm ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-(--error) anim-pulse" />
            <span className="text-label text-error">
              Alarm bojowy · {active} aktywne
            </span>
          </>
        ) : (
          <span className="text-label text-muted">Tactical feed</span>
        )}
      </div>
      <div className="w-px h-5 bg-(--border-subtle)" />
      <div className="ticker-wrap flex-1">
        <div className="ticker text-caption py-2 select-none text-primary">
          {alarm ? (
            <span>
              Wykryto zbliżające się obiekty napowietrzne — system PSR-A PILICA przechodzi w tryb przechwytywania — jednostki defensywne aktywne — oczekiwanie na decyzję dowodzenia.
            </span>
          ) : (
            <span className="text-secondary">
              Stalowa Wola nominalna — Huta HSW operacyjna — GPZ Maziarnia przesyła energię bez zakłóceń — Most San: monitoring radarowy ciągły — Cesium 3D terrain aktywny.
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
