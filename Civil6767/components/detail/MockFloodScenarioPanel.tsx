'use client';

import { useEffect, useMemo } from 'react';
import type { MockFloodRoutingResponse, MockFloodOption } from '@/lib/types';

type Props = {
  data: MockFloodRoutingResponse;
  onClose: () => void;
  selectedOptionId?: string | null;
  onSelectOption?: (optionId: string | null) => void;
};

function ScoreBar({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const color =
    pct >= 75 ? 'bg-primary-dark' : pct >= 50 ? 'bg-amber-500' : 'bg-critical';
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-outline/20">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  );
}

function OptionCard({
  option,
  rank,
  isSelected,
  onSelect
}: {
  option: MockFloodOption;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const allAssigned = option.unassigned_patients === 0;

  return (
    <div
      className={`cursor-pointer rounded-lg border-2 shadow-sm transition-all ${
        isSelected
          ? 'border-primary-dark bg-primary/5 ring-2 ring-primary-dark/20'
          : 'border-outline bg-white hover:border-primary-dark/40'
      }`}
      onClick={onSelect}
    >
      {/* Option header */}
      <div className="flex items-center gap-3 border-b border-outline bg-surface-variant/30 px-4 py-3">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full font-headline text-sm font-black text-white ${
            rank === 1
              ? 'bg-primary-dark'
              : rank === 2
                ? 'bg-amber-500'
                : 'bg-sky-600'
          }`}
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="truncate font-headline text-sm font-bold text-on-surface">
            {option.option_name}
          </h4>
          <p className="font-headline text-xs text-on-surface-variant">
            {option.strategy}
          </p>
        </div>
        <div className="text-right">
          <span className="block font-headline text-xl font-black text-primary-dark">
            {option.score_overall}
          </span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Wynik
          </span>
        </div>
        {isSelected && (
          <span className="material-symbols-outlined text-lg text-primary-dark">
            check_circle
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-0 border-b border-outline">
        <div className="border-r border-outline px-3 py-2.5 text-center">
          <span className="block font-headline text-base font-black text-on-surface">
            {option.total_patients_to_transfer}
          </span>
          <span className="font-headline text-[10px] text-on-surface-variant">
            Pacjentów
          </span>
        </div>
        <div className="border-r border-outline px-3 py-2.5 text-center">
          <span
            className={`block font-headline text-base font-black ${allAssigned ? 'text-primary-dark' : 'text-critical'}`}
          >
            {option.assigned_patients}/{option.total_patients_to_transfer}
          </span>
          <span className="font-headline text-[10px] text-on-surface-variant">
            Przydzielonych
          </span>
        </div>
        <div className="px-3 py-2.5 text-center">
          <span className="block font-headline text-base font-black text-on-surface">
            ~{option.expected_transfer_minutes} min
          </span>
          <span className="font-headline text-[10px] text-on-surface-variant">
            Czas transferu
          </span>
        </div>
      </div>

      {/* Targets */}
      <div className="border-t border-outline px-4 py-3">
        <span className="mb-2 block font-headline text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          Szpitale docelowe
        </span>
        <div className="flex flex-col gap-2">
          {option.targets.map(t => (
            <div
              key={t.hospital_id}
              className="rounded border border-outline/60 bg-primary/5 px-3 py-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-headline text-xs font-semibold text-on-surface">
                    {t.hospital_name}
                  </span>
                  <span className="font-headline text-[11px] text-on-surface-variant">
                    {t.address}
                  </span>
                </div>
                <span className="whitespace-nowrap font-headline text-[11px] font-bold text-primary-dark">
                  {t.distance_km.toFixed(1)} km
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-3 font-headline text-[11px] text-on-surface-variant">
                <span>
                  Pacjenci:{' '}
                  <strong className="text-on-surface">
                    {t.allocated_patients}
                  </strong>
                </span>
                <span>
                  Łóżka:{' '}
                  <strong className="text-on-surface">
                    {t.free_beds_before}
                  </strong>{' '}
                  &rarr;{' '}
                  <strong className="text-on-surface">
                    {t.free_beds_after}
                  </strong>
                </span>
              </div>
              {t.allocations.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {t.allocations.map((a, i) => (
                    <span
                      key={i}
                      className="rounded bg-primary-dark/10 px-1.5 py-0.5 font-headline text-[10px] text-primary-dark"
                    >
                      {a.source_department_name} &rarr;{' '}
                      {a.target_department_name} ({a.patients})
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MockFloodScenarioPanel({
  data,
  onClose,
  selectedOptionId,
  onSelectOption
}: Props) {
  const sortedOptions = useMemo(
    () => [...data.options].sort((a, b) => b.score_overall - a.score_overall),
    [data.options]
  );

  // Auto-select best option on mount if nothing selected
  useEffect(() => {
    if (!selectedOptionId && sortedOptions.length > 0 && onSelectOption) {
      onSelectOption(sortedOptions[0].option_id);
    }
  }, [selectedOptionId, sortedOptions, onSelectOption]);
  const alertColor =
    data.flood_alert_level === 'CRITICAL' || data.flood_alert_level === 'HIGH'
      ? 'critical'
      : data.flood_alert_level === 'MODERATE'
        ? 'amber-600'
        : 'amber-500';

  return (
    <div className="flex max-h-[80vh] flex-col rounded border border-l-4 border-outline border-l-critical bg-white shadow-xl">
      {/* Header */}
      <div className="border-b border-outline bg-critical/5 p-5 pr-10">
        <div className="mb-1 flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-critical opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-critical" />
          </span>
          <span className="font-headline text-[10px] font-bold uppercase tracking-[0.2em] text-critical">
            Symulacja powodzi — dane demo
          </span>
        </div>
        <h2 className="font-headline text-lg font-extrabold tracking-tight text-on-surface">
          Scenariusz ewakuacji szpitala
        </h2>
        <p className="mt-1 font-headline text-xs text-on-surface-variant">
          Mock routing options — {data.options.length} warianty transferu
          pacjentow
        </p>
      </div>

      {/* Impacted hospital info */}
      <div className="border-b border-outline bg-critical/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-base text-critical">
            local_hospital
          </span>
          <div className="min-w-0 flex-1">
            <span className="block font-headline text-xs font-bold text-on-surface">
              {data.impacted_hospital_name}
            </span>
            <span className="font-headline text-[10px] text-on-surface-variant">
              {data.impacted_hospital_address}
            </span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span
            className={`flex items-center gap-1 rounded bg-${alertColor}/10 px-2 py-1`}
          >
            <span
              className={`material-symbols-outlined text-xs text-${alertColor}`}
            >
              flood
            </span>
            <span
              className={`font-headline text-[10px] font-bold text-${alertColor}`}
            >
              {data.flood_alert_level}
            </span>
          </span>
          <span className="flex items-center gap-1 rounded bg-critical/10 px-2 py-1">
            <span className="material-symbols-outlined text-xs text-critical">
              water
            </span>
            <span className="font-headline text-[10px] font-bold text-critical">
              {data.impacted_water_level_cm} cm
            </span>
          </span>
          <span className="flex items-center gap-1 rounded bg-amber-500/10 px-2 py-1">
            <span className="material-symbols-outlined text-xs text-amber-600">
              domain
            </span>
            <span className="font-headline text-[10px] font-bold text-amber-700">
              {data.impacted_departments.length} oddzialow zagrozone
            </span>
          </span>
        </div>
        {data.impacted_departments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {data.impacted_departments.map(d => (
              <span
                key={d}
                className="rounded bg-critical/10 px-1.5 py-0.5 font-headline text-[10px] font-bold text-critical"
              >
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Routing options */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="flex flex-col gap-3">
          {sortedOptions.map((opt, i) => (
            <OptionCard
              key={opt.option_id}
              option={opt}
              rank={i + 1}
              isSelected={selectedOptionId === opt.option_id}
              onSelect={() =>
                onSelectOption?.(
                  selectedOptionId === opt.option_id ? null : opt.option_id
                )
              }
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-outline bg-surface-variant/30 px-4 py-2">
        <span className="font-headline text-[10px] text-on-surface-variant">
          Scenariusz: {data.scenario_id} | Wygenerowano: {data.generated_at}
        </span>
      </div>
    </div>
  );
}
