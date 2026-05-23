'use client';

import { useEffect, useState } from 'react';
import { RIVER_TICKER } from '@/lib/constants';
import type { RiverStatus, FloodOverviewStation } from '@/lib/types';

const API_BASE = '/api/backend';

const STATUS_ICON: Record<RiverStatus['status'], string> = {
  critical: 'warning',
  warning: 'error',
  stable: 'check_circle'
};

function useHydroTicker(): { rivers: RiverStatus[] | null; loading: boolean } {
  const [rivers, setRivers] = useState<RiverStatus[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/flood/overview`);
        if (cancelled || !res.ok) {
          if (!cancelled) {
            setRivers(RIVER_TICKER);
            setLoading(false);
          }
          return;
        }

        const floodData = await res.json();
        const stations: FloodOverviewStation[] =
          floodData?.lubelskie_top_stations ?? [];

        const items: RiverStatus[] = stations.map(s => {
          const name = s.river
            ? `${s.river} (${s.station_name})`
            : s.station_name || '?';
          const lvl = s.water_level_cm ?? 0;
          const status: RiverStatus['status'] =
            lvl > 400 ? 'critical' : lvl > 250 ? 'warning' : 'stable';
          return { name, level: `${lvl}cm`, status };
        });

        if (!cancelled) {
          setRivers(items.length > 0 ? items.slice(0, 16) : RIVER_TICKER);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setRivers(RIVER_TICKER);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { rivers, loading };
}

function TickerRow({ rivers }: { rivers: RiverStatus[] }) {
  return (
    <>
      {rivers.map(river => {
        const isCritical = river.status === 'critical';
        const isWarning = river.status === 'warning';
        return (
          <div
            key={river.name}
            className="flex items-center gap-2 px-5 font-headline text-xs font-bold uppercase tracking-widest text-white"
          >
            <span
              className={`material-symbols-outlined text-sm ${
                isCritical ? 'animate-pulse' : ''
              }`}
            >
              {STATUS_ICON[river.status]}
            </span>
            <span>
              {river.name}: {river.level}
            </span>
            {isCritical && (
              <span className="rounded bg-white/20 px-1.5 py-0.5 text-[8px] font-black tracking-widest text-white">
                ALARM
              </span>
            )}
            {isWarning && (
              <span className="rounded bg-white/10 px-1.5 py-0.5 text-[8px] font-bold tracking-widest text-white/80">
                OSTRZEŻ.
              </span>
            )}
            <span className="text-white/40">│</span>
          </div>
        );
      })}
    </>
  );
}

export function BottomTicker() {
  const { rivers, loading } = useHydroTicker();
  const hasCritical = rivers?.some(r => r.status === 'critical') ?? false;

  return (
    <footer
      className={`fixed bottom-0 left-0 z-[100] flex h-10 w-full items-center overflow-hidden whitespace-nowrap ${
        hasCritical ? 'bg-critical-deep' : 'bg-primary-dark'
      }`}
      style={{
        boxShadow: hasCritical
          ? '0 -4px 20px rgba(187,0,19,0.3)'
          : '0 -4px 20px rgba(45,108,0,0.2)'
      }}
    >
      {loading || !rivers ? (
        <div className="flex h-full w-full items-center justify-center gap-2">
          <span className="material-symbols-outlined animate-spin text-sm text-white/60">
            progress_activity
          </span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-white/60">
            Pobieranie danych hydrologicznych…
          </span>
        </div>
      ) : (
        <>
          {hasCritical && (
            <div className="flex h-full items-center gap-1.5 bg-critical px-4">
              <span className="material-symbols-outlined animate-pulse text-sm text-white">
                flood
              </span>
              <span className="font-headline text-[9px] font-black uppercase tracking-widest text-white">
                ALERT POWODZIOWY
              </span>
            </div>
          )}
          <div className="flex min-w-max animate-ticker items-center whitespace-nowrap">
            <TickerRow rivers={rivers} />
            <TickerRow rivers={rivers} />
          </div>
        </>
      )}
    </footer>
  );
}
