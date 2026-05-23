'use client';

import { useState, useMemo } from 'react';
import type {
  ApiHospital,
  FloodPredictionResponse,
  FloodRiskHospital
} from '@/lib/types';
import { HospitalFloodRiskPill } from './HospitalFloodRiskSection';

type SortKey = 'name' | 'free_beds' | 'occupancy' | 'flood_risk';
type SortDir = 'asc' | 'desc';

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  occupancy: 'desc',    // most critical first
  flood_risk: 'desc',   // highest risk first
  free_beds: 'asc',     // least free beds first (critical)
  name: 'asc',          // A-Z
};

const SORT_OPTIONS: Array<{ key: SortKey; label: string; icon: string; descLabel: string; ascLabel: string }> = [
  { key: 'occupancy', label: 'Obłożenie', icon: 'priority_high', descLabel: 'Najbardziej krytyczne', ascLabel: 'Najmniej obłożone' },
  { key: 'flood_risk', label: 'Ryzyko powodzi', icon: 'flood', descLabel: 'Najwyższe ryzyko', ascLabel: 'Najniższe ryzyko' },
  { key: 'free_beds', label: 'Wolne łóżka', icon: 'bed', descLabel: 'Najwięcej wolnych', ascLabel: 'Najmniej wolnych' },
  { key: 'name', label: 'Nazwa', icon: 'sort_by_alpha', descLabel: 'Z → A', ascLabel: 'A → Z' },
];

type Props = {
  hospitals: ApiHospital[];
  loading: boolean;
  onSelectHospital?: (hospital: ApiHospital) => void;
  floodPrediction?: FloodPredictionResponse | null;
};

const RISK_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  moderate: 1,
  low: 2,
  watch: 2
};

