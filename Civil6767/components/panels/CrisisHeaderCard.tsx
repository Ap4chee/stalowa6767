'use client';

import { useFloodOverview } from '@/lib/useFloodData';

type Props = {
  mockFloodEnabled?: boolean;
  onToggleMockFlood?: () => void;
};

export function CrisisHeaderCard({
  mockFloodEnabled,
  onToggleMockFlood
}: Props) {
  const { data: flood } = useFloodOverview();

  const stationCount = flood?.lubelskie_station_count ?? 0;
  const hydroWarnings = flood?.hydro_warnings_count ?? 0;
  const meteoWarnings = flood?.meteo_flood_like_warnings_count ?? 0;
  const hasCrisis = hydroWarnings > 0;
  const hasWarning = meteoWarnings > 0;

  return (
    <div className="flex items-center gap-2 rounded border border-outline bg-white px-3 py-2 shadow-md">
      {/* Title */}
      <h2 className="font-headline text-xs font-bold leading-tight text-on-surface whitespace-nowrap">
        Hydr<span className="text-primary-dark">OS</span>
      </h2>

      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />

      {/* Flood status pill */}
      {stationCount > 0 && (
        <div className="flex items-center gap-1.5">
          {hydroWarnings > 0 && (
            <span className="flex items-center gap-1 rounded bg-critical/10 px-1.5 py-0.5">
              <span className="material-symbols-outlined text-[11px] text-critical">
                warning
              </span>
              <span className="font-headline text-[10px] font-black text-critical">
                {hydroWarnings} hydro
              </span>
            </span>
          )}
          {meteoWarnings > 0 && (
            <span className="flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5">
              <span className="material-symbols-outlined text-[11px] text-amber-600">
                error
              </span>
              <span className="font-headline text-[10px] font-black text-amber-700">
                {meteoWarnings} meteo
              </span>
            </span>
          )}
          {!hasCrisis && !hasWarning && (
            <span className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5">
              <span className="material-symbols-outlined text-[11px] text-primary-dark">
                check_circle
              </span>
              <span className="font-headline text-[10px] font-bold text-primary-dark">
                OK
              </span>
            </span>
          )}
        </div>
      )}

      {/* Mock flood toggle */}
      {onToggleMockFlood && (
        <>
          <div className="mx-0.5 h-4 w-px bg-outline" />
          <button
            type="button"
            onClick={onToggleMockFlood}
            className={`flex items-center gap-1 rounded px-1.5 py-0.5 transition-all ${
              mockFloodEnabled
                ? 'bg-critical/15 ring-1 ring-critical/30'
                : 'hover:bg-outline/40'
            }`}
          >
            <span
              className={`material-symbols-outlined text-xs ${
                mockFloodEnabled ? 'text-critical' : 'text-on-surface-variant'
              }`}
            >
              {mockFloodEnabled ? 'emergency' : 'science'}
            </span>
            <span
              className={`font-headline text-[9px] font-bold whitespace-nowrap ${
                mockFloodEnabled ? 'text-critical' : 'text-on-surface-variant'
              }`}
            >
              Demo
            </span>
            <div
              className={`relative h-3.5 w-7 rounded-full shadow-inner transition-colors ${
                mockFloodEnabled ? 'bg-critical' : 'bg-outline'
              }`}
            >
              <div
                className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white shadow transition-all ${
                  mockFloodEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </div>
          </button>
        </>
      )}
    </div>
  );
}
