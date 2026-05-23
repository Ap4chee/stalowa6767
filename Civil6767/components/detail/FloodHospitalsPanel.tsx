'use client';

import { useMemo } from 'react';
import type { MLHospitalPrediction } from '@/lib/types';
import { bucketForProbability, bucketMeta } from './HospitalFloodRiskSection';

type Props = {
  onClose: () => void;
  hospitalCount?: number;
  departmentCount?: number;
  mlPredictions: MLHospitalPrediction[];
  mlPredictionsLoading: boolean;
};

export function FloodHospitalsPanel({
  onClose,
  hospitalCount,
  departmentCount,
  mlPredictions,
  mlPredictionsLoading
}: Props) {
  // Sort by probability descending
  const sorted = useMemo(
    () =>
      [...mlPredictions].sort(
        (a, b) =>
          b.flood_warning_risk_probability - a.flood_warning_risk_probability
      ),
    [mlPredictions]
  );

  const highRisk = sorted.filter(
    h => bucketForProbability(h.flood_warning_risk_probability) === 'critical'
  ).length;
  const elevatedRisk = sorted.filter(
    h => bucketForProbability(h.flood_warning_risk_probability) === 'elevated'
  ).length;
  const watchRisk = sorted.filter(
    h => bucketForProbability(h.flood_warning_risk_probability) === 'watch'
  ).length;
  const safeCount = sorted.length - highRisk - elevatedRisk - watchRisk;

  return (
    <div className="flex max-h-[70vh] flex-col rounded border border-l-4 border-outline border-l-critical bg-white shadow-xl">
      {/* Header */}
      <div className="border-b border-outline bg-surface-variant/30 p-5 pr-10">
        <div className="mb-1">
          <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-critical">
            Analiza ryzyka — ML
          </span>
        </div>
        <h2 className="font-headline text-lg font-extrabold tracking-tight text-on-surface">
          Szpitale — predykcja powodziowa
        </h2>
        <p className="mt-1 font-headline text-xs text-on-surface-variant">
          Predykcja na podstawie modelu ML i danych IMGW
        </p>
        {hospitalCount != null && (
          <p className="mt-1.5 font-headline text-[10px] text-on-surface-variant">
            <span className="font-bold text-primary-dark">{hospitalCount}</span>{' '}
            szpitali
            {departmentCount != null && (
              <>
                {' '}
                ·{' '}
                <span className="font-bold text-primary-dark">
                  {departmentCount}
                </span>{' '}
                oddziałów
              </>
            )}{' '}
            w systemie
          </p>
        )}
      </div>

      {mlPredictionsLoading && (
        <div className="flex items-center justify-center p-8">
          <span className="font-headline text-xs text-on-surface-variant animate-pulse">
            Analizowanie ryzyka powodziowego (ML)...
          </span>
        </div>
      )}

      {!mlPredictionsLoading && sorted.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-4 gap-0 border-b border-outline">
            <div className="border-r border-outline p-3 text-center">
              <span className="block font-headline text-2xl font-black text-critical">
                {highRisk}
              </span>
              <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-critical">
                Wysokie
              </span>
            </div>
            <div className="border-r border-outline p-3 text-center">
              <span className="block font-headline text-2xl font-black text-amber-600">
                {elevatedRisk}
              </span>
              <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-amber-600">
                Podwyższone
              </span>
            </div>
            <div className="border-r border-outline p-3 text-center">
              <span className="block font-headline text-2xl font-black text-sky-600">
                {watchRisk}
              </span>
              <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-sky-600">
                Obserwacja
              </span>
            </div>
            <div className="p-3 text-center">
              <span className="block font-headline text-2xl font-black text-primary-dark">
                {safeCount}
              </span>
              <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-primary-dark">
                Bezpiecznie
              </span>
            </div>
          </div>

          {/* Hospital list */}
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-2">
              {sorted.map(h => {
                const prob =
                  typeof h.flood_warning_risk_probability === 'number'
                    ? h.flood_warning_risk_probability
                    : 0;
                const bucket = bucketForProbability(prob);
                const meta = bucketMeta(bucket);
                const pct = (prob * 100).toFixed(1);

                return (
                  <div
                    key={h.hospital.hospital_id}
                    className={`rounded border p-3 ${meta.border} ${meta.bg}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="block truncate font-headline text-xs font-semibold text-on-surface">
                          {h.hospital.hospital_name}
                        </span>
                        <span className="font-headline text-[10px] text-on-surface-variant">
                          {h.hospital.address}
                        </span>
                      </div>
                      <span
                        className={`flex items-center gap-1 whitespace-nowrap font-headline text-[9px] font-bold uppercase tracking-widest ${meta.fg}`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {meta.icon}
                        </span>
                        {meta.label} · {pct}%
                      </span>
                    </div>

                    {/* Probability bar */}
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-outline/30">
                      <div
                        className={`h-full rounded-full ${meta.dot} transition-all`}
                        style={{
                          width: `${Math.max(prob * 100, 1)}%`
                        }}
                      />
                    </div>

                    <div className="mt-1.5 flex items-center gap-3 font-headline text-[10px] text-on-surface-variant">
                      {h.nearest_station && (
                        <span>
                          Stacja:{' '}
                          <strong>{h.nearest_station.station_name}</strong>
                          {' · '}
                          {h.nearest_station.river}
                          {typeof h.nearest_station.distance_km ===
                            'number' && (
                            <>
                              {' · '}
                              {h.nearest_station.distance_km.toFixed(1)} km
                            </>
                          )}
                          {h.nearest_station.station_water_level_cm != null && (
                            <>
                              {' · '}
                              {h.nearest_station.station_water_level_cm} cm
                            </>
                          )}
                        </span>
                      )}
                      <span>
                        Łóżka: {h.hospital.free_beds}/{h.hospital.total_beds}
                      </span>
                    </div>

                    {bucket === 'critical' && (
                      <button
                        type="button"
                        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded bg-critical py-2 font-headline text-[10px] font-bold uppercase tracking-widest text-white hover:opacity-90"
                      >
                        <span className="material-symbols-outlined text-sm">
                          emergency_share
                        </span>
                        Zarządź ewakuację
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {!mlPredictionsLoading && sorted.length === 0 && (
        <div className="p-6 text-center">
          <span className="material-symbols-outlined mb-2 text-3xl text-on-surface-variant">
            cloud_off
          </span>
          <p className="font-headline text-xs text-on-surface-variant">
            Nie udało się pobrać danych ML. Sprawdź połączenie z API.
          </p>
        </div>
      )}
    </div>
  );
}