export function HospitalListPanel({
  hospitals,
  loading,
  onSelectHospital,
  floodPrediction
}: Props) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('occupancy');
  const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_DIR['occupancy']);

  const handleSortClick = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  };

  const riskMap = useMemo(() => {
    const map = new Map<number, FloodRiskHospital>();
    if (floodPrediction?.at_risk_hospitals) {
      for (const h of floodPrediction.at_risk_hospitals) map.set(h.id, h);
    }
    return map;
  }, [floodPrediction]);

  const filtered = useMemo(() => {
    let list = hospitals.filter(
      h =>
        h.hospital_name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase())
    );

    const dir = sortDir === 'asc' ? 1 : -1;

    list = [...list].sort((a, b) => {
      const aFree = a.departments.reduce((s, d) => s + d.free_beds, 0);
      const bFree = b.departments.reduce((s, d) => s + d.free_beds, 0);
      const aBeds = a.departments.reduce((s, d) => s + (d.total_beds ?? 0), 0);
      const bBeds = b.departments.reduce((s, d) => s + (d.total_beds ?? 0), 0);

      switch (sortKey) {
        case 'name':
          return dir * a.hospital_name.localeCompare(b.hospital_name, 'pl');
        case 'free_beds':
          return dir * (aFree - bFree);
        case 'occupancy': {
          const aRatio = aBeds > 0 ? aFree / aBeds : 1;
          const bRatio = bBeds > 0 ? bFree / bBeds : 1;
          return dir * (aRatio - bRatio);
        }
        case 'flood_risk': {
          const aRisk = riskMap.get(a.id);
          const bRisk = riskMap.get(b.id);
          const aOrder = aRisk
            ? (RISK_ORDER[aRisk.station_risk_level] ?? 3)
            : 9;
          const bOrder = bRisk
            ? (RISK_ORDER[bRisk.station_risk_level] ?? 3)
            : 9;
          return dir * (aOrder - bOrder);
        }
        default:
          return 0;
      }
    });

    return list;
  }, [hospitals, search, sortKey, sortDir, riskMap]);

  const totalFreeAll = hospitals.reduce(
    (s, h) => s + h.departments.reduce((ds, d) => ds + d.free_beds, 0),
    0
  );
  const totalBedsAll = hospitals.reduce(
    (s, h) => s + h.departments.reduce((ds, d) => ds + (d.total_beds ?? 0), 0),
    0
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-outline bg-surface-variant/30 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-primary-dark">
              Rejestr placówek
            </span>
            <h2 className="font-headline text-lg font-extrabold tracking-tight text-on-surface">
              Szpitale woj. lubelskiego
            </h2>
          </div>
          <div className="flex items-center gap-1.5 rounded border border-primary/20 bg-primary/10 px-2 py-0.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary-dark">
              LIVE
            </span>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded border border-outline bg-white p-2 text-center">
            <span className="block font-headline text-xl font-black text-primary-dark">
              {hospitals.length}
            </span>
            <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Placówek
            </span>
          </div>
          <div className="rounded border border-outline bg-white p-2 text-center">
            <span className="block font-headline text-xl font-black text-primary-dark">
              {totalFreeAll}
            </span>
            <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Wolnych łóżek
            </span>
          </div>
          <div className="rounded border border-outline bg-white p-2 text-center">
            <span className="block font-headline text-xl font-black text-primary-dark">
              {totalBedsAll}
            </span>
            <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Łóżek ogółem
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="mt-3 flex items-center rounded border border-outline bg-white px-3 py-1.5">
          <span className="material-symbols-outlined mr-2 text-sm text-on-surface-variant">
            search
          </span>
          <input
            type="text"
            placeholder="Szukaj szpitala lub adresu..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border-none bg-transparent text-xs text-on-surface focus:outline-none focus:ring-0"
          />
        </div>

        {/* Sort buttons */}
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
            Sortuj według
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {SORT_OPTIONS.map(opt => {
              const isActive = sortKey === opt.key;

              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSortClick(opt.key)}
                  className={`group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-headline text-[11px] font-bold transition-all ${
                    isActive
                      ? 'bg-primary-dark text-white shadow-sm'
                      : 'border border-outline bg-white text-on-surface-variant hover:border-primary/40 hover:bg-primary/5 hover:text-primary-dark'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {opt.icon}
                  </span>
                  {opt.label}
                  {isActive && (
                    <span className="material-symbols-outlined text-sm transition-transform">
                      {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Active sort description */}
          {(() => {
            const active = SORT_OPTIONS.find(o => o.key === sortKey);
            if (!active) return null;
            const desc = sortDir === 'asc' ? active.ascLabel : active.descLabel;
            return (
              <span className="flex items-center gap-1 font-headline text-[10px] text-on-surface-variant">
                <span className="material-symbols-outlined text-xs text-primary-dark">
                  {sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                </span>
                {desc}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center p-8">
          <span className="font-headline text-xs text-on-surface-variant animate-pulse">
            Pobieranie danych szpitali...
          </span>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-2">
          {filtered.map(hospital => {
            const totalFree = hospital.departments.reduce(
              (s, d) => s + d.free_beds,
              0
            );
            const totalBeds = hospital.departments.reduce(
              (s, d) => s + (d.total_beds ?? 0),
              0
            );
            const ratio = totalBeds > 0 ? totalFree / totalBeds : 1;
            const isExpanded = expandedId === hospital.id;

            const statusColor =
              ratio < 0.1
                ? 'border-critical/30 bg-critical/5'
                : ratio < 0.3
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-primary/30 bg-primary/5';

            const badgeColor =
              ratio < 0.1
                ? 'text-critical'
                : ratio < 0.3
                  ? 'text-amber-700'
                  : 'text-primary-dark';

            const statusLabel =
              ratio < 0.1
                ? 'KRYTYCZNY'
                : ratio < 0.3
                  ? 'OGRANICZONY'
                  : 'DOSTĘPNY';

            const riskInfo = riskMap.get(hospital.id);

            return (
              <div
                key={hospital.id}
                className={`rounded border p-3 ${statusColor}`}
              >
                <div
                  className="flex cursor-pointer items-start justify-between gap-2"
                  onClick={() => setExpandedId(isExpanded ? null : hospital.id)}
                >
                  <div className="min-w-0 flex-1">
                    <span className="block truncate font-headline text-xs font-semibold text-on-surface">
                      {hospital.hospital_name}
                    </span>
                    <span className="font-headline text-[10px] text-on-surface-variant">
                      {hospital.address}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <HospitalFloodRiskPill
                        level={riskInfo?.station_risk_level ?? 'safe'}
                        compact
                      />
                      {riskInfo && (
                        <span className="font-headline text-[9px] text-on-surface-variant">
                          {riskInfo.nearest_risk_station_name}
                          {typeof riskInfo.distance_km === 'number' && (
                            <> · {riskInfo.distance_km.toFixed(1)} km</>
                          )}
                        </span>
                      )}
                      {hospital.has_sor === true && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 font-headline text-[9px] font-bold text-primary-dark">
                          <span className="material-symbols-outlined text-[10px]">
                            emergency
                          </span>
                          SOR
                        </span>
                      )}
                      {hospital.doctors_on_duty != null && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-variant px-1.5 py-0.5 font-headline text-[9px] font-bold text-on-surface-variant">
                          <span className="material-symbols-outlined text-[10px]">
                            stethoscope
                          </span>
                          {hospital.doctors_on_duty}
                        </span>
                      )}
                      {hospital.generator_fuel_hours != null && (
                        <span
                          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-headline text-[9px] font-bold ${
                            hospital.generator_fuel_hours < 4
                              ? 'bg-critical/10 text-critical'
                              : hospital.generator_fuel_hours < 12
                                ? 'bg-amber-500/10 text-amber-700'
                                : 'bg-primary/10 text-primary-dark'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[10px]">
                            local_gas_station
                          </span>
                          {hospital.generator_fuel_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`font-headline text-[9px] font-bold uppercase tracking-widest ${badgeColor}`}
                    >
                      {statusLabel}
                    </span>
                    <span className="font-headline text-xs font-bold text-on-surface">
                      {totalFree}/{totalBeds} łóżek
                    </span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-1.5">
                    <div className="font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Oddziały ({hospital.departments.length})
                    </div>
                    {hospital.departments.map(dept => {
                      const dRatio = dept.total_beds
                        ? dept.free_beds / dept.total_beds
                        : 1;
                      const dColor =
                        dRatio < 0.1
                          ? 'text-critical'
                          : dRatio < 0.3
                            ? 'text-amber-700'
                            : 'text-primary-dark';
                      return (
                        <div
                          key={dept.department_id}
                          className="flex items-center justify-between rounded bg-white/60 px-2 py-1.5"
                        >
                          <span className="truncate font-headline text-[11px] text-on-surface">
                            {dept.department_name}
                          </span>
                          <span
                            className={`whitespace-nowrap font-headline text-[11px] font-bold ${dColor}`}
                          >
                            {dept.free_beds}/{dept.total_beds ?? '?'} łóżek
                          </span>
                        </div>
                      );
                    })}
                    {hospital.latitude != null &&
                      hospital.longitude != null && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            onSelectHospital?.(hospital);
                          }}
                          className="mt-1 flex w-full items-center justify-center gap-1.5 rounded border border-primary/30 bg-primary/10 py-2 font-headline text-[10px] font-bold uppercase tracking-widest text-primary-dark hover:bg-primary/20"
                        >
                          <span className="material-symbols-outlined text-sm">
                            location_on
                          </span>
                          Pokaż na mapie
                        </button>
                      )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="p-6 text-center">
            <span className="material-symbols-outlined mb-2 text-3xl text-on-surface-variant">
              search_off
            </span>
            <p className="font-headline text-xs text-on-surface-variant">
              Brak wyników dla &ldquo;{search}&rdquo;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
