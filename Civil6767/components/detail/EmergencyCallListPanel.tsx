'use client';

import { useState, useMemo } from 'react';
import type {
  EmergencyCall,
  EmergencyPriority,
  EmergencyCategory
} from '@/lib/types';
import { EMERGENCY_CALLS } from '@/lib/constants';

const PRIORITY_META: Record<
  EmergencyPriority,
  { label: string; bg: string; fg: string; dot: string; order: number }
> = {
  critical: {
    label: 'Krytyczne',
    bg: 'bg-red-50',
    fg: 'text-red-700',
    dot: 'bg-red-600',
    order: 0
  },
  high: {
    label: 'Wysokie',
    bg: 'bg-orange-50',
    fg: 'text-orange-700',
    dot: 'bg-orange-500',
    order: 1
  },
  medium: {
    label: 'Średnie',
    bg: 'bg-amber-50',
    fg: 'text-amber-700',
    dot: 'bg-amber-500',
    order: 2
  },
  low: {
    label: 'Niskie',
    bg: 'bg-gray-50',
    fg: 'text-gray-600',
    dot: 'bg-gray-400',
    order: 3
  }
};

const CATEGORY_META: Record<
  EmergencyCategory,
  { label: string; icon: string }
> = {
  medical: { label: 'Medyczne', icon: 'local_hospital' },
  fire: { label: 'Pożar', icon: 'local_fire_department' },
  accident: { label: 'Wypadek', icon: 'car_crash' },
  flood: { label: 'Powódź', icon: 'flood' },
  infrastructure: { label: 'Infrastruktura', icon: 'engineering' },
  other: { label: 'Inne', icon: 'report' }
};

const STATUS_META: Record<string, { label: string; dot: string }> = {
  new: { label: 'Nowe', dot: 'bg-red-500' },
  dispatched: { label: 'Dysponowane', dot: 'bg-amber-500' },
  'in-progress': { label: 'W toku', dot: 'bg-blue-500' },
  resolved: { label: 'Zakończone', dot: 'bg-green-500' }
};

function formatTime(ts: string) {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return ts;
  }
}

type Props = {
  onSelectCall?: (call: EmergencyCall) => void;
};

export function EmergencyCallListPanel({ onSelectCall }: Props) {
  const [filter, setFilter] = useState<EmergencyPriority | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<
    EmergencyCategory | 'all'
  >('all');

  const calls = EMERGENCY_CALLS;

  const activeCount = calls.filter(c => c.status !== 'resolved').length;
  const criticalCount = calls.filter(c => c.priority === 'critical').length;

  const filtered = useMemo(() => {
    let list = [...calls];
    if (filter !== 'all') list = list.filter(c => c.priority === filter);
    if (categoryFilter !== 'all')
      list = list.filter(c => c.category === categoryFilter);
    list.sort((a, b) => {
      const pa = PRIORITY_META[a.priority].order;
      const pb = PRIORITY_META[b.priority].order;
      if (pa !== pb) return pa - pb;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    return list;
  }, [calls, filter, categoryFilter]);

  return (
    <div className="flex flex-col rounded border border-outline bg-white shadow-lg">
      {/* Header */}
      <div className="border-b border-outline bg-surface-variant/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-base text-red-600">
              call
            </span>
            <h3 className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface">
              Zgłoszenia alarmowe 112
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              {activeCount} aktywnych
            </span>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-px border-b border-outline bg-outline">
        {(
          [
            ['critical', criticalCount],
            ['high', calls.filter(c => c.priority === 'high').length],
            ['medium', calls.filter(c => c.priority === 'medium').length],
            ['low', calls.filter(c => c.priority === 'low').length]
          ] as [EmergencyPriority, number][]
        ).map(([key, count]) => {
          const meta = PRIORITY_META[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(f => (f === key ? 'all' : key))}
              className={`flex flex-col items-center bg-white py-2 transition-colors hover:bg-surface-variant/50 ${
                filter === key ? 'ring-1 ring-inset ring-primary-dark' : ''
              }`}
            >
              <span className={`text-base font-bold ${meta.fg}`}>{count}</span>
              <span className="text-[8px] font-semibold uppercase tracking-wider text-on-surface-variant">
                {meta.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-1 border-b border-outline px-3 py-2">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
            categoryFilter === 'all'
              ? 'bg-primary-dark text-white'
              : 'bg-surface-variant text-on-surface-variant hover:bg-outline'
          }`}
        >
          Wszystkie
        </button>
        {(
          Object.entries(CATEGORY_META) as [
            EmergencyCategory,
            { label: string; icon: string }
          ][]
        ).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => setCategoryFilter(f => (f === key ? 'all' : key))}
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider transition-colors ${
              categoryFilter === key
                ? 'bg-primary-dark text-white'
                : 'bg-surface-variant text-on-surface-variant hover:bg-outline'
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 10 }}
            >
              {meta.icon}
            </span>
            {meta.label}
          </button>
        ))}
      </div>

      {/* Call list */}
      <div className="max-h-[420px] overflow-y-auto thin-scrollbar">
        {filtered.length === 0 && (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined mb-1 text-2xl text-on-surface-variant">
              search_off
            </span>
            <p className="text-xs text-on-surface-variant">
              Brak zgłoszeń dla wybranych filtrów
            </p>
          </div>
        )}
        {filtered.map(call => {
          const pr = PRIORITY_META[call.priority];
          const cat = CATEGORY_META[call.category];
          const st = STATUS_META[call.status] ?? STATUS_META.new;
          return (
            <button
              key={call.id}
              type="button"
              onClick={() => onSelectCall?.(call)}
              className={`flex w-full items-start gap-3 border-b border-outline/60 px-4 py-3 text-left transition-colors hover:bg-surface-variant/40 ${pr.bg}`}
            >
              {/* Priority dot + category icon */}
              <div className="flex flex-col items-center gap-1 pt-0.5">
                <span className={`h-2.5 w-2.5 rounded-full ${pr.dot}`} />
                <span
                  className="material-symbols-outlined text-on-surface-variant"
                  style={{ fontSize: 14 }}
                >
                  {cat.icon}
                </span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-bold text-on-surface">
                    {call.title}
                  </span>
                  <span className="shrink-0 text-[10px] text-on-surface-variant">
                    {formatTime(call.timestamp)}
                  </span>
                </div>
                <div className="mt-0.5 truncate text-[10px] text-on-surface-variant">
                  {call.location}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                    <span className="text-[9px] font-medium text-on-surface-variant">
                      {st.label}
                    </span>
                  </span>
                  {call.assignedUnit && (
                    <span className="truncate text-[9px] text-on-surface-variant/70">
                      · {call.assignedUnit}
                    </span>
                  )}
                </div>
              </div>

              {/* Arrow */}
              <span className="material-symbols-outlined text-sm text-on-surface-variant/50 pt-1">
                chevron_right
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="border-t border-outline bg-surface-variant/20 px-4 py-2 text-center">
        <span className="text-[9px] text-on-surface-variant">
          Dane mockupowe · {calls.length} zgłoszeń łącznie · Region lubelskie
        </span>
      </div>
    </div>
  );
}
