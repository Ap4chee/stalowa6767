'use client';

import type { MLHospitalPrediction } from '@/lib/types';

type RiskBucket = 'critical' | 'elevated' | 'watch' | 'safe';

export function bucketForProbability(p: number): RiskBucket {
  if (p >= 0.5) return 'critical';
  if (p >= 0.2) return 'elevated';
  if (p >= 0.05) return 'watch';
  return 'safe';
}

export function bucketMeta(bucket: RiskBucket) {
  switch (bucket) {
    case 'critical':
      return {
        label: 'WYSOKIE',
        short: 'Wysokie ryzyko powodziowe',
        icon: 'crisis_alert',
        fg: 'text-critical',
        bg: 'bg-critical/10',
        border: 'border-critical/40',
        dot: 'bg-critical'
      };
    case 'elevated':
      return {
        label: 'PODWYŻSZONE',
        short: 'Podwyższone ryzyko powodziowe',
        icon: 'warning',
        fg: 'text-amber-700',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/40',
        dot: 'bg-amber-500'
      };
    case 'watch':
      return {
        label: 'OBSERWACJA',
        short: 'Ryzyko w obserwacji',
        icon: 'visibility',
        fg: 'text-sky-700',
        bg: 'bg-sky-500/10',
        border: 'border-sky-500/40',
        dot: 'bg-sky-500'
      };
    case 'safe':
    default:
      return {
        label: 'BEZPIECZNIE',
        short: 'Brak zagrożenia powodziowego',
        icon: 'check_circle',
        fg: 'text-primary-dark',
        bg: 'bg-primary/10',
        border: 'border-primary/30',
        dot: 'bg-primary'
      };
  }
}

type Props = {
  loading?: boolean;
  mlPrediction: MLHospitalPrediction | null;
};

export function HospitalFloodRiskSection({ loading, mlPrediction }: Props) {
  if (loading) {
    return (
      <div className="border-b border-outline bg-surface-variant/20 p-3">
        <div className="mb-1 font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
          Ryzyko powodziowe
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
          <span className="font-headline text-[11px] text-on-surface-variant animate-pulse">
            Analizowanie danych ML...
          </span>
        </div>
      </div>
    );
  }

  if (!mlPrediction) {
    return (
      <div className="border-b border-outline bg-surface-variant/20 p-3">
        <div className="mb-1 font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
          Ryzyko powodziowe
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
            cloud_off
          </span>
          <span className="font-headline text-[11px] text-on-surface-variant">
            Brak danych z modelu ML
          </span>
        </div>
      </div>
    );
  }

  const probability =
    typeof mlPrediction.flood_warning_risk_probability === 'number'
      ? mlPrediction.flood_warning_risk_probability
      : 0;
  const bucket = bucketForProbability(probability);
  const meta = bucketMeta(bucket);
  const pctDisplay = (probability * 100).toFixed(1);

  const timestamp = new Date(mlPrediction.predicted_at).toLocaleString(
    'pl-PL',
    {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }
  );

  const station = mlPrediction.nearest_station;

  return (
    <div className={`border-b border-outline ${meta.bg} p-3`}>
      <div className="mb-1 flex items-center justify-between">
        <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
          Ryzyko powodziowe · predykcja ML
        </span>
        <span className="font-mono text-[9px] text-on-surface-variant">
          {timestamp}
        </span>
      </div>

      {/* Status row */}
      <div className="flex items-center gap-2">
        <span
          className={`material-symbols-outlined text-[20px] ${meta.fg}`}
          aria-hidden
        >
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={`font-headline text-[13px] font-extrabold uppercase tracking-wide ${meta.fg}`}
          >
            {meta.label}{' '}
            <span className="text-[11px] font-bold normal-case">
              ({pctDisplay}%)
            </span>
          </div>
          <div className="font-headline text-[11px] text-on-surface">
            {meta.short}
          </div>
        </div>
      </div>

      {/* Probability bar */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-outline/40">
        <div
          className={`h-full rounded-full ${meta.dot} transition-all`}
          style={{ width: `${Math.max(probability * 100, 1)}%` }}
        />
      </div>

      {/* Nearest station details */}
      {station && (
        <div className="mt-2 rounded border border-outline/60 bg-white/70 p-2">
          <div className="mb-0.5 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-sky-700">
              water
            </span>
            <span className="font-headline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
              Najbliższa stacja hydrologiczna
            </span>
          </div>
          <div className="font-headline text-[11px] font-semibold text-on-surface">
            {station.station_name}
            <span className="font-normal text-on-surface-variant">
              {' · '}
              {station.river}
            </span>
          </div>
          <div className="mt-1 grid grid-cols-3 gap-1 font-headline text-[10px] text-on-surface">
            <div>
              <span className="block font-bold">
                {typeof station.distance_km === 'number'
                  ? `${station.distance_km.toFixed(1)} km`
                  : '—'}
              </span>
              <span className="text-[9px] uppercase text-on-surface-variant">
                dystans
              </span>
            </div>
            <div>
              <span className="block font-bold">
                {station.station_water_level_cm ?? '—'} cm
              </span>
              <span className="text-[9px] uppercase text-on-surface-variant">
                poziom
              </span>
            </div>
            <div>
              <span className="block font-bold">
                {typeof station.station_flow_m3s === 'number'
                  ? `${station.station_flow_m3s.toFixed(1)} m³/s`
                  : '—'}
              </span>
              <span className="text-[9px] uppercase text-on-surface-variant">
                przepływ
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type PillProps = {
  level?: string | null;
  probability?: number;
  className?: string;
  compact?: boolean;
};

function bucketFromLevel(level?: string | null): RiskBucket {
  switch ((level ?? '').toLowerCase()) {
    case 'high':
    case 'wysokie':
    case 'critical':
      return 'critical';
    case 'medium':
    case 'moderate':
    case 'umiarkowane':
      return 'elevated';
    case 'low':
    case 'watch':
    case 'niskie':
      return 'watch';
    default:
      return 'safe';
  }
}

export function HospitalFloodRiskPill({
  level,
  probability,
  className,
  compact
}: PillProps) {
  const bucket =
    typeof probability === 'number'
      ? bucketForProbability(probability)
      : bucketFromLevel(level);
  const meta = bucketMeta(bucket);

  const suffix =
    typeof probability === 'number' && !Number.isNaN(probability)
      ? ` · ${(probability * 100).toFixed(1)}%`
      : '';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 font-headline text-[9px] font-bold uppercase tracking-widest ${meta.fg} ${meta.border} ${meta.bg} ${className ?? ''}`}
      title={meta.short}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {compact ? meta.label : `${meta.label}${suffix}`}
    </span>
  );
}
